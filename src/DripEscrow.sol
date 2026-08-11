// SPDX-License-Identifier: MIT
pragma solidity >=0.8.22;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title DripEscrow
/// @notice One-per-subscription FXRP wallet. The subscription's reserved XRPL destination tag is bound
///         to this contract as its minting recipient, so direct-minted FXRP lands here — segregated per
///         subscription. The factory can pull the balance (to fund a stream via {DripSubscriptions.finalize})
///         or refund it to the customer. No other party can move the funds.
contract DripEscrow {
    /*//////////////////////////////////////////////////////////////////////////
                                  STATE VARIABLES
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev The FXRP token (minting recipient for this escrow's destination tag).
    IERC20 public immutable fxrp;

    /// @dev The factory contract that created this escrow; the only address allowed to pull or refund.
    address public immutable subscriptions;

    /// @dev The subscriber; the only address funds can be refunded to.
    address public immutable customer;

    /*//////////////////////////////////////////////////////////////////////////
                                    CONSTRUCTOR
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Approves the factory to pull FXRP from this escrow. The factory is the only funder of
    ///      streams, so a one-time max approval is safe.
    constructor(IERC20 fxrp_, address subscriptions_, address customer_) {
        fxrp = fxrp_;
        subscriptions = subscriptions_;
        customer = customer_;
        fxrp_.approve(subscriptions_, type(uint256).max);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                   RESTRICTED FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Only the factory may pull or refund.
    modifier onlySubscriptions() {
        require(msg.sender == subscriptions, "escrow: not factory");
        _;
    }

    /// @notice The FXRP balance that has arrived (via direct mints with this escrow's tag) but has
    ///         not yet been credited to a stream by {DripSubscriptions.finalize}.
    function balance() external view returns (uint256) {
        return fxrp.balanceOf(address(this));
    }

    /// @notice Moves the escrow balance to the factory (used by {DripSubscriptions.finalize} to fund
    ///         the next stream). Only callable by the factory.
    function pull() external onlySubscriptions returns (uint256 amount) {
        amount = fxrp.balanceOf(address(this));
        fxrp.transfer(subscriptions, amount);
    }

    /// @notice Refunds the escrow balance to the customer. Only callable by the factory.
    function refund() external onlySubscriptions returns (uint256 amount) {
        amount = fxrp.balanceOf(address(this));
        fxrp.transfer(customer, amount);
    }
}
