// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

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

    mapping(uint256 => ValidatorStake[]) public monthVS;

    modifier onlyStakeContract() {
        require(timeally.validStakingContracts(msg.sender), "ValM: Only stakes can call");
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
        (, address _validator, uint256 _amount) = stake.delegation(_month, _delegationIndex);
        uint256 _validatorIndex;

        for (; _validatorIndex < monthVS[_month].length; _validatorIndex++) {
            if (monthVS[_month][_validatorIndex].validator == _validator) {
                break;
            }
        }

        if (_validatorIndex == monthVS[_month].length) {
            uint256 index = monthVS[_month].length;
            monthVS[_month].push();
            monthVS[_month][index].validator = _validator;
        }

        ValidatorStake storage validatorStake = monthVS[_month][_validatorIndex];
        validatorStake.amount = validatorStake.amount.add(_amount);

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
}
