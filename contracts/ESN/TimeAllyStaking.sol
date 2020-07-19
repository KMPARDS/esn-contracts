// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "../lib/SafeMath.sol";
import "./NRTManager.sol";
import "./TimeAllyManager.sol";
import "./ValidatorManager.sol";
import "./PrepaidEs.sol";
import "./PrepaidEsReceiver.sol";

contract TimeAllyStaking is PrepaidEsReceiver {
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
    uint256 public stakingEndMonth;
    uint256 public unboundedBasicAmount; // @dev isstime pay

    mapping(uint256 => uint256) topups; // @dev topups will be applicable since next month
    mapping(uint256 => bool) claimedMonths;
    mapping(uint256 => Delegation[]) delegations;

    modifier onlyStaker() {
        require(msg.sender == staker, "TAStaking: Only staker can call");
        _;
    }

    constructor() public payable {
        timeAllyManager = TimeAllyManager(msg.sender);

        // TODO: Switch to always querying the contract address from
        //       parent to enable a possible migration.
        nrtManager = NRTManager(timeAllyManager.nrtManager());
        validatorManager = ValidatorManager(timeAllyManager.validatorManager());

        staker = tx.origin;
        timestamp = now;

        uint256 _currentMonth = nrtManager.currentNrtMonth();
        stakingStartMonth = _currentMonth + 1;

        uint256 _defaultMonths = timeAllyManager.defaultMonths();
        stakingEndMonth = stakingStartMonth + _defaultMonths - 1;

        topups[_currentMonth] = msg.value;
        unboundedBasicAmount = msg.value.mul(2).div(100);
    }

    receive() external payable {
        _stakeTopUp(msg.value);
    }

    function prepaidFallback(address, uint256 _value) public override returns (bool) {
        PrepaidEs prepaidEs = timeAllyManager.prepaidEs();
        require(msg.sender == address(prepaidEs), "TAStaking: Only prepaidEs contract can call");
        prepaidEs.transfer(address(timeAllyManager), _value);

        return true;
    }

    function delegate(
        address _platform,
        address _delegatee,
        uint256 _amount,
        uint256[] memory _months
    ) public onlyStaker {
        require(_platform != address(0), "TAStaking: Cant delegate on zero");
        require(_delegatee != address(0), "TAStaking: Cant delegate to zero");
        uint256 _currentMonth = nrtManager.currentNrtMonth();

        for (uint256 i = 0; i < _months.length; i++) {
            require(_months[i] > _currentMonth, "TAStaking: Only future months");

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
                _amount.add(_alreadyDelegated) <= getPrincipalAmount(_months[i]),
                "TAStaking: delegate overflow"
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

            validatorManager.addDelegation(_months[i], _delegationIndex, _amount);
        }
    }

    function withdrawMonthlyNRT(uint256[] memory _months) public {
        require(msg.sender == staker, "TAStaking: Only owner allowed");

        uint256 _currentMonth = nrtManager.currentNrtMonth();

        uint256 _unclaimedReward;

        for (uint256 i = 0; i < _months.length; i++) {
            uint256 _month = _months[i];
            require(_month <= _currentMonth, "TAStaking: NRT for the month is not released");
            require(
                _month <= stakingEndMonth,
                "TAStaking: Month cannot be higher than end of staking"
            );
            require(
                _month >= stakingStartMonth,
                "TAStaking: Month cannot be lower than start of staking"
            );
            require(!claimedMonths[_month], "TAStaking: Month is already claimed");

            claimedMonths[_month] = true;
            _unclaimedReward = _unclaimedReward.add(getMonthlyReward(_month));
        }

        // communicate TimeAlly manager to process _unclaimedReward
        timeAllyManager.processNrtReward(_unclaimedReward);
    }

    function getMonthlyReward(uint256 _month) public view returns (uint256) {
        uint256 _totalActiveStaking = timeAllyManager.getTotalActiveStaking(_month);
        uint256 _timeallyNrtReleased = timeAllyManager.getTimeAllyMonthlyNRT(_month);

        return getPrincipalAmount(_month).mul(_timeallyNrtReleased).div(_totalActiveStaking);
    }

    function _stakeTopUp(uint256 _topupAmount) private {
        uint256 _currentMonth = nrtManager.currentNrtMonth();

        topups[_currentMonth] += _topupAmount;

        // TODO: update isstime limit logic
        uint256 _increasedBasic = _topupAmount
            .mul(2)
            .div(100)
            .mul(stakingEndMonth - _currentMonth)
            .div(stakingEndMonth - stakingStartMonth + 1);

        unboundedBasicAmount = unboundedBasicAmount.add(_increasedBasic);

        timeAllyManager.increaseActiveStaking(_topupAmount, stakingEndMonth);
    }

    function getPrincipalAmount(uint256 _month) public view returns (uint256) {
        if (_month > stakingEndMonth) {
            return 0;
        }

        uint256 _principalAmount;

        for (uint256 i = stakingStartMonth - 1; i < _month; i++) {
            _principalAmount += topups[i];
        }

        return _principalAmount;
    }

    function nextMonthPrincipalAmount() public view returns (uint256) {
        uint256 _currentMonth = nrtManager.currentNrtMonth();
        return getPrincipalAmount(_currentMonth + 1);
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
