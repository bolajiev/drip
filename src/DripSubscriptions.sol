// SPDX-License-Identifier: MIT
pragma solidity >=0.8.22;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import { IDripLockup } from "./interfaces/IDripLockup.sol";
import { IAssetManagerFXRP } from "./interfaces/IAssetManagerFXRP.sol";
import { IFlareContractRegistry } from "./interfaces/IFlareContractRegistry.sol";
import { IMintingTagManager } from "./interfaces/IMintingTagManager.sol";
import { Errors } from "./libraries/Errors.sol";
import { Lockup } from "./types/Lockup.sol";

/// @title DripSubscriptions
/// @notice Drip's recurring-subscription wrapper. One XRPL payment (via FAssets direct minting) funds one
///         billing cycle: the minted FXRP lands in this contract, {finalize} deposits it into a cancelable
///         linear stream in {DripLockup}, and the merchant draws down the vested amount over the cycle.
/// @dev Renewal model: every subscription owns a reserved XRPL destination tag (via {IMintingTagManager}),
///      permanently bound to this contract as the minting recipient. The customer pays with the same
///      destination tag each billing cycle; {finalize} credits the subscription and opens the next stream.
///      The customer is the stream's sender, so they can cancel directly on {DripLockup} and the unstreamed
///      remainder is refunded to them by the lockup contract, with no interaction needed here.
///
///      The reserved tag is an ERC-721 minted to this contract, hence {IERC721Receiver} support.
///
///      Known limitation (out of scope for the hackathon): payments are attributed to a subscription by
///      contract-level balance accounting ({pendingFxrp}), so concurrent pending payments for different
///      subscriptions must be finalized sequentially.
contract DripSubscriptions is IERC721Receiver {
    /*//////////////////////////////////////////////////////////////////////////
                                  STATE VARIABLES
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev The lockup contract that holds all streams.
    IDripLockup public immutable lockup;

    /// @dev The FXRP token, resolved at runtime from the Flare contract registry.
    IERC20 public immutable fxrp;

    /// @dev The MintingTagManager, resolved at runtime from the FXRP AssetManager.
    IMintingTagManager public immutable mintingTagManager;

    /// @dev The id of the next plan to be created.
    uint256 public nextPlanId;

    /// @dev The id of the next subscription to be created.
    uint256 public nextSubscriptionId;

    /// @dev Plans mapped by unsigned integers.
    mapping(uint256 planId => Plan plan) public plans;

    /// @dev Subscriptions mapped by unsigned integers.
    mapping(uint256 subscriptionId => Subscription subscription) public subscriptions;

    /*//////////////////////////////////////////////////////////////////////////
                                      STRUCTS
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice A merchant's subscription offering.
    /// @param merchant The address receiving the streamed payments.
    /// @param pricePerCycle The expected FXRP amount per billing cycle, in UBA (6 decimals).
    /// @param cycleDuration The billing period in seconds.
    /// @param active Whether new customers can subscribe.
    /// @param name The plan's display name (what customers see on the subscribe page).
    /// @param description A short description of what the subscription covers.
    struct Plan {
        address merchant;
        uint128 pricePerCycle;
        uint40 cycleDuration;
        bool active;
        string name;
        string description;
    }

    /// @notice A customer's subscription to a plan.
    /// @param planId The plan this subscription belongs to.
    /// @param customer The address paying for the subscription; also the sender of every stream.
    /// @param tag The reserved XRPL destination tag used to fund each billing cycle.
    /// @param streamId The stream of the current billing cycle (zero until the first payment is finalized).
    /// @param cycle The number of billing cycles funded so far.
    /// @param active Whether the subscription is active. Set to false after cancellation.
    struct Subscription {
        uint256 planId;
        address customer;
        uint256 tag;
        uint256 streamId;
        uint256 cycle;
        bool active;
    }

    /*//////////////////////////////////////////////////////////////////////////
                                      EVENTS
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a merchant creates a plan.
    event PlanCreated(
        uint256 indexed planId,
        address indexed merchant,
        uint128 pricePerCycle,
        uint40 cycleDuration,
        string name,
        string description
    );

    /// @notice Emitted when a merchant deactivates a plan.
    event PlanDeactivated(uint256 indexed planId);

    /// @notice Emitted when a customer subscribes. `tag` is the XRPL destination tag to pay into.
    event SubscriptionCreated(
        uint256 indexed subscriptionId, address indexed customer, uint256 indexed planId, uint256 tag
    );

    /// @notice Emitted when a payment is finalized into a stream for a billing cycle.
    event SubscriptionFinalized(
        uint256 indexed subscriptionId, uint256 indexed streamId, uint256 cycle, uint128 amount
    );

    /// @notice Emitted when a subscription is deactivated after its stream was canceled.
    event SubscriptionDeactivated(uint256 indexed subscriptionId);

    /*//////////////////////////////////////////////////////////////////////////
                                     CONSTRUCTOR
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice Resolves FXRP and the MintingTagManager from Flare's dynamic contract registry. Addresses
    ///         must never be hardcoded — they change between deployments.
    /// @param registry Flare's contract registry.
    /// @param lockupAddress The address of the {DripLockup} contract.
    constructor(IFlareContractRegistry registry, address lockupAddress) {
        address assetManager = registry.getContractAddressByName("AssetManagerFXRP");
        fxrp = IERC20(IAssetManagerFXRP(assetManager).fAsset());
        mintingTagManager = IMintingTagManager(IAssetManagerFXRP(assetManager).getMintingTagManager());
        lockup = IDripLockup(lockupAddress);

        // Set the next plan and subscription IDs to 1.
        nextPlanId = 1;
        nextSubscriptionId = 1;

        // Approve the lockup to pull deposited FXRP from this contract. This wrapper is the only funder
        // of streams, so a one-time max approval is safe.
        fxrp.approve(lockupAddress, type(uint256).max);
    }

    /*//////////////////////////////////////////////////////////////////////////
                          USER-FACING STATE-CHANGING FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice Registers a subscription plan. The caller becomes the merchant.
    /// @param name The plan's display name (e.g. "Amaka's Newsletter"). Required.
    /// @param description A short description of what the subscription covers. Optional.
    /// @param pricePerCycle The expected FXRP amount per billing cycle, in UBA.
    /// @param cycleDuration The billing period in seconds.
    /// @return planId The id of the newly created plan.
    function createPlan(
        string calldata name,
        string calldata description,
        uint128 pricePerCycle,
        uint40 cycleDuration
    ) external returns (uint256 planId) {
        // Check: the name is not empty, and the price and the cycle duration are not zero.
        if (bytes(name).length == 0 || pricePerCycle == 0 || cycleDuration == 0) {
            revert Errors.DripSubscriptions_InvalidPlan();
        }

        // Load the plan ID in a variable.
        planId = nextPlanId;

        // Effect: store the plan.
        plans[planId] = Plan({
            merchant: msg.sender,
            pricePerCycle: pricePerCycle,
            cycleDuration: cycleDuration,
            active: true,
            name: name,
            description: description
        });

        unchecked {
            // Effect: bump the next plan ID.
            nextPlanId = planId + 1;
        }

        // Log the creation of the plan.
        emit PlanCreated(planId, msg.sender, pricePerCycle, cycleDuration, name, description);
    }

    /// @notice Deactivates a plan so new customers cannot subscribe. Existing subscriptions are unaffected.
    /// @param planId The id of the plan to deactivate.
    function deactivatePlan(uint256 planId) external {
        // Check: the caller is the plan's merchant.
        if (msg.sender != plans[planId].merchant) {
            revert Errors.DripSubscriptions_UnauthorizedPlanOwner(planId, msg.sender);
        }

        // Effect: deactivate the plan.
        plans[planId].active = false;

        // Log the deactivation.
        emit PlanDeactivated(planId);
    }

    /// @notice Creates a subscription for a plan and reserves a reusable XRPL destination tag for it.
    /// @dev The reservation fee is paid by this contract in C2FLR, so the contract must be funded with
    ///      native tokens at deployment.
    /// @param planId The id of the plan to subscribe to.
    /// @return subscriptionId The id of the newly created subscription.
    /// @return tag The XRPL destination tag the customer pays into for every billing cycle.
    function subscribe(uint256 planId) external returns (uint256 subscriptionId, uint256 tag) {
        // Check: the plan exists and is active.
        if (!plans[planId].active) {
            revert Errors.DripSubscriptions_PlanNotActive(planId);
        }

        // Interaction: reserve a minting tag and bind this contract as its minting recipient, so direct
        // mints using this destination tag land here.
        tag = mintingTagManager.reserve{ value: mintingTagManager.reservationFee() }();
        mintingTagManager.setMintingRecipient(tag, address(this));

        // Load the subscription ID in a variable.
        subscriptionId = nextSubscriptionId;

        // Effect: store the subscription.
        subscriptions[subscriptionId] = Subscription({
            planId: planId,
            customer: msg.sender,
            tag: tag,
            streamId: 0,
            cycle: 0,
            active: true
        });

        unchecked {
            // Effect: bump the next subscription ID.
            nextSubscriptionId = subscriptionId + 1;
        }

        // Log the creation of the subscription.
        emit SubscriptionCreated(subscriptionId, msg.sender, planId, tag);
    }

    /// @notice Credits a received payment to a subscription and opens the stream for its next billing cycle.
    /// @dev Callable by anyone once the direct mint has landed: the entire pending balance ({pendingFxrp})
    ///      becomes the stream's deposit. The stream's sender is the customer, so they can cancel it
    ///      directly on {DripLockup} and be refunded the unstreamed remainder. Renewal is the same call
    ///      after the customer pays again with the subscription's tag.
    /// @param subscriptionId The id of the subscription to finalize.
    function finalize(uint256 subscriptionId) external {
        // Check: the subscription is active.
        Subscription storage subscription = subscriptions[subscriptionId];
        if (!subscription.active) {
            revert Errors.DripSubscriptions_SubscriptionNotActive(subscriptionId);
        }

        // Check: there is a payment waiting to be credited. FXRP can only leave this contract through
        // {finalize}, so the contract's balance is exactly the uncredited amount.
        uint256 amount = pendingFxrp();
        if (amount == 0) {
            revert Errors.DripSubscriptions_NoPendingPayment();
        }

        // Interactions: deposit the payment into a cancelable linear stream for this billing cycle.
        uint256 streamId = lockup.createStream({
            sender: subscription.customer,
            recipient: plans[subscription.planId].merchant,
            depositAmount: uint128(amount),
            token: fxrp,
            duration: plans[subscription.planId].cycleDuration
        });

        // Effect: record the new stream.
        subscription.streamId = streamId;
        subscription.cycle += 1;
        lastStreamOf[subscription.customer] = streamId;

        // Log the finalized payment.
        emit SubscriptionFinalized(subscriptionId, streamId, subscription.cycle, uint128(amount));
    }

    /// @notice Marks a subscription as inactive once its current stream has been canceled.
    /// @dev The refund itself is handled by {DripLockup.cancel}, which sends the unstreamed remainder
    ///      straight to the customer (the stream's sender). Anyone can call this for bookkeeping.
    /// @param subscriptionId The id of the subscription to deactivate.
    function deactivateSubscription(uint256 subscriptionId) external {
        Subscription storage subscription = subscriptions[subscriptionId];

        // Check: the subscription is active.
        if (!subscription.active) {
            revert Errors.DripSubscriptions_SubscriptionNotActive(subscriptionId);
        }

        // Check: the current stream has been canceled or depleted, i.e. the customer actually stopped it.
        Lockup.Status status = lockup.statusOf(subscription.streamId);
        if (status != Lockup.Status.CANCELED && status != Lockup.Status.DEPLETED) {
            revert Errors.DripSubscriptions_StreamNotCanceled(subscriptionId);
        }

        // Effect: mark the subscription as inactive. The customer canceled, so no further funding will arrive.
        subscription.active = false;

        // Log the deactivation.
        emit SubscriptionDeactivated(subscriptionId);
    }

    /*//////////////////////////////////////////////////////////////////////////
                          USER-FACING READ-ONLY FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev The most recently finalized stream per customer, used by {isActive}.
    mapping(address customer => uint256 streamId) public lastStreamOf;

    /// @notice Returns the FXRP balance that has arrived (via direct mints) but has not yet been
    ///         credited to a stream by {finalize}. FXRP can only leave this contract through {finalize},
    ///         so this is simply the contract's FXRP balance.
    function pendingFxrp() public view returns (uint256) {
        return fxrp.balanceOf(address(this));
    }

    /// @notice Returns whether a customer is currently paid up: their most recently finalized
    ///         stream is still streaming.
    /// @dev This is the building block a merchant wires into their own access control ("is this
    ///      address currently subscribed?"). It gates nothing itself — it only reports status.
    /// @param customer The customer address.
    /// @return Whether the customer's latest cycle is live right now.
    function isActive(address customer) external view returns (bool) {
        uint256 streamId = lastStreamOf[customer];
        return streamId != 0 && lockup.statusOf(streamId) == Lockup.Status.STREAMING;
    }

    /*//////////////////////////////////////////////////////////////////////////
                                      FALLBACK
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice Accepts native tokens used to pay tag reservation fees on {IMintingTagManager}.
    /// @dev Native tokens are only ever spent by {subscribe} to reserve a subscription's minting tag;
    ///      any excess balance stays in this contract.
    receive() external payable {}

    /// @notice Accepts the ERC-721 minted by {IMintingTagManager} when a tag is reserved.
    /// @dev The tag NFT is held by this contract so the subscription's tag stays bound to it for
    ///      renewal cycles; the customer never holds it directly.
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
