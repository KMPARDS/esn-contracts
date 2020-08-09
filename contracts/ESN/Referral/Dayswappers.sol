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

    constructor() {
        /// @dev Seat with index 0 is a null seat
        seats.push();
    }

    function join() public {
        _join(msg.sender);
    }

    function setIntroducer(address _introducer) public {
        uint256 _introducerSeatIndex = seatIndexes[_introducer];

        if(_introducerSeatIndex == 0) {
            _introducerSeatIndex = _join(_introducer);
        }

        uint256 _selfSeatIndex = seatIndexes[msg.sender];

        if(_selfSeatIndex == 0) {
            _selfSeatIndex = _join(msg.sender);
        }

        Seat storage seat =  seats[_selfSeatIndex];

        require(seat.introducerSeatIndex == 0, "Dayswapper: Introducer already set");
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
}
