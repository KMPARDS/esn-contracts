// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { NRTManager } from "../NRTManager.sol";
import { KycDapp } from "./KycDapp.sol";

contract Dayswappers {
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

    mapping(uint32 => uint256) nrtReceived;

    NRTManager public nrtManager;

    KycDapp public kycDapp;

    /// @dev Stores seat indexes for addresses
    mapping(address => uint32) seatIndexes;

    /// @notice Emits when a networker joins or transfers their seat
    event SeatTransfer(address indexed from, address indexed to, uint32 indexed seatIndex);

    /// @notice Emits when a networker marks another networker as their introducer
    event Introduce(uint32 indexed introducerSeatIndex, uint32 indexed networkerSeatIndex);

    event Promotion(uint32 indexed seatIndex, uint32 indexed beltIndex);

    event Distribution(
        uint32 indexed seatIndex,
        bool isDefinite,
        uint256 reward,
        uint256[3] rewardRatio
    );

    constructor(Belt[] memory _belts) {
        /// @dev Seat with index 0 is a null seat
        seats.push();

        // make null seat black

        // belts = _belts;
        for (uint256 i = 0; i < _belts.length; i++) {
            belts.push(_belts[i]);
        }
    }

    function setInitialValues(NRTManager _nrtMananger, KycDapp _kycDapp) public {
        nrtManager = _nrtMananger;
        kycDapp = _kycDapp;
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

    function resolveKyc(address _networker) public {
        uint32 _seatIndex = seatIndexes[_networker];
        require(_seatIndex != 0, "Dayswappers: Networker not joined");

        Seat storage seat = seats[_seatIndex];

        require(!seat.kycResolved, "Dayswappers: Kyc already resolved");

        /// @dev Checks if KYC is approved on KYC Dapp
        require(kycDapp.getKycStatus(_networker), "Dayswappers: Kyc not approved");

        uint32 _depth = seat.depth; // it is always 0 when starting, might be needed in iterator mechanism
        uint32 _uplineSeatIndex = seat.incompleteKycResolveSeatIndex; // iterator mechanism, incomplete pls complete it

        if (_uplineSeatIndex == 0) {
            _uplineSeatIndex = seat.introducerSeatIndex;
        }

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

    function promoteSelf(uint32 _month) public {
        address _networker = msg.sender;
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

    function _distributeToTree(
        uint32 _seatIndex,
        uint256 _value,
        bool _isDefinite,
        uint256[3] memory _rewardRatio
    ) private {
        // uint32 _seatIndex = seatIndexes[_networker];
        // // if networker not joined then burn the amount
        // require(_seatIndex != 0, "Dayswappers: Networker not joined");

        uint32 _currentMonth = uint32(nrtManager.currentNrtMonth());

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
                _rewardSeat(_seatIndex, _reward, _isDefinite, _rewardRatio, _currentMonth);

                _previousBeltIndex = _currentBeltIndex;

                if (_belts[_currentBeltIndex].leadershipPercent > 0) {
                    isSecondLeader = true;
                }
            } else if (_currentBeltIndex == _previousBeltIndex && isSecondLeader) {
                isSecondLeader = false;
                uint256 leadershipDiff = _belts[_currentBeltIndex].leadershipPercent;
                uint256 _reward = _value.mul(leadershipDiff).div(100);
                _sent += _reward;
                _rewardSeat(_seatIndex, _reward, _isDefinite, _rewardRatio, _currentMonth);
            }

            _seatIndex = seats[_seatIndex].introducerSeatIndex;

            if (_seatIndex == 0) {
                break;
            }
        }

        if (_sent < _value) {
            uint256 _unrewarded = _value.sub(_sent);
            _rewardSeat(0, _unrewarded, _isDefinite, _rewardRatio, _currentMonth);
        }
    }

    function _rewardSeat(
        uint32 _seatIndex,
        uint256 _value,
        bool _isDefinite,
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

        emit Distribution(_seatIndex, _isDefinite, _value, _rewardRatio);
    }

    function _createSeat(address _networker) private returns (uint32) {
        uint32 _newSeatIndex = uint32(seats.length);
        require(seatIndexes[_networker] == 0, "Dayswappers: Seat already alloted");

        seats.push();

        seats[_newSeatIndex].owner = _networker;
        seatIndexes[_networker] = _newSeatIndex;

        emit SeatTransfer(address(0), _networker, _newSeatIndex);

        return _newSeatIndex;
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
