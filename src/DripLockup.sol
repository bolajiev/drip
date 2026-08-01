// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.22;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { IDripLockup } from "./interfaces/IDripLockup.sol";
import { Errors } from "./libraries/Errors.sol";
import { Helpers } from "./libraries/Helpers.sol";
import { LockupMath } from "./libraries/LockupMath.sol";
import { Lockup } from "./types/Lockup.sol";
import { LockupLinear } from "./types/LockupLinear.sol";

/*
 * @title DripLockup
 * @notice A fork of Sablier's audited linear-vesting contracts (sablier-labs/lockup v3.0.1), trimmed to the
 *         subset Drip needs: one-directional, cancelable linear streams, no NFT representation, no protocol
 *         fees, no hooks.
 *
 * @dev The streaming math ({LockupMath.calculateStreamedAmountLL}) and the stream lifecycle logic (create,
 *      withdraw, cancel) are upstream Sablier code, unmodified. Removed upstream features: ERC-721 stream
 *      NFTs, Comptroller fees in native tokens, recipient hooks, dynamic/tranched models, batch operations.
 *      The stream's recipient is stored in a mapping instead of being the NFT owner.
 *
 *      Trust model:
 *      - The stream's `sender` can cancel at any time and is refunded the unstreamed remainder.
 *      - The stream's `recipient` can withdraw only what has vested so far.
 */
contract DripLockup is IDripLockup {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////////////////
                                  STATE VARIABLES
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Cliff timestamps mapped by stream IDs. Always zero in Drip (no cliffs), kept for Sablier parity.
    mapping(uint256 streamId => uint40 cliffTime) internal _cliffs;

    /// @dev Lockup streams mapped by unsigned integers.
    mapping(uint256 id => Lockup.Stream stream) internal _streams;

    /// @dev Unlock amounts mapped by stream IDs. Always zero in Drip, kept for Sablier parity.
    mapping(uint256 streamId => LockupLinear.UnlockAmounts unlockAmounts) internal _unlockAmounts;

    /// @dev Recipients mapped by stream IDs. Upstream stores this as the NFT owner.
    mapping(uint256 streamId => address recipient) internal _recipients;

    /// @dev The id of the next stream to be created.
    uint256 public nextStreamId;

    /*//////////////////////////////////////////////////////////////////////////
                                      MODIFIERS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Checks that `streamId` does not reference a null stream.
    modifier notNull(uint256 streamId) {
        _notNull(streamId);
        _;
    }

    /*//////////////////////////////////////////////////////////////////////////
                                     CONSTRUCTOR
    //////////////////////////////////////////////////////////////////////////*/

    constructor() {
        // Set the next stream to 1.
        nextStreamId = 1;
    }

    /*//////////////////////////////////////////////////////////////////////////
                          USER-FACING STATE-CHANGING FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @inheritdoc IDripLockup
    function createStream(address sender, address recipient, uint128 depositAmount, IERC20 token, uint40 duration)
        external
        returns (uint256 streamId)
    {
        // Set the current block timestamp as the stream's start time.
        Lockup.Timestamps memory timestamps = Lockup.Timestamps({ start: uint40(block.timestamp), end: 0 });

        // Calculate the end time.
        timestamps.end = timestamps.start + duration;

        // Validate the user-provided parameters. Cliff time and unlock amounts are always zero in Drip.
        Helpers.checkCreateLL({
            sender: sender,
            timestamps: timestamps,
            cliffTime: 0,
            depositAmount: depositAmount,
            unlockAmounts: LockupLinear.UnlockAmounts({ start: 0, cliff: 0 }),
            token: address(token),
            nativeToken: address(0),
            shape: ""
        });

        // Load the stream ID in a variable.
        streamId = nextStreamId;

        // Effect: store the recipient. Upstream mints an ERC-721 NFT to this address.
        _recipients[streamId] = recipient;

        // Effect: create the stream.
        _streams[streamId] = Lockup.Stream({
            sender: sender,
            startTime: timestamps.start,
            endTime: timestamps.end,
            isCancelable: true,
            wasCanceled: false,
            token: token,
            isDepleted: false,
            isTransferable: false,
            lockupModel: Lockup.Model.LOCKUP_LINEAR,
            amounts: Lockup.Amounts({ deposited: depositAmount, withdrawn: 0, refunded: 0 })
        });

        unchecked {
            // Effect: bump the next stream ID.
            nextStreamId = streamId + 1;
        }

        // Interaction: transfer the deposit amount from the funder.
        token.safeTransferFrom({ from: msg.sender, to: address(this), value: depositAmount });

        // Log the newly created stream.
        emit CreateLockupLinearStream({
            streamId: streamId,
            funder: msg.sender,
            sender: sender,
            recipient: recipient,
            depositAmount: depositAmount,
            token: token,
            startTime: timestamps.start,
            endTime: timestamps.end
        });
    }

    /// @inheritdoc IDripLockup
    function cancel(uint256 streamId)
        public
        override
        notNull(streamId)
        returns (uint128 refundedAmount)
    {
        // Check: the stream is neither depleted nor canceled.
        if (_streams[streamId].isDepleted) {
            revert Errors.SablierLockup_StreamDepleted(streamId);
        } else if (_streams[streamId].wasCanceled) {
            revert Errors.SablierLockup_StreamCanceled(streamId);
        }

        // Check: `msg.sender` is the stream's sender.
        if (msg.sender != _streams[streamId].sender) {
            revert Errors.SablierLockup_Unauthorized(streamId, msg.sender);
        }

        // Calculate the streamed amount.
        uint128 streamedAmount = _streamedAmountOf(streamId);

        // Retrieve the amounts from storage.
        Lockup.Amounts memory amounts = _streams[streamId].amounts;

        // Check: the stream is not settled.
        if (streamedAmount >= amounts.deposited) {
            revert Errors.SablierLockup_StreamSettled(streamId);
        }

        // Check: the stream is cancelable.
        if (!_streams[streamId].isCancelable) {
            revert Errors.SablierLockup_StreamNotCancelable(streamId);
        }

        // Calculate the sender's amount.
        unchecked {
            refundedAmount = amounts.deposited - streamedAmount;
        }

        // Calculate the recipient's amount.
        uint128 recipientAmount = streamedAmount - amounts.withdrawn;

        // Effect: mark the stream as canceled.
        _streams[streamId].wasCanceled = true;

        // Effect: make the stream not cancelable anymore, because a stream can only be canceled once.
        _streams[streamId].isCancelable = false;

        // Effect: if there are no tokens left for the recipient to withdraw, mark the stream as depleted.
        if (recipientAmount == 0) {
            _streams[streamId].isDepleted = true;
        }

        // Effect: set the refunded amount.
        _streams[streamId].amounts.refunded = refundedAmount;

        // Retrieve the sender and the recipient from storage.
        address sender = _streams[streamId].sender;
        address recipient = _recipients[streamId];

        // Retrieve the ERC-20 token from storage.
        IERC20 token = _streams[streamId].token;

        // Interaction: refund the sender.
        token.safeTransfer({ to: sender, value: refundedAmount });

        // Log the cancellation.
        emit CancelLockupStream(streamId, sender, recipient, token, refundedAmount, recipientAmount);
    }

    /// @inheritdoc IDripLockup
    function withdraw(uint256 streamId, address to, uint128 amount)
        public
        override
        notNull(streamId)
    {
        // Check: the stream is not depleted.
        if (_streams[streamId].isDepleted) {
            revert Errors.SablierLockup_StreamDepleted(streamId);
        }

        // Check: the withdrawal address is not zero.
        if (to == address(0)) {
            revert Errors.SablierLockup_WithdrawToZeroAddress(streamId);
        }

        // Retrieve the recipient from storage.
        address recipient = _recipients[streamId];

        // Check: `msg.sender` is the stream's recipient.
        if (msg.sender != recipient) {
            revert Errors.SablierLockup_Unauthorized(streamId, msg.sender);
        }

        // Check: the withdrawal address must be the recipient, mirroring upstream's no-approval path.
        if (to != recipient) {
            revert Errors.SablierLockup_WithdrawalAddressNotRecipient(streamId, msg.sender, to);
        }

        // Check: the withdraw amount is not zero.
        if (amount == 0) {
            revert Errors.SablierLockup_WithdrawAmountZero(streamId);
        }

        // Check: the withdraw amount is not greater than the withdrawable amount.
        uint128 withdrawableAmount = _withdrawableAmountOf(streamId);
        if (amount > withdrawableAmount) {
            revert Errors.SablierLockup_Overdraw(streamId, amount, withdrawableAmount);
        }

        // Effect: update the withdrawn amount.
        _streams[streamId].amounts.withdrawn = _streams[streamId].amounts.withdrawn + amount;

        // Retrieve the amounts from storage.
        Lockup.Amounts memory amounts = _streams[streamId].amounts;

        // Using ">=" instead of "==" for additional safety reasons. In the event of an unforeseen increase in the
        // withdrawn amount, the stream will still be marked as depleted.
        if (amounts.withdrawn >= amounts.deposited - amounts.refunded) {
            // Effect: mark the stream as depleted.
            _streams[streamId].isDepleted = true;

            // Effect: make the stream not cancelable anymore, because a depleted stream cannot be canceled.
            _streams[streamId].isCancelable = false;
        }

        // Retrieve the ERC-20 token from storage.
        IERC20 token = _streams[streamId].token;

        // Interaction: perform the ERC-20 transfer.
        token.safeTransfer({ to: to, value: amount });

        // Log the withdrawal.
        emit WithdrawFromLockupStream(streamId, to, token, amount);
    }

    /// @inheritdoc IDripLockup
    function withdrawMax(uint256 streamId, address to) external override returns (uint128 withdrawnAmount) {
        withdrawnAmount = _withdrawableAmountOf(streamId);
        withdraw({ streamId: streamId, to: to, amount: withdrawnAmount });
    }

    /*//////////////////////////////////////////////////////////////////////////
                          USER-FACING READ-ONLY FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @inheritdoc IDripLockup
    function statusOf(uint256 streamId) external view override notNull(streamId) returns (Lockup.Status status) {
        status = _statusOf(streamId);
    }

    /// @inheritdoc IDripLockup
    function streamedAmountOf(uint256 streamId)
        external
        view
        override
        notNull(streamId)
        returns (uint128 streamedAmount)
    {
        streamedAmount = _streamedAmountOf(streamId);
    }

    /// @inheritdoc IDripLockup
    function withdrawableAmountOf(uint256 streamId)
        external
        view
        override
        notNull(streamId)
        returns (uint128 withdrawableAmount)
    {
        withdrawableAmount = _withdrawableAmountOf(streamId);
    }

    /// @inheritdoc IDripLockup
    function refundableAmountOf(uint256 streamId)
        external
        view
        override
        notNull(streamId)
        returns (uint128 refundableAmount)
    {
        // Note that checking for `isCancelable` also checks if the stream `wasCanceled` thanks to the protocol
        // invariant that canceled streams are not cancelable anymore.
        if (_streams[streamId].isCancelable && !_streams[streamId].isDepleted) {
            refundableAmount = _streams[streamId].amounts.deposited - _streamedAmountOf(streamId);
        }
        // Otherwise, the result is implicitly zero.
    }

    /// @inheritdoc IDripLockup
    function recipientOf(uint256 streamId) external view override notNull(streamId) returns (address recipient) {
        recipient = _recipients[streamId];
    }

    /// @inheritdoc IDripLockup
    function getStream(uint256 streamId) external view override notNull(streamId) returns (Lockup.Stream memory stream) {
        stream = _streams[streamId];
    }

    /// @inheritdoc IDripLockup
    function getUnlockAmounts(uint256 streamId)
        external
        view
        override
        notNull(streamId)
        returns (LockupLinear.UnlockAmounts memory unlockAmounts)
    {
        unlockAmounts = _unlockAmounts[streamId];
    }

    /*//////////////////////////////////////////////////////////////////////////
                            INTERNAL READ-ONLY FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Retrieves the stream's status without performing a null check. Upstream {SablierLockupState._statusOf}.
    function _statusOf(uint256 streamId) internal view returns (Lockup.Status) {
        if (_streams[streamId].isDepleted) {
            return Lockup.Status.DEPLETED;
        } else if (_streams[streamId].wasCanceled) {
            return Lockup.Status.CANCELED;
        }

        if (block.timestamp < _streams[streamId].startTime) {
            return Lockup.Status.PENDING;
        }

        if (_streamedAmountOf(streamId) < _streams[streamId].amounts.deposited) {
            return Lockup.Status.STREAMING;
        } else {
            return Lockup.Status.SETTLED;
        }
    }

    /// @dev Calculates the streamed amount for the LL model. Upstream {SablierLockup._streamedAmountOf}.
    function _streamedAmountOf(uint256 streamId) internal view returns (uint128 streamedAmount) {
        // Load the stream from storage.
        Lockup.Stream memory stream = _streams[streamId];

        if (stream.isDepleted) {
            return stream.amounts.withdrawn;
        } else if (stream.wasCanceled) {
            return stream.amounts.deposited - stream.amounts.refunded;
        }

        // Calculate the streamed amount for the LL model.
        streamedAmount = LockupMath.calculateStreamedAmountLL({
            cliffTime: _cliffs[streamId],
            depositedAmount: stream.amounts.deposited,
            endTime: stream.endTime,
            startTime: stream.startTime,
            unlockAmounts: _unlockAmounts[streamId],
            withdrawnAmount: stream.amounts.withdrawn
        });
    }

    /*//////////////////////////////////////////////////////////////////////////
                            PRIVATE READ-ONLY FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev See the documentation for the user-facing functions that call this private function.
    function _withdrawableAmountOf(uint256 streamId) private view returns (uint128) {
        return _streamedAmountOf(streamId) - _streams[streamId].amounts.withdrawn;
    }

    /// @dev A private function is used instead of inlining this logic in a modifier because Solidity copies
    /// modifiers into every function that uses them.
    function _notNull(uint256 streamId) private view {
        // Since {Helpers._checkCreateStream} reverts if the sender address is zero, this can be used to check whether
        // the stream exists.
        if (_streams[streamId].sender == address(0)) {
            revert Errors.SablierLockupState_Null(streamId);
        }
    }
}
