// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "../lib/SafeMath.sol";
import "./TimeAllyManager.sol";
import "./TimeAllyStaking.sol";

contract ValidatorManager {
    using SafeMath for uint256;

    struct ValidatorStaking {
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

    mapping(uint256 => ValidatorStaking[]) validatorStakings;

    modifier onlyStakingContract() {
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

    function addDelegation(uint256 _month, uint256 _delegationIndex) public onlyStakingContract {
        TimeAllyStaking stake = TimeAllyStaking(msg.sender);
        TimeAllyStaking.Delegation memory _delegation = stake.getDelegation(
            _month,
            _delegationIndex
        );
        uint256 _validatorIndex;

        for (; _validatorIndex < validatorStakings[_month].length; _validatorIndex++) {
            if (validatorStakings[_month][_validatorIndex].validator == _delegation.delegatee) {
                break;
            }
        }

        if (_validatorIndex == validatorStakings[_month].length) {
            uint256 index = validatorStakings[_month].length;
            validatorStakings[_month].push();
            validatorStakings[_month][index].validator = _delegation.delegatee;
        }

        ValidatorStaking storage validatorStaking = validatorStakings[_month][_validatorIndex];
        validatorStaking.amount = validatorStaking.amount.add(_delegation.amount);

        /// @dev _delegationIndex2 should be same as _delegationIndex
        ///    TODO: add extensive test cases.

        // uint256 _delegationIndex2;

        // for (; _delegationIndex < validatorStaking.delegators.length; _delegationIndex++) {
        //     if (validatorStaking.delegators[_delegationIndex].stakeContract == msg.sender) {
        //         break;
        //     }
        // }

        if (_delegationIndex == validatorStaking.delegators.length) {
            validatorStaking.delegators.push(
                Delegation({ stakeContract: msg.sender, delegationIndex: _delegationIndex })
            );
        }
    }

    function getValidatorStaking(uint256 _month, uint256 _validatorIndex)
        public
        view
        returns (ValidatorStaking memory)
    {
        return validatorStakings[_month][_validatorIndex];
    }

    function getValidatorStakings(uint256 _month) public view returns (ValidatorStaking[] memory) {
        return validatorStakings[_month];
    }

    function getValidatorStakingDelegator(
        uint256 _month,
        uint256 _validatorIndex,
        uint256 _delegatorIndex
    ) public view returns (Delegation memory) {
        return validatorStakings[_month][_validatorIndex].delegators[_delegatorIndex];
    }

    function getValidatorStakingDelegators(uint256 _month, uint256 _validatorIndex)
        public
        view
        returns (Delegation[] memory)
    {
        return validatorStakings[_month][_validatorIndex].delegators;
    }
}
