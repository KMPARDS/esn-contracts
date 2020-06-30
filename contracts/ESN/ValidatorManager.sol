// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "../lib/SafeMath.sol";
import "./TimeAllyManager.sol";
import "./TimeAllyStake.sol";

contract ValidatorManager {
    using SafeMath for uint256;

    struct ValidatorStake {
        address validator;
        uint256 amount;
        Delegation[] delegators;
    }

    struct Delegation {
        address stakeContract;
        uint256 delegationIndex;
    }

    address public deployer;
    TimeAllyManager public timeally;

    mapping(uint256 => ValidatorStake[]) validatorStakes;

    modifier onlyStakeContract() {
        require(timeally.isStakingContractValid(msg.sender), "ValM: Only stakes can call");
        _;
    }

    constructor() public {
        deployer = msg.sender;
    }

    function setInitialValues(address _timeally) public {
        require(msg.sender == deployer, "ValM: Only deployer can call");

        timeally = TimeAllyManager(payable(_timeally));
    }

    function addDelegation(uint256 _month, uint256 _delegationIndex) public onlyStakeContract {
        TimeAllyStake stake = TimeAllyStake(msg.sender);
        TimeAllyStake.Delegation memory _delegation = stake.getDelegation(_month, _delegationIndex);
        uint256 _validatorIndex;

        for (; _validatorIndex < validatorStakes[_month].length; _validatorIndex++) {
            if (validatorStakes[_month][_validatorIndex].validator == _delegation.delegatee) {
                break;
            }
        }

        if (_validatorIndex == validatorStakes[_month].length) {
            uint256 index = validatorStakes[_month].length;
            validatorStakes[_month].push();
            validatorStakes[_month][index].validator = _delegation.delegatee;
        }

        ValidatorStake storage validatorStake = validatorStakes[_month][_validatorIndex];
        validatorStake.amount = validatorStake.amount.add(_delegation.amount);

        /// @dev _delegationIndex2 should be same as _delegationIndex
        ///    TODO: add extensive test cases.

        // uint256 _delegationIndex2;

        // for (; _delegationIndex < validatorStake.delegators.length; _delegationIndex++) {
        //     if (validatorStake.delegators[_delegationIndex].stakeContract == msg.sender) {
        //         break;
        //     }
        // }

        if (_delegationIndex == validatorStake.delegators.length) {
            validatorStake.delegators.push(
                Delegation({ stakeContract: msg.sender, delegationIndex: _delegationIndex })
            );
        }
    }

    function getValidatorStake(uint256 _month, uint256 _validatorIndex)
        public
        view
        returns (ValidatorStake memory)
    {
        return validatorStakes[_month][_validatorIndex];
    }

    function getValidatorStakes(uint256 _month) public view returns (ValidatorStake[] memory) {
        return validatorStakes[_month];
    }

    function getValidatorStakeDelegator(
        uint256 _month,
        uint256 _validatorIndex,
        uint256 _delegatorIndex
    ) public view returns (Delegation memory) {
        return validatorStakes[_month][_validatorIndex].delegators[_delegatorIndex];
    }

    function getValidatorStakeDelegators(uint256 _month, uint256 _validatorIndex)
        public
        view
        returns (Delegation[] memory)
    {
        return validatorStakes[_month][_validatorIndex].delegators;
    }
}
