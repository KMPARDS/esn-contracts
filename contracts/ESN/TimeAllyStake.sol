// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "../lib/SafeMath.sol";
import "./NRTManager.sol";
import "./TimeAllyManager.sol";
import "./ValidatorManager.sol";

contract TimeAllyStake {
    using SafeMath for uint256;

    struct Delegation {
        address platform;
        address delegatee;
        uint256 amount;
    }

    NRTManager public nrtManager;
    TimeAllyManager public timeAllyManager;
    ValidatorManager public validatorManager;

    address public staker;
    uint256 public timestamp;
    uint256 public stakingStartMonth;
    uint256 public stakingPlanId;
    uint256 public stakingEndMonth;
    uint256 public unboundedBasicAmount;
    mapping(uint256 => uint256) principalAmount;
    mapping(uint256 => bool) claimedMonths;
    mapping(uint256 => Delegation[]) delegations;

    modifier onlyStaker() {
        require(msg.sender == staker, "TAStake: Only staker can call");
        _;
    }

    constructor(uint256 _planId) public payable {
        timeAllyManager = TimeAllyManager(msg.sender);
        nrtManager = NRTManager(timeAllyManager.nrtManager());
        validatorManager = ValidatorManager(timeAllyManager.validatorManager());
        staker = tx.origin;
        timestamp = now;
        stakingPlanId = _planId;
        stakingStartMonth = nrtManager.currentNrtMonth() + 1;
        TimeAllyManager.StakingPlan memory _stakingPlan = timeAllyManager.getStakingPlan(_planId);
        stakingEndMonth = stakingStartMonth + _stakingPlan.months - 1;

        for (uint256 i = stakingStartMonth; i <= stakingEndMonth; i++) {
            principalAmount[i] = msg.value;
        }

        unboundedBasicAmount = msg.value.mul(2).div(100);
    }

    receive() external payable {
        _stakeTopUp(msg.value);
    }

    function delegate(
        address _platform,
        address _delegatee,
        uint256 _amount,
        uint256[] memory _months
    ) public onlyStaker {
        require(_platform != address(0), "TAStake: Cannot delegate on zero");
        require(_delegatee != address(0), "TAStake: Cannot delegate to zero");
        uint256 _currentMonth = nrtManager.currentNrtMonth();

        for (uint256 i = 0; i < _months.length; i++) {
            require(_months[i] > _currentMonth, "TAStake: Only future delegatable");

            Delegation[] storage monthlyDelegation = delegations[_months[i]];
            uint256 _alreadyDelegated;

            uint256 _delegationIndex;
            for (; _delegationIndex < monthlyDelegation.length; _delegationIndex++) {
                _alreadyDelegated = _alreadyDelegated.add(
                    monthlyDelegation[_delegationIndex].amount
                );
                if (
                    _platform == monthlyDelegation[_delegationIndex].platform &&
                    _delegatee == monthlyDelegation[_delegationIndex].delegatee
                ) {
                    break;
                }
            }
            require(
                _amount.add(_alreadyDelegated) <= principalAmount[_months[i]],
                "TAStake: delegate overflow"
            );
            if (_delegationIndex == monthlyDelegation.length) {
                monthlyDelegation.push(
                    Delegation({ platform: _platform, delegatee: _delegatee, amount: _amount })
                );
            } else {
                monthlyDelegation[_delegationIndex].amount = monthlyDelegation[_delegationIndex]
                    .amount
                    .add(_amount);
            }

            validatorManager.addDelegation(_months[i], _delegationIndex);
        }
    }

    function _stakeTopUp(uint256 _topupAmount) private {
        uint256 _currentMonth = nrtManager.currentNrtMonth();

        for (uint256 i = _currentMonth + 1; i <= stakingEndMonth; i++) {
            principalAmount[i] += _topupAmount;
        }

        uint256 _increasedBasic = _topupAmount
            .mul(2)
            .div(100)
            .mul(stakingEndMonth - _currentMonth)
            .div(stakingEndMonth - stakingStartMonth + 1);

        unboundedBasicAmount = unboundedBasicAmount.add(_increasedBasic);

        timeAllyManager.increaseActiveStake(_topupAmount, stakingEndMonth);
    }

    function getPrincipalAmount(uint256 _month) public view returns (uint256) {
        return principalAmount[_month];
    }

    function isMonthClaimed(uint256 _month) public view returns (bool) {
        return claimedMonths[_month];
    }

    function getDelegations(uint256 _month) public view returns (Delegation[] memory) {
        return delegations[_month];
    }

    function getDelegation(uint256 _month, uint256 _delegationIndex)
        public
        view
        returns (Delegation memory)
    {
        return delegations[_month][_delegationIndex];
    }
}
