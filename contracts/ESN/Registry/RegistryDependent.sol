// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { IRegistry } from "./IRegistry.sol";
import { Governable } from "../Governance/Governable.sol";

abstract contract RegistryDependent is Governable {
    IRegistry private registry;

    function setRegistry(address _registry) public onlyGovernance {
        registry = IRegistry(_registry);
    }

    function _addressOf(bytes32 _identifier) internal view returns (address) {
        return registry.getAddress(_identifier);
    }
}
