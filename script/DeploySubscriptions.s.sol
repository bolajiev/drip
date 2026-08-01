// SPDX-License-Identifier: MIT
pragma solidity >=0.8.22;

import { Script, console } from "forge-std/Script.sol";

import { DripSubscriptions } from "../src/DripSubscriptions.sol";
import { IFlareContractRegistry } from "../src/interfaces/IFlareContractRegistry.sol";

/// @notice Deploys only DripSubscriptions, wired to an already-deployed DripLockup.
/// @dev Usage: LOCKUP=<lockup-address> forge script script/DeploySubscriptions.s.sol:DeploySubscriptions --rpc-url coston2 --broadcast
contract DeploySubscriptions is Script {
    /// @dev FlareContractRegistry is deployed at this same address on every Flare network.
    address internal constant FLARE_CONTRACT_REGISTRY = 0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019;

    function run() external returns (DripSubscriptions subscriptions) {
        address lockupAddress = vm.envAddress("LOCKUP");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        subscriptions = new DripSubscriptions(
            IFlareContractRegistry(FLARE_CONTRACT_REGISTRY), lockupAddress
        );

        vm.stopBroadcast();

        console.log("DripSubscriptions:", address(subscriptions));
    }
}
