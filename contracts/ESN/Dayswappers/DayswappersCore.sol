// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { NRTManager } from "../NRT/NRTManager.sol";
import { NRTReceiver } from "../NRT/NRTReceiver.sol";
import { TimeAllyManager } from "../TimeAllyManager.sol";
import { TimeAllyStaking } from "../TimeAllyStaking.sol";
import { KycDapp } from "../KycDapp/KycDapp.sol";
import { PrepaidEs } from "../PrepaidEs.sol";

abstract contract Dayswappers is Ownable, NRTReceiver {
    using SafeMath for uint256;

    struct Seat {
        address owner; // Address of seat owner.
        bool kycResolved; // whether upline referral is incremented after kyc approved.
        uint32 incompleteKycResolveSeatIndex; // upline's seat index after which process is pending
        uint32 depth; // tree depth, actual if kyc is completely resolved else upto which kyc was resolved. useful for giving rewards in iterator mode
        uint32 introducerSeatIndex; // index of introducer, cannot be changed.
        uint32 beltIndex; // belt identifier
        uint256[3] definiteEarnings; // [liquid, prepaid, staking]
        mapping(uint32 => Monthly) monthlyData; // data that is mapped monthly
    }

    struct Monthly {
        uint32 treeReferrals; // number of new downline kycs in this month
        uint256 volume; // volume done on dayswapper enabled platforms in this month
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

    KycDapp public kycDapp;

    PrepaidEs public prepaidEs;

    TimeAllyManager public timeallyManager;

    /// @dev Stores seat indexes for addresses
    mapping(address => uint32) seatIndexes;

    /// @dev Stores monthly rewards (indefinite) to everyone
    mapping(uint32 => uint256) totalMonthlyRewards;

    /// @notice Emits when a networker joins or transfers their seat
    event SeatTransfer(address indexed from, address indexed to, uint32 indexed seatIndex);

    /// @notice Emits when a networker marks another networker as their introducer
    event Introduce(uint32 indexed introducerSeatIndex, uint32 indexed networkerSeatIndex);

    event Promotion(uint32 indexed seatIndex, uint32 indexed beltIndex);

    event Volume(address indexed platform, uint32 indexed seatIndex, uint256 amount);

    event Reward(
        uint32 indexed seatIndex,
        bool isDefinite,
        bool fromTree,
        uint256 reward,
        uint256[3] rewardRatio
    );

    event Withdraw(
        uint32 indexed seatIndex,
        bool indexed isDefinite,
        uint8 indexed rewardType,
        uint32 month,
        uint256 amount,
        bool success
    );

    modifier onlyJoined(address _networker) {
        require(_isJoined(_networker), "Dayswappers: Networker not joined");
        _;
    }

    modifier onlyKycAuthorised() {
        uint256 _seatIndex = seatIndexes[msg.sender];
        require(seats[_seatIndex].kycResolved, "Dayswappers: KYC not resolved");
        require(
            kycDapp.isKycLevel1(seats[_seatIndex].owner),
            "Dayswappers: Only kyc approved allowed"
        );
        _;
    }

    constructor(Belt[] memory _belts) {
        // belts = _belts;
        for (uint256 i = 0; i < _belts.length; i++) {
            belts.push(_belts[i]);
        }

        /// @dev Seat with index 0 is a null seat
        seats.push();

        // make null seat black
        seats[0].beltIndex = uint32(belts.length - 1);
    }

    function receiveNrt() external override payable {
        require(msg.sender == address(nrtManager), "NRTReceiver: Only NRT can send");
        uint32 currentNrtMonth = uint32(nrtManager.currentNrtMonth());
        monthlyNRT[currentNrtMonth] = msg.value;

        if (totalMonthlyRewards[currentNrtMonth - 1] == 0) {
            nrtManager.addToBurnPool{ value: msg.value }();
        }
    }

    function setInitialValues(
        NRTManager _nrtMananger,
        KycDapp _kycDapp,
        PrepaidEs _prepaidEs,
        TimeAllyManager _timeallyManager,
        address _nullWallet
    ) public {
        nrtManager = _nrtMananger;
        kycDapp = _kycDapp;
        prepaidEs = _prepaidEs;
        timeallyManager = _timeallyManager;
        seats[0].owner = _nullWallet;
    }

    function join(address _introducer) public {
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
        require(
            !checkCircularReference(_selfSeatIndex, _introducerSeatIndex),
            "Dayswapper: Circular reference not allowed"
        );

        seat.introducerSeatIndex = _introducerSeatIndex;

        emit Introduce(_introducerSeatIndex, _selfSeatIndex);
    }

    function resolveKyc(address _networker) public onlyJoined(_networker) {
        uint32 _seatIndex = seatIndexes[_networker];
        require(_seatIndex != 0, "Dayswappers: Networker not joined");

        Seat storage seat = seats[_seatIndex];

        require(!seat.kycResolved, "Dayswappers: Kyc already resolved");

        /// @dev Checks if KYC is approved on KYC Dapp
        require(kycDapp.isKycLevel1(_networker), "Dayswappers: Kyc not approved");

        uint32 _depth = seat.depth; // it is always 0 when starting, might be needed in iterator mechanism
        uint32 _uplineSeatIndex = seat.incompleteKycResolveSeatIndex; // iterator mechanism, incomplete pls complete it

        if (_uplineSeatIndex == 0) {
            _uplineSeatIndex = seat.introducerSeatIndex;
        }

        seat.kycResolved = true;

        uint32 _currentMonth = uint32(nrtManager.currentNrtMonth());

        while (_uplineSeatIndex != 0) {
            Seat storage upline = seats[_uplineSeatIndex];
            upline.monthlyData[_currentMonth].treeReferrals++;
            _depth++;
            _uplineSeatIndex = upline.introducerSeatIndex;

            // Add a gas break here and update seat.incompleteKycResolveSeatIndex value with
            // current uplne seat index.
        }

        seat.depth = _depth;
    }

    function promoteBelt(address _networker, uint32 _month) public onlyJoined(_networker) {
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
        view
        returns (uint32 _newBeltIndex)
    {
        for (; _newBeltIndex < belts.length - 1; _newBeltIndex++) {
            if (treeReferrals < belts[_newBeltIndex + 1].required) {
                break;
            }
        }
    }

    function payToTree(address _networker, uint256[3] memory _rewardRatio) public payable {
        uint32 _seatIndex = seatIndexes[_networker];
        if (msg.value > 0) {
            _distributeToTree(_seatIndex, msg.value, true, _rewardRatio);
        }
    }

    function payToIntroducer(address _networker, uint256[3] memory _rewardRatio) public payable {
        uint32 _seatIndex = seatIndexes[_networker];
        uint32 _introducerSeatIndex = seats[_seatIndex].introducerSeatIndex;
        if (msg.value > 0) {
            _rewardSeat(_introducerSeatIndex, msg.value, true, true, _rewardRatio, 0);
        }
    }

    function rewardToTree(
        address _networker,
        uint256 _value,
        uint256[3] memory _rewardRatio
    ) public {
        uint32 _seatIndex = seatIndexes[_networker];
        if (_value > 0) {
            _distributeToTree(_seatIndex, _value, false, _rewardRatio);
        }
    }

    function rewardToIntroducer(
        address _networker,
        uint256 _value,
        uint256[3] memory _rewardRatio
    ) public {
        uint32 _seatIndex = seatIndexes[_networker];
        uint32 _introducerSeatIndex = seats[_seatIndex].introducerSeatIndex;
        if (_value > 0) {
            uint32 _currentMonth = uint32(nrtManager.currentNrtMonth());
            totalMonthlyRewards[_currentMonth] = totalMonthlyRewards[_currentMonth].add(_value);
            _rewardSeat(_introducerSeatIndex, _value, false, true, _rewardRatio, _currentMonth);
        }
    }

    function reportVolume(address _networker, uint256 _amount) public {
        // only allowed should be able to call

        uint32 _seatIndex = seatIndexes[_networker];
        uint32 _currentMonth = uint32(nrtManager.currentNrtMonth());

        seats[_seatIndex].monthlyData[_currentMonth].volume = seats[_seatIndex]
            .monthlyData[_currentMonth]
            .volume
            .add(_amount);

        emit Volume(msg.sender, _seatIndex, _amount);
    }

    function transferSeat(address _newOwner) public onlyJoined(msg.sender) onlyKycAuthorised {
        require(seatIndexes[_newOwner] == 0, "Dayswappers: New owner already has a seat");
        uint32 _seatIndex = seatIndexes[msg.sender];
        Seat storage seat = seats[_seatIndex];

        seat.owner = _newOwner;
        seatIndexes[_newOwner] = seatIndexes[msg.sender];
        seatIndexes[msg.sender] = 0;

        emit SeatTransfer(msg.sender, _newOwner, _seatIndex);
    }

    function withdrawEarnings(
        address _stakingContract,
        bool _isDefinite,
        uint32 _month
    ) public onlyJoined(msg.sender) onlyKycAuthorised {
        uint32 _seatIndex = seatIndexes[msg.sender];
        // Seat storage seat = seats[_seatIndex];
        uint256[3] storage earningsStorage = seats[_seatIndex].definiteEarnings;
        // uint256[3] memory _earningsMemory = seat.definiteEarnings;

        if (!_isDefinite) {
            require(monthlyNRT[_month + 1] > 0, "Dayswappers: NRT amount not received for month");

            earningsStorage = seats[_seatIndex].monthlyData[_month].nrtEarnings;
            // _earningsMemory = seats[_seatIndex].monthlyData[_month].nrtEarnings;
        }

        require(
            earningsStorage[0] > 0 || earningsStorage[1] > 0 || earningsStorage[2] > 0,
            "Dayswappers: No reward or already withdrawn"
        );

        if (earningsStorage[1] > 0 || earningsStorage[2] > 0) {
            require(
                timeallyManager.isStakingContractValid(_stakingContract),
                "Dayswappers: Invalid staking contract"
            );
            require(
                msg.sender == TimeAllyStaking(payable(_stakingContract)).owner(),
                "Dayswappers: Not ownership of staking"
            );
        }

        uint256 _burnAmount;

        for (uint8 i = 0; i <= 2; i++) {
            uint256 _rawValue = earningsStorage[i];
            uint256 _adjustedReward = earningsStorage[i];

            // if NRT then adjust reward based on monthlyNRT
            if (!_isDefinite) {
                uint256 _totalRewards = totalMonthlyRewards[_month];
                uint256 _nrt = monthlyNRT[_month + 1];
                if (_totalRewards > _nrt) {
                    _adjustedReward = _adjustedReward.mul(_nrt).div(_totalRewards);
                } else {
                    // burn amount which was not utilised
                    _burnAmount = _burnAmount.add(
                        _adjustedReward.mul(_nrt.sub(_totalRewards)).div(_nrt)
                    );
                }
            }

            if (_adjustedReward == 0) {
                continue;
            }

            earningsStorage[i] = 0;
            bool _success;

            if (i == 0) {
                _success = _processLiquidReward(seats[_seatIndex].owner, _adjustedReward);
            } else if (i == 1) {
                _success = _processPrepaidReward(
                    seats[_seatIndex].owner,
                    _stakingContract,
                    _adjustedReward
                );
            } else if (i == 2) {
                _success = _processStakingReward(_stakingContract, _adjustedReward);
            } else {
                revert("Dayswappers: Invalid reward type");
            }

            if (!_success) {
                earningsStorage[i] = _rawValue; //_earningsMemory[i];
            }

            emit Withdraw(
                _seatIndex,
                _isDefinite,
                i,
                _isDefinite ? 0 : _month,
                _adjustedReward,
                _success
            );
        }

        if (_burnAmount > 0) {
            nrtManager.addToBurnPool{ value: _burnAmount }();
        }
    }

    function _processLiquidReward(address _destination, uint256 _value) private returns (bool) {
        (bool _success, ) = _destination.call{ value: _value }("");
        return _success;
    }

    function _processPrepaidReward(
        address _destination,
        address _stakingContract,
        uint256 _value
    ) private returns (bool) {
        (bool _success, ) = address(prepaidEs).call{ value: _value }(
            abi.encodeWithSignature("convertToESP(address)", _destination)
        );

        if (_success) {
            (bool _success2, ) = _stakingContract.call(
                abi.encodeWithSignature("increaseIssTime(uint256)", _value)
            );
            // _success = _success && _success2;
            require(_success2, "Dayswappers: Increase Isstime prepaid failing");
        }

        return _success;
    }

    function _processStakingReward(address _stakingContract, uint256 _value)
        private
        returns (bool)
    {
        (bool _success, ) = _stakingContract.call{ value: _value }("");

        if (_success) {
            (bool _success2, ) = _stakingContract.call(
                abi.encodeWithSignature("increaseIssTime(uint256)", _value)
            );
            // _success = _success && _success2;
            require(_success2, "Dayswappers: Increase Isstime staking failing");
        }
        return true;
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

        uint32 _currentMonth;

        if (!_isDefinite) {
            _currentMonth = uint32(nrtManager.currentNrtMonth());
            totalMonthlyRewards[_currentMonth] = totalMonthlyRewards[_currentMonth].add(_value);
        }

        uint256 _sent;
        uint32 _previousBeltIndex;
        bool isSecondLeader;

        Belt[] memory _belts = belts;

        while (true) {
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

            if (_seatIndex == 0) {
                break;
            }
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
        Seat storage seat = seats[_seatIndex];

        uint256 _rewardSum = _rewardRatio[0] + _rewardRatio[1] + _rewardRatio[2];

        if (_isDefinite) {
            for (uint256 i = 0; i <= 2; i++) {
                if (_rewardRatio[i] > 0) {
                    seat.definiteEarnings[i] = seat.definiteEarnings[i].add(
                        _value.mul(_rewardRatio[i]).div(_rewardSum)
                    );
                }
            }
        } else {
            for (uint256 i = 0; i <= 2; i++) {
                if (_rewardRatio[i] > 0) {
                    seat.monthlyData[_month].nrtEarnings[i] = seat.monthlyData[_month]
                        .nrtEarnings[i]
                        .add(_value.mul(_rewardRatio[i]).div(_rewardSum));
                }
            }
        }

        emit Reward(_seatIndex, _isDefinite, _fromTree, _value, _rewardRatio);
    }

    function _createSeat(address _networker) internal returns (uint32) {
        uint32 _newSeatIndex = uint32(seats.length);
        require(seatIndexes[_networker] == 0, "Dayswappers: Seat already alloted");

        seats.push();

        seats[_newSeatIndex].owner = _networker;
        seatIndexes[_networker] = _newSeatIndex;

        emit SeatTransfer(address(0), _networker, _newSeatIndex);

        return _newSeatIndex;
    }

    function _isJoined(address _networker) private view returns (bool) {
        uint256 _seatIndex = seatIndexes[_networker];
        if (_seatIndex == 0) {
            return msg.sender == seats[_seatIndex].owner;
        }
        return true;
    }

    function getSeatByIndex(uint32 _seatIndex)
        public
        view
        returns (
            uint32 seatIndex,
            address owner,
            bool kycResolved,
            uint32 incompleteKycResolveSeatIndex,
            uint32 depth,
            uint32 introducerSeatIndex,
            uint32 beltIndex,
            uint256[3] memory definiteEarnings
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
        definiteEarnings = seat.definiteEarnings;
    }

    function getSeatByAddress(address _networker)
        public
        view
        returns (
            uint32 seatIndex,
            address owner,
            bool kycResolved,
            uint32 incompleteKycResolveSeatIndex,
            uint32 depth,
            uint32 introducerSeatIndex,
            uint32 beltIndex,
            uint256[3] memory definiteEarnings
        )
    {
        require(_isJoined(_networker), "Dayswappers: Networker not joined");

        seatIndex = seatIndexes[_networker];
        (
            seatIndex,
            owner,
            kycResolved,
            incompleteKycResolveSeatIndex,
            depth,
            introducerSeatIndex,
            beltIndex,
            definiteEarnings
        ) = getSeatByIndex(seatIndex);
    }

    function getSeatMonthlyDataByIndex(uint32 _seatIndex, uint32 _month)
        public
        view
        returns (
            uint32 treeReferrals,
            uint256 volume,
            uint256[3] memory nrtEarnings
        )
    {
        Monthly storage seatMonthlyData = seats[_seatIndex].monthlyData[_month];
        treeReferrals = seatMonthlyData.treeReferrals;
        volume = seatMonthlyData.volume;
        nrtEarnings = seatMonthlyData.nrtEarnings;
    }

    function getSeatMonthlyDataByAddress(address _networker, uint32 _month)
        public
        view
        returns (
            uint32 treeReferrals,
            uint256 volume,
            uint256[3] memory nrtEarnings
        )
    {
        require(_isJoined(_networker), "Dayswappers: Networker not joined");

        uint32 seatIndex = seatIndexes[_networker];
        return getSeatMonthlyDataByIndex(seatIndex, _month);
    }

    function checkCircularReference(uint32 _networkerSeatIndex, uint32 _introducerSeatIndex)
        private
        view
        returns (bool)
    {
        while (true) {
            /// @dev If any upline is the networker, this is circular.
            if (_introducerSeatIndex == _networkerSeatIndex) {
                return true;
            }

            /// @dev Moving one level up in the tree.
            _introducerSeatIndex = seats[_introducerSeatIndex].introducerSeatIndex;

            /// @dev If some introducer is the only null seat, this is not circular.
            if (_introducerSeatIndex == 0) {
                return false;
            }
        }
    }
}
