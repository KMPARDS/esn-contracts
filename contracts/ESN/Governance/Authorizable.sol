// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { Governable } from "./Governable.sol";
import { RegistryDependent } from "../KycDapp/RegistryDependent.sol";

contract Authorizable is Governable, RegistryDependent {
    mapping(bytes32 => bool) authorized;

    event Authorised(bytes32 indexed wallet, bool newStatus);

    modifier onlyAuthorized() {
        require(isAuthorized(msg.sender), "Authorizable: Only authorised");
        _;
    }

    function updateAuthorization(bytes32 _username, bool _newStatus) public onlyGovernance {
        authorized[_username] = _newStatus;

        emit Authorised(_username, _newStatus);
    }

    function isAuthorized(address _wallet) public view returns (bool) {
        return isAuthorized(resolveUsername(_wallet));
    }

    function isAuthorized(bytes32 _username) public view returns (bool) {
        return authorized[_username];
    }
}
