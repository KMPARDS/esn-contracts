// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
// import { ValidatorManager } from "./ValidatorManager.sol";
import { RegistryDependent } from "../KycDapp/RegistryDependent.sol";

/// @title Validator Set
/// @notice Used to set block sealers.
contract ValidatorSet is RegistryDependent {
    using SafeMath for uint256;

    /// @notice Maximum validators in a set.
    uint256 public MAX_VALIDATORS = 5;

    /// @notice Amount of unique validators required in the set to prevent duplicates.
    uint256 public PERCENT_UNIQUE = 51;

    /// @notice Number of tries to do before settling for a lower length of set.
    uint256 public LUCK_TRIES = 4;

    /// @notice Interval of blocks after which change can be initiated.
    uint256 public BLOCKS_INTERVAL = 40;

    /// @notice Last block number in which finaliseChange was called by system.
    ///         If this is zero means, system is yet to call this method.
    uint256 public lastFinalizeChangeBlock;

    /// @notice Address from which system transaction come.
    address public SYSTEM_ADDRESS = address(2**160 - 2);

    /// @notice Validator Manager contract reference.
    // ValidatorManager public validatorManager;

    /// @dev Addresses of current validators.
    address[] currentValidators;

    /// @dev Addresses of next lucky validators.
    address[] nextValidators;

    /// @dev Addresses of seed validator nodes.
    address[] seedValidators;

    /// @notice Emits when initiateChange is called.
    event InitiateChange(bytes32 indexed _parent_hash, address[] _new_set);

    /// @notice Sets seed validators.
    /// @param _seedValidators: Addresses of validator nodes during seed.
    /// @param _testSystemAddress: Testing system address, for mainnet, Zero address is passed.
    constructor(address[] memory _seedValidators, address _testSystemAddress) {
        currentValidators = _seedValidators;
        seedValidators = _seedValidators;
        if (_testSystemAddress != address(0)) {
            SYSTEM_ADDRESS = _testSystemAddress;
        }
    }

    // TODO: setup governance
    function setInitialValues() public {
        // address payable _validatorManager,
        // uint256 _MAX_VALIDATORS,
        // uint256 _PERCENT_UNIQUE,
        // uint256 _LUCK_TRIES,
        // uint256 _BLOCKS_INTERVAL
        // validatorManager = ValidatorManager(_validatorManager);
        // MAX_VALIDATORS = _MAX_VALIDATORS;
        // PERCENT_UNIQUE = _PERCENT_UNIQUE;
        // LUCK_TRIES = _LUCK_TRIES;
        // BLOCKS_INTERVAL = _BLOCKS_INTERVAL;
    }

    function setMaxValidators(uint256 _MAX_VALIDATORS) public onlyGovernance {
        MAX_VALIDATORS = _MAX_VALIDATORS;
    }

    function setPercentUnique(uint256 _PERCENT_UNIQUE) public onlyGovernance {
        PERCENT_UNIQUE = _PERCENT_UNIQUE;
    }

    function setLuckTries(uint256 _LUCK_TRIES) public onlyGovernance {
        LUCK_TRIES = _LUCK_TRIES;
    }

    function setBlocksInterval(uint256 _BLOCKS_INTERVAL) public onlyGovernance {
        BLOCKS_INTERVAL = _BLOCKS_INTERVAL;
    }

    /// @notice Allocates next validators and emits InitiateChange event.
    /// @dev Requires delegation in Validator Manager contract else this reverts.
    function initiateChange() public {
        require(lastFinalizeChangeBlock != 0, "AuRa: Cannot initiate");
        require(block.number > lastFinalizeChangeBlock + BLOCKS_INTERVAL, "Aura: Too early");
        allocateNextValidators();
        require(nextValidators.length > 0, "Aura: No Validators");

        emit InitiateChange(blockhash(block.number - 1), nextValidators);
        lastFinalizeChangeBlock = 0;
    }

    /// @notice Finalizes the change
    /// @dev Called by system once existing validators show support by sealing blocks after
    ///      the emitted event.
    function finalizeChange() external {
        require(msg.sender == SYSTEM_ADDRESS, "AuRa: Only system can call");
        if (nextValidators.length > 0) {
            currentValidators = nextValidators;
        }
        lastFinalizeChangeBlock = block.number;
    }

    /// @notice Allocates validators from Validator Manager smart contract.
    function allocateNextValidators() private {
        delete nextValidators;

        for (uint256 i = 0; i < MAX_VALIDATORS * LUCK_TRIES; i++) {
            if (nextValidators.length >= MAX_VALIDATORS) {
                break;
            }

            address luckyValidator = validatorManager().getLuckyValidatorAddress();
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

    /// @notice Gets list of existing validators.
    /// @return List of sealer addresses.
    function getValidators() public view returns (address[] memory) {
        return currentValidators;
    }

    /// @notice Gets list of next validators.
    /// @return List of upcomming sealer addresses.
    function getNextValidators() public view returns (address[] memory) {
        return nextValidators;
    }
}
