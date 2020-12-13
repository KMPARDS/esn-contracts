// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

pragma experimental ABIEncoderV2;
/**
 * @title Storage
 * @dev Store & retreive value in a variable
 */

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { RegistryDependent } from "../KycDapp/RegistryDependent.sol";
import { Governable } from "../Governance/Governable.sol";

contract CharityDapp is Governable, RegistryDependent {
    address Owner;
    uint256 charityPoolDonations;
    uint256 campaignDonations;

    constructor() {
        Owner = msg.sender;
        charityPoolDonations = 0;
        campaignDonations = 0;
    }

    receive() external payable {}

    struct Campaign {
        //about the proposal input by the user
        string PraposalHash; //description of the proposal
        string proposalTitle;
        address Campaigner; // Address if Campaigner
        bool fullExtraction; //whether want to have whole fund out or just as much as raised
        bool proposalApproved; //approved by faithminus
        // bool openForFunding;
        uint256 fundRaisingDeadline; //time till the fund will be open for donating
        uint256 fundingGoal; //total amount for raisingthe fund
        uint256 raisedFunds; //funds which have been raised for the proposal
        uint256 claimedFunds; //funds which are claimed by the user
        uint256 support;
    }

    mapping(bytes32 => Campaign) public campaigns;
    mapping(bytes32 => mapping(address => bool)) public supportUser;
    mapping(address => bool) public Admin;

    event ProposalAdded(bytes32 proposalAddress, address indexed _campaigner);
    event ProposalAproved(bytes32 proposalAddress, uint256 amount, string description);
    event Donated(bytes32 indexed proposalAddress, address indexed donorAddress, uint256 amount);
    event ProposalClaimed(bytes32 proposalAddress, uint256 amount, string description);
    event Comments(bytes32 indexed proposalAddress, address Sender, string message, uint256 time);

    modifier onlyKycApproved() {
        require(kycDapp().isKycLevel1(msg.sender), "CharityDapp: KYC_NOT_APPROVED");
        //require(kycDapp().isKycApproved(msg.sender, 2, 'SURVEY_DAPP', 'AUTHOR'), "RentingDapp: Author KYC_NOT_APPROVED for level 3");
        _;
    }

    modifier Govern() {
        require(msg.sender == Owner, "Govern: you are not Authorized");
        _;
    }

    modifier onlyAdmin() {
        require(Admin[msg.sender], "Admin : you are not Authorized");
        _;
    }

    function setAdmin(address user) public Govern {
        Admin[user] = true;
    }

    function removeAdmin(address user) public Govern {
        Admin[user] = false;
    }

    function addComments(bytes32 _proposalAddress, string memory message) public {
        emit Comments(_proposalAddress, msg.sender, message, block.timestamp);
    }

    function getCharityPool() public view returns (uint256) {
        return (address(this).balance - campaignDonations);
    }

    function newCampaign(
        string memory ipfsHash,
        string memory _title,
        uint256 _fundingGoal,
        bool _fullExtraction,
        uint256 _fundRaisingDeadline
    ) public onlyKycApproved {
        bytes memory source = abi.encodePacked(msg.sender);
        bytes32 hashedinput = keccak256(abi.encodePacked(bytes(ipfsHash), source));
        campaigns[hashedinput].PraposalHash = ipfsHash;
        campaigns[hashedinput].proposalTitle = _title;
        campaigns[hashedinput].fullExtraction = _fullExtraction;
        campaigns[hashedinput].fundRaisingDeadline = _fundRaisingDeadline;
        campaigns[hashedinput].Campaigner = msg.sender;
        emit ProposalAdded(hashedinput, msg.sender);
        campaigns[hashedinput].fundingGoal = _fundingGoal;
        campaigns[hashedinput].raisedFunds = 0;
        campaigns[hashedinput].claimedFunds = 0;
        campaigns[hashedinput].support = 0;
        // campaigns[hashedinput].openForFunding = true;
        campaigns[hashedinput].proposalApproved = false;
    }

    function Support(bytes32 _proposalAddress) public {
        require(
            supportUser[_proposalAddress][msg.sender] == false,
            "You have already support this campaign"
        );
        supportUser[_proposalAddress][msg.sender] = true;
        campaigns[_proposalAddress].support += 1;
    }

    function approveProposal(bytes32 _proposalAddress) public onlyAdmin {
        campaigns[_proposalAddress].proposalApproved = true;
        emit ProposalAproved(
            _proposalAddress,
            campaigns[_proposalAddress].fundingGoal,
            campaigns[_proposalAddress].PraposalHash
        );
    }

    function donate(bytes32 _proposalAddress) public payable {
        Campaign storage cs = campaigns[_proposalAddress];
        require(msg.value > 0, "Insufficient Fund");
        require(cs.proposalApproved, "The proposal funding is not Approved yet");
        require(
            campaigns[_proposalAddress].raisedFunds < campaigns[_proposalAddress].fundingGoal,
            "The Campaign achived its goal"
        );
        require(
            block.timestamp < campaigns[_proposalAddress].fundRaisingDeadline,
            "The Campaign has been ended"
        );
        cs.raisedFunds += (msg.value); //amount would be added to the proposal funds
        campaignDonations += (msg.value);
        dayswappers().reportVolume(msg.sender, msg.value);
        emit Donated(_proposalAddress, msg.sender, msg.value);
    }

    function addToCharityPool() external payable {
        require(msg.value > 0, "Insufficient funds");
        charityPoolDonations += (msg.value);
        dayswappers().reportVolume(msg.sender, msg.value);
    }

    function donateToCharityPool() public payable {
        require(msg.value > 0, "Insufficient funds");
        charityPoolDonations += (msg.value);
        dayswappers().reportVolume(msg.sender, msg.value);
    }

    function CharityPool(bytes32 _proposalAddress, uint256 poolDonation) public onlyAdmin {
        Campaign storage cam = campaigns[_proposalAddress];
        uint256 charityPool = getCharityPool();
        require(
            cam.fullExtraction == true,
            "This will only applicable for those proposal who wish to raise full funding goal"
        );
        require(
            charityPool > (cam.fundingGoal - cam.raisedFunds),
            "The pool should have enough tokens for the proposal"
        );
        require(
            poolDonation <= (cam.fundingGoal - cam.raisedFunds),
            "The praposal doesn't need so much amount"
        );
        require(cam.proposalApproved, "The proposal is yet to get the approvals");
        require(
            block.timestamp > campaigns[_proposalAddress].fundRaisingDeadline,
            "The proposal funding period should be closed"
        );

        // charityPoolDonations -= poolDonation;
        campaigns[_proposalAddress].raisedFunds += poolDonation;
        emit Donated(_proposalAddress, msg.sender, (cam.fundingGoal - cam.raisedFunds));
    }

    function claimFunds(bytes32 _proposalAddress) public payable {
        Campaign storage cam = campaigns[_proposalAddress];
        require(
            msg.sender == cam.Campaigner,
            "Only the Campaigner is authorised to claimed the funds"
        );
        require(cam.proposalApproved, "The proposal should be approved");
        require(cam.claimedFunds < cam.fundingGoal, "The funds have been already claimed");
        uint256 value = cam.raisedFunds - cam.claimedFunds;
        msg.sender.transfer(value);
        campaigns[_proposalAddress].claimedFunds += value;
        emit ProposalClaimed(_proposalAddress, cam.claimedFunds, cam.PraposalHash);
    }
}
