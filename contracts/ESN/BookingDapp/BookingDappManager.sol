// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { EventManager } from "./EventManager.sol";

import { RegistryDependent } from "../KycDapp/RegistryDependent.sol";
import { IDayswappers } from "../Dayswappers/IDayswappers.sol";

contract BookingDappManager is RegistryDependent {
    using SafeMath for uint256;

    address public bookingDappOwner;
    mapping(address => bool) public events;
    uint256 public totalEvents = 0;

    // address[] public allEvents;

    event NewEvent(uint256, address indexed, address, string, string, uint256);
    event BoughtTickets(
        address indexed _event,
        address indexed buyer,
        uint256[] seats,
        string name,
        string location,
        uint256 startTime
    );
    event CancelTickets(
        address indexed _event,
        address indexed buyer,
        uint256[] seats,
        string name,
        string location,
        uint256 startTime
    );

    modifier onlyKycApproved() {
        require(kycDapp().isKycLevel1(msg.sender), "BookingDapp: KYC_NOT_APPROVED");
        _;
    }

    constructor() {
        bookingDappOwner = msg.sender;
    }

    function createEvent(
        string memory _name,
        string memory _desc,
        string memory _location,
        uint256 _startTime,
        uint256 _seatTypes,
        uint256[] memory _seatsPerType,
        uint256[] memory _pricePerType
    ) public onlyKycApproved {
        uint256 totalSeats = 0;
        for (uint256 i = 0; i < _seatTypes; i++) totalSeats += _seatsPerType[i];

        totalEvents++;

        EventManager _newEvent = new EventManager(
            msg.sender,
            _name,
            _desc,
            _location,
            _startTime,
            _seatTypes,
            _seatsPerType,
            _pricePerType,
            totalSeats,
            bookingDappOwner
        );

        events[address(_newEvent)] = true;
        // allEvents.push(address(_newEvent));

        emit NewEvent(totalEvents, msg.sender, address(_newEvent), _name, _location, _startTime);
    }

    function emitTickets(
        address buyer,
        uint256[] memory seats,
        string memory name,
        string memory location,
        uint256 startTime
    ) external {
        require(events[msg.sender], "Event does not exist");
        emit BoughtTickets(msg.sender, buyer, seats, name, location, startTime);
    }

    function emitCancel(
        address buyer,
        uint256[] memory seats,
        string memory name,
        string memory location,
        uint256 startTime
    ) external {
        require(events[msg.sender], "Event does not exist");
        emit CancelTickets(msg.sender, buyer, seats, name, location, startTime);
    }

    // Call this function through child contracts for sending rewards
    function payRewards(
        address _networker,
        uint256 _treeAmount,
        uint256 _introducerAmount
    ) public payable {
        require(
            msg.value == _treeAmount + _introducerAmount,
            "BookingDapp: Insufficient value sent"
        );

        // For this to work, setKycDapp needs to be called after contract is deployed
        IDayswappers _dayswappersContract = dayswappers();

        _dayswappersContract.payToTree{ value: _treeAmount }(
            _networker,
            [uint256(50), uint256(0), uint256(50)]
        );
        _dayswappersContract.payToIntroducer{ value: _introducerAmount }(
            _networker,
            [uint256(50), uint256(0), uint256(50)]
        );
    }
}
