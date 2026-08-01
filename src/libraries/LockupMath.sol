// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.22;

import { PRBMathCastingUint128 as CastingUint128 } from "@prb/math/src/casting/Uint128.sol";
import { PRBMathCastingUint40 as CastingUint40 } from "@prb/math/src/casting/Uint40.sol";
import { UD60x18, ud } from "@prb/math/src/UD60x18.sol";

import { LockupLinear } from "../types/LockupLinear.sol";

/// @title LockupMath
/// @notice Provides functions for calculating the streamed amounts in Lockup streams. Note that 'streamed' is
/// synonymous with 'vested'.
/// @dev Vendored from sablier-labs/lockup v3.0.1 (src/libraries/LockupMath.sol), trimmed to the linear model.
///      The linear streaming math below is unmodified upstream code.
library LockupMath {
    using CastingUint128 for uint128;
    using CastingUint40 for uint40;

    /// @notice Calculates the streamed amount of LL streams.
    /// @dev The LL streaming model uses the following distribution function:
    ///
    /// $$
    ///        ( x * sa + s, block timestamp < cliff time
    /// f(x) = (
    ///        ( x * sa + s + c, block timestamp => cliff time
    /// $$
    ///
    /// Where:
    ///
    /// - $x$ is the elapsed time in the streamable range divided by the total streamable range.
    /// - $sa$ is the streamable amount, i.e. deposited amount minus unlock amounts' sum.
    /// - $s$ is the start unlock amount.
    /// - $c$ is the cliff unlock amount.
    ///
    /// Assumptions:
    /// 1. The sum of the unlock amounts (start and cliff) does not overflow uint128 and is less than or equal to
    /// the deposit amount.
    /// 2. The start time is before the end time.
    /// 3. If the cliff time is not zero, it is after the start time and before the end time.
    function calculateStreamedAmountLL(
        uint40 cliffTime,
        uint128 depositedAmount,
        uint40 endTime,
        uint40 startTime,
        LockupLinear.UnlockAmounts calldata unlockAmounts,
        uint128 withdrawnAmount
    )
        external
        view
        returns (uint128)
    {
        uint40 blockTimestamp = uint40(block.timestamp);

        // If the start time is in the future, return zero.
        if (startTime > blockTimestamp) {
            return 0;
        }

        // If the cliff time is in the future, return the start unlock amount.
        if (cliffTime > blockTimestamp) {
            return unlockAmounts.start;
        }

        // If the end time is not in the future, return the deposited amount.
        if (endTime <= blockTimestamp) {
            return depositedAmount;
        }

        unchecked {
            uint128 unlockAmountsSum = unlockAmounts.start + unlockAmounts.cliff;

            //  If the sum of the unlock amounts is greater than or equal to the deposited amount, return the deposited
            // amount. The ">=" operator is used as a safety measure in case of a bug, as the sum of the unlock amounts
            // should never exceed the deposited amount.
            if (unlockAmountsSum >= depositedAmount) {
                return depositedAmount;
            }

            UD60x18 elapsedTime;
            UD60x18 streamableRange;

            // Calculate the streamable range.
            if (cliffTime == 0) {
                elapsedTime = ud(blockTimestamp - startTime);
                streamableRange = ud(endTime - startTime);
            } else {
                elapsedTime = ud(blockTimestamp - cliffTime);
                streamableRange = ud(endTime - cliffTime);
            }

            UD60x18 elapsedTimePercentage = elapsedTime.div(streamableRange);
            UD60x18 streamableAmount = ud(depositedAmount - unlockAmountsSum);

            // The streamed amount is the sum of the unlock amounts plus the product of elapsed time percentage and
            // streamable amount.
            uint128 streamedAmount = unlockAmountsSum + (elapsedTimePercentage.mul(streamableAmount)).intoUint128();

            // Although the streamed amount should never exceed the deposited amount, this condition is checked
            // without asserting to avoid locking tokens in case of a bug. If this situation occurs, the withdrawn
            // amount is considered to be the streamed amount, and the stream is effectively frozen.
            if (streamedAmount > depositedAmount) {
                return withdrawnAmount;
            }

            return streamedAmount;
        }
    }
}
