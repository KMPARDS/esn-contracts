// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { Governable } from "../Governance/Governable.sol";
import { Authorizable } from "../Governance/Authorizable.sol";
import { NRTReceiver } from "../NRT/NRTReceiver.sol";
import { RegistryDependent } from "../KycDapp/RegistryDependent.sol";
import { ITimeAllyStaking } from "../TimeAlly/1LifeTimes/ITimeAllyStaking.sol";
import { IDayswappers } from "./IDayswappers.sol";
import { Initializable } from "@openzeppelin/contracts/proxy/Initializable.sol";

abstract contract Dayswappers is
    IDayswappers,
    Governable,
    RegistryDependent,
    Authorizable,
    NRTReceiver,
    Initializable
{
    using SafeMath for uint256;

    struct Seat {
        address owner; // Address of seat owner.
        bool kycResolved; // whether upline referral is incremented after kyc approved.
        uint32 incompleteKycResolveSeatIndex; // upline's seat index after which process is pending
        uint32 depth; // tree depth, actual if kyc is completely resolved else upto which kyc was resolved. useful for giving rewards in iterator mode
        uint32 introducerSeatIndex; // index of introducer, cannot be changed.
        uint32 beltIndex; // belt identifier
        mapping(uint32 => Monthly) monthlyData; // data that is mapped monthly
    }

    struct Monthly {
        uint32 treeReferrals; // number of new downline kycs in this month
        uint256 volume; // volume done on dayswapper enabled platforms in this month
        uint256[3] definiteEarnings; // [liquid, prepaid, staking]
        uint256[3] nrtEarnings; // [liquid, prepaid, staking]
    }

    struct Belt {
        uint32 required;
        uint256 distributionPercent;
        uint256 leadershipPercent;
    }

    Belt[] belts;

    /// @dev Stores dayswappers seats
    Seat[] seats;

    // KycDapp public kycDapp;

    // PrepaidEs public prepaidEs;

    // TimeAllyManager public timeallyManager;

    uint256 public override volumeTarget;

    mapping(uint32 => uint256) totalMonthlyActiveDayswappers;

    /// @dev Stores seat indexes for addresses
    mapping(address => uint32) seatIndexes;

    /// @dev Stores monthly rewards (indefinite) to everyone
    mapping(uint32 => uint256) totalMonthlyIndefiniteRewards;

    modifier onlyJoined(address _networker) {
        require(isJoined(_networker), "Dayswappers: Networker not joined");
        _;
    }

    modifier onlyKycAuthorised() {
        uint256 _seatIndex = seatIndexes[msg.sender];
        require(seats[_seatIndex].kycResolved, "Dayswappers: KYC not resolved");
        require(
            kycDapp().isKycLevel1(seats[_seatIndex].owner),
            "Dayswappers: Only kyc approved allowed"
        );
        _;
    }

    function initialize(Belt[] memory _belts) public virtual initializer {
        _initializeGovernable();

        // belts = _belts;
        for (uint256 i = 0; i < _belts.length; i++) {
            belts.push(_belts[i]);
        }

        /// @dev Seat with index 0 is a null seat
        seats.push();

        // make null seat black
        seats[0].beltIndex = uint32(belts.length - 1);
    }

    function receiveNrt(uint32 _currentNrtMonth) public override payable {
        NRTReceiver.receiveNrt(_currentNrtMonth);

        uint256 _totalRewards = totalMonthlyIndefiniteRewards[_currentNrtMonth - 1];
        uint256 _nrt = monthlyNRT[_currentNrtMonth];
        if (_totalRewards < _nrt) {
            uint256 _burn = _nrt.sub(_totalRewards);
            nrtManager().addToBurnPool{ value: _burn }();
        }
    }

    function setNullWallet(address _nullWallet) public onlyGovernance {
        address _oldOwner = seats[0].owner;
        seats[0].owner = _nullWallet;
        emit SeatTransfer(_oldOwner, _nullWallet, 0);
    }

    function setVolumeTarget(uint256 _volumeTarget) public onlyGovernance {
        volumeTarget = _volumeTarget;
    }

    function join(address _introducer) public override {
        uint32 _introducerSeatIndex = seatIndexes[_introducer];

        // if (_introducer != address(0) && _introducerSeatIndex == 0) {
        //     _introducerSeatIndex = _createSeat(_introducer);
        // }

        require(
            _introducer == address(0) || _introducerSeatIndex != 0,
            "Dayswappers: Introducer not joined"
        );

        // Creates a seat, reverts if seat already exists
        uint32 _selfSeatIndex = _createSeat(msg.sender);

        Seat storage seat = seats[_selfSeatIndex];

        // this line is not required
        require(seat.introducerSeatIndex == 0, "Dayswapper: Introducer already set");

        // is this check required now when introducer cannot change?
        // require(
        //     !checkCircularReference(_selfSeatIndex, _introducerSeatIndex),
        //     "Dayswapper: Circular reference not allowed"
        // );

        seat.introducerSeatIndex = _introducerSeatIndex;

        emit Introduce(_introducerSeatIndex, _selfSeatIndex);
    }

    function resolveKyc(address _networker) public override onlyJoined(_networker) {
        uint32 _seatIndex = seatIndexes[_networker];
        require(_seatIndex != 0, "Dayswappers: Networker not joined");

        Seat storage seat = seats[_seatIndex];

        require(!seat.kycResolved, "Dayswappers: Kyc already resolved");

        /// @dev Checks if KYC is approved on KYC Dapp
        require(kycDapp().isKycLevel1(_networker), "Dayswappers: Kyc not approved");

        uint32 _depth = seat.depth; // it is always 0 when starting, might be needed in iterator mechanism
        uint32 _uplineSeatIndex = seat.incompleteKycResolveSeatIndex; // iterator mechanism, incomplete pls complete it

        if (_uplineSeatIndex == 0) {
            _uplineSeatIndex = seat.introducerSeatIndex;
        }

        seat.kycResolved = true;

        uint32 _currentMonth = uint32(nrtManager().currentNrtMonth());

        while (_uplineSeatIndex != 0) {
            Seat storage upline = seats[_uplineSeatIndex];
            upline.monthlyData[_currentMonth].treeReferrals++;
            _depth++;
            _uplineSeatIndex = upline.introducerSeatIndex;

            // Add a gas break here and update seat.incompleteKycResolveSeatIndex value with
            // current uplne seat index.
        }

        seat.depth = _depth;

        emit KycResolve(_seatIndex);
    }

    function promoteBelt(address _networker, uint32 _month) public override onlyJoined(_networker) {
        // address _networker = msg.sender;
        uint32 _seatIndex = seatIndexes[_networker];
        require(_seatIndex != 0, "Dayswappers: Networker not joined");

        Seat storage seat = seats[_seatIndex];
        uint32 _treeReferrals = seat.monthlyData[_month].treeReferrals;

        uint32 _newBeltIndex = getBeltIdFromTreeReferrals(_treeReferrals);

        require(_newBeltIndex > seat.beltIndex, "Dayswappers: No promotion this month so far");
        seat.beltIndex = _newBeltIndex;

        emit Promotion(_seatIndex, _newBeltIndex);
    }

    function getBeltIdFromTreeReferrals(uint32 treeReferrals)
        public
        override
        view
        returns (uint32 _newBeltIndex)
    {
        for (; _newBeltIndex < belts.length - 1; _newBeltIndex++) {
            if (treeReferrals < belts[_newBeltIndex + 1].required) {
                break;
            }
        }
    }

    function payToTree(address _networker, uint256[3] memory _rewardRatio) public override payable {
        uint32 _seatIndex = seatIndexes[_networker];
        if (msg.value > 0) {
            _distributeToTree(_seatIndex, msg.value, true, _rewardRatio);
        }
    }

    function payToNetworker(address _networker, uint256[3] memory _rewardRatio)
        public
        override
        payable
    {
        uint32 _seatIndex = seatIndexes[_networker];

        _payToSeat(_seatIndex, _rewardRatio);
    }

    function payToIntroducer(address _networker, uint256[3] memory _rewardRatio)
        public
        override
        payable
    {
        uint32 _seatIndex = seatIndexes[_networker];
        uint32 _introducerSeatIndex = seats[_seatIndex].introducerSeatIndex;

        _payToSeat(_introducerSeatIndex, _rewardRatio);
    }

    function _payToSeat(uint32 _seatIndex, uint256[3] memory _rewardRatio) private {
        if (msg.value > 0) {
            uint32 _currentMonth = uint32(nrtManager().currentNrtMonth());
            _rewardSeat(_seatIndex, msg.value, true, false, _rewardRatio, _currentMonth);
        }
    }

    function rewardToTree(
        address _networker,
        uint256 _value,
        uint256[3] memory _rewardRatio
    ) public override onlyAuthorized {
        uint32 _seatIndex = seatIndexes[_networker];
        if (_value > 0) {
            _distributeToTree(_seatIndex, _value, false, _rewardRatio);
        }
    }

    // function rewardToIntroducer(
    //     address _networker,
    //     uint256 _value,
    //     uint256[3] memory _rewardRatio
    // ) public {
    //     uint32 _seatIndex = seatIndexes[_networker];
    //     uint32 _introducerSeatIndex = seats[_seatIndex].introducerSeatIndex;
    //     if (_value > 0) {
    //         uint32 _currentMonth = uint32(nrtManager.currentNrtMonth());
    //         totalMonthlyIndefiniteRewards[_currentMonth] = totalMonthlyIndefiniteRewards[_currentMonth]
    //             .add(_value);
    //         _rewardSeat(_introducerSeatIndex, _value, false, false, _rewardRatio, _currentMonth);
    //     }
    // }

    function reportVolume(address _networker, uint256 _amount) public override onlyAuthorized {
        uint32 _seatIndex = seatIndexes[_networker];
        uint32 _currentMonth = uint32(nrtManager().currentNrtMonth());
        uint256 _prevVolume = seats[_seatIndex].monthlyData[_currentMonth].volume;
        uint256 _newVolume = _prevVolume.add(_amount);
        seats[_seatIndex].monthlyData[_currentMonth].volume = _newVolume;

        uint256 _volumeTarget = volumeTarget;
        if (_prevVolume < _volumeTarget && _newVolume >= _volumeTarget) {
            totalMonthlyActiveDayswappers[_currentMonth] += 1;
            emit Active(_seatIndex, _currentMonth);
        }

        emit Volume(msg.sender, _seatIndex, _currentMonth, _amount);
    }

    function transferSeat(address _newOwner)
        public
        override
        onlyJoined(msg.sender)
        onlyKycAuthorised
    {
        require(seatIndexes[_newOwner] == 0, "Dayswappers: New owner already has a seat");
        uint32 _seatIndex = seatIndexes[msg.sender];
        Seat storage seat = seats[_seatIndex];

        seat.owner = _newOwner;
        seatIndexes[_newOwner] = seatIndexes[msg.sender];
        seatIndexes[msg.sender] = 0;

        emit SeatTransfer(msg.sender, _newOwner, _seatIndex);
    }

    function withdrawDefiniteEarnings(
        address _stakingContract,
        uint32 _month,
        RewardType _rewardType
    ) public override {
        _withdrawEarnings(_stakingContract, true, _month, _rewardType);
    }

    function withdrawNrtEarnings(
        address _stakingContract,
        uint32 _month,
        RewardType _rewardType
    ) public override {
        _withdrawEarnings(_stakingContract, false, _month, _rewardType);
    }

    function _withdrawEarnings(
        address stakingContract,
        bool _isDefinite,
        uint32 _month,
        RewardType _rewardType
    ) private onlyJoined(msg.sender) onlyKycAuthorised {
        uint32 _seatIndex = seatIndexes[msg.sender];
        // Seat storage seat = seats[_seatIndex];
        uint256[3] storage earningsStorage = seats[_seatIndex].monthlyData[_month].definiteEarnings;
        // uint256[3] memory _earningsMemory = seat.definiteEarnings;

        if (!_isDefinite) {
            require(monthlyNRT[_month + 1] > 0, "Dayswappers: NRT amount not received for month");

            earningsStorage = seats[_seatIndex].monthlyData[_month].nrtEarnings;
            // _earningsMemory = seats[_seatIndex].monthlyData[_month].nrtEarnings;
        } else if (
            monthlyNRT[_month + 1] == 0 &&
            seats[_seatIndex].monthlyData[_month].volume < volumeTarget
        ) {
            revert("Dayswappers: Volume not acheived for instant definite withdraw");
        }

        require(
            earningsStorage[0] > 0 || earningsStorage[1] > 0 || earningsStorage[2] > 0,
            "Dayswappers: No reward or already withdrawn"
        );

        if (earningsStorage[1] > 0 || earningsStorage[2] > 0) {
            require(
                timeallyManager().isStakingContractValid(stakingContract),
                "Dayswappers: Invalid staking contract"
            );
            require(
                msg.sender == Governable(stakingContract).owner(),
                "Dayswappers: Not ownership of staking"
            );
        }

        uint256 _burnAmount;
        uint256[3] memory _adjustedRewards;
        uint256 _issTime;

        for (uint8 i = 0; i <= 2; i++) {
            uint256 _rawValue = earningsStorage[i];
            _adjustedRewards[i] = earningsStorage[i];

            // if NRT then adjust reward based on monthlyNRT
            if (!_isDefinite) {
                uint256 _totalRewards = totalMonthlyIndefiniteRewards[_month];
                uint256 _nrt = monthlyNRT[_month + 1];
                if (_totalRewards > _nrt) {
                    _adjustedRewards[i] = _adjustedRewards[i].mul(_nrt).div(_totalRewards);
                }
                // else {
                //     // burn amount which was not utilised
                //     _burnAmount = _burnAmount.add(
                //         _adjustedRewards[i].mul(_nrt.sub(_totalRewards)).div(_nrt)
                //     );
                // }
            }

            /// @dev Burn reward if volume target is not acheived.
            if (seats[_seatIndex].monthlyData[_month].volume < volumeTarget) {
                _burnAmount = _burnAmount.add(_adjustedRewards[i]);
                _adjustedRewards[i] = 0;
            }

            if (_rawValue > 0) {
                earningsStorage[i] = 0;
            }
        }

        if (_rewardType == RewardType.Liquid) {
            // do nothing keep as it is and proceed
        } else if (_rewardType == RewardType.Prepaid) {
            _issTime = _issTime.add(_adjustedRewards[0]); // 100% isstime for degrading liquid to prepaid
            _adjustedRewards[1] = _adjustedRewards[1].add(_adjustedRewards[0]);
            _adjustedRewards[0] = 0;
        } else if (_rewardType == RewardType.Staked) {
            _issTime = _issTime.add(_adjustedRewards[0].mul(225).div(100)); // 225% isstime for degrading liquid to staked
            // _issTime = _issTime.add(_prepaidReward); // 0% isstime for degrading prepaid es to staked
            _adjustedRewards[2] = _adjustedRewards[2].add(_adjustedRewards[0]).add(
                _adjustedRewards[1]
            );
            _adjustedRewards[0] = 0;
            _adjustedRewards[1] = 0;
        } else {
            /// @dev Invalid enum calls are auto-reverted but still, just in some case.
            revert("Dayswappers: Invalid reward type specified");
        }

        /// @dev Send liquid rewards if any.
        if (_adjustedRewards[0] > 0) {
            (bool _success, ) = msg.sender.call{ value: _adjustedRewards[0] }("");
            require(_success, "Dayswappers: Liquid ES transfer to self is failing");
        }

        /// @dev Send prepaid rewards if any.
        if (_adjustedRewards[1] > 0) {
            prepaidEs().convertToESP{ value: _adjustedRewards[1] }(msg.sender);
        }

        /// @dev Send staking rewards as topup if any.
        if (_adjustedRewards[2] > 0) {
            (bool _success, ) = address(stakingContract).call{ value: _adjustedRewards[2] }("");
            require(_success, "Dayswappers: Staking Topup is failing");
        }

        /// @dev Increase IssTime Limit for the staking.
        if (_issTime > 0) {
            ITimeAllyStaking(stakingContract).increaseIssTime(_issTime);
        }

        if (_burnAmount > 0) {
            nrtManager().addToBurnPool{ value: _burnAmount }();
        }

        emit Withdraw(_seatIndex, _isDefinite, _rewardType, _month, _adjustedRewards);
    }

    function _distributeToTree(
        uint32 _seatIndex,
        uint256 _value,
        bool _isDefinite,
        uint256[3] memory _rewardRatio
    ) private {
        // uint32 _seatIndex = seatIndexes[_networker];
        // // if networker not joined then burn the amount
        // require(_seatIndex != 0, "Dayswappers: Networker not joined");

        uint32 _currentMonth = uint32(nrtManager().currentNrtMonth());

        if (!_isDefinite) {
            totalMonthlyIndefiniteRewards[_currentMonth] = totalMonthlyIndefiniteRewards[_currentMonth]
                .add(_value);
        }

        uint256 _sent;
        uint32 _previousBeltIndex;
        bool isSecondLeader;

        Belt[] memory _belts = belts;

        while (true) {
            if (_seatIndex == 0) {
                break;
            }

            uint32 _currentBeltIndex = seats[_seatIndex].beltIndex;

            if (_currentBeltIndex > _previousBeltIndex) {
                uint256 distributionDiff = _belts[_currentBeltIndex].distributionPercent.sub(
                    _belts[_previousBeltIndex].distributionPercent
                );

                uint256 _reward = _value.mul(distributionDiff).div(100);
                _sent += _reward;
                _rewardSeat(_seatIndex, _reward, _isDefinite, true, _rewardRatio, _currentMonth);

                _previousBeltIndex = _currentBeltIndex;

                if (_belts[_currentBeltIndex].leadershipPercent > 0) {
                    isSecondLeader = true;
                }
            } else if (_currentBeltIndex == _previousBeltIndex && isSecondLeader) {
                isSecondLeader = false;
                uint256 leadershipDiff = _belts[_currentBeltIndex].leadershipPercent;
                uint256 _reward = _value.mul(leadershipDiff).div(100);
                _sent += _reward;
                _rewardSeat(_seatIndex, _reward, _isDefinite, true, _rewardRatio, _currentMonth);
            }

            _seatIndex = seats[_seatIndex].introducerSeatIndex;
        }

        if (_sent < _value) {
            uint256 _unrewarded = _value.sub(_sent);
            _rewardSeat(0, _unrewarded, _isDefinite, true, _rewardRatio, _currentMonth);
        }
    }

    function _rewardSeat(
        uint32 _seatIndex,
        uint256 _value,
        bool _isDefinite,
        bool _fromTree,
        uint256[3] memory _rewardRatio,
        uint32 _month
    ) private {
        Monthly storage seatMonthlyData = seats[_seatIndex].monthlyData[_month];

        uint256 _rewardSum = _rewardRatio[0] + _rewardRatio[1] + _rewardRatio[2];

        if (_isDefinite) {
            for (uint256 i = 0; i <= 2; i++) {
                if (_rewardRatio[i] > 0) {
                    seatMonthlyData.definiteEarnings[i] = seatMonthlyData.definiteEarnings[i].add(
                        _value.mul(_rewardRatio[i]).div(_rewardSum)
                    );
                }
            }
        } else {
            for (uint256 i = 0; i <= 2; i++) {
                if (_rewardRatio[i] > 0) {
                    seatMonthlyData.nrtEarnings[i] = seatMonthlyData.nrtEarnings[i].add(
                        _value.mul(_rewardRatio[i]).div(_rewardSum)
                    );
                }
            }
        }

        emit Reward(msg.sender, _seatIndex, _month, _isDefinite, _fromTree, _value, _rewardRatio);
    }

    function _createSeat(address _networker) internal returns (uint32) {
        uint32 _newSeatIndex = uint32(seats.length);
        require(!isJoined(_networker), "Dayswappers: Seat already alloted");

        seats.push();

        seats[_newSeatIndex].owner = _networker;
        seatIndexes[_networker] = _newSeatIndex;

        emit SeatTransfer(address(0), _networker, _newSeatIndex);
        emit Promotion(_newSeatIndex, 0);

        return _newSeatIndex;
    }

    function isJoined(address _networker) public view returns (bool) {
        uint256 _seatIndex = seatIndexes[_networker];
        if (_seatIndex == 0) {
            return _networker == seats[_seatIndex].owner;
        }
        return true;
    }

    function getSeatByIndex(uint32 _seatIndex)
        public
        override
        view
        returns (
            uint32 seatIndex,
            address owner,
            bool kycResolved,
            uint32 incompleteKycResolveSeatIndex,
            uint32 depth,
            uint32 introducerSeatIndex,
            uint32 beltIndex
        )
    {
        seatIndex = _seatIndex;
        Seat storage seat = seats[_seatIndex];
        owner = seat.owner;
        kycResolved = seat.kycResolved;
        incompleteKycResolveSeatIndex = seat.incompleteKycResolveSeatIndex;
        depth = seat.depth;
        introducerSeatIndex = seat.introducerSeatIndex;
        beltIndex = seat.beltIndex;
    }

    function getSeatByAddressStrict(address _networker)
        public
        override
        view
        returns (
            uint32 seatIndex,
            address owner,
            bool kycResolved,
            uint32 incompleteKycResolveSeatIndex,
            uint32 depth,
            uint32 introducerSeatIndex,
            uint32 beltIndex
        )
    {
        require(isJoined(_networker), "Dayswappers: Networker not joined");

        return getSeatByAddress(_networker);
    }

    function getSeatByAddress(address _networker)
        public
        override
        view
        returns (
            uint32 seatIndex,
            address owner,
            bool kycResolved,
            uint32 incompleteKycResolveSeatIndex,
            uint32 depth,
            uint32 introducerSeatIndex,
            uint32 beltIndex
        )
    {
        // require(_isJoined(_networker), "Dayswappers: Networker not joined");

        seatIndex = seatIndexes[_networker];
        (
            seatIndex,
            owner,
            kycResolved,
            incompleteKycResolveSeatIndex,
            depth,
            introducerSeatIndex,
            beltIndex
        ) = getSeatByIndex(seatIndex);
    }

    function getSeatMonthlyDataByIndex(uint32 _seatIndex, uint32 _month)
        public
        override
        view
        returns (
            uint32 treeReferrals,
            uint256 volume,
            uint256[3] memory definiteEarnings,
            uint256[3] memory nrtEarnings,
            bool isActive
        )
    {
        Monthly storage seatMonthlyData = seats[_seatIndex].monthlyData[_month];
        treeReferrals = seatMonthlyData.treeReferrals;
        volume = seatMonthlyData.volume;
        definiteEarnings = seatMonthlyData.definiteEarnings;
        nrtEarnings = seatMonthlyData.nrtEarnings;
        isActive = volume >= volumeTarget;
    }

    function getSeatMonthlyDataByAddressStrict(address _networker, uint32 _month)
        public
        override
        view
        returns (
            uint32 treeReferrals,
            uint256 volume,
            uint256[3] memory definiteEarnings,
            uint256[3] memory nrtEarnings,
            bool isActive
        )
    {
        require(isJoined(_networker), "Dayswappers: Networker not joined");

        return getSeatMonthlyDataByAddress(_networker, _month);
    }

    function getSeatMonthlyDataByAddress(address _networker, uint32 _month)
        public
        override
        view
        returns (
            uint32 treeReferrals,
            uint256 volume,
            uint256[3] memory definiteEarnings,
            uint256[3] memory nrtEarnings,
            bool isActive
        )
    {
        // require(_isJoined(_networker), "Dayswappers: Networker not joined");

        uint32 seatIndex = seatIndexes[_networker];
        return getSeatMonthlyDataByIndex(seatIndex, _month);
    }

    function isActiveAddress(address _networker) public override view returns (bool) {
        uint32 _seatIndex = seatIndexes[_networker];
        if (_seatIndex == 0) {
            return msg.sender == seats[_seatIndex].owner;
        }
        return isActiveSeat(_seatIndex);
    }

    function isActiveSeat(uint32 _seatIndex) public override view returns (bool) {
        uint32 currentNrtMonth = uint32(nrtManager().currentNrtMonth());
        return seats[_seatIndex].monthlyData[currentNrtMonth].volume >= volumeTarget;
    }

    function resolveIntroducer(address _networker) public override view returns (address) {
        uint32 _seatIndex = seatIndexes[_networker];
        Seat storage seat = seats[_seatIndex];
        if (_seatIndex == 0 && _networker != seat.owner) {
            return address(0);
        }

        return seats[seat.introducerSeatIndex].owner;
    }

    function getTotalMonthlyActiveDayswappers(uint32 _month)
        public
        override
        view
        returns (uint256)
    {
        return totalMonthlyActiveDayswappers[_month];
    }

    function getTotalMonthlyIndefiniteRewards(uint32 _month) public view returns (uint256) {
        return totalMonthlyIndefiniteRewards[_month];
    }
}
