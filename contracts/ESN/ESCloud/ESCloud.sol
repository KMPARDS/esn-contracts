// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.4;
pragma experimental ABIEncoderV2;

import { RegistryDependent } from "../KycDapp/RegistryDependent.sol";
import { EIP1167CloneFactory } from "../../lib/EIP1167CloneFactory.sol";
import { Host } from "./Host.sol";
import { IESCloud } from "./IESCloud.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";

contract ESCloud is EIP1167CloneFactory, RegistryDependent, IESCloud {
    using SafeMath for uint256;

    address public implementation; /// @dev stores the address of implementation contract
    address[] public clonedContracts; /// @dev returns the address of cloned contracts

    // mapping(address => bool) public isValid; /// @dev Stores authentic bet contracts (only deployed through this contract)

    mapping(address => bool) public Admin;
    mapping(address => address) public host;
    mapping(address => bool) public isHost;

    event RaisedDispute(address indexed Host, bytes32 indexed file);
    event ApplyHost(address indexed Host, bytes32 Details);
    event NewHost(address indexed Clone, address Host, bytes32 _details);

    modifier Govern() {
        require(msg.sender == owner(), "Govern: you are not Authorized");
        _;
    }
    modifier onlyKycApproved {
        require(kycDapp().isKycLevel1(msg.sender), "ESCloud: KYC_REQUIRED");
        _;
    }
    modifier onlyAdmin() {
        require(Admin[msg.sender], "Admin: you are not Authorized");
        _;
    }
    modifier onlyHost() {
        require(isHost[msg.sender], "Host: you are not Authorized");
        _;
    }

    function setAdmin(address user, bool status) public Govern {
        Admin[user] = status;
    }

    function isAdmin(address user) public view override returns (bool) {
        return Admin[user];
    }

    //Add onlyowner
    function storageFactory(address _implementation) public Govern {
        implementation = _implementation;
    }

    function newHost(address _Host, bytes32 _Details) public onlyKycApproved {
        emit ApplyHost(_Host, _Details);
    }

    function approveHost(address _Host, bytes32 Details) public onlyAdmin {
        require(host[_Host] == address(0), "Already Exist");
        address clone = createClone(implementation);
        clonedContracts.push(clone);
        host[_Host] = clone;
        Host(clone).init(_Host, Details, address(this));
        isHost[address(clone)] = true;
        emit NewHost(clone, _Host, Details);
    }

    function Dispute(address Host_address, bytes32 file) external override onlyHost {
        emit RaisedDispute(Host_address, file);
    }

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
