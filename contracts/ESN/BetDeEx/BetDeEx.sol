// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import { EIP1167CloneFactory } from "../../lib/EIP1167CloneFactory.sol";
import { Governable } from "../Governance/Governable.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { Bet } from "./Bet.sol";
import { IKycDapp } from "../KycDapp/IKycDapp.sol";
import { IDayswappers } from "../Dayswappers/IDayswappers.sol";
import { RegistryDependent } from "../KycDapp/RegistryDependent.sol";

/// @title BetDeEx Smart Contract - The Decentralized Prediction Platform of Era Swap Ecosystem
/// @author The EraSwap Team
/// @notice This contract is used by manager to deploy new Bet contracts
/// @dev This contract also acts as treasurer


contract BetDeEx is EIP1167CloneFactory, Governable, RegistryDependent {
    using SafeMath for uint256;

    address public implementation; /// @dev stores the address of implementation contract
    address[] public clonedContracts; /// @dev returns the address of cloned contracts
    //address public owner; /// @dev Required to be public because ES needs to be sent transaparently.
    // address private _owner;

    mapping(address => bool) public isBetValid; /// @dev Stores authentic bet contracts (only deployed through this contract)
    
    mapping(address => bool) public Admin;

    event NewBetEvent(
        address indexed _deployer, //Show the bets of deployer
        address _contractAddress,
        uint8 indexed _category,
        uint8 indexed _subCategory,
        string _description
    );
    event ApproveBetEvent(
        address indexed _approver,
        address _contractAddress
    );

    event NewBetting(
        address indexed _betAddress,
        address indexed _bettorAddress,
        uint8 indexed _choice,
        uint256 _betTokensInExaEs
    );

    event EndBetContract(
        address indexed _ender,
        address indexed _contractAddress,
        uint8 _result,
        uint256 _prize,
        string _description,
        uint256 endTime
    );

   
    modifier onlyKycApproved {
        require(kycDapp().isKycLevel1(msg.sender), "BetDeEx: KYC_REQUIRED");
        _;
    }

    modifier onlyBetContract {
        require(isBetValid[msg.sender], "BetDeEx: ONLY_BET_CAN_CALL");
        _;
    }

    /// @notice Sets up BetDeEx smart contract when deployed

    constructor() {
        // _owner = msg.sender; // gets done in by governable
    }

    /*function setKYC(address user) public{
        KYC[user] = true;
    }*/
    
    modifier Govern() {
        require(msg.sender == owner(), "Govern: you are not Authorized");
        _;
    }

    function setAdmin(address user,bool status) public Govern {
        Admin[user] = status;
    }
    function isAdmin(address user) public view  returns(bool) {
        return Admin[user];
    }
    //Add onlyowner
    function storageFactory(address _implementation) public onlyGovernance {
        implementation = _implementation;
    }
    

    function createBet(
        string memory _description,
        uint8 _category,
        uint8 _subCategory,
        uint256 _minimumBetInExaEs,
        uint256 _prizePercentPerThousand,
        uint8 _incentive,
        bool _isDrawPossible,
        uint256 _pauseTimestamp,
        string memory _other
    ) public onlyKycApproved {
        // Add KYC check
        // Add upvote and downvote
        // Add a feature to sort by volume
        address clone = createClone(implementation);
        clonedContracts.push(clone);
        Bet(clone).initialize(
            msg.sender,
            _description,
            _category,
            _subCategory,
            _minimumBetInExaEs,
            _prizePercentPerThousand,
            _incentive,
            _isDrawPossible,
            _pauseTimestamp,
            address(kycDapp()),
            _other
        );
        isBetValid[address(clone)] = false;
        emit NewBetEvent(msg.sender, address(clone), _category, _subCategory, _description);
    }
    
    function approveBet(address _contract) public   {
        require(Admin[msg.sender], "Admin: you are not Authorized");
        isBetValid[_contract] = true;
        emit ApproveBetEvent(msg.sender, _contract);
    }

    /// @notice this function is used for getting total number of bets
    /// @return number of Bet contracts deployed by BetDeEx
    function getNumberOfBets() public view returns (uint256) {
        return clonedContracts.length;
    }

    /// @notice this is an internal functionality that is only for bet contracts to emit a event when a new bet is placed so that front end can get the information by subscribing to  contract
    function emitNewBettingEvent(
        address _bettorAddress,
        uint8 _choice,
        uint256 _betTokensInExaEs
    ) public onlyBetContract {
        emit NewBetting(msg.sender, _bettorAddress, _choice, _betTokensInExaEs);
    }

    /// @notice this is an internal functionality that is only for bet contracts to emit event when a bet is ended so that front end can get the information by subscribing to  contract
    function emitEndBetEvent(
        address _endby,
        uint8 _result,
        uint256 _prize,
        string memory _description
    ) public onlyBetContract {
        emit EndBetContract( _endby,msg.sender, _result, _prize,_description,block.timestamp);
    }

    function payRewards(
        address _buyer,
        address _seller,
        uint256 _value,
        uint256 _distribute
    ) public payable onlyBetContract{
        uint256 _reward = _value.mul(_distribute).div(100);
        require(
            msg.value == _reward,
            "Insufficient_Fund"
        );

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

