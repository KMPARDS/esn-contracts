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
        uint256 perThousandCommission;
        uint256 blockRewards;
        bool withdrawn;
        Delegator[] delegators;
    }

    struct Delegator {
        address stakingContract;
        uint256 delegationIndex;
        bool withdrawn;
    }

    address public deployer;
    address public validatorSet;
    address public blockRewardContract;
    NRTManager public nrtManager;
    TimeAllyManager public timeally;
    RandomnessManager public randomnessManager;

    mapping(uint256 => ValidatorStaking[]) validatorStakings;
    mapping(uint256 => uint256) totalAdjustedStakings;
    mapping(uint256 => uint256) blockRewardsMonthlyNRT;
    mapping(uint256 => uint256) totalBlockRewards;

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
        blockRewardsMonthlyNRT[currentNrtMonth] = msg.value;
    }

    function setInitialValues(
        address _validatorSet,
        address _nrtManager,
        address _timeally,
        address _randomnessManager,
        address _blockRewardContract
    ) public {
        require(msg.sender == deployer, "ValM: Only deployer can call");

        validatorSet = _validatorSet;
        blockRewardContract = _blockRewardContract;
        nrtManager = NRTManager(_nrtManager);
        timeally = TimeAllyManager(payable(_timeally));
        randomnessManager = RandomnessManager(_randomnessManager);
    }

    function addDelegation(
        uint256 _month,
        uint256 _stakerDelegationIndex,
        uint256 _amount
    ) external onlyStakingContract {
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
        validatorStaking.amount = validatorStaking.amount.add(_amount);
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
                Delegator({
                    stakingContract: msg.sender,
                    delegationIndex: _stakerDelegationIndex,
                    withdrawn: false
                })
            );
        }
    }

    function registerBlock(address _miner) external {
        require(msg.sender == blockRewardContract, "ValM: Only BRC can call");
        uint256 _month = nrtManager.currentNrtMonth();
        uint256 i = 0;
        for (; i < validatorStakings[_month].length; i++) {
            if (_miner == validatorStakings[_month][i].validator) {
                break;
            }
        }
        if (i < validatorStakings[_month].length) {
            validatorStakings[_month][i].blockRewards += 1;
        }
        totalBlockRewards[_month] += 1;
    }

    function withdrawBlockReward(
        uint256 _month,
        uint256 _validatorIndex,
        uint256 _delegatorIndex
    ) external {
        Delegator storage _delegator = validatorStakings[_month][_validatorIndex]
            .delegators[_delegatorIndex];

        TimeAllyStaking staking = TimeAllyStaking(payable(_delegator.stakingContract));

        address _stakingOwner = staking.staker();
        require(msg.sender == _stakingOwner, "ValM: Not delegation owner");

        /// @TODO: consider to instead delete the array element to reduce blockchain state bloat
        require(!_delegator.withdrawn, "ValM: Already withdrawn");
        _delegator.withdrawn = true;

        TimeAllyStaking.Delegation memory _delegation = staking.getDelegation(
            _month,
            _delegator.delegationIndex
        );

        uint256 _benefitAmount = getValidatorEarning(_month, _validatorIndex);

        if (validatorStakings[_month][_validatorIndex].perThousandCommission > 0) {
            _benefitAmount = _benefitAmount
                .mul(
                uint256(100).sub(validatorStakings[_month][_validatorIndex].perThousandCommission)
            )
                .div(1000);
        }

        _benefitAmount = _benefitAmount.mul(_delegation.amount).div(
            validatorStakings[_month][_validatorIndex].amount
        );

        (bool _success, ) = _stakingOwner.call{ value: _benefitAmount }("");
        require(_success, "ValM: Transfer failed");
    }

    function setCommission(
        uint256 _validatorIndex,
        uint256 _month,
        uint256 _perThousandCommission
    ) external {
        ValidatorStaking storage vs = validatorStakings[_month][_validatorIndex];
        require(msg.sender == vs.validator, "ValM: Not auth validator");

        vs.perThousandCommission = _perThousandCommission;
    }

    function withdrawCommission(uint256 _validatorIndex, uint256 _month) external {
        ValidatorStaking storage vs = validatorStakings[_month][_validatorIndex];
        require(msg.sender == vs.validator, "ValM: Not auth validator");

        /// @TODO: consider to instead delete the array element to reduce blockchain state bloat
        require(!vs.withdrawn, "ValM: Already withdrawn");
        vs.withdrawn = true;

        uint256 _benefitAmount = getValidatorEarning(_month, _validatorIndex)
            .mul(vs.perThousandCommission)
            .div(1000);

        (bool _success, ) = vs.validator.call{ value: _benefitAmount }("");
        require(_success, "ValM: Transfer failed");
    }

    function getValidatorEarning(uint256 _month, uint256 _validatorIndex)
        public
        view
        returns (uint256)
    {
        ValidatorStaking storage _vs = validatorStakings[_month][_validatorIndex];
        return blockRewardsMonthlyNRT[_month].mul(_vs.blockRewards).div(totalBlockRewards[_month]);
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
    ) public view returns (Delegator memory) {
        return validatorStakings[_month][_validatorIndex].delegators[_delegatorIndex];
    }

    function getValidatorStakingDelegators(uint256 _month, uint256 _validatorIndex)
        public
        view
        returns (Delegator[] memory)
    {
        return validatorStakings[_month][_validatorIndex].delegators;
    }

    function getTotalAdjustedStakings(uint256 _month) public view returns (uint256) {
        return totalAdjustedStakings[_month];
    }

    function getTotalBlockReward(uint256 _month) public view returns (uint256) {
        return totalBlockRewards[_month];
    }

    function getBlockRewardsMonthlyNRT(uint256 _month) public view returns (uint256) {
        return blockRewardsMonthlyNRT[_month];
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
