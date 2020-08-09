// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

contract Dayswappers {
    struct Seat {
        address owner;
        uint256 introducerSeatIndex;
        uint256 beltId;
        uint256 issTime;
        mapping(uint256 => uint256) volume;
        mapping(uint256 => uint256) reward;
        mapping(uint256 => bool) claimed;
    }

    /// @dev Stores dayswappers seats
    Seat[] seats;

    /// @dev Stores seat indexes for addresses
    mapping(address => uint256) seatIndexes;

    /// @notice Emits when a networker joins or transfers their seat
    event SeatTransfer(address from, address to, uint256 seatIndex);

    /// @notice Emits when a networker marks another networker as their introducer
    event Introduce(uint256 introducerSeatIndex, uint256 networkerSeatIndex);

    constructor() public {
        /// @dev Seat with index 0 is a null seat
        seats.push();
    }

    function join() public {
        _join(msg.sender);
    }

    function setIntroducer(address _introducer) public {
        uint256 _introducerSeatIndex = seatIndexes[_introducer];

        if (_introducerSeatIndex == 0) {
            _introducerSeatIndex = _join(_introducer);
        }

        uint256 _selfSeatIndex = seatIndexes[msg.sender];

        if (_selfSeatIndex == 0) {
            _selfSeatIndex = _join(msg.sender);
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

    function _join(address _networker) public returns (uint256) {
        uint256 _newSeatIndex = seats.length;
        require(seatIndexes[_networker] == 0, "Dayswappers: Seat already alloted");

        seats.push();

        seats[_newSeatIndex].owner = _networker;
        seatIndexes[_networker] = _newSeatIndex;

        emit SeatTransfer(address(0), _networker, _newSeatIndex);

        return _newSeatIndex;
    }

    function getSeatByIndex(uint256 _seatIndex)
        public
        view
        returns (
            address owner,
            uint256 introducerSeatIndex,
            uint256 beltId,
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
            address owner,
            uint256 introducerSeatIndex,
            uint256 beltId,
            uint256 issTime
        )
    {
        uint256 _seatIndex = seatIndexes[_networker];
        return getSeatByIndex(_seatIndex);
    }

    function checkCircularReference(uint256 _networkerSeatIndex, uint256 _introducerSeatIndex)
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
