// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice ERC173 Contract Ownership
abstract contract Governable is Ownable {
    /// @notice Adding an extra modifier to prevent confusion between faith minus and governance
    modifier onlyGovernance() virtual {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    // TODO: onlyGovernanceOrFaithMinus, onlyFaithMinus

    function renounceOwnership() public virtual override pure {
        revert("ERC173: RENOUNCE_NOT_ALLOWED");
    }
}
