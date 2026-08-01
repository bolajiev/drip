// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.22;

import { Test } from "forge-std/Test.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { DripLockup } from "../src/DripLockup.sol";
import { Errors } from "../src/libraries/Errors.sol";
import { Lockup } from "../src/types/Lockup.sol";

contract DripLockupTest is Test {
    DripLockup internal lockup;
    MockERC20 internal token;

    address internal constant SENDER = address(0xBEEF);
    address internal constant RECIPIENT = address(0xCAFE);

    uint128 internal constant DEPOSIT = 1_000_000e6;
    uint40 internal constant DURATION = 30 days;

    function setUp() public {
        lockup = new DripLockup();
        token = new MockERC20("FXRP", "FXRP", 6);
        token.mint(address(this), DEPOSIT);
        token.approve(address(lockup), type(uint256).max);
    }

    function test_CreateStream() public {
        uint256 streamId = lockup.createStream(SENDER, RECIPIENT, DEPOSIT, token, DURATION);

        assertEq(streamId, 1);
        assertEq(lockup.nextStreamId(), 2);
        assertEq(token.balanceOf(address(lockup)), DEPOSIT);

        Lockup.Stream memory stream = lockup.getStream(streamId);
        assertEq(stream.sender, SENDER);
        assertEq(stream.startTime, block.timestamp);
        assertEq(stream.endTime, block.timestamp + DURATION);
        assertTrue(stream.isCancelable);
        assertFalse(stream.wasCanceled);
        assertFalse(stream.isDepleted);
        assertEq(address(stream.token), address(token));
        assertEq(stream.amounts.deposited, DEPOSIT);
        assertEq(stream.amounts.withdrawn, 0);
        assertEq(stream.amounts.refunded, 0);

        assertEq(lockup.recipientOf(streamId), RECIPIENT);
        assertTrue(lockup.statusOf(streamId) == Lockup.Status.STREAMING);
        assertEq(lockup.streamedAmountOf(streamId), 0);
    }

    function test_CreateStream_RevertWhen_DepositZero() public {
        vm.expectRevert(Errors.SablierHelpers_DepositAmountZero.selector);
        lockup.createStream(SENDER, RECIPIENT, 0, token, DURATION);
    }

    function test_CreateStream_RevertWhen_SenderZero() public {
        vm.expectRevert(Errors.SablierHelpers_SenderZeroAddress.selector);
        lockup.createStream(address(0), RECIPIENT, DEPOSIT, token, DURATION);
    }

    function test_StreamedAmount_Linear() public {
        uint256 streamId = lockup.createStream(SENDER, RECIPIENT, DEPOSIT, token, DURATION);

        // At 25% of the duration, 25% of the deposit has streamed.
        vm.warp(block.timestamp + DURATION / 4);
        assertEq(lockup.streamedAmountOf(streamId), DEPOSIT / 4);

        // At 75% of the duration, 75% of the deposit has streamed.
        vm.warp(block.timestamp + DURATION / 2);
        assertEq(lockup.streamedAmountOf(streamId), DEPOSIT * 3 / 4);

        // After the end time, everything has streamed and the stream is settled.
        vm.warp(block.timestamp + DURATION);
        assertEq(lockup.streamedAmountOf(streamId), DEPOSIT);
        assertTrue(lockup.statusOf(streamId) == Lockup.Status.SETTLED);
    }

    function test_Withdraw_Partial() public {
        uint256 streamId = lockup.createStream(SENDER, RECIPIENT, DEPOSIT, token, DURATION);

        vm.warp(block.timestamp + DURATION / 2);
        uint128 withdrawable = lockup.withdrawableAmountOf(streamId);

        vm.prank(RECIPIENT);
        lockup.withdraw(streamId, RECIPIENT, withdrawable);

        assertEq(token.balanceOf(RECIPIENT), withdrawable);
        assertEq(lockup.withdrawableAmountOf(streamId), 0);
        assertEq(lockup.getStream(streamId).amounts.withdrawn, withdrawable);
    }

    function test_WithdrawMax_AfterSettlement() public {
        uint256 streamId = lockup.createStream(SENDER, RECIPIENT, DEPOSIT, token, DURATION);

        vm.warp(block.timestamp + DURATION + 1);
        vm.prank(RECIPIENT);
        uint128 withdrawn = lockup.withdrawMax(streamId, RECIPIENT);

        assertEq(withdrawn, DEPOSIT);
        assertEq(token.balanceOf(RECIPIENT), DEPOSIT);
        assertTrue(lockup.statusOf(streamId) == Lockup.Status.DEPLETED);
    }

    function test_Withdraw_RevertWhen_NotRecipient() public {
        uint256 streamId = lockup.createStream(SENDER, RECIPIENT, DEPOSIT, token, DURATION);

        vm.warp(block.timestamp + DURATION / 2);
        vm.prank(address(0x1234));
        vm.expectRevert(
            abi.encodeWithSelector(Errors.SablierLockup_Unauthorized.selector, streamId, address(0x1234))
        );
        lockup.withdraw(streamId, RECIPIENT, DEPOSIT / 2);
    }

    function test_Withdraw_RevertWhen_Overdraw() public {
        uint256 streamId = lockup.createStream(SENDER, RECIPIENT, DEPOSIT, token, DURATION);

        vm.warp(block.timestamp + DURATION / 2);
        vm.prank(RECIPIENT);
        vm.expectRevert(
            abi.encodeWithSelector(
                Errors.SablierLockup_Overdraw.selector, streamId, DEPOSIT, DEPOSIT / 2
            )
        );
        lockup.withdraw(streamId, RECIPIENT, DEPOSIT);
    }

    function test_Cancel_RefundsUnstreamedToSender() public {
        uint256 streamId = lockup.createStream(SENDER, RECIPIENT, DEPOSIT, token, DURATION);

        vm.warp(block.timestamp + DURATION / 2);
        assertEq(lockup.refundableAmountOf(streamId), DEPOSIT / 2);

        vm.prank(SENDER);
        uint128 refunded = lockup.cancel(streamId);

        assertEq(refunded, DEPOSIT / 2);
        assertEq(token.balanceOf(SENDER), DEPOSIT / 2);
        assertEq(token.balanceOf(address(lockup)), DEPOSIT / 2);

        Lockup.Stream memory stream = lockup.getStream(streamId);
        assertTrue(stream.wasCanceled);
        assertEq(stream.amounts.refunded, DEPOSIT / 2);
        assertTrue(lockup.statusOf(streamId) == Lockup.Status.CANCELED);

        // The recipient can still withdraw the streamed remainder.
        vm.prank(RECIPIENT);
        lockup.withdrawMax(streamId, RECIPIENT);
        assertEq(token.balanceOf(RECIPIENT), DEPOSIT / 2);
        assertTrue(lockup.statusOf(streamId) == Lockup.Status.DEPLETED);
    }

    function test_Cancel_RevertWhen_NotSender() public {
        uint256 streamId = lockup.createStream(SENDER, RECIPIENT, DEPOSIT, token, DURATION);

        vm.prank(RECIPIENT);
        vm.expectRevert(
            abi.encodeWithSelector(Errors.SablierLockup_Unauthorized.selector, streamId, RECIPIENT)
        );
        lockup.cancel(streamId);
    }

    function test_Cancel_RevertWhen_Settled() public {
        uint256 streamId = lockup.createStream(SENDER, RECIPIENT, DEPOSIT, token, DURATION);

        vm.warp(block.timestamp + DURATION + 1);
        vm.prank(SENDER);
        vm.expectRevert(abi.encodeWithSelector(Errors.SablierLockup_StreamSettled.selector, streamId));
        lockup.cancel(streamId);
    }

    function test_Withdraw_RevertWhen_NullStream() public {
        vm.expectRevert(abi.encodeWithSelector(Errors.SablierLockupState_Null.selector, 42));
        lockup.statusOf(42);
    }
}

contract MockERC20 is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory name_, string memory symbol_, uint8 decimals_) {
        name = name_;
        symbol = symbol_;
        decimals = decimals_;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
