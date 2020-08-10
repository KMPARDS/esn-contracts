// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "../NRTManager.sol";
import "./KycDapp.sol";

contract Dayswappers {
    struct Seat {
        address owner; // Address of seat owner.
        bool kycResolved; // whether upline referral is incremented after kyc approved.
        uint32 incompleteKycResolveSeatIndex; // upline's seat index after which process is pending
        uint32 depth; // tree depth, actual if kyc is completely resolved else upto which kyc was resolved
        uint32 introducerSeatIndex; // index of introducer, cannot be changed.
        uint32 beltId; // belt identifier
        uint256 issTime; // isstime credit earned
        mapping(uint32 => Monthly) monthlyData; // data that is mapped monthly
    }

    struct Monthly {
        uint32 treeReferrals; // number of new downline kycs in this month
        uint256 volume; // volume done on dayswapper enabled platforms in this month
        uint256 reward; // dayswapper reward received in this month
        bool claimed; // status of dayswapper reward claimed in this month
    }

    /// @dev Stores dayswappers seats
    Seat[] seats;

    NRTManager public nrtManager;

    KycDapp public kycDapp;

    /// @dev Stores seat indexes for addresses
    mapping(address => uint32) seatIndexes;

    /// @notice Emits when a networker joins or transfers their seat
    event SeatTransfer(address from, address to, uint32 seatIndex);

    /// @notice Emits when a networker marks another networker as their introducer
    event Introduce(uint32 introducerSeatIndex, uint32 networkerSeatIndex);

    constructor() public {
        /// @dev Seat with index 0 is a null seat
        seats.push();
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

        require(seat.introducerSeatIndex == 0, "Dayswapper: Introducer already set");
        require(
            !checkCircularReference(_selfSeatIndex, _introducerSeatIndex),
            "Dayswapper: Circular reference not allowed"
        );
        seat.introducerSeatIndex = _introducerSeatIndex;

        emit Introduce(_introducerSeatIndex, _selfSeatIndex);
    }

    function resolveKyc(address _networker) public {
        uint32 _seatIndex = seatIndexes[_networker];
        Seat storage seat = seats[_seatIndex];

        require(!seat.kycResolved, "Dayswappers: Kyc already resolved");

        /// @dev Checks if KYC is approved on KYC Dapp
        require(kycDapp.getKycStatus(_networker), "Dayswappers: Kyc not approved");

        uint32 _depth = seat.depth;
        uint32 _uplineSeatIndex = seat.incompleteKycResolveSeatIndex;

        if (_uplineSeatIndex == 0) {
            _uplineSeatIndex = seat.introducerSeatIndex;
        }

        uint32 _currentMonth = uint32(nrtManager.currentNrtMonth());

        while (_uplineSeatIndex != 0) {
            Seat storage upline = seats[_uplineSeatIndex];
            upline.monthlyData[_currentMonth].treeReferrals++;
            _depth++;
            _uplineSeatIndex = upline.introducerSeatIndex;
        }
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
            address owner,
            uint32 introducerSeatIndex,
            uint32 beltId,
            uint256 issTime
        )
    {
        Seat storage seat = seats[_seatIndex];
        owner = seat.owner;
        introducerSeatIndex = seat.introducerSeatIndex;
        beltId = seat.beltId;
        issTime = seat.issTime;
    }

    function getSeatByAddress(address _networker)
        public
        view
        returns (
            uint32 seatIndex,
            address owner,
            uint32 introducerSeatIndex,
            uint32 beltId,
            uint256 issTime
        )
    {
        seatIndex = seatIndexes[_networker];
        (owner, introducerSeatIndex, beltId, issTime) = getSeatByIndex(seatIndex);
    }

    function getSeatMonthlyDataByIndex(uint32 _seatIndex, uint32 _month)
        public
        view
        returns (
            uint32 treeReferrals,
            uint256 volume,
            uint256 reward,
            bool claimed
        )
    {
        Monthly storage seatMonthlyData = seats[_seatIndex].monthlyData[_month];
        treeReferrals = seatMonthlyData.treeReferrals;
        volume = seatMonthlyData.volume;
        reward = seatMonthlyData.reward;
        claimed = seatMonthlyData.claimed;
    }

    function getSeatMonthlyDataByAddress(address _networker, uint32 _month)
        public
        view
        returns (
            uint32 treeReferrals,
            uint256 volume,
            uint256 reward,
            bool claimed
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
