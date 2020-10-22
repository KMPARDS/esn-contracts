// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { Context } from "@openzeppelin/contracts/GSN/Context.sol";

// import { Initializable } from "@openzeppelin/contracts/proxy/Initializable.sol";

contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        address msgSender = _msgSender();
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(_owner == _msgSender(), "Ownable: CALLER_IS_NOT_THE_OWNER");
        _;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    // function renounceOwnership() public virtual onlyOwner {
    //     emit OwnershipTransferred(_owner, address(0));
    //     _owner = address(0);
    // }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0), "Ownable: NEW_OWNER_IS_ZERO_ADDR");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

/// @notice ERC173 Contract Ownership
abstract contract Governable is Ownable {
    /// @notice Adding an extra modifier to prevent confusion between faith minus and governance
    modifier onlyGovernance() virtual {
        require(owner() == msg.sender, "Ownable: CALLER_IS_NOT_THE_OWNER");
        _;
    }

    function _initializeGovernable() internal {
        _transferOwnership(msg.sender);
    }
}
