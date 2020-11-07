// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

interface ITimeAllyClub {
    enum RewardType { Liquid, Prepaid, Staked }

    struct Membership {
        uint256 businessVolume;
        uint256 otherVolume;
        mapping(address => PlatformBusiness) platformBusiness;
    }

    struct PlatformBusiness {
        uint256 business;
        uint256 calculatedReward;
        bool claimed;
    }

    struct Incentive {
        string label;
        uint256 target;
        uint32 directBountyPerTenThousand;
        uint32 treeBountyPerTenThousand;
    }

    function rewardToIntroducer(address _networker, uint256 _value) external;

    function rewardToNetworker(address _networker, uint256 _value) external;

    function withdrawPlatformIncentive(
        uint32 _month,
        address _platform,
        RewardType _rewardType,
        address stakingContract
    ) external;

    function getReward(
        address _networker,
        uint32 _month,
        address _platform
    ) external view returns (uint256 direct, uint256 tree);

    function getIncentiveSlab(uint256 _volume, address _platform)
        external
        view
        returns (Incentive memory);

    function getMembershipVolume(address _network, uint32 _month)
        external
        view
        returns (uint256 businessVolume, uint256 otherVolume);

    function getCurrentIncentiveSlabForNetworker(address _networker, address _platform)
        external
        view
        returns (Incentive memory);

    function getPlatformBusiness(
        address _network,
        uint32 _month,
        address _platform
    ) external view returns (PlatformBusiness memory);

    function getTotalBusinessVolume(uint32 _month) external view returns (uint256);
}
