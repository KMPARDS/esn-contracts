// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { ERC173 } from "./ERC173.sol";

contract WithAdminMode is ERC173 {
    bool public adminMode = true;

    modifier whenAdminMode() {
        require(adminMode, "AdminMode: ADMIN_MODE_INACTIVE");
        _;
    }

    function renounceMigrationMode() public whenAdminMode onlyOwner {
        adminMode = false;
    }
}
