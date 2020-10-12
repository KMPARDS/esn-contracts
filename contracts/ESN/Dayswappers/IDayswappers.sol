// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface IDayswappers {
    enum RewardType { Liquid, Prepaid, Staked }

    /// @notice Emits when a networker joins or transfers their seat
    event SeatTransfer(address indexed from, address indexed to, uint32 indexed seatIndex);

    /// @notice Emits when a networker marks another networker as their introducer
    event Introduce(uint32 indexed introducerSeatIndex, uint32 indexed networkerSeatIndex);

    event Promotion(uint32 indexed seatIndex, uint32 indexed beltIndex);

    /// @notice Emits when kyc is resolved on Dayswappers
    event KycResolve(uint32 indexed seatIndex);

    event Volume(
        address indexed platform,
        uint32 indexed seatIndex,
        uint32 indexed month,
        uint256 amount
    );

    /// @notice Emits when a networker becomes active
    event Active(uint32 indexed seatIndex, uint32 indexed month);

    event Reward(
        address indexed platform,
        uint32 indexed seatIndex,
        uint32 indexed month,
        bool isDefinite,
        bool fromTree,
        uint256 reward,
        uint256[3] rewardRatio
    );

    event Withdraw(
        uint32 indexed seatIndex,
        bool indexed isDefinite,
        RewardType rewardType,
        uint32 month,
        uint256[3] adjustedRewards
    );

    function join(address _introducer) external;

    function resolveKyc(address _networker) external;

    function promoteBelt(address _networker, uint32 _month) external;

    function getBeltIdFromTreeReferrals(uint32 treeReferrals)
        external
        view
        returns (uint32 _newBeltIndex);

    function payToTree(address _networker, uint256[3] memory _rewardRatio) external payable;

    function payToNetworker(address _networker, uint256[3] memory _rewardRatio) external payable;

    function payToIntroducer(address _networker, uint256[3] memory _rewardRatio) external payable;

    function rewardToTree(
        address _networker,
        uint256 _value,
        uint256[3] memory _rewardRatio
    ) external;

    function reportVolume(address _networker, uint256 _amount) external;

    function transferSeat(address _newOwner) external;

    function withdrawDefiniteEarnings(
        address _stakingContract,
        uint32 _month,
        RewardType _rewardType
    ) external;

    function withdrawNrtEarnings(
        address _stakingContract,
        uint32 _month,
        RewardType _rewardType
    ) external;

    function getSeatByIndex(uint32 _seatIndex)
        external
        view
        returns (
            uint32 seatIndex,
            address owner,
            bool kycResolved,
            uint32 incompleteKycResolveSeatIndex,
            uint32 depth,
            uint32 introducerSeatIndex,
            uint32 beltIndex
        );

    function getSeatByAddress(address _networker)
        external
        view
        returns (
            uint32 seatIndex,
            address owner,
            bool kycResolved,
            uint32 incompleteKycResolveSeatIndex,
            uint32 depth,
            uint32 introducerSeatIndex,
            uint32 beltIndex
        );

    function getSeatByAddressStrict(address _networker)
        external
        view
        returns (
            uint32 seatIndex,
            address owner,
            bool kycResolved,
            uint32 incompleteKycResolveSeatIndex,
            uint32 depth,
            uint32 introducerSeatIndex,
            uint32 beltIndex
        );

    function getSeatMonthlyDataByIndex(uint32 _seatIndex, uint32 _month)
        external
        view
        returns (
            uint32 treeReferrals,
            uint256 volume,
            uint256[3] memory definiteEarnings,
            uint256[3] memory nrtEarnings,
            bool isActive
        );

    function getSeatMonthlyDataByAddress(address _networker, uint32 _month)
        external
        view
        returns (
            uint32 treeReferrals,
            uint256 volume,
            uint256[3] memory definiteEarnings,
            uint256[3] memory nrtEarnings,
            bool isActive
        );

    function getSeatMonthlyDataByAddressStrict(address _networker, uint32 _month)
        external
        view
        returns (
            uint32 treeReferrals,
            uint256 volume,
            uint256[3] memory definiteEarnings,
            uint256[3] memory nrtEarnings,
            bool isActive
        );

    function isActiveAddress(address _networker) external view returns (bool);

    function isActiveSeat(uint32 _seatIndex) external view returns (bool);

    function resolveIntroducer(address _networker) external view returns (address);

    function getTotalMonthlyActiveDayswappers(uint32 _month) external view returns (uint256);

    function volumeTarget() external view returns (uint256);
}
