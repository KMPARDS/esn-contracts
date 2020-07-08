// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "../lib/SafeMath.sol";
import "./ValidatorManager.sol";

contract ValidatorSet {
    using SafeMath for uint256;

    uint256 public MAX_VALIDATORS = 5;
    uint256 public VALIDATOR_SPRINT = 1;
    uint256 public NULL_VALIDATORS = 1;

    uint256 public BLOCKS_INTERVAL = 50;
    uint256 public lastFinalizeChangeBlock;

    address public SYSTEM_ADDRESS = address(2**160 - 2);

    ValidatorManager public validatorManager;

    address[] currentValidators;
    address[] nextValidators;

    event InitiateChange(bytes32 indexed _parent_hash, address[] _new_set);

    constructor(address _firstValidator, address _testSystemAddress) public {
        currentValidators.push(_firstValidator);
        if (_testSystemAddress != address(0)) {
            SYSTEM_ADDRESS = _testSystemAddress;
        }
    }

    function setInitialValues(address _validatorManager, uint256 _BLOCKS_INTERVAL) public {
        validatorManager = ValidatorManager(_validatorManager);
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

        // to ensure a positive validator sprint
        if (VALIDATOR_SPRINT == 0) {
            VALIDATOR_SPRINT = 1;
        }

        // to ensure that always 80% validator addresses are real addresses
        if (NULL_VALIDATORS.mul(4) > VALIDATOR_SPRINT) {
            NULL_VALIDATORS = VALIDATOR_SPRINT.div(4);
        }

        for (uint256 i = 0; i < MAX_VALIDATORS; i++) {
            for (uint256 j = 0; j < VALIDATOR_SPRINT; j++) {
                nextValidators.push(validatorManager.getLuckyValidatorAddress());
            }
            for (uint256 j = 0; j < NULL_VALIDATORS; j++) {
                nextValidators.push(address(0));
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
