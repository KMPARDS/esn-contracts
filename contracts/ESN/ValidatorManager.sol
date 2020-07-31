// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "../lib/SafeMath.sol";
import "./NRTManager.sol";
import "./TimeAllyManager.sol";
import "./TimeAllyStaking.sol";
import "./RandomnessManager.sol";

contract ValidatorManager {
    using SafeMath for uint256;

    struct Validator {
        address wallet;
        uint256 amount;
        uint256 adjustedAmount;
        uint256 perThousandCommission;
        uint256 blocksSealed;
        bool withdrawn;
        Delegator[] delegators;
    }

    struct Delegator {
        address stakingContract;
        uint256 amount;
        bool withdrawn;
    }

    address public deployer;
    address public validatorSet;
    address public blockRewardContract;
    NRTManager public nrtManager;
    TimeAllyManager public timeally;
    RandomnessManager public randomnessManager;

    mapping(uint256 => Validator[]) monthlyValidators;

    // @dev (month, validator) => validator index plus one
    mapping(uint256 => mapping(address => uint256)) validatorIndexesPlusOne;

    // @dev (month, validatorIndex, stakingContract) => delegator index plus one
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) delegatorIndexesPlusOne;

    mapping(uint256 => uint256) totalAdjustedStakings;
    mapping(uint256 => uint256) blockRewardsMonthlyNRT;
    mapping(uint256 => uint256) totalBlocksSealed;

    event Uint(uint256 a, string m);

    modifier onlyStakingContract() {
        require(timeally.isStakingContractValid(msg.sender), "ValM: Only stakes can call");
        _;
    }

    constructor() {
        deployer = msg.sender;
    }

    function receiveNrt() external payable {
        require(msg.sender == address(nrtManager), "TimeAlly: Only NRT can send");
        uint256 currentNrtMonth = nrtManager.currentNrtMonth();
        blockRewardsMonthlyNRT[currentNrtMonth] = msg.value;
    }

    function setInitialValues(
        address _validatorSet,
        address payable _nrtManager,
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

    function registerDelegation(uint256 _month, bytes memory _extraData)
        external
        onlyStakingContract
    {
        require(_extraData.length == 20, "ValM: Extra data should be an address");

        uint256 _amount = TimeAllyStaking(msg.sender).nextMonthPrincipalAmount();
        address _delegatee;
        assembly {
            _delegatee := mload(add(_extraData, 20))
        }

        uint256 _validatorIndex = validatorIndexesPlusOne[_month][_delegatee];

        if (_validatorIndex == 0) {
            uint256 index = monthlyValidators[_month].length;
            monthlyValidators[_month].push();
            monthlyValidators[_month][index].wallet = _delegatee;

            /// @dev storing  "index + 1" for quick access next time
            validatorIndexesPlusOne[_month][_delegatee] = monthlyValidators[_month].length;
            _validatorIndex = monthlyValidators[_month].length - 1;
        } else {
            _validatorIndex -= 1;
        }

        Validator storage validatorStaking = monthlyValidators[_month][_validatorIndex];

        uint256 _delegatorIndex = delegatorIndexesPlusOne[_month][_validatorIndex][msg.sender];

        if (_delegatorIndex == 0) {
            validatorStaking.delegators.push(
                Delegator({ stakingContract: msg.sender, amount: 0, withdrawn: false })
            );

            delegatorIndexesPlusOne[_month][_validatorIndex][msg.sender] = validatorStaking
                .delegators
                .length;
            _delegatorIndex = validatorStaking.delegators.length - 1;
        } else {
            _delegatorIndex -= 1;
        }

        Delegator storage delegator = validatorStaking.delegators[_delegatorIndex];
        _amount = _amount.sub(delegator.amount);

        require(_amount > 0, "ValM: Already delegated principal amount");

        validatorStaking.amount = validatorStaking.amount.add(_amount);
        delegator.amount = delegator.amount.add(_amount);
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
    }

    function registerBlock(address _sealer) external {
        require(msg.sender == blockRewardContract, "ValM: Only BRC can call");
        uint256 _month = nrtManager.currentNrtMonth();

        uint256 _validatorIndexPlusOne = validatorIndexesPlusOne[_month][_sealer];
        if (_validatorIndexPlusOne != 0) {
            monthlyValidators[_month][_validatorIndexPlusOne - 1].blocksSealed += 1;
        }

        totalBlocksSealed[_month] += 1;
    }

    function withdrawDelegationShare(
        uint256 _month,
        address _validator,
        address _stakingContract
    ) external {
        uint256 _validatorIndex = getValidatorIndex(_month, _validator);
        uint256 _delegatorIndex = getDelegatorIndex(_month, _validatorIndex, _stakingContract);
        Validator storage validatorStaking = monthlyValidators[_month][_validatorIndex];
        Delegator storage delegator = monthlyValidators[_month][_validatorIndex]
            .delegators[_delegatorIndex];

        TimeAllyStaking staking = TimeAllyStaking(payable(delegator.stakingContract));

        address _stakingOwner = staking.owner();
        require(msg.sender == _stakingOwner, "ValM: Not delegation owner");

        /// @TODO: consider to instead delete the array element to reduce blockchain state bloat
        require(!delegator.withdrawn, "ValM: Already withdrawn");
        delegator.withdrawn = true;

        // TimeAllyStaking.Delegation memory _delegation = staking.getDelegation(
        //     _month,
        //     _delegator.delegationIndex
        // );

        uint256 _benefitAmount = getValidatorEarning(_month, _validator);
        require(_benefitAmount > 0, "ValM: Validator earning is zero for the month");

        if (validatorStaking.perThousandCommission > 0) {
            _benefitAmount = _benefitAmount
                .mul(uint256(100).sub(validatorStaking.perThousandCommission))
                .div(1000);
        }

        _benefitAmount = _benefitAmount.mul(delegator.amount).div(
            monthlyValidators[_month][_validatorIndex].amount
        );

        if (_benefitAmount > 0) {
            (bool _success, ) = _stakingOwner.call{ value: _benefitAmount }("");
            require(_success, "ValM: Transfer failed");
        }
    }

    function setCommission(uint256 _month, uint256 _perThousandCommission) external {
        uint256 _validatorIndex = getValidatorIndex(_month, msg.sender);
        Validator storage validator = monthlyValidators[_month][_validatorIndex];

        uint256 _currentMonth = nrtManager.currentNrtMonth();

        require(_month >= _currentMonth, "ValM: Only future month allowed");

        if (_month == _currentMonth) {
            require(
                validator.perThousandCommission == 0,
                "ValM: Cannot update current month once set"
            );
        }

        emit Uint(_validatorIndex, "vi");
        validator.perThousandCommission = _perThousandCommission;
    }

    function withdrawCommission(uint256 _month) external {
        uint256 _validatorIndex = getValidatorIndex(_month, msg.sender);
        Validator storage validator = monthlyValidators[_month][_validatorIndex];

        /// @TODO: consider to instead delete the array element to reduce blockchain state bloat
        require(!validator.withdrawn, "ValM: Already withdrawn");
        validator.withdrawn = true;

        uint256 _benefitAmount = getValidatorEarning(_month, msg.sender);
        require(_benefitAmount > 0, "ValM: Validator earning is zero for the month");

        _benefitAmount = _benefitAmount.mul(validator.perThousandCommission).div(1000);

        emit Uint(validator.perThousandCommission, "vs.perThousandCommission");
        emit Uint(_benefitAmount, "benefit amoutn");

        (bool _success, ) = validator.wallet.call{ value: _benefitAmount }("");
        require(_success, "ValM: Transfer failed");
    }

    function getValidatorEarning(uint256 _month, address _validator) public view returns (uint256) {
        uint256 _validatorIndex = getValidatorIndex(_month, _validator);
        Validator storage validator = monthlyValidators[_month][_validatorIndex];
        return
            blockRewardsMonthlyNRT[_month].mul(validator.blocksSealed).div(
                totalBlocksSealed[_month]
            );
    }

    function getLuckyValidatorAddress() public returns (address) {
        uint256 _month = nrtManager.currentNrtMonth();
        uint256 _randomNumber = uint256(randomnessManager.getRandomBytes32());
        return monthlyValidators[_month][pickValidator(_month, _randomNumber)].wallet;
    }

    function pickValidator(uint256 _month, uint256 _seed) public view returns (uint256) {
        int256 _luckyStake = int256((_seed) % totalAdjustedStakings[_month]);

        uint256 i = 0;
        while (_luckyStake > 0) {
            _luckyStake -= int256(monthlyValidators[_month][i].adjustedAmount);
            i++;
        }

        return i - 1;
    }

    function getValidatorByIndex(uint256 _month, uint256 _validatorIndex)
        public
        view
        returns (Validator memory)
    {
        return monthlyValidators[_month][_validatorIndex];
    }

    function getValidatorByAddress(uint256 _month, address _validator)
        public
        view
        returns (Validator memory)
    {
        uint256 _validatorIndex = getValidatorIndex(_month, _validator);
        return getValidatorByIndex(_month, _validatorIndex);
    }

    function getValidators(uint256 _month) public view returns (Validator[] memory) {
        return monthlyValidators[_month];
    }

    function getDelegatorByIndex(
        uint256 _month,
        uint256 _validatorIndex,
        uint256 _delegatorIndex
    ) public view returns (Delegator memory) {
        return monthlyValidators[_month][_validatorIndex].delegators[_delegatorIndex];
    }

    function getDelegatorByAddress(
        uint256 _month,
        address _validator,
        address _stakingContract
    ) public view returns (Delegator memory) {
        uint256 _validatorIndex = getValidatorIndex(_month, _validator);
        uint256 _delegatorIndex = getDelegatorIndex(_month, _validatorIndex, _stakingContract);
        return monthlyValidators[_month][_validatorIndex].delegators[_delegatorIndex];
    }

    function getTotalAdjustedStakings(uint256 _month) public view returns (uint256) {
        return totalAdjustedStakings[_month];
    }

    function getTotalBlockReward(uint256 _month) public view returns (uint256) {
        return totalBlocksSealed[_month];
    }

    function getBlockRewardsMonthlyNRT(uint256 _month) public view returns (uint256) {
        return blockRewardsMonthlyNRT[_month];
    }

    function getValidatorIndex(uint256 _month, address _validator) public view returns (uint256) {
        require(validatorIndexesPlusOne[_month][_validator] > 0, "ValM: Validator not present");
        return validatorIndexesPlusOne[_month][_validator] - 1;
    }

    function getDelegatorIndex(
        uint256 _month,
        uint256 _validatorIndex,
        address _stakingContract
    ) public view returns (uint256) {
        require(
            delegatorIndexesPlusOne[_month][_validatorIndex][_stakingContract] > 0,
            "ValM: Delegator not present"
        );
        return delegatorIndexesPlusOne[_month][_validatorIndex][_stakingContract] - 1;
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
