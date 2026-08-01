// SPDX-License-Identifier: MIT
pragma solidity >=0.8.22;

import { Script, console } from "forge-std/Script.sol";

import { DripLockup } from "../src/DripLockup.sol";
import { DripSubscriptions } from "../src/DripSubscriptions.sol";
import { IFlareContractRegistry } from "../src/interfaces/IFlareContractRegistry.sol";

/// @notice Deploys DripLockup, then DripSubscriptions wired to it. The wrapper resolves FXRP and the
///         MintingTagManager at runtime from Flare's contract registry.
/// @dev Usage: forge script script/Deploy.s.sol:Deploy --rpc-url coston2 --broadcast
contract Deploy is Script {
    /// @dev FlareContractRegistry is deployed at this same address on every Flare network.
    address internal constant FLARE_CONTRACT_REGISTRY = 0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019;

    function run() external returns (DripLockup lockup, DripSubscriptions subscriptions) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        lockup = new DripLockup();
        subscriptions = new DripSubscriptions(
            IFlareContractRegistry(FLARE_CONTRACT_REGISTRY), address(lockup)
        );

        vm.stopBroadcast();

        console.log("DripLockup:", address(lockup));
        console.log("DripSubscriptions:", address(subscriptions));
        console.log("FXRP:", address(subscriptions.fxrp()));
        console.log("MintingTagManager:", address(subscriptions.mintingTagManager()));
    }
}
