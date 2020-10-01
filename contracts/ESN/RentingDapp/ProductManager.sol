// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { RentalAgreement } from "./RentalAgreement.sol";

contract ProductManager
{
    using SafeMath for uint256;
     
    address[] public rents;
    address public manager;
     
    mapping(address => bool) public isAuthorised;
    mapping(address => bool) public isRentValid;

    uint256[] public discounts;
    uint256[] public possibleRents;
    uint48[] public startingTime;
    uint48[] public endingTime;
    uint48[2][] public bookedDates;
    
    string public lessorName;
    string public location;
    address public lessorAddress;
    uint256 public itemId;
    uint256 public maxRent;
    uint256 public security;
    uint256 public cancellationFee;
    uint256 public bookings = 0;
    
    string public description;
    bool public isRented; 
     
    event NewRentalContract(
        address indexed _lessor,
        address indexed _lessee,
        address _contractAddress, 
        uint256 _start,
        uint256 _end,
        uint256 _rent, 
        uint256 _security, 
        uint256 _cancellationFee,
        uint256 _incentive,
        string _item
    );
    
    event NewRenting(
        address indexed _rentAddress,
        address indexed _lessorAddress,
        address indexed _lesseeAddress,
        string _item
    );
    
    event EndRentalContract(
        address indexed _lessor,
        address indexed _contractAddress
    );
     
    modifier onlyManager()
    {
        require(msg.sender == manager, "Only manager can call this");
        _;
    }
     
    modifier onlyAuthorised()
    {
        require(msg.sender == lessorAddress, "Only authorised (Lessor) can call");
        _;
    }
     
    modifier onlyRentalContract()
    {
        require(isRentValid[msg.sender], "Only rental contract can call");
        _;
    }
     

    constructor(string memory _name, string memory _location, address _address, uint256 _id, uint256 _maxRent, uint256 _security, uint256 _cancellationFee, string memory _description, bool _status)
    {
        manager = msg.sender;
        //isAuthorised[msg.sender] = true;
        
        lessorName = _name;
        location = _location;
        lessorAddress = _address;
        itemId = _id;
        maxRent = _maxRent;
        security = _security;
        cancellationFee = _cancellationFee;
        description = _description;
        isRented = _status; //can be updated by itself here
        
        isAuthorised[lessorAddress] = true;
    }
     

    function addDiscount(uint256 _discount) public onlyAuthorised
    {
        discounts.push(_discount);        
    }
    
    function removeDiscount(uint256 _discount) public onlyAuthorised
    {
        for(uint256 i=0; i<discounts.length; i++)
        {
            if(discounts[i] == _discount)
            discounts[i] = 0;
        }
    }
    
     
    function createAgreement(uint256 _incentive, uint48 start, uint48 end) public /*onlyAuthorised*/ returns (address)
    {
        //require(msg.sender != manager, "Only Lessor can create a rental agreement for his listing");
        
        //require(isRented == false, "Item currently under rent...not available");
        
        bool check = checkAvailability(start, end);
        
        require(check == true, "Not available on given range of timings");
        
        startingTime.push(start);
        endingTime.push(end);
        
        bookedDates.push();
        
        bookedDates[bookings][0] = start;
        bookedDates[bookings][1] = end;
        
        bookings++;
        
      
        
        for(uint256 i=0; i < discounts.length; i++)
        {
            uint256 val = maxRent.mul(discounts[i]).div(100);
            possibleRents.push(maxRent.sub(val));
        }
        
        if(discounts.length == 0)
            possibleRents.push(maxRent);
        
        RentalAgreement _newRentalAgreement = new RentalAgreement(lessorAddress, msg.sender, maxRent, security, cancellationFee, _incentive, description, isRented, possibleRents);

        rents.push(address(_newRentalAgreement));
        isRentValid[address(_newRentalAgreement)] = true;
        
        isRented = true;
     
        emit NewRentalContract(lessorAddress, msg.sender, address(_newRentalAgreement), start, end, maxRent, security, cancellationFee, _incentive, description);
        
    }
     
    function getNumberOfRents() public view returns (uint256) {
        return rents.length;
    }
    
    
    function emitNewRentingEvent(address _lessorAddress, address _lesseeAddress, string memory _item) public onlyRentalContract {
        emit NewRenting(msg.sender, _lessorAddress, _lesseeAddress, _item);
    }
    
    function getDiscounts() public view returns(uint256[] memory)
    {
        return discounts;
    }
    
    function emitEndEvent(address _lessor) public onlyRentalContract {
        emit EndRentalContract(_lessor, msg.sender);
    }
    
    function endAgreement() public onlyRentalContract
    {
        isRented = false;
    }
    
    
    function checkAvailability(uint256 _from, uint256 _to) view private returns(bool)
    {
        for(uint256 i=0; i<bookings; i++)
        {
            if(_from >= startingTime[i] && _from <= endingTime[i])
            return false;
            
            if(_to >= startingTime[i] && _to <= endingTime[i])
            return false;
            
            if(_from <= startingTime[i] && _to >= endingTime[i])
            return false;
        }
        
        return true;
    }
    
    function getBookedDates() view public returns(uint48[2][] memory)
    {
        return bookedDates;
    }
}