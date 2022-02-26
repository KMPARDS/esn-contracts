// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.4;
pragma experimental ABIEncoderV2;

import { RegistryDependent } from "../KycDapp/RegistryDependent.sol";
import { EIP1167CloneFactory } from "../../lib/EIP1167CloneFactory.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { Chat } from "./Chat.sol";

contract CureDapp is EIP1167CloneFactory, RegistryDependent {
    using SafeMath for uint256;
    address public implementation; /// @dev stores the address of implementation contract

    struct Expert {
        bytes32 specilization;
        string Details;
        string name;
        uint256 fees;
        uint256 Incentive; // per Thousand
    }

    struct Appointment {
        address expert;
        address patient;
        uint256 fees;
        address chat;
        Status status;
    }

    enum Status { Pending, Progressed, Cured, Refunded }
    mapping(address => Expert) public experts;
    mapping(address => Appointment) public appointments;

    event NewExpert(
        address indexed expert,
        string name,
        bytes32 indexed specilization,
        uint256 fees
    );
    event AppointmentBooked(address indexed expert, address indexed patient, address indexed chat);

    modifier onlyKycApproved(bytes32 Specilization) {
        require(
            kycDapp().isKycApproved(
                msg.sender,
                2,
                0x435552455f444150500000000000000000000000000000000000000000000000,
                Specilization
            ) == true,
            "EXPERT: KYC_REQUIRED"
        );
        _;
    }
    modifier onlyExpert(address _chat) {
        require(appointments[_chat].expert == msg.sender, "Only_EXPERT");
        _;
    }
    modifier onlyPatient(address _chat) {
        require(appointments[_chat].patient == msg.sender, "Only_Patient");
        _;
    }

    function storageFactory(address _implementation) public {
        require(msg.sender == owner(), "Govern: you are not Authorized");
        implementation = _implementation;
    }

    function newExpert(
        string memory _Details,
        string memory name,
        bytes32 _specilization,
        uint256 _fees,
        uint256 _incentive
    ) public onlyKycApproved(_specilization) {
        require(experts[msg.sender].specilization == "", "Already Exist");
        experts[msg.sender] = Expert(_specilization, _Details, name, _fees, _incentive);
        emit NewExpert(msg.sender, name, _specilization, _fees);
    }

    function updateExpert(
        string memory _Details,
        string memory _name,
        bytes32 _specilization,
        uint256 _fees,
        uint256 _incentive
    ) public onlyKycApproved(_specilization) {
        experts[msg.sender] = Expert(_specilization, _Details, _name, _fees, _incentive);
        // emit NewExpert(msg.sender,_specilization,_fees);
    }

    function BookAppointment(address _expert) public payable {
        require(msg.value == experts[_expert].fees, "Consultancy Fees Insufficient");
        address chatAddress = createClone(implementation);
        Chat(chatAddress).init(_expert, msg.sender, block.number);
        appointments[chatAddress] = Appointment(
            _expert,
            msg.sender,
            msg.value,
            chatAddress,
            Status.Pending
        );
        emit AppointmentBooked(_expert, msg.sender, chatAddress);
    }

    function ProceedAppointment(address _chat) public {
        require(appointments[_chat].expert == msg.sender, "Only_EXPERT");
        appointments[_chat].status = Status.Progressed;

        // Fees Distribution
        uint256 _reward =
            appointments[_chat].fees.mul(10 + experts[msg.sender].Incentive).div(1000);
        payable(msg.sender).transfer(appointments[_chat].fees.sub(_reward));

        //Seller Introducer
        dayswappers().payToIntroducer{ value: _reward.mul(20).div(100) }(
            appointments[_chat].patient,
            [uint256(50), uint256(0), uint256(50)]
        );

        //Seller Tree
        dayswappers().payToTree{ value: _reward.mul(20).div(100) }(
            appointments[_chat].patient,
            [uint256(50), uint256(0), uint256(50)]
        );
        // Buyer Introducer
        dayswappers().payToIntroducer{ value: _reward.mul(20).div(100) }(
            appointments[_chat].expert,
            [uint256(50), uint256(0), uint256(50)]
        );

        // Buyer Tree
        dayswappers().payToTree{ value: _reward.mul(20).div(100) }(
            appointments[_chat].expert,
            [uint256(50), uint256(0), uint256(50)]
        );

        // BurnPool
        nrtManager().addToBurnPool{ value: _reward.mul(10).div(100) }();

        // Charity Pool
        address charity = kycDapp().resolveAddress("CHARITY_DAPP");
        (bool _successCharity, ) = address(charity).call{ value: _reward.mul(10).div(100) }("");
        require(_successCharity, "CureDapp: CHARITY_TRANSFER_IS_FAILING");

        dayswappers().reportVolume(appointments[_chat].patient, appointments[_chat].fees);
    }

    function CureAppointment(address _chat) public {
        require(appointments[_chat].expert == msg.sender, "Only_EXPERT");
        appointments[_chat].status = Status.Cured;
    }

    function Refund(address _chat) public {
        if (appointments[_chat].expert != msg.sender) {
            require(appointments[_chat].patient == msg.sender, "Only_Patient");
            require(appointments[_chat].status == Status.Pending, "No_Refund After Proceed");
        }

        appointments[_chat].status = Status.Refunded;
        payable(msg.sender).transfer(appointments[_chat].fees);
    }
}
