// SPDX-License-Identifier: MIT
pragma solidity >=0.8.22;

/// @title IFlareContractRegistry
/// @notice Minimal interface of Flare's dynamic contract registry. Addresses on Flare change between
///         deployments, so contracts must look up FXRP and the AssetManager at runtime instead of
///         hardcoding them. See dev.flare.network.
interface IFlareContractRegistry {
    /// @notice Returns the address of a contract registered under `name` (e.g. "AssetManagerFXRP").
    /// @dev The Flare registry's getter takes a dynamic string, not a fixed-size bytes32.
    function getContractAddressByName(string calldata name) external view returns (address);
}
