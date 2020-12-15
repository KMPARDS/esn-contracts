// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { RegistryDependent } from "../KycDapp/RegistryDependent.sol";
import { Governable } from "../Governance/Governable.sol";

/**
 * @title Storage
 * @dev Store & retreive value in a variable
 */
contract DistributeIncentive is Governable, RegistryDependent {
    using SafeMath for uint256;

    mapping(address => bool) public Admin;
    address Owner;

    constructor() {
        Owner = msg.sender;
    }

    receive() external payable {}

    event SendIncentive(address Seller, address Buyer, uint256 Value);

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

    function getFund() public view returns (uint256) {
        return address(this).balance;
    }

    function addFund() public payable {
        require(msg.value > 0, "Insufficient funds");
    }

    function sendIncentive(
        address _seller,
        address _buyer,
        uint256 _value,
        uint256 _incentivefortxn
    ) public payable {
        require(_incentivefortxn <= 99, "Incentive can't be more that 99 %");
        //Rewards
        uint256 _reward = _value.mul(_incentivefortxn + 1).div(100);
        //buyer
        dayswappers().payToIntroducer{ value: _reward.mul(20).div(100) }(
            _buyer,
            [uint256(50), uint256(0), uint256(50)]
        );
        dayswappers().payToTree{ value: _reward.mul(20).div(100) }(
            _buyer,
            [uint256(50), uint256(0), uint256(50)]
        );

        //Seller
        dayswappers().payToIntroducer{ value: _reward.mul(20).div(100) }(
            _seller,
            [uint256(50), uint256(0), uint256(50)]
        );
        dayswappers().payToTree{ value: _reward.mul(20).div(100) }(
            _seller,
            [uint256(50), uint256(0), uint256(50)]
        );

        // 10 % to burn pool
        nrtManager().addToBurnPool{ value: _reward.mul(10).div(100) }();
        // 10 % to Charity Pool
        address charity = kycDapp().resolveAddress("CHARITY_DAPP");
        (bool _successCharity, ) = charity.call{ value: _reward.mul(10).div(100) }("");
        require(_successCharity, "Incentive: CHARITY_TRANSFER_IS_FAILING");

        (bool _success, ) = owner().call{ value: msg.value.sub(_reward) }("");
        require(_success, "Incentive: PROFIT_TRANSFER_FAILING");

        dayswappers().reportVolume(_buyer, _value);

        emit SendIncentive(_seller, _buyer, _value);
    }
}
