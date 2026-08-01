// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.22;

import { Lockup } from "../types/Lockup.sol";
import { LockupLinear } from "../types/LockupLinear.sol";
import { Errors } from "./Errors.sol";

/// @title Helpers
/// @notice Library with functions needed to validate input parameters across Lockup streams.
/// @dev Vendored from sablier-labs/lockup v3.0.1 (src/libraries/Helpers.sol), trimmed to the linear model.
///      The kept functions are unmodified upstream code.
library Helpers {
    /// @dev Checks the parameters of the {SablierLockup-_createLL} function.
    function checkCreateLL(
        address sender,
        Lockup.Timestamps memory timestamps,
        uint40 cliffTime,
        uint128 depositAmount,
        LockupLinear.UnlockAmounts memory unlockAmounts,
        address token,
        address nativeToken,
        string memory shape
    )
        public
        pure
    {
        // Check: validate the user-provided common parameters.
        _checkCreateStream(sender, depositAmount, timestamps.start, token, nativeToken, shape);

        // Check: validate the user-provided cliff and end times.
        _checkTimestampsAndUnlockAmounts(depositAmount, timestamps, cliffTime, unlockAmounts);
    }

    /*//////////////////////////////////////////////////////////////////////////
                            PRIVATE READ-ONLY FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Checks the user-provided cliff, end times, and unlock amounts of an LL stream.
    function _checkTimestampsAndUnlockAmounts(
        uint128 depositAmount,
        Lockup.Timestamps memory timestamps,
        uint40 cliffTime,
        LockupLinear.UnlockAmounts memory unlockAmounts
    )
        private
        pure
    {
        // Since a cliff time of zero means there is no cliff, the following checks are performed only if it's not zero.
        if (cliffTime > 0) {
            // Check: the start time is strictly less than the cliff time.
            if (timestamps.start >= cliffTime) {
                revert Errors.SablierHelpers_StartTimeNotLessThanCliffTime(timestamps.start, cliffTime);
            }

            // Check: the cliff time is strictly less than the end time.
            if (cliffTime >= timestamps.end) {
                revert Errors.SablierHelpers_CliffTimeNotLessThanEndTime(cliffTime, timestamps.end);
            }
        }
        // Check: the cliff unlock amount is zero when the cliff time is zero.
        else if (unlockAmounts.cliff > 0) {
            revert Errors.SablierHelpers_CliffTimeZeroUnlockAmountNotZero(unlockAmounts.cliff);
        }

        // Check: the start time is strictly less than the end time.
        if (timestamps.start >= timestamps.end) {
            revert Errors.SablierHelpers_StartTimeNotLessThanEndTime(timestamps.start, timestamps.end);
        }

        // Check: the sum of the start and cliff unlock amounts is not greater than the deposit amount.
        if (unlockAmounts.start + unlockAmounts.cliff > depositAmount) {
            revert Errors.SablierHelpers_UnlockAmountsSumTooHigh(
                depositAmount, unlockAmounts.start, unlockAmounts.cliff
            );
        }
    }

    /// @dev Checks the user-provided common parameters across Lockup streams.
    function _checkCreateStream(
        address sender,
        uint128 depositAmount,
        uint40 startTime,
        address token,
        address nativeToken,
        string memory shape
    )
        private
        pure
    {
        // Check: the sender is not the zero address.
        if (sender == address(0)) {
            revert Errors.SablierHelpers_SenderZeroAddress();
        }

        // Check: the deposit amount is not zero.
        if (depositAmount == 0) {
            revert Errors.SablierHelpers_DepositAmountZero();
        }

        // Check: the start time is not zero.
        if (startTime == 0) {
            revert Errors.SablierHelpers_StartTimeZero();
        }

        // Check: the token is not the native token.
        if (token == nativeToken) {
            revert Errors.SablierHelpers_CreateNativeToken(nativeToken);
        }

        // Check: the shape is not greater than 32 bytes.
        if (bytes(shape).length > 32) {
            revert Errors.SablierHelpers_ShapeExceeds32Bytes(bytes(shape).length);
        }
    }
}
