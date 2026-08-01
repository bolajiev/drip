// SPDX-License-Identifier: MIT
pragma solidity >=0.8.22;

/// @title IAssetManagerFXRP
/// @notice Minimal interface of the FXRP AssetManager diamond, as used by Drip's subscription wrapper.
/// @dev Signatures match flare-foundation/fassets (IDirectMintingSettings.sol and the AssetManager interface).
interface IAssetManagerFXRP {
    /// @notice Returns the address of the f-asset token contract (FXRP).
    function fAsset() external view returns (address);

    /// @notice Returns the address of the MintingTagManager, used to reserve XRPL destination tags.
    function getMintingTagManager() external view returns (address);
}
