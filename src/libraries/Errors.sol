// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.22;

import { Lockup } from "../types/Lockup.sol";

/// @title Errors
/// @notice Library with all the errors used by the Drip contracts.
/// @dev Error signatures are identical to the ones in sablier-labs/lockup v3.0.1 (src/libraries/Errors.sol);
///      only the errors used by the linear model and the subscription wrapper are kept.
library Errors {
    /*//////////////////////////////////////////////////////////////////////////
                                    HELPERS
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice Thrown when trying to create a linear stream with a cliff time not strictly less than the end time.
    error SablierHelpers_CliffTimeNotLessThanEndTime(uint40 cliffTime, uint40 endTime);

    /// @notice Thrown when trying to create a stream with a non zero cliff unlock amount when the cliff time is zero.
    error SablierHelpers_CliffTimeZeroUnlockAmountNotZero(uint128 cliffUnlockAmount);

    /// @notice Thrown when trying to create a stream with the native token.
    error SablierHelpers_CreateNativeToken(address nativeToken);

    /// @notice Thrown when trying to create a stream with a zero deposit amount.
    error SablierHelpers_DepositAmountZero();

    /// @notice Thrown when trying to create a stream with the sender as the zero address.
    error SablierHelpers_SenderZeroAddress();

    /// @notice Thrown when trying to create a stream with a shape string exceeding 32 bytes.
    error SablierHelpers_ShapeExceeds32Bytes(uint256 shapeLength);

    /// @notice Thrown when trying to create a linear stream with a start time not strictly less than the cliff time,
    /// when the cliff time does not have a zero value.
    error SablierHelpers_StartTimeNotLessThanCliffTime(uint40 startTime, uint40 cliffTime);

    /// @notice Thrown when trying to create a linear stream with a start time not strictly less than the end time.
    error SablierHelpers_StartTimeNotLessThanEndTime(uint40 startTime, uint40 endTime);

    /// @notice Thrown when trying to create a stream with a zero start time.
    error SablierHelpers_StartTimeZero();

    /// @notice Thrown when trying to create a stream with the sum of the unlock amounts greater than the deposit
    /// amount.
    error SablierHelpers_UnlockAmountsSumTooHigh(
        uint128 depositAmount, uint128 startUnlockAmount, uint128 cliffUnlockAmount
    );

    /*//////////////////////////////////////////////////////////////////////////
                                    DRIP-LOCKUP
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice Thrown when trying to withdraw an amount greater than the withdrawable amount.
    error SablierLockup_Overdraw(uint256 streamId, uint128 amount, uint128 withdrawableAmount);

    /// @notice Thrown when trying to cancel or renounce a canceled stream.
    error SablierLockup_StreamCanceled(uint256 streamId);

    /// @notice Thrown when trying to cancel, renounce, or withdraw from a depleted stream.
    error SablierLockup_StreamDepleted(uint256 streamId);

    /// @notice Thrown when trying to cancel or renounce a stream that is not cancelable.
    error SablierLockup_StreamNotCancelable(uint256 streamId);

    /// @notice Thrown when trying to cancel or renounce a settled stream.
    error SablierLockup_StreamSettled(uint256 streamId);

    /// @notice Thrown when `msg.sender` lacks authorization to perform an action.
    error SablierLockup_Unauthorized(uint256 streamId, address caller);

    /// @notice Thrown when trying to withdraw to an address other than the recipient's.
    error SablierLockup_WithdrawalAddressNotRecipient(uint256 streamId, address caller, address to);

    /// @notice Thrown when trying to withdraw zero tokens from a stream.
    error SablierLockup_WithdrawAmountZero(uint256 streamId);

    /// @notice Thrown when trying to withdraw to the zero address.
    error SablierLockup_WithdrawToZeroAddress(uint256 streamId);

    /// @notice Thrown when the ID references a null stream.
    error SablierLockupState_Null(uint256 streamId);

    /*//////////////////////////////////////////////////////////////////////////
                                  DRIP-SUBSCRIPTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice Thrown when trying to create a plan with an invalid price or duration.
    error DripSubscriptions_InvalidPlan();

    /// @notice Thrown when trying to subscribe to a plan that does not exist or is not active.
    error DripSubscriptions_PlanNotActive(uint256 planId);

    /// @notice Thrown when trying to deactivate a plan that is not owned by `msg.sender`.
    error DripSubscriptions_UnauthorizedPlanOwner(uint256 planId, address caller);

    /// @notice Thrown when trying to finalize or cancel a subscription that is not active.
    error DripSubscriptions_SubscriptionNotActive(uint256 subscriptionId);

    /// @notice Thrown when trying to finalize a subscription before a payment has arrived.
    error DripSubscriptions_NoPendingPayment();

    /// @notice Thrown when trying to deactivate a subscription whose current stream has not been canceled.
    error DripSubscriptions_StreamNotCanceled(uint256 subscriptionId);
}
