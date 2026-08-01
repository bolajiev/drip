// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.22;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { Lockup } from "../types/Lockup.sol";
import { LockupLinear } from "../types/LockupLinear.sol";

/// @title IDripLockup
/// @notice Interface of {DripLockup}, Drip's fork of Sablier's audited linear-vesting contracts.
/// @dev The stream lifecycle is a subset of {ISablierLockupLinear} + {ISablierLockup}: create a cancelable
///      linear stream, withdraw the vested amount, or cancel and refund the sender. Unlike upstream Sablier,
///      streams are not represented as NFTs and there are no protocol fees or hooks.
interface IDripLockup {
    /*//////////////////////////////////////////////////////////////////////////
                                      EVENTS
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a stream is created. Same shape as Sablier's {ISablierLockupLinear.CreateLockupLinearStream}.
    /// @param streamId The id of the newly created stream.
    /// @param funder The address that funded the stream.
    /// @param sender The address distributing the tokens, with the ability to cancel the stream.
    /// @param recipient The address receiving the tokens.
    /// @param depositAmount The amount deposited in the stream.
    /// @param token The contract address of the ERC-20 token to be distributed.
    /// @param startTime The Unix timestamp indicating the stream's start.
    /// @param endTime The Unix timestamp indicating the stream's end.
    event CreateLockupLinearStream(
        uint256 streamId,
        address funder,
        address sender,
        address recipient,
        uint128 depositAmount,
        IERC20 token,
        uint40 startTime,
        uint40 endTime
    );

    /// @notice Emitted when a stream is canceled. Same shape as Sablier's {ISablierLockup.CancelLockupStream}.
    /// @param streamId The id of the canceled stream.
    /// @param sender The address distributing the tokens.
    /// @param recipient The address receiving the tokens.
    /// @param token The contract address of the ERC-20 token to be distributed.
    /// @param senderAmount The amount refunded to the sender.
    /// @param recipientAmount The amount remaining for the recipient to withdraw.
    event CancelLockupStream(
        uint256 streamId, address sender, address recipient, IERC20 token, uint128 senderAmount, uint128 recipientAmount
    );

    /// @notice Emitted when a withdrawal is made. Same shape as Sablier's {ISablierLockup.WithdrawFromLockupStream}.
    /// @param streamId The id of the stream from which tokens were withdrawn.
    /// @param to The address that received the tokens.
    /// @param token The contract address of the ERC-20 token.
    /// @param amount The amount of tokens withdrawn.
    event WithdrawFromLockupStream(uint256 streamId, address to, IERC20 token, uint128 amount);

    /*//////////////////////////////////////////////////////////////////////////
                          USER-FACING STATE-CHANGING FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice Creates a cancelable linear stream that vests `depositAmount` over `duration` seconds, starting now.
    /// @dev The deposit is pulled from `msg.sender`, who may be different from `sender`.
    /// @param sender The address distributing the tokens, with the ability to cancel the stream.
    /// @param recipient The address receiving the tokens.
    /// @param depositAmount The amount of `token` to deposit in the stream.
    /// @param token The contract address of the ERC-20 token to be distributed.
    /// @param duration The total duration of the stream in seconds.
    /// @return streamId The id of the newly created stream.
    function createStream(address sender, address recipient, uint128 depositAmount, IERC20 token, uint40 duration)
        external
        returns (uint256 streamId);

    /// @notice Cancels a stream and refunds the unstreamed remainder to the sender.
    /// @dev Only the stream's sender can cancel.
    /// @param streamId The id of the stream to cancel.
    /// @return refundedAmount The amount refunded to the sender.
    function cancel(uint256 streamId) external returns (uint128 refundedAmount);

    /// @notice Withdraws `amount` of tokens from a stream to `to`.
    /// @dev Only the stream's recipient can withdraw.
    /// @param streamId The id of the stream to withdraw from.
    /// @param to The address to send the tokens to.
    /// @param amount The amount of tokens to withdraw.
    function withdraw(uint256 streamId, address to, uint128 amount) external;

    /// @notice Withdraws all the withdrawable amount from a stream to `to`.
    /// @dev Only the stream's recipient can withdraw.
    /// @param streamId The id of the stream to withdraw from.
    /// @param to The address to send the tokens to.
    /// @return withdrawnAmount The amount of tokens withdrawn.
    function withdrawMax(uint256 streamId, address to) external returns (uint128 withdrawnAmount);

    /*//////////////////////////////////////////////////////////////////////////
                          USER-FACING READ-ONLY FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice Retrieves the status of a stream.
    function statusOf(uint256 streamId) external view returns (Lockup.Status status);

    /// @notice Retrieves the amount of tokens streamed (vested) so far.
    function streamedAmountOf(uint256 streamId) external view returns (uint128 streamedAmount);

    /// @notice Retrieves the amount of tokens that can be withdrawn right now.
    function withdrawableAmountOf(uint256 streamId) external view returns (uint128 withdrawableAmount);

    /// @notice Retrieves the amount of tokens that would be refunded to the sender if the stream were canceled now.
    function refundableAmountOf(uint256 streamId) external view returns (uint128 refundableAmount);

    /// @notice Retrieves the recipient of a stream.
    function recipientOf(uint256 streamId) external view returns (address recipient);

    /// @notice Retrieves the full stream struct.
    function getStream(uint256 streamId) external view returns (Lockup.Stream memory stream);

    /// @notice Retrieves the unlock amounts of a stream.
    function getUnlockAmounts(uint256 streamId)
        external
        view
        returns (LockupLinear.UnlockAmounts memory unlockAmounts);
}
