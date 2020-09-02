// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { Governable } from "./Governable.sol";

contract WithAdminMode is Governable {
    bool private adminMode = true;

    modifier whenAdminMode() {
        require(adminMode, "AdminMode: ADMIN_MODE_INACTIVE");
        _;
    }

    function renounceAdminMode() public whenAdminMode onlyOwner {
        adminMode = false;
    }

    function isAdminMode() public view returns (bool) {
        return adminMode;
    }
}
