// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { Governable } from "./Governable.sol";

contract Authorizable is Governable {
    mapping(address => bool) authorized;

    event Authorised(address indexed wallet, bool newStatus);

    modifier onlyAuthorized() {
        require(authorized[msg.sender], "TAProm: Only authorised");
        _;
    }

    function updateAuthorization(address _wallet, bool _newStatus) public onlyOwner {
        authorized[_wallet] = _newStatus;

        emit Authorised(_wallet, _newStatus);
    }

    function isAuthorized(address _wallet) public view returns (bool) {
        return authorized[_wallet];
    }
}
