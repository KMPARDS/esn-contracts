// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice ERC173 Contract Ownership
contract ERC173 is Ownable {
    function renounceOwnership() public virtual override pure {
        revert("ERC173: RENOUNCE_NOT_ALLOWED");
    }
}
