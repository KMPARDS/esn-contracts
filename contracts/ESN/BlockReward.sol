// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "./ValidatorManager.sol";

/// @title Block Reward Contract
/// @notice Used to record that a block is sealed by a validator.
contract BlockReward {
    /// @dev System calls are received by this address.
    address public SYSTEM_ADDRESS = address(2**160 - 2);
    ValidatorManager public validatorManager;

    modifier onlySystem {
        require(msg.sender == SYSTEM_ADDRESS, "Only System can call");
        _;
    }

    /// @notice Sets test system address.
    /// @param _testSystemAddress: Testing address.
    /// @dev For mainnet _testSystemAddress to be passed is zero address.
    constructor(address _testSystemAddress) {
        if (_testSystemAddress != address(0)) {
            SYSTEM_ADDRESS = _testSystemAddress;
        }
    }

    /// @notice Sets validator address.
    /// @param _validatorManager: Address of validator manager contract.
    function setInitialValues(address payable _validatorManager) public {
        validatorManager = ValidatorManager(_validatorManager);
    }

    /// @notice Informs validator manager about sealers.
    /// @param benefactors: Addresses of sealers.
    /// @dev benefactors array would contain a single address.
    function reward(address[] memory benefactors, uint16[] memory)
        external
        onlySystem
        returns (address[] memory, uint256[] memory)
    {
        for (uint256 i = 0; i < benefactors.length; i++) {
            validatorManager.registerBlock(benefactors[i]);
        }

        return (new address[](0), new uint256[](0));
    }
}
