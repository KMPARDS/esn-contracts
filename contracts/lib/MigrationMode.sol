// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract WithMigrationMode is Ownable {
    bool public migrationMode = true;

    modifier whenMigrationActive() {
        require(migrationMode, "Migration: Migration mode is not active");
        _;
    }

    function renounceMigrationMode() public whenMigrationActive {
        migrationMode = false;
    }
}
