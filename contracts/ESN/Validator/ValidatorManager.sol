// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { NRTReceiver } from "../NRT/NRTReceiver.sol";
import { TimeAllyStaking } from "../TimeAlly/1LifeTimes/TimeAllyStaking.sol";
import { RegistryDependent } from "../KycDapp/RegistryDependent.sol";
import { Governable } from "../Governance/Governable.sol";
import { IValidatorManager } from "./IValidatorManager.sol";
import { Initializable } from "@openzeppelin/contracts/proxy/Initializable.sol";

/// @title Validator Manager
/// @notice Manages delegations and PoS selection for validator set.
contract ValidatorManager is
    IValidatorManager,
    Governable,
    RegistryDependent,
    NRTReceiver,
    Initializable
{
    using SafeMath for uint256;

    /// @notice Address of validator set smart contract.
    // address public validatorSet;

    /// @notice Address of block reward smart contract.
    // address public blockRewardContract;

    /// @notice NRT Manager contract reference.
    // NRTManager public nrtManager;

    /// @notice TimeAlly Manager contract reference.
    // TimeAllyManager public timeally;

    /// @notice Randomness Manager contract reference.
    // RandomnessManager public randomnessManager;

    /// @notice Prepaid ES contract reference.
    // PrepaidEs public prepaidEs;

    /// @dev Maps NRT Months against validators.
    mapping(uint256 => Validator[]) monthlyValidators;

    /// @dev (month, validator) => validator index plus one
    ///      Used to reduce ops for searching a validator in the array.
    mapping(uint256 => mapping(address => uint256)) validatorIndexesPlusOne;

    /// @dev (month, validatorIndex, stakingContract) => delegator index plus one
    ///      Used to reduce ops for searching a delegator in the array.
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) delegatorIndexesPlusOne;

    /// @dev Maps NRT Months with total adjusted stakings
    mapping(uint256 => uint256) totalAdjustedStakings;

    /// @dev Maps NRT Months with Validator NRT amount received.
    // mapping(uint256 => uint256) blockRewardsMonthlyNRT;

    /// @dev Maps NRT Months with total blocks sealed.
    mapping(uint256 => uint256) totalBlocksSealed;

    event Delegation(
        address indexed stakingContract,
        uint32 indexed month,
        address indexed validator
    );

    modifier onlyStakingContract() {
        require(timeallyManager().isStakingContractValid(msg.sender), "ValM: Only stakes can call");
        _;
    }

    // /// @notice Sets deployer's address
    // constructor() {
    //     deployer = msg.sender;
    // }

    function initialize() public payable initializer {
        _initializeGovernable();
    }

    /// @notice Allows NRT Manager contract to send NRT share for Validator Manager.
    /// @dev Burns NRT if no one has delegated anything.
    function receiveNrt(uint32 _currentNrtMonth) public override payable {
        NRTReceiver.receiveNrt(_currentNrtMonth);

        uint256 _totalAdjustedStaking = totalAdjustedStakings[_currentNrtMonth - 1];
        uint256 _nrt = monthlyNRT[_currentNrtMonth];
        if (_totalAdjustedStaking == 0) {
            nrtManager().addToBurnPool{ value: _nrt }();
        }
    }

    /// @notice Allows a TimeAlly staking to register a delegation.
    /// @param _month: NRT Month.
    /// @param _extraData: Address of validator to delegate.
    function registerDelegation(uint32 _month, bytes memory _extraData)
        external
        override
        onlyStakingContract
    {
        require(_extraData.length == 20, "ValM: Extra data should be an address");
        require(_month > nrtManager().currentNrtMonth(), "ValM: ONLY_FUTURE_MONTHS_ALLOWED");

        uint256 _amount = TimeAllyStaking(msg.sender).principal();
        address _delegatee;
        assembly {
            _delegatee := mload(add(_extraData, 20))
        }

        uint256 _validatorIndex = validatorIndexesPlusOne[_month][_delegatee];

        if (_validatorIndex == 0) {
            uint256 index = monthlyValidators[_month].length;
            monthlyValidators[_month].push();
            monthlyValidators[_month][index].wallet = _delegatee;

            /// @dev Stores  "index + 1" for quick access next time.
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

        emit Delegation(msg.sender, uint32(_month), _delegatee);
    }

    /// @notice Allows block reward contract to register a sealed block by validator.
    /// @param _sealer: Address of validator who sealed the block.
    function registerBlock(address _sealer) external override {
        // require(msg.sender == blockRewardContract, "ValM: Only BRC can call");
        require(msg.sender == resolveAddress("BLOCK_REWARD"), "ValM: Only BRC can call");
        uint256 _month = nrtManager().currentNrtMonth();

        uint256 _validatorIndexPlusOne = validatorIndexesPlusOne[_month][_sealer];
        if (_validatorIndexPlusOne != 0) {
            monthlyValidators[_month][_validatorIndexPlusOne - 1].blocksSealed += 1;
        }

        totalBlocksSealed[_month] += 1;
    }

    /// @notice Allows staking owners to withdraw share from validators earnings.
    /// @param _month: NRT Month.
    /// @param _validator: Address of validator.
    /// @param _stakingContract: Address of staking contract which has delegated.
    function withdrawDelegationShare(
        uint32 _month,
        address _validator,
        address _stakingContract
    ) external override {
        require(_month < nrtManager().currentNrtMonth(), "ValM: ONLY_PAST_MONTHS_ALLOWED");

        uint256 _validatorIndex = getValidatorIndex(_month, _validator);
        uint256 _delegatorIndex = getDelegatorIndex(_month, _validatorIndex, _stakingContract);
        // Validator storage validatorStaking = monthlyValidators[_month][_validatorIndex];
        Delegator storage delegator = monthlyValidators[_month][_validatorIndex]
            .delegators[_delegatorIndex];

        TimeAllyStaking staking = TimeAllyStaking(payable(delegator.stakingContract));

        address _stakingOwner = staking.owner();
        require(msg.sender == _stakingOwner, "ValM: Not delegation owner");

        require(!delegator.withdrawn, "ValM: Already withdrawn");
        delegator.withdrawn = true;

        uint256 _benefitAmount = getDelegationShare(_month, _validator, _stakingContract);

        if (_benefitAmount > 0) {
            prepaidEs().convertToESP{ value: _benefitAmount }(_stakingOwner);
        }
    }

    /// @notice Allows a validator to set commission.
    /// @param _month: NRT month.
    /// @param _perThousandCommission: Per thousand commission of validator.
    function setCommission(uint32 _month, uint256 _perThousandCommission) external override {
        uint256 _validatorIndex = getValidatorIndex(_month, msg.sender);
        Validator storage validator = monthlyValidators[_month][_validatorIndex];

        uint256 _currentMonth = nrtManager().currentNrtMonth();

        require(_month >= _currentMonth, "ValM: Only future month allowed");

        if (_month == _currentMonth) {
            require(
                validator.perThousandCommission == 0,
                "ValM: Cannot update current month once set"
            );
        }

        validator.perThousandCommission = _perThousandCommission;
    }

    /// @notice Allows a validator to withdraw their commission.
    /// @param _month: NRT Month.
    function withdrawCommission(uint32 _month) external override {
        require(_month < nrtManager().currentNrtMonth(), "ValM: ONLY_PAST_MONTHS_ALLOWED");

        uint256 _validatorIndex = getValidatorIndex(_month, msg.sender);
        Validator storage validator = monthlyValidators[_month][_validatorIndex];

        require(!validator.withdrawn, "ValM: Already withdrawn");
        validator.withdrawn = true;

        uint256 _benefitAmount = getCommission(_month, msg.sender);
        require(_benefitAmount > 0, "ValM: Validator earning is zero for the month");

        prepaidEs().convertToESP{ value: _benefitAmount }(validator.wallet);
    }

    /// @notice Gets earnings of a validator based on blocks sealed in previous months.
    /// @dev Can be called after NRT is released.
    /// @param _month: NRT Month.
    /// @param _validator: Address of validator.
    function getValidatorEarning(uint32 _month, address _validator)
        public
        override
        view
        returns (uint256)
    {
        uint256 _validatorIndex = getValidatorIndex(_month, _validator);
        Validator storage validator = monthlyValidators[_month][_validatorIndex];
        return monthlyNRT[_month].mul(validator.blocksSealed).div(totalBlocksSealed[_month]);
    }

    function getDelegationShare(
        uint32 _month,
        address _validator,
        address _stakingContract
    ) public view returns (uint256) {
        uint256 _validatorIndex = getValidatorIndex(_month, _validator);
        uint256 _delegatorIndex = getDelegatorIndex(_month, _validatorIndex, _stakingContract);
        Validator storage validatorStaking = monthlyValidators[_month][_validatorIndex];
        Delegator storage delegator = monthlyValidators[_month][_validatorIndex]
            .delegators[_delegatorIndex];

        uint256 _benefitAmount = getValidatorEarning(_month, _validator);

        if (validatorStaking.perThousandCommission > 0) {
            _benefitAmount = _benefitAmount
                .mul(uint256(100).sub(validatorStaking.perThousandCommission))
                .div(1000);
        }

        _benefitAmount = _benefitAmount.mul(delegator.amount).div(
            monthlyValidators[_month][_validatorIndex].amount
        );
        return _benefitAmount;
    }

    function getCommission(uint32 _month, address _validator) public view returns (uint256) {
        uint256 _validatorIndex = getValidatorIndex(_month, _validator);
        Validator storage validator = monthlyValidators[_month][_validatorIndex];

        uint256 _benefitAmount = getValidatorEarning(_month, _validator);
        _benefitAmount = _benefitAmount.mul(validator.perThousandCommission).div(1000);

        return _benefitAmount;
    }

    /// @notice Gets address of a lucky vaidator based on PoS.
    /// @return Address of a validator
    function getLuckyValidatorAddress() public override returns (address) {
        uint32 _month = nrtManager().currentNrtMonth();
        uint256 _randomNumber = uint256(randomnessManager().getRandomBytes32());
        return monthlyValidators[_month][pickValidator(_month, _randomNumber)].wallet;
    }

    /// @notice Picks a validator index based on PoS.
    /// @param _month: NRT Month.
    /// @param _seed: Pseudo random seed.
    /// @return Validator Index.
    function pickValidator(uint32 _month, uint256 _seed) public override view returns (uint256) {
        int256 _luckyStake = int256((_seed) % totalAdjustedStakings[_month]);

        uint256 i = 0;
        while (_luckyStake > 0) {
            _luckyStake -= int256(monthlyValidators[_month][i].adjustedAmount);
            i++;
        }

        return i - 1;
    }

    /// @notice Gets validator by month and index.
    /// @param _month: NRT Month.
    /// @param _validatorIndex: Index of the validator in array.
    /// @return Validator struct.
    function getValidatorByIndex(uint32 _month, uint256 _validatorIndex)
        public
        override
        view
        returns (Validator memory)
    {
        return monthlyValidators[_month][_validatorIndex];
    }

    /// @notice Gets validator by month and address
    /// @param _month: NRT Month.
    /// @param _validator: Address of validator.
    /// @return Validator struct.
    function getValidatorByAddress(uint32 _month, address _validator)
        public
        override
        view
        returns (Validator memory)
    {
        uint256 _validatorIndex = getValidatorIndex(_month, _validator);
        return getValidatorByIndex(_month, _validatorIndex);
    }

    /// @notice Gets all validators for the month.
    /// @param _month: NRT Month.
    /// @return Validator struct array.
    function getValidators(uint32 _month) public override view returns (Validator[] memory) {
        return monthlyValidators[_month];
    }

    /// @notice Gets delegator by validator and delegator index.
    /// @param _month: NRT Month.
    /// @param _validatorIndex: Index of validator in array.
    /// @param _delegatorIndex: Index of delegator in array.
    /// @return Delegator struct.
    function getDelegatorByIndex(
        uint32 _month,
        uint256 _validatorIndex,
        uint256 _delegatorIndex
    ) public override view returns (Delegator memory) {
        return monthlyValidators[_month][_validatorIndex].delegators[_delegatorIndex];
    }

    /// @notice Get delegator by addresses.
    /// @param _month: NRT Month.
    /// @param _validator: Address of the validator.
    /// @param _stakingContract: Address of the delegating contract.
    /// @return Delegator struct.
    function getDelegatorByAddress(
        uint32 _month,
        address _validator,
        address _stakingContract
    ) public override view returns (Delegator memory) {
        uint256 _validatorIndex = getValidatorIndex(_month, _validator);
        uint256 _delegatorIndex = getDelegatorIndex(_month, _validatorIndex, _stakingContract);
        return monthlyValidators[_month][_validatorIndex].delegators[_delegatorIndex];
    }

    /// @notice Gets total adjusted stakings for the month.
    /// @param _month: NRT Month.
    /// @return Total adjusted stakings for the month.
    function getTotalAdjustedStakings(uint32 _month) public override view returns (uint256) {
        return totalAdjustedStakings[_month];
    }

    /// @notice Gets total blocks sealed in the month.
    /// @param _month: NRT Month.
    /// @return Total number of blocks sealed in the month.
    function getTotalBlocksSealed(uint32 _month) public override view returns (uint256) {
        return totalBlocksSealed[_month];
    }

    /// @notice Gets total block rewards NRT in the month.
    /// @param _month: NRT Month.
    /// @return Total block rewards NRT in the month.
    // function getBlockRewardsMonthlyNRT(uint256 _month) public override view returns (uint256) {
    //     return monthlyN[_month];
    // }

    /// @notice Gets validator index.
    /// @param _month: NRT Month.
    /// @param _validator: Address of the validator.
    /// @return Index of the validator.
    function getValidatorIndex(uint32 _month, address _validator)
        public
        override
        view
        returns (uint256)
    {
        require(validatorIndexesPlusOne[_month][_validator] > 0, "ValM: Validator not present");
        return validatorIndexesPlusOne[_month][_validator] - 1;
    }

    /// @notice Gets delegator index.
    /// @param _month: NRT Month.
    /// @param _validatorIndex: Index of the validator.
    /// @param _stakingContract: Address of delegatinng staking contract.
    /// @return Index of delegator
    function getDelegatorIndex(
        uint32 _month,
        uint256 _validatorIndex,
        address _stakingContract
    ) public override view returns (uint256) {
        require(
            delegatorIndexesPlusOne[_month][_validatorIndex][_stakingContract] > 0,
            "ValM: Delegator not present"
        );
        return delegatorIndexesPlusOne[_month][_validatorIndex][_stakingContract] - 1;
    }

    /// @notice Gets quadratic adjustment amount for a given amount.
    /// @param _amount: Initial amount.
    /// @param _base: Amount intervals in which adjustment rate should increase.
    /// @param _premiumFactor: Factor in which premium increases.
    /// @return Quadratic adjusted amount.
    function getAdjustedAmount(
        uint256 _amount,
        uint256 _base,
        uint256 _premiumFactor
    ) public override pure returns (uint256) {
        /// @dev This makes _base as minimum stake value.
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

            /// @dev This maintains continuty.
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
