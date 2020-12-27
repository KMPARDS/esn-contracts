// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { EventManager } from "./EventManager.sol";

import { RegistryDependent } from "../KycDapp/RegistryDependent.sol";
import { IDayswappers } from "../Dayswappers/IDayswappers.sol";
import { IBookingDappManager } from "./IBookingDappManager.sol";

contract BookingDappManager is RegistryDependent, IBookingDappManager {
    using SafeMath for uint256;

    address public bookingDappOwner;
    mapping(address => bool) public events;
    uint256 public totalEvents = 0;

    // address[] public allEvents;

    event NewEvent(uint256, address indexed, address, string, string, uint256);

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
        uint256[] memory _pricePerType,
        uint256 _incentive
    ) public onlyKycApproved {
        uint256 totalSeats = 0;
        for (uint256 i = 0; i < _seatTypes; i++) totalSeats += _seatsPerType[i];

        totalEvents++;

        EventManager _newEvent =
            new EventManager(
                msg.sender,
                _name,
                _desc,
                _location,
                _startTime,
                _seatTypes,
                _seatsPerType,
                _pricePerType,
                totalSeats,
                bookingDappOwner,
                _incentive
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
    ) external override {
        require(events[msg.sender], "Event does not exist");
        emit BoughtTickets(msg.sender, buyer, seats, name, location, startTime);
    }

    function emitCancel(
        address buyer,
        uint256[] memory seats,
        string memory name,
        string memory location,
        uint256 startTime
    ) external override {
        require(events[msg.sender], "Event does not exist");
        emit CancelTickets(msg.sender, buyer, seats, name, location, startTime);
    }

    // Call this function through child contracts for sending rewards
    function payRewards(
        address _buyer,
        address _seller,
        uint256 _value,
        uint256 _distribute
    ) public payable override {
        uint256 _reward = _value.mul(_distribute).div(100);
        require(msg.value == _reward, "Insufficient_Fund");

        //Seller Introducer
        dayswappers().payToIntroducer{ value: _reward.mul(20).div(100) }(
            _seller,
            [uint256(50), uint256(0), uint256(50)]
        );

        //Seller Tree
        dayswappers().payToTree{ value: _reward.mul(20).div(100) }(
            _seller,
            [uint256(50), uint256(0), uint256(50)]
        );
        // Buyer Introducer
        dayswappers().payToIntroducer{ value: _reward.mul(20).div(100) }(
            _buyer,
            [uint256(50), uint256(0), uint256(50)]
        );

        // Buyer Tree
        dayswappers().payToTree{ value: _reward.mul(20).div(100) }(
            _buyer,
            [uint256(50), uint256(0), uint256(50)]
        );

        // BurnPool
        nrtManager().addToBurnPool{ value: _reward.mul(10).div(100) }();

        // Charity Pool
        address charity = kycDapp().resolveAddress("CHARITY_DAPP");
        (bool _successCharity, ) = address(charity).call{ value: _reward.mul(10).div(100) }("");
        require(_successCharity, "RentingDapp: CHARITY_TRANSFER_IS_FAILING");

        dayswappers().reportVolume(_buyer, _value);
    }
}
