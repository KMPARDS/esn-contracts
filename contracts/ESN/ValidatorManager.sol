// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "../lib/SafeMath.sol";
import "./NRTManager.sol";
import "./TimeAllyManager.sol";
import "./TimeAllyStaking.sol";
import "./RandomnessManager.sol";

contract ValidatorManager {
    using SafeMath for uint256;

    struct ValidatorStaking {
        address validator;
        uint256 amount;
        uint256 adjustedAmount;
        Delegation[] delegators;
    }

    struct Delegation {
        address stakingContract;
        uint256 delegationIndex;
    }

    address public deployer;
    address public validatorSet;
    NRTManager public nrtManager;
    TimeAllyManager public timeally;
    RandomnessManager public randomnessManager;

    mapping(uint256 => ValidatorStaking[]) validatorStakings;
    mapping(uint256 => uint256) totalAdjustedStakings;
    mapping(uint256 => uint256) validatorMonthlyNRT;

    modifier onlyStakingContract() {
        require(timeally.isStakingContractValid(msg.sender), "ValM: Only stakes can call");
        _;
    }

    constructor() public {
        deployer = msg.sender;
    }

    receive() external payable {
        require(msg.sender == address(nrtManager), "TimeAlly: Only NRT can send");
        uint256 currentNrtMonth = nrtManager.currentNrtMonth();
        validatorMonthlyNRT[currentNrtMonth] = msg.value;
    }

    function setInitialValues(
        address _validatorSet,
        address _nrtManager,
        address _timeally,
        address _randomnessManager
    ) public {
        require(msg.sender == deployer, "ValM: Only deployer can call");

        validatorSet = _validatorSet;
        nrtManager = NRTManager(_nrtManager);
        timeally = TimeAllyManager(payable(_timeally));
        randomnessManager = RandomnessManager(_randomnessManager);
    }

    function addDelegation(uint256 _month, uint256 _stakerDelegationIndex)
        external
        onlyStakingContract
    {
        TimeAllyStaking stake = TimeAllyStaking(msg.sender);
        TimeAllyStaking.Delegation memory _delegation = stake.getDelegation(
            _month,
            _stakerDelegationIndex
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
        uint256 _previousAdjustedAmount = validatorStaking.adjustedAmount;
        uint256 _newAdjustedAmount = getAdjustedAmount(
            validatorStaking.amount,
            170000 ether,
            170 ether
        );
        totalAdjustedStakings[_month] = totalAdjustedStakings[_month]
            .sub(_previousAdjustedAmount)
            .add(_newAdjustedAmount);
        validatorStaking.adjustedAmount = _newAdjustedAmount;

        uint256 _validatorDelegationIndex;

        for (
            ;
            _validatorDelegationIndex < validatorStaking.delegators.length;
            _validatorDelegationIndex++
        ) {
            if (
                validatorStaking.delegators[_validatorDelegationIndex].stakingContract == msg.sender
            ) {
                break;
            }
        }

        if (_validatorDelegationIndex == validatorStaking.delegators.length) {
            validatorStaking.delegators.push(
                Delegation({ stakingContract: msg.sender, delegationIndex: _stakerDelegationIndex })
            );
        }
    }

    function getLuckyValidatorAddress() public returns (address) {
        uint256 _month = nrtManager.currentNrtMonth();
        uint256 _randomNumber = uint256(randomnessManager.getRandomBytes32());
        return validatorStakings[_month][pickValidator(_month, _randomNumber)].validator;
    }

    function pickValidator(uint256 _month, uint256 _seed) public view returns (uint256) {
        int256 _luckyStake = int256((_seed) % totalAdjustedStakings[_month]);

        uint256 i = 0;
        while (_luckyStake > 0) {
            _luckyStake -= int256(validatorStakings[_month][i].adjustedAmount);
            i++;
        }

        return i - 1;
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

    function getTotalAdjustedStakings(uint256 _month) public view returns (uint256) {
        return totalAdjustedStakings[_month];
    }

    function getAdjustedAmount(
        uint256 _amount,
        uint256 _base,
        uint256 _premiumFactor
    ) public pure returns (uint256) {
        /// @dev this makes _base as minimum stake value
        if (_amount < _base) {
            return 0;
        }

        int256 __amount = int256(_amount);
        int256 __base = int256(_base);

        uint256 _premium;
        uint256 _count = 0;

        while (__amount > 0) {
            __amount -= __base;
            uint256 _premiumIncrease = _premiumFactor * _count;

            /// @dev this maintains continuty
            if (__amount < 0) {
                _premiumIncrease = _premiumIncrease.mul(uint256(__amount + __base)).div(_base);
            }

            _premium += _premiumIncrease;
            _count++;
        }

        if (_amount < _premium.mul(40)) {
            _premium = _amount.div(40);
        }
        return _amount - _premium;
    }
}
