// SPDX-License-Identifier: MIT
pragma solidity >=0.8.22;

import { Test } from "forge-std/Test.sol";

import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import { DripLockup } from "../src/DripLockup.sol";
import { DripSubscriptions } from "../src/DripSubscriptions.sol";
import { IFlareContractRegistry } from "../src/interfaces/IFlareContractRegistry.sol";
import { Errors } from "../src/libraries/Errors.sol";
import { Lockup } from "../src/types/Lockup.sol";

import { MockERC20 } from "./DripLockup.t.sol";

/// @notice Full-cycle test: merchant plan -> customer subscribes -> payment lands (simulated direct mint)
///         -> finalize opens a stream -> merchant withdraws accrued -> customer cancels -> remainder
///         refunded -> renewal funds the next cycle.
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
        planId = subscriptions.createPlan(PRICE, CYCLE);
    }

    function _subscribe(uint256 planId) internal returns (uint256 subscriptionId, uint256 tag) {
        vm.prank(CUSTOMER);
        (subscriptionId, tag) = subscriptions.subscribe(planId);
    }

    /// @dev Simulates the FXRP direct mint landing in the wrapper: mint straight into the contract,
    ///      exactly as the FAssets AssetManager would.
    function _simulatePayment(uint256 amount) internal {
        fxrp.mint(address(subscriptions), amount);
    }

    function test_FullCycle_EndToEnd() public {
        // 1. Merchant creates a plan.
        uint256 planId = _createPlan();
        (address merchant, uint128 price, uint40 cycleDuration, bool active) = subscriptions.plans(planId);
        assertEq(merchant, MERCHANT);
        assertEq(price, PRICE);
        assertEq(cycleDuration, CYCLE);
        assertTrue(active);

        // 2. Customer subscribes; a tag is reserved and bound to the wrapper.
        (uint256 subscriptionId, uint256 tag) = _subscribe(planId);
        assertEq(tagManager.mintingRecipient(tag), address(subscriptions));
        assertEq(tagManager.ownerOfTag(tag), address(subscriptions));

        (uint256 subPlanId, address customer, uint256 subTag, uint256 streamId, uint256 cycle, bool subActive) =
            subscriptions.subscriptions(subscriptionId);
        assertEq(subPlanId, planId);
        assertEq(customer, CUSTOMER);
        assertEq(subTag, tag);
        assertEq(streamId, 0);
        assertEq(cycle, 0);
        assertTrue(subActive);

        // 3. The customer's XRPL payment lands as a direct mint into the wrapper.
        _simulatePayment(PRICE);
        assertEq(subscriptions.pendingFxrp(), PRICE);

        // 4. The payment is finalized into a stream for cycle 1.
        subscriptions.finalize(subscriptionId);
        assertEq(subscriptions.pendingFxrp(), 0);

        uint256 cycleOne;
        (,,, streamId, cycleOne,) = subscriptions.subscriptions(subscriptionId);
        assertEq(streamId, 1);
        assertEq(cycleOne, 1);
        assertEq(lockup.getStream(streamId).sender, CUSTOMER);
        assertEq(lockup.recipientOf(streamId), MERCHANT);
        assertEq(lockup.getStream(streamId).amounts.deposited, PRICE);
        assertEq(fxrp.balanceOf(address(lockup)), PRICE);

        // 5. Mid-cycle: the merchant withdraws the accrued half.
        vm.warp(block.timestamp + CYCLE / 2);
        vm.prank(MERCHANT);
        lockup.withdrawMax(streamId, MERCHANT);
        assertEq(fxrp.balanceOf(MERCHANT), PRICE / 2);

        // 6. Renewal: the customer pays again with the same tag (no memo, no new tag); a new stream
        //    opens for cycle 2 while cycle 1 keeps streaming.
        _simulatePayment(PRICE);
        subscriptions.finalize(subscriptionId);
        (,,, uint256 streamTwo,,) = subscriptions.subscriptions(subscriptionId);
        (,,,, uint256 cycleTwo,) = subscriptions.subscriptions(subscriptionId);
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

        // 8. The subscription is marked inactive.
        subscriptions.deactivateSubscription(subscriptionId);
        (,,,,, bool subActiveAfter) = subscriptions.subscriptions(subscriptionId);
        assertFalse(subActiveAfter);
    }

    function test_CreatePlan_RevertWhen_ZeroPrice() public {
        vm.prank(MERCHANT);
        vm.expectRevert(Errors.DripSubscriptions_InvalidPlan.selector);
        subscriptions.createPlan(0, CYCLE);
    }

    function test_CreatePlan_RevertWhen_ZeroDuration() public {
        vm.prank(MERCHANT);
        vm.expectRevert(Errors.DripSubscriptions_InvalidPlan.selector);
        subscriptions.createPlan(PRICE, 0);
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
        (uint256 subscriptionId,) = _subscribe(planId);

        vm.expectRevert(Errors.DripSubscriptions_NoPendingPayment.selector);
        subscriptions.finalize(subscriptionId);
    }

    function test_Finalize_RevertWhen_AlreadyFinalized() public {
        uint256 planId = _createPlan();
        (uint256 subscriptionId,) = _subscribe(planId);

        _simulatePayment(PRICE);
        subscriptions.finalize(subscriptionId);

        // A second finalize before any new payment must revert.
        vm.expectRevert(Errors.DripSubscriptions_NoPendingPayment.selector);
        subscriptions.finalize(subscriptionId);
    }

    function test_Finalize_RevertWhen_SubscriptionInactive() public {
        uint256 planId = _createPlan();
        (uint256 subscriptionId,) = _subscribe(planId);
        _simulatePayment(PRICE);
        subscriptions.finalize(subscriptionId);
        (,,,, uint256 cancelStreamId,) = subscriptions.subscriptions(subscriptionId);

        // Cancel the stream, deactivate the subscription, then attempt to fund again.
        vm.prank(CUSTOMER);
        lockup.cancel(cancelStreamId);
        subscriptions.deactivateSubscription(subscriptionId);

        _simulatePayment(PRICE);
        vm.expectRevert(
            abi.encodeWithSelector(Errors.DripSubscriptions_SubscriptionNotActive.selector, subscriptionId)
        );
        subscriptions.finalize(subscriptionId);
    }

    function test_DeactivateSubscription_RevertWhen_StreamNotCanceled() public {
        uint256 planId = _createPlan();
        (uint256 subscriptionId,) = _subscribe(planId);
        _simulatePayment(PRICE);
        subscriptions.finalize(subscriptionId);

        // The stream is still streaming; the subscription cannot be deactivated.
        vm.expectRevert(
            abi.encodeWithSelector(Errors.DripSubscriptions_StreamNotCanceled.selector, subscriptionId)
        );
        subscriptions.deactivateSubscription(subscriptionId);
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
