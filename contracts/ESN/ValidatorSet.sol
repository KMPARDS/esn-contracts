// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "../lib/SafeMath.sol";
import "./ValidatorManager.sol";

contract ValidatorSet {
    using SafeMath for uint256;

    uint256 public MAX_VALIDATORS = 5;
    uint256 public PERCENT_UNIQUE = 51;
    uint256 public LUCK_TRIES = 4;
    uint256 public BLOCKS_INTERVAL = 40;
    uint256 public lastFinalizeChangeBlock;

    address public SYSTEM_ADDRESS = address(2**160 - 2);

    ValidatorManager public validatorManager;

    address[] currentValidators;
    address[] nextValidators;
    address[] seedValidators;

    event InitiateChange(bytes32 indexed _parent_hash, address[] _new_set);

    constructor(address[] memory _seedValidators, address _testSystemAddress) public {
        currentValidators = _seedValidators;
        seedValidators = _seedValidators;
        if (_testSystemAddress != address(0)) {
            SYSTEM_ADDRESS = _testSystemAddress;
        }
    }

    function setInitialValues(
        address payable _validatorManager,
        uint256 _MAX_VALIDATORS,
        uint256 _PERCENT_UNIQUE,
        uint256 _LUCK_TRIES,
        uint256 _BLOCKS_INTERVAL
    ) public {
        validatorManager = ValidatorManager(_validatorManager);
        MAX_VALIDATORS = _MAX_VALIDATORS;
        PERCENT_UNIQUE = _PERCENT_UNIQUE;
        LUCK_TRIES = _LUCK_TRIES;
        BLOCKS_INTERVAL = _BLOCKS_INTERVAL;
    }

    function initiateChange() public {
        require(lastFinalizeChangeBlock != 0, "AuRa: Cannot initiate");
        require(block.number > lastFinalizeChangeBlock + BLOCKS_INTERVAL, "Aura: Too early");
        allocateNextValidators();
        require(nextValidators.length > 0, "Aura: No Validators");

        emit InitiateChange(blockhash(block.number - 1), nextValidators);
        lastFinalizeChangeBlock = 0;
    }

    function finalizeChange() external {
        require(msg.sender == SYSTEM_ADDRESS, "AuRa: Only system can call");
        if (nextValidators.length > 0) {
            currentValidators = nextValidators;
        }
        lastFinalizeChangeBlock = block.number;
    }

    function allocateNextValidators() private {
        delete nextValidators;

        for (uint256 i = 0; i < MAX_VALIDATORS * LUCK_TRIES; i++) {
            if (nextValidators.length >= MAX_VALIDATORS) {
                break;
            }

            address luckyValidator = validatorManager.getLuckyValidatorAddress();
            bool exists;
            for (uint256 j = 0; j < nextValidators.length; j++) {
                if (
                    nextValidators.length * 2 > MAX_VALIDATORS * 1 ||
                    luckyValidator == nextValidators[j]
                ) {
                    exists = true;
                    break;
                }
            }

            if (!exists) {
                nextValidators.push(luckyValidator);
            }
        }
    }

    function getValidators() public view returns (address[] memory) {
        return currentValidators;
    }

    function getNextValidators() public view returns (address[] memory) {
        return nextValidators;
    }
}
