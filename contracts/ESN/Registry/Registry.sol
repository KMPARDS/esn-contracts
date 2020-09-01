// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { IRegistry } from "./IRegistry.sol";
import { Governable } from "../Governance/Governable.sol";

contract Registry is IRegistry, Governable {
    mapping(bytes32 => address) registry;

    event UpdateAddress(bytes32 indexed identifier, address indexed entry);

    function setAddress(bytes32 _identifier, address _entry) public onlyGovernance {
        registry[_identifier] = _entry;

        emit UpdateAddress(_identifier, _entry);
    }

    function getAddress(bytes32 _identifier) public override view returns (address) {
        return registry[_identifier];
    }
}
