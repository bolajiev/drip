// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.22;

/// @notice Namespace for the structs used only in LL streams.
/// @dev Vendored verbatim from sablier-labs/lockup v3.0.1 (src/types/LockupLinear.sol).
library LockupLinear {
    /// @notice Struct encapsulating the cliff duration and the total duration used at runtime in
    /// {SablierLockupLinear.createWithDurationsLL} function.
    /// @param cliff The cliff duration in seconds.
    /// @param total The total duration in seconds.
    struct Durations {
        uint40 cliff;
        uint40 total;
    }

    /// @notice Struct encapsulating the unlock amounts for the stream.
    /// @dev The sum of `start` and `cliff` must be less than or equal to deposit amount. Both amounts can be zero.
    /// @param start The amount to be unlocked at the start time.
    /// @param cliff The amount to be unlocked at the cliff time.
    struct UnlockAmounts {
        // slot 0
        uint128 start;
        uint128 cliff;
    }
}
