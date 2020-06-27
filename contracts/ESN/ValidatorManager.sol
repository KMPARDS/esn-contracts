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
    TimeAllyManager timeally;

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

        ValidatorStake storage validatorStake;
        for (uint256 i = 0; i < monthVS[_month].length; i++) {
            if (monthVS[_month][i].validator == _validator) {
                validatorStake = monthVS[_month][i];
            }
        }

        if (validatorStake.validator == address(0)) {
            uint256 index = monthVS[_month].length;
            monthVS[_month].push();
            validatorStake = monthVS[_month][index];
            validatorStake.validator = _validator;
        }

        validatorStake.amount = validatorStake.amount.add(_amount);

        Delegation storage _delegation;
        for (uint256 i = 0; i < validatorStake.delegators.length; i++) {
            if (validatorStake.delegators[i].stakeContract == msg.sender) {
                _delegation = validatorStake.delegators[i];
            }
        }

        if (_delegation.stakeContract == address(0)) {
            validatorStake.delegators.push(
                Delegation({ stakeContract: msg.sender, delegationIndex: _delegationIndex })
            );
        }
    }
}
