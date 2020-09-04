// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

interface IValidatorManager {
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

    function registerDelegation(uint256 _month, bytes memory _extraData) external;

    function registerBlock(address _sealer) external;

    function withdrawDelegationShare(
        uint256 _month,
        address _validator,
        address _stakingContract
    ) external;

    function setCommission(uint256 _month, uint256 _perThousandCommission) external;

    function withdrawCommission(uint256 _month) external;

    function getValidatorEarning(uint256 _month, address _validator)
        external
        view
        returns (uint256);

    function getLuckyValidatorAddress() external returns (address);

    function pickValidator(uint256 _month, uint256 _seed) external view returns (uint256);

    function getValidatorByIndex(uint256 _month, uint256 _validatorIndex)
        external
        view
        returns (Validator memory);

    function getValidatorByAddress(uint256 _month, address _validator)
        external
        view
        returns (Validator memory);

    function getValidators(uint256 _month) external view returns (Validator[] memory);

    function getDelegatorByIndex(
        uint256 _month,
        uint256 _validatorIndex,
        uint256 _delegatorIndex
    ) external view returns (Delegator memory);

    function getDelegatorByAddress(
        uint256 _month,
        address _validator,
        address _stakingContract
    ) external view returns (Delegator memory);

    function getTotalAdjustedStakings(uint256 _month) external view returns (uint256);

    function getTotalBlocksSealed(uint256 _month) external view returns (uint256);

    function getBlockRewardsMonthlyNRT(uint256 _month) external view returns (uint256);

    function getValidatorIndex(uint256 _month, address _validator) external view returns (uint256);

    function getDelegatorIndex(
        uint256 _month,
        uint256 _validatorIndex,
        address _stakingContract
    ) external view returns (uint256);

    function getAdjustedAmount(
        uint256 _amount,
        uint256 _base,
        uint256 _premiumFactor
    ) external pure returns (uint256);
}
