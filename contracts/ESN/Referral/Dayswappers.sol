// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

contract Dayswappers {
    struct Seat {
        address owner;
        uint48 introducerSeatIndex;
        uint48 beltId;
        uint256 issTime;
        mapping(uint256 => uint256) volume;
        mapping(uint256 => uint256) reward;
        mapping(uint256 => bool) claimed;
    }

    /// @dev Stores dayswappers seats
    Seat[] seats;

    /// @dev Stores seat indexes for addresses
    mapping(address => uint48) seatIndexes;

    /// @notice Emits when a networker joins or transfers their seat
    event SeatTransfer(address from, address to, uint48 seatIndex);

    /// @notice Emits when a networker marks another networker as their introducer
    event Introduce(uint48 introducerSeatIndex, uint48 networkerSeatIndex);

    constructor() {
        /// @dev Seat with index 0 is a null seat
        seats.push();
    }

    function createSeat() public {
        _createSeat(msg.sender);
    }

    function setIntroducer(address _introducer) public {
        uint48 _introducerSeatIndex = seatIndexes[_introducer];

        if (_introducerSeatIndex == 0) {
            _introducerSeatIndex = _createSeat(_introducer);
        }

        uint48 _selfSeatIndex = seatIndexes[msg.sender];

        if (_selfSeatIndex == 0) {
            _selfSeatIndex = _createSeat(msg.sender);
        }

        Seat storage seat = seats[_selfSeatIndex];

        require(seat.introducerSeatIndex == 0, "Dayswapper: Introducer already set");
        require(
            !checkCircularReference(_selfSeatIndex, _introducerSeatIndex),
            "Dayswapper: Circular reference not allowed"
        );
        seat.introducerSeatIndex = _introducerSeatIndex;

        emit Introduce(_introducerSeatIndex, _selfSeatIndex);
    }

    function _createSeat(address _networker) private returns (uint48) {
        uint48 _newSeatIndex = uint48(seats.length);
        require(seatIndexes[_networker] == 0, "Dayswappers: Seat already alloted");

        seats.push();

        seats[_newSeatIndex].owner = _networker;
        seatIndexes[_networker] = _newSeatIndex;

        emit SeatTransfer(address(0), _networker, _newSeatIndex);

        return _newSeatIndex;
    }

    function getSeatByIndex(uint48 _seatIndex)
        public
        view
        returns (
            address owner,
            uint48 introducerSeatIndex,
            uint48 beltId,
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
            uint48 seatIndex,
            address owner,
            uint48 introducerSeatIndex,
            uint48 beltId,
            uint256 issTime
        )
    {
        seatIndex = seatIndexes[_networker];
        (owner, introducerSeatIndex, beltId, issTime) = getSeatByIndex(seatIndex);
    }

    function checkCircularReference(uint48 _networkerSeatIndex, uint48 _introducerSeatIndex)
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
