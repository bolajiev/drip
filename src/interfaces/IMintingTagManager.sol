// SPDX-License-Identifier: MIT
pragma solidity >=0.8.22;

/// @title IMintingTagManager
/// @notice Minimal interface of Flare's MintingTagManager (flare-foundation/fassets, contracts/userInterfaces/
///         IMintingTagManager.sol). Each tag is an ERC-721 NFT whose owner controls a minting recipient:
///         XRPL payments to the Core Vault carrying the tag as destination tag mint FXRP directly to that
///         recipient. Tags are reusable, which is Drip's renewal mechanism.
interface IMintingTagManager {
    /// @notice Emitted when a new minting tag is reserved.
    event MintingTagReserved(uint256 tag, address owner);

    /// @notice Emitted when the minting recipient for a tag is changed.
    event RecipientChanged(uint256 tag, address recipient);

    /// @notice Reserves a new minting tag by paying the reservation fee. The caller becomes the owner of the
    /// tag and the initial minting recipient.
    /// @return The newly reserved minting tag id.
    function reserve() external payable returns (uint256);

    /// @notice Sets the minting recipient for a tag. Only callable by the tag owner.
    /// @param mintingTag The minting tag id.
    /// @param recipient The new minting recipient address (must not be zero address).
    function setMintingRecipient(uint256 mintingTag, address recipient) external;

    /// @notice The fee (in native currency) required to reserve a new minting tag.
    function reservationFee() external view returns (uint256);

    /// @notice Returns the minting recipient for a given tag.
    function mintingRecipient(uint256 mintingTag) external view returns (address);

    /// @notice Returns all minting tag ids owned by the given address.
    function reservedTagsForOwner(address owner) external view returns (uint256[] memory);
}
