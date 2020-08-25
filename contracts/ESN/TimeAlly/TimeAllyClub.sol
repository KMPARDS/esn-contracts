// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { NRTManager } from "../NRT/NRTManager.sol";
import { NRTReceiver } from "../NRT/NRTReceiver.sol";
import { Dayswappers } from "../Dayswappers/DayswappersCore.sol";

contract TimeAllyClub is NRTReceiver {
    using SafeMath for uint256;

    struct Membership {
        uint256 businessVolume;
        uint256 otherVolume;
        mapping(address => uint256) platformBusiness;
    }

    struct Incentive {
        string label;
        uint256 target;
        uint32 directBountyPerTenThousand;
        uint32 treeBountyPerTenThousand;
    }

    Dayswappers public dayswappers;
    address public timeallyManager;

    mapping(address => mapping(uint32 => Membership)) monthlyMemberships;
    mapping(uint32 => uint256) totalBusinessVolume;
    mapping(address => Incentive[]) platformIncentiveStructure;

    event Club(address indexed networker, address staker, uint256 value);

    function setInitialValues(
        NRTManager _nrtManager,
        Dayswappers _dayswappers,
        address _timeallyManager
    ) public {
        nrtManager = _nrtManager;
        dayswappers = _dayswappers;
        timeallyManager = _timeallyManager;
    }

    function setPlatformIncentives(address _platform, Incentive[] memory _incentiveStructure)
        public
    {
        if (platformIncentiveStructure[_platform].length > 0) {
            delete platformIncentiveStructure[_platform];
        }

        for (uint256 i = 0; i < _incentiveStructure.length; i++) {
            platformIncentiveStructure[_platform].push(_incentiveStructure[i]);
        }
    }

    function reportNewStaking(address _staker, uint256 _value) external {
        require(msg.sender == timeallyManager, "Club: Only TimeAlly allowed");

        address _introducer = dayswappers.resolveIntroducer(_staker);
        if (_introducer == address(0)) return;

        uint32 _currentMonth = uint32(nrtManager.currentNrtMonth());
        monthlyMemberships[_introducer][_currentMonth]
            .businessVolume = monthlyMemberships[_introducer][_currentMonth].businessVolume.add(
            _value
        );

        totalBusinessVolume[_currentMonth] = totalBusinessVolume[_currentMonth].add(_value);

        monthlyMemberships[_introducer][_currentMonth].platformBusiness[msg
            .sender] = monthlyMemberships[_introducer][_currentMonth].platformBusiness[msg.sender]
            .add(_value);

        emit Club(_introducer, _staker, _value);
    }

    function getIncentiveSlab(uint256 _volume, address _platform)
        public
        view
        returns (Incentive memory)
    {
        Incentive[] storage incentiveStructure = platformIncentiveStructure[_platform];

        // uint256 _volume = monthlyMemberships[_networker][_month].businessVolume +
        //     monthlyMemberships[_networker][_month].otherVolume;

        uint256 i = 0;
        for (; i < incentiveStructure.length; i++) {
            // monthlyMemberships[_networker];
            if (_volume < incentiveStructure[i].target) {
                break;
            }
        }

        i--;

        return incentiveStructure[i];
    }

    function getMembership(address _network, uint32 _month)
        public
        view
        returns (uint256 businessVolume, uint256 otherVolume)
    {
        businessVolume = monthlyMemberships[_network][_month].businessVolume;
        otherVolume = monthlyMemberships[_network][_month].otherVolume;
    }

    function getPlatformBusiness(
        address _network,
        uint32 _month,
        address _platform
    ) public view returns (uint256) {
        return monthlyMemberships[_network][_month].platformBusiness[_platform];
    }

    function getTotalBusinessVolume(uint32 _month) public view returns (uint256) {
        return totalBusinessVolume[_month];
    }
}
