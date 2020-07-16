// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "./ValidatorManager.sol";

contract BlockReward {
    address public SYSTEM_ADDRESS = address(2**160 - 2);
    ValidatorManager public validatorManager;

    modifier onlySystem {
        require(msg.sender == SYSTEM_ADDRESS, "Only System can call");
        _;
    }

    constructor(address _testSystemAddress) public {
        if (_testSystemAddress != address(0)) {
            SYSTEM_ADDRESS = _testSystemAddress;
        }
    }

    function setInitialValues(address payable _validatorManager) public {
        validatorManager = ValidatorManager(_validatorManager);
    }

    // produce rewards for the given benefactors, with corresponding reward codes.
    // only callable by `SYSTEM_ADDRESS`
    function reward(address[] memory benefactors, uint16[] memory kind)
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
