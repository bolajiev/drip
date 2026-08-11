// SPDX-License-Identifier: MIT
pragma solidity >=0.8.22;

import { Test } from "forge-std/Test.sol";

import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import { DripLockup } from "../src/DripLockup.sol";
import { DripSubscriptions } from "../src/DripSubscriptions.sol";
import { DripEscrow } from "../src/DripEscrow.sol";
import { IFlareContractRegistry } from "../src/interfaces/IFlareContractRegistry.sol";
import { Errors } from "../src/libraries/Errors.sol";
import { Lockup } from "../src/types/Lockup.sol";

import { MockERC20 } from "./DripLockup.t.sol";

/// @notice Full-cycle test: merchant plan -> customer subscribes (tag bound to a per-subscription escrow)
///         -> payment lands in the escrow (simulated direct mint) -> finalize opens a stream -> merchant
///         withdraws accrued -> customer cancels -> remainder refunded -> renewal funds the next cycle.
///         Also covers payment segregation across concurrent subscriptions, the no-overlap rule, pending
///         refunds, per-plan access control, and plan editing.
contract DripSubscriptionsTest is Test {
    MockERC20 internal fxrp;
    MockAssetManager internal assetManager;
    MockMintingTagManager internal tagManager;
    MockRegistry internal registry;

    DripLockup internal lockup;
    DripSubscriptions internal subscriptions;

    address internal constant MERCHANT = address(0xACE);
    address internal constant CUSTOMER = address(0xBEE);
    address internal constant OTHER = address(0x1234);

    uint128 internal constant PRICE = 100e6; // 100 FXRP per cycle
    uint40 internal constant CYCLE = 30 days;
    string internal constant NAME = "Amaka's Newsletter";
    string internal constant DESC = "Five issues a month on fintech.";

    function setUp() public {
        // Deploy the Flare-side mocks.
        fxrp = new MockERC20("FXRP", "FXRP", 6);
        tagManager = new MockMintingTagManager();
        assetManager = new MockAssetManager(address(fxrp), address(tagManager));
        registry = new MockRegistry(address(assetManager));

        // Deploy the Drip contracts.
        lockup = new DripLockup();
        subscriptions = new DripSubscriptions(registry, address(lockup));

        // Fund the wrapper with native tokens so it can pay tag reservation fees.
        vm.deal(address(subscriptions), 100 ether);
    }

    function _createPlan() internal returns (uint256 planId) {
        vm.prank(MERCHANT);
        planId = subscriptions.createPlan(NAME, DESC, PRICE, CYCLE);
    }

    function _subscribe(uint256 planId) internal returns (uint256 subscriptionId, uint256 tag, address escrow) {
        vm.prank(CUSTOMER);
        (subscriptionId, tag) = subscriptions.subscribe(planId);
        (,,,,,, escrow) = subscriptions.subscriptions(subscriptionId);
    }

    /// @dev Simulates the FXRP direct mint landing in the subscription's escrow, exactly as the FAssets
    ///      AssetManager would once the tag's minting recipient is the escrow.
    function _simulatePayment(address escrow, uint256 amount) internal {
        fxrp.mint(escrow, amount);
    }

    function test_FullCycle_EndToEnd() public {
        // 1. Merchant creates a plan.
        uint256 planId = _createPlan();
        (address merchant, uint128 price, uint40 cycleDuration, bool active, string memory name, string memory desc) =
            subscriptions.plans(planId);
        assertEq(merchant, MERCHANT);
        assertEq(price, PRICE);
        assertEq(cycleDuration, CYCLE);
        assertTrue(active);
        assertEq(name, NAME);
        assertEq(desc, DESC);

        // 2. Customer subscribes; a tag is reserved and bound to a fresh per-subscription escrow.
        (uint256 subscriptionId, uint256 tag, address escrow) = _subscribe(planId);
        assertTrue(escrow != address(0));
        assertEq(tagManager.mintingRecipient(tag), escrow);
        assertEq(tagManager.ownerOfTag(tag), address(subscriptions));
        assertEq(subscriptions.planSubscriptionOf(planId, CUSTOMER), subscriptionId);

        (
            uint256 subPlanId,
            address customer,
            uint256 subTag,
            uint256 streamId,
            uint256 cycle,
            bool subActive,
            address subEscrow
        ) = subscriptions.subscriptions(subscriptionId);
        assertEq(subPlanId, planId);
        assertEq(customer, CUSTOMER);
        assertEq(subTag, tag);
        assertEq(streamId, 0);
        assertEq(cycle, 0);
        assertTrue(subActive);
        assertEq(subEscrow, escrow);

        // 3. The customer's XRPL payment lands as a direct mint in the escrow.
        _simulatePayment(escrow, PRICE);
        assertEq(subscriptions.pendingFxrp(subscriptionId), PRICE);

        // 4. The payment is finalized into a stream for cycle 1.
        subscriptions.finalize(subscriptionId);
        assertEq(subscriptions.pendingFxrp(subscriptionId), 0);

        uint256 cycleOne;
        (,,, streamId, cycleOne,,) = subscriptions.subscriptions(subscriptionId);
        assertEq(streamId, 1);
        assertEq(cycleOne, 1);
        assertEq(lockup.getStream(streamId).sender, CUSTOMER);
        assertEq(lockup.recipientOf(streamId), MERCHANT);
        assertEq(lockup.getStream(streamId).amounts.deposited, PRICE);
        assertEq(fxrp.balanceOf(address(lockup)), PRICE);
        assertTrue(subscriptions.isActive(CUSTOMER));
        assertTrue(subscriptions.isActive(planId, CUSTOMER));

        // 5. Mid-cycle: the merchant withdraws the accrued half.
        vm.warp(block.timestamp + CYCLE / 2);
        vm.prank(MERCHANT);
        lockup.withdrawMax(streamId, MERCHANT);
        assertEq(fxrp.balanceOf(MERCHANT), PRICE / 2);

        // 6. The cycle ends naturally; the customer renews with the same tag (no memo, no new tag).
        vm.warp(block.timestamp + CYCLE / 2);
        assertEq(uint8(lockup.statusOf(streamId)), uint8(Lockup.Status.SETTLED));
        _simulatePayment(escrow, PRICE);
        subscriptions.finalize(subscriptionId);
        (,,, uint256 streamTwo,,,) = subscriptions.subscriptions(subscriptionId);
        (,,,, uint256 cycleTwo,,) = subscriptions.subscriptions(subscriptionId);
        assertEq(cycleTwo, 2);
        assertEq(streamTwo, 2);
        assertEq(lockup.getStream(streamTwo).sender, CUSTOMER);
        assertEq(lockup.recipientOf(streamTwo), MERCHANT);

        // 7. The customer cancels cycle 2; the unstreamed remainder goes straight back to them.
        vm.warp(block.timestamp + CYCLE / 2);
        assertEq(lockup.refundableAmountOf(streamTwo), PRICE / 2);
        vm.prank(CUSTOMER);
        lockup.cancel(streamTwo);
        assertEq(fxrp.balanceOf(CUSTOMER), PRICE / 2);
        // Nothing had been withdrawn from cycle 2, so the stream is canceled (not depleted).
        assertTrue(lockup.statusOf(streamTwo) == Lockup.Status.CANCELED);
        assertFalse(subscriptions.isActive(CUSTOMER));
        assertFalse(subscriptions.isActive(planId, CUSTOMER));

        // 8. The subscription is marked inactive.
        subscriptions.deactivateSubscription(subscriptionId);
        (,,,,, bool subActiveAfter,) = subscriptions.subscriptions(subscriptionId);
        assertFalse(subActiveAfter);
    }

    /// @dev THE core v3 bug fix: two customers pay concurrently; each finalize credits only its own escrow.
    function test_PaymentSegregation_TwoSubscribers() public {
        uint256 planId = _createPlan();
        (uint256 subA,, address escrowA) = _subscribe(planId);

        vm.prank(address(0xB0B));
        (uint256 subB,) = subscriptions.subscribe(planId);
        (,,,,,, address escrowB) = subscriptions.subscriptions(subB);

        // Both payments arrive before either finalize.
        _simulatePayment(escrowA, PRICE);
        _simulatePayment(escrowB, PRICE);

        // Finalizing A must deposit exactly A's payment, and leave B's untouched.
        subscriptions.finalize(subA);
        (,,, uint256 streamA,,,) = subscriptions.subscriptions(subA);
        assertEq(lockup.getStream(streamA).amounts.deposited, PRICE);
        assertEq(subscriptions.pendingFxrp(subB), PRICE);
        assertEq(fxrp.balanceOf(escrowB), PRICE);

        // Finalizing B deposits exactly B's payment.
        subscriptions.finalize(subB);
        (,,, uint256 streamB,,,) = subscriptions.subscriptions(subB);
        assertEq(lockup.getStream(streamB).amounts.deposited, PRICE);
        assertEq(subscriptions.pendingFxrp(subA), 0);
        assertEq(subscriptions.pendingFxrp(subB), 0);
    }

    /// @dev A renewal payment that arrives mid-cycle stays in the escrow; finalize refuses to overlap.
    function test_Finalize_RevertWhen_CycleStillStreaming() public {
        uint256 planId = _createPlan();
        (uint256 subscriptionId,, address escrow) = _subscribe(planId);

        _simulatePayment(escrow, PRICE);
        subscriptions.finalize(subscriptionId);

        // Early renewal: the next payment arrives while cycle 1 is still streaming.
        _simulatePayment(escrow, PRICE);
        vm.expectRevert(
            abi.encodeWithSelector(Errors.DripSubscriptions_CycleStillStreaming.selector, subscriptionId)
        );
        subscriptions.finalize(subscriptionId);

        // The payment is not lost: it sits in the escrow as next-cycle credit.
        assertEq(subscriptions.pendingFxrp(subscriptionId), PRICE);

        // Once the cycle ends, the same finalize credits the accumulated escrow balance.
        vm.warp(block.timestamp + CYCLE);
        subscriptions.finalize(subscriptionId);
        (,,, uint256 streamTwo,,,) = subscriptions.subscriptions(subscriptionId);
        assertEq(lockup.getStream(streamTwo).amounts.deposited, PRICE);
        assertEq(subscriptions.pendingFxrp(subscriptionId), 0);
    }

    /// @dev Un-credited escrow funds (wrong amount, prepaid next cycle, payment after cancel) are
    ///      refundable to the customer, by anyone, at any time the cycle is not streaming.
    function test_RefundPending_ReturnsFundsToCustomer() public {
        uint256 planId = _createPlan();
        (uint256 subscriptionId,, address escrow) = _subscribe(planId);

        // A wrong-amount payment arrives; the customer wants it back.
        _simulatePayment(escrow, 5e6);
        vm.prank(OTHER);
        subscriptions.refundPending(subscriptionId);
        assertEq(fxrp.balanceOf(CUSTOMER), 5e6);
        assertEq(subscriptions.pendingFxrp(subscriptionId), 0);
    }

    function test_RefundPending_RevertWhen_Streaming() public {
        uint256 planId = _createPlan();
        (uint256 subscriptionId,, address escrow) = _subscribe(planId);

        _simulatePayment(escrow, PRICE);
        subscriptions.finalize(subscriptionId);

        // Committed funds are not refundable through the escrow — cancel on the lockup handles that.
        _simulatePayment(escrow, PRICE);
        vm.expectRevert(
            abi.encodeWithSelector(Errors.DripSubscriptions_CycleStillStreaming.selector, subscriptionId)
        );
        subscriptions.refundPending(subscriptionId);
    }

    function test_RefundPending_RevertWhen_NothingToRefund() public {
        uint256 planId = _createPlan();
        (uint256 subscriptionId,,) = _subscribe(planId);

        vm.expectRevert(Errors.DripSubscriptions_NoPendingPayment.selector);
        subscriptions.refundPending(subscriptionId);
    }

    /// @dev The per-plan read is the precise access-control signal: a customer on plan A is not
    ///      automatically "active" on plan B, and vice versa.
    function test_IsActive_PerPlan() public {
        uint256 planA = _createPlan();
        vm.prank(MERCHANT);
        uint256 planB = subscriptions.createPlan("B", "B", PRICE, CYCLE);

        (uint256 subA,, address escrowA) = _subscribe(planA);

        // Active on plan A but never subscribed to plan B.
        _simulatePayment(escrowA, PRICE);
        subscriptions.finalize(subA);
        assertTrue(subscriptions.isActive(planA, CUSTOMER));
        assertFalse(subscriptions.isActive(planB, CUSTOMER));

        // Customer joins plan B as well; both plans are independent.
        vm.prank(CUSTOMER);
        (uint256 subB,) = subscriptions.subscribe(planB);
        (,,,,,, address escrowB) = subscriptions.subscriptions(subB);
        assertFalse(subscriptions.isActive(planB, CUSTOMER));
        _simulatePayment(escrowB, PRICE);
        subscriptions.finalize(subB);
        assertTrue(subscriptions.isActive(planB, CUSTOMER));
        assertTrue(subscriptions.isActive(CUSTOMER));

        // Canceling plan A does not affect plan B's coverage.
        (,,, uint256 streamA,,,) = subscriptions.subscriptions(subA);
        vm.prank(CUSTOMER);
        lockup.cancel(streamA);
        assertFalse(subscriptions.isActive(planA, CUSTOMER));
        assertTrue(subscriptions.isActive(planB, CUSTOMER));
    }

    function test_IsActive_UnknownCustomer() public view {
        assertFalse(subscriptions.isActive(OTHER));
    }

    function test_Subscribe_RevertWhen_AlreadySubscribed() public {
        uint256 planId = _createPlan();
        _subscribe(planId);

        vm.prank(CUSTOMER);
        vm.expectRevert(abi.encodeWithSelector(Errors.DripSubscriptions_AlreadySubscribed.selector, planId, CUSTOMER));
        subscriptions.subscribe(planId);
    }

    function test_UpdatePlan_MerchantOnly() public {
        uint256 planId = _createPlan();

        vm.prank(OTHER);
        vm.expectRevert(
            abi.encodeWithSelector(Errors.DripSubscriptions_UnauthorizedPlanOwner.selector, planId, OTHER)
        );
        subscriptions.updatePlan(planId, "Hacked", "", 1e6);

        vm.prank(MERCHANT);
        subscriptions.updatePlan(planId, "New Name", "New desc", 42e6);
        (, uint128 newPrice,,, string memory newName, string memory newDesc) = subscriptions.plans(planId);
        assertEq(newPrice, 42e6);
        assertEq(newName, "New Name");
        assertEq(newDesc, "New desc");
        // The duration is locked — active streams depend on it.
        (address merchant, , uint40 duration, bool active,,) = subscriptions.plans(planId);
        assertEq(merchant, MERCHANT);
        assertEq(duration, CYCLE);
        assertTrue(active);
    }

    function test_UpdatePlan_RevertWhen_EmptyName() public {
        uint256 planId = _createPlan();
        vm.prank(MERCHANT);
        vm.expectRevert(Errors.DripSubscriptions_InvalidPlan.selector);
        subscriptions.updatePlan(planId, "", "", PRICE);
    }

    function test_ReactivatePlan() public {
        uint256 planId = _createPlan();
        vm.prank(MERCHANT);
        subscriptions.deactivatePlan(planId);
        (,,, bool afterDeactivate,,) = subscriptions.plans(planId);
        assertFalse(afterDeactivate);

        vm.prank(MERCHANT);
        subscriptions.reactivatePlan(planId);
        (,,, bool afterReactivate,,) = subscriptions.plans(planId);
        assertTrue(afterReactivate);

        vm.prank(OTHER);
        vm.expectRevert(
            abi.encodeWithSelector(Errors.DripSubscriptions_UnauthorizedPlanOwner.selector, planId, OTHER)
        );
        subscriptions.reactivatePlan(planId);
    }

    function test_CreatePlan_RevertWhen_ZeroPrice() public {
        vm.prank(MERCHANT);
        vm.expectRevert(Errors.DripSubscriptions_InvalidPlan.selector);
        subscriptions.createPlan(NAME, DESC, 0, CYCLE);
    }

    function test_CreatePlan_RevertWhen_ZeroDuration() public {
        vm.prank(MERCHANT);
        vm.expectRevert(Errors.DripSubscriptions_InvalidPlan.selector);
        subscriptions.createPlan(NAME, DESC, PRICE, 0);
    }

    function test_CreatePlan_RevertWhen_EmptyName() public {
        vm.prank(MERCHANT);
        vm.expectRevert(Errors.DripSubscriptions_InvalidPlan.selector);
        subscriptions.createPlan("", DESC, PRICE, CYCLE);
    }

    function test_Subscribe_RevertWhen_PlanInactive() public {
        uint256 planId = _createPlan();
        vm.prank(MERCHANT);
        subscriptions.deactivatePlan(planId);

        vm.prank(CUSTOMER);
        vm.expectRevert(abi.encodeWithSelector(Errors.DripSubscriptions_PlanNotActive.selector, planId));
        subscriptions.subscribe(planId);
    }

    function test_DeactivatePlan_RevertWhen_NotMerchant() public {
        uint256 planId = _createPlan();
        vm.prank(OTHER);
        vm.expectRevert(
            abi.encodeWithSelector(Errors.DripSubscriptions_UnauthorizedPlanOwner.selector, planId, OTHER)
        );
        subscriptions.deactivatePlan(planId);
    }

    function test_Finalize_RevertWhen_NoPayment() public {
        uint256 planId = _createPlan();
        (uint256 subscriptionId,,) = _subscribe(planId);

        vm.expectRevert(Errors.DripSubscriptions_NoPendingPayment.selector);
        subscriptions.finalize(subscriptionId);
    }

    function test_Finalize_RevertWhen_AlreadyFinalized() public {
        uint256 planId = _createPlan();
        (uint256 subscriptionId,, address escrow) = _subscribe(planId);

        _simulatePayment(escrow, PRICE);
        subscriptions.finalize(subscriptionId);

        // Cycle 1 is still streaming: the second finalize reverts with the no-overlap error.
        vm.expectRevert(
            abi.encodeWithSelector(Errors.DripSubscriptions_CycleStillStreaming.selector, subscriptionId)
        );
        subscriptions.finalize(subscriptionId);

        // Once the cycle ends and no new payment arrived, the escrow is empty: no pending payment.
        vm.warp(block.timestamp + CYCLE);
        vm.expectRevert(Errors.DripSubscriptions_NoPendingPayment.selector);
        subscriptions.finalize(subscriptionId);
    }

    function test_Finalize_RevertWhen_SubscriptionInactive() public {
        uint256 planId = _createPlan();
        (uint256 subscriptionId,, address escrow) = _subscribe(planId);
        _simulatePayment(escrow, PRICE);
        subscriptions.finalize(subscriptionId);
        (,,, uint256 cancelStreamId,,,) = subscriptions.subscriptions(subscriptionId);

        // Cancel the stream, deactivate the subscription, then attempt to fund again.
        vm.prank(CUSTOMER);
        lockup.cancel(cancelStreamId);
        subscriptions.deactivateSubscription(subscriptionId);

        _simulatePayment(escrow, PRICE);
        vm.expectRevert(
            abi.encodeWithSelector(Errors.DripSubscriptions_SubscriptionNotActive.selector, subscriptionId)
        );
        subscriptions.finalize(subscriptionId);

        // Even the refund path still works for late payments: the customer can reclaim the escrow.
        // (The first PRICE came back via the cancel refund; the second via refundPending.)
        subscriptions.refundPending(subscriptionId);
        assertEq(fxrp.balanceOf(CUSTOMER), PRICE * 2);
    }

    function test_DeactivateSubscription_RevertWhen_StreamNotCanceled() public {
        uint256 planId = _createPlan();
        (uint256 subscriptionId,, address escrow) = _subscribe(planId);
        _simulatePayment(escrow, PRICE);
        subscriptions.finalize(subscriptionId);

        // The stream is still streaming; the subscription cannot be deactivated.
        vm.expectRevert(
            abi.encodeWithSelector(Errors.DripSubscriptions_StreamNotCanceled.selector, subscriptionId)
        );
        subscriptions.deactivateSubscription(subscriptionId);
    }

    function test_Escrow_OnlyFactoryCanMoveFunds() public {
        uint256 planId = _createPlan();
        (,, address escrow) = _subscribe(planId);
        _simulatePayment(escrow, PRICE);

        // The customer cannot pull their own escrow.
        vm.prank(CUSTOMER);
        vm.expectRevert("escrow: not factory");
        DripEscrow(escrow).pull();
        vm.expectRevert("escrow: not factory");
        DripEscrow(escrow).refund();
    }
}

/// @notice Mock of Flare's contract registry.
contract MockRegistry is IFlareContractRegistry {
    address internal immutable assetManager;

    constructor(address assetManager_) {
        assetManager = assetManager_;
    }

    function getContractAddressByName(string calldata) external view returns (address) {
        return assetManager;
    }
}

/// @notice Mock of the FXRP AssetManager diamond.
contract MockAssetManager {
    address internal immutable fxrpToken;
    address internal immutable tagManager;

    constructor(address fxrpToken_, address tagManager_) {
        fxrpToken = fxrpToken_;
        tagManager = tagManager_;
    }

    function fAsset() external view returns (address) {
        return fxrpToken;
    }

    function getMintingTagManager() external view returns (address) {
        return tagManager;
    }
}

/// @notice Mock of Flare's MintingTagManager.
contract MockMintingTagManager {
    uint256 internal fee = 1 ether;
    uint256 internal nextTag = 1;
    mapping(uint256 => address) public ownerOfTag;
    mapping(uint256 => address) public mintingRecipient;

    function reserve() external payable returns (uint256) {
        uint256 tag = nextTag++;
        ownerOfTag[tag] = msg.sender;
        mintingRecipient[tag] = msg.sender;
        if (msg.sender.code.length > 0) {
            try IERC721Receiver(msg.sender).onERC721Received(msg.sender, address(0), tag, "") returns (bytes4 ret) {
                require(ret == IERC721Receiver.onERC721Received.selector, "bad receiver");
            } catch {
                revert("transfer to non ERC721Receiver implementer");
            }
        }
        return tag;
    }

    function setMintingRecipient(uint256 mintingTag, address recipient) external {
        require(ownerOfTag[mintingTag] == msg.sender, "not owner");
        mintingRecipient[mintingTag] = recipient;
    }

    function reservationFee() external view returns (uint256) {
        return fee;
    }

    function reservedTagsForOwner(address owner) external view returns (uint256[] memory) {
        uint256[] memory tags = new uint256[](0);
        return tags;
    }
}
