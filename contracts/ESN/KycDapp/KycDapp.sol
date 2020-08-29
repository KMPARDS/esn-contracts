// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { IKycDapp } from "./IKycDapp.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { NRTManager } from "../NRT/NRTManager.sol";
import { Dayswappers } from "../Dayswappers/DayswappersCore.sol";
import { TimeAllyClub } from "../TimeAlly/TimeAllyClub.sol";
import { TimeAllyPromotionalBucket } from "../TimeAlly/TimeAllyPromotionalBucket.sol";

contract KycDapp is IKycDapp, Ownable {
    using SafeMath for uint256;

    struct Identity {
        address owner;
        bytes32 kycApprovedDetailsIPFS; // this can be only updated by owner address (faithminus approval)
        bytes32 profileDetailsIPFS; // this can be updated by user anytime without need for approval
        KYC_STATUS level1;
        mapping(uint8 => mapping(address => mapping(bytes32 => KYC_STATUS))) nextLevels;
    }

    NRTManager public nrtManager;
    Dayswappers public dayswappers;
    TimeAllyClub public timeallyClub;
    TimeAllyPromotionalBucket public timeallyPromotionalBucket;
    address public charityPool;

    /// @dev Fixed usernames
    mapping(bytes32 => Identity) public identities;
    mapping(address => bytes32) public usernames;
    mapping(uint8 => mapping(address => mapping(bytes32 => uint256))) baseKycFees;
    // mapping(address => uint256) public balanceOf;

    event IdentityTransfer(address indexed from, address indexed to, bytes32 indexed username);

    event KycDetailsUpdated(bytes32 indexed username, bytes32 newKycDetailsIPfS);

    event ProfileDetailsUpdated(bytes32 indexed username, bytes32 newProfileDetailsIPfS);

    event KycApplied(
        bytes32 indexed username,
        uint8 indexed level,
        address platform,
        bytes32 specialization
    );

    event KycStatusUpdated(
        bytes32 indexed username,
        uint8 indexed level,
        address platform,
        bytes32 specialization,
        KYC_STATUS newKycStatus
    );

    event KycFeeUpdated(
        uint8 indexed level,
        address indexed platform,
        bytes32 indexed specialization,
        uint256 amount
    );

    modifier identityUsernameExists(bytes32 _username) {
        require(identities[_username].owner != address(0), "Kyc: Identity not registered");
        _;
    }

    modifier identityWalletExists(address _wallet) {
        bytes32 _username = usernames[msg.sender];
        require(usernames[msg.sender] != bytes32(0), "Kyc: Identity not registered");
        _;
    }

    function setInitialValues(
        NRTManager _nrtManager,
        Dayswappers _dayswappers,
        TimeAllyClub _timeallyClub,
        TimeAllyPromotionalBucket _timeallyPromotionalBucket,
        address _charityPool
    ) public onlyOwner {
        nrtManager = _nrtManager;
        dayswappers = _dayswappers;
        timeallyClub = _timeallyClub;
        timeallyPromotionalBucket = _timeallyPromotionalBucket;
        charityPool = _charityPool;
    }

    function updateKycFee(
        uint8 _level,
        address _platform,
        bytes32 _specialization,
        uint256 _amount
    ) public onlyOwner {
        baseKycFees[_level][_platform][_specialization] = _amount;
        emit KycFeeUpdated(_level, _platform, _specialization, _amount);
    }

    function getKycFee(
        uint8 _level,
        address _platform,
        bytes32 _specialization
    ) public view returns (uint256) {
        uint256 _fee = baseKycFees[_level][_platform][_specialization];
        uint256 rebasesNeeded = nrtManager.currentNrtMonth() / 12;
        for (; rebasesNeeded > 0; rebasesNeeded--) {
            _fee = _fee.mul(90).div(100);
        }
        return _fee;
    }

    function register(bytes32 _newUsername) public payable {
        // TODO: take payment here to prevent brute force

        require(usernames[msg.sender] == bytes32(0), "Kyc: Your identity already exists");
        require(identities[_newUsername].owner == address(0), "Kyc: Username is taken");

        usernames[msg.sender] = _newUsername;
        identities[_newUsername].owner = msg.sender;

        emit IdentityTransfer(address(0), msg.sender, _newUsername);

        applyForKyc(1, address(0), bytes32(0));
    }

    function applyForKyc(
        uint8 _level,
        address _platform,
        bytes32 _specialization
    ) public payable identityWalletExists(msg.sender) {
        bytes32 _username = usernames[msg.sender];
        uint256 kycFees = getKycFee(_level, _platform, _specialization);
        require(kycFees > 0, "Kyc: KYC specialization does not have fee");
        require(
            msg.value == kycFees,
            msg.value < kycFees ? "Kyc: Insufficient KYC Fees" : "Kyc: Excess KYC Fees"
        );
        // balanceOf[_wallet] = balanceOf[_wallet].sub(_amount);
        // emit BalanceChanged(_wallet, int256(_amount) * -1);

        {
            uint256 _faithminusCharge = msg.value.mul(80).div(100);
            // FaithMinus is a modified multi-sig, Kyc Dapp needs to be allowed in there
            // in order to propose a transaction by paying curator fees
            (bool _success, ) = owner().call{ value: _faithminusCharge }(
                abi.encodeWithSignature(
                    "proposeTransaction(address,uint256,bytes)",
                    address(this),
                    0,
                    abi.encodeWithSelector(
                        this.updateKycStatus.selector,
                        _username,
                        _level,
                        _platform,
                        _specialization
                    )
                )
            );
            require(_success, "Kyc: Faithminus transfer is failing");
        }

        {
            uint256 _burn = msg.value.mul(10).div(100);
            nrtManager.addToBurnPool{ value: _burn }();
        }

        {
            uint256 _charity = msg.value.mul(10).div(100);
            (bool _success, ) = charityPool.call{ value: _charity }("");
            require(_success, "Kyc: Faithminus transfer is failing");
        }

        emit KycApplied(_username, _level, _platform, _specialization);
    }

    /// @dev This emits an event and admin can catch that and check it. And if ok then can approve it using a function
    function proposeKycDetails(bytes32 _kycUnapprovedDetailsIPFS) public {
        bytes32 _username = usernames[msg.sender];
        require(usernames[msg.sender] != bytes32(0), "Kyc: Your identity does not exist");

        emit KycDetailsUpdated(_username, _kycUnapprovedDetailsIPFS);
    }

    function approveKycDetails(bytes32 _username, bytes32 _kycUnapprovedDetailsIPFS)
        public
        onlyOwner
    {
        identities[_username].kycApprovedDetailsIPFS = _kycUnapprovedDetailsIPFS;
    }

    function updateKycStatus(
        bytes32 _username,
        uint8 _level,
        address _platform,
        bytes32 _specialization,
        KYC_STATUS _kycStatus
    ) public onlyOwner identityUsernameExists(_username) {
        uint256 _kycFees = getKycFee(_level, _platform, _specialization);
        require(_kycFees > 0, "Kyc: KYC specialization does not have fee");

        KYC_STATUS _earlierStatus;

        if (_level == 1) {
            _earlierStatus = identities[_username].level1;
            identities[_username].level1 = _kycStatus;
            emit KycStatusUpdated(_username, 1, address(0), bytes32(0), _kycStatus);
        } else {
            _earlierStatus = identities[_username].nextLevels[_level][_platform][_specialization];
            identities[_username].nextLevels[_level][_platform][_specialization] = _kycStatus;
            emit KycStatusUpdated(_username, _level, _platform, _specialization, _kycStatus);
        }

        if (_earlierStatus == KYC_STATUS.NULL) {
            address _wallet = identities[_username].owner;

            // self user 100% staking
            timeallyPromotionalBucket.rewardToStaker(_wallet, _kycFees);

            // introducer 40% 50-50liquid staked
            timeallyClub.rewardToIntroducer(_wallet, _kycFees);

            // self tree 40%, 50-50liquid-staked
            dayswappers.rewardToTree(
                _wallet,
                _kycFees.mul(40).div(100),
                [uint256(50), uint256(0), uint256(50)]
            );
        }
    }

    function getIdentityByAddress(address _wallet)
        public
        override
        view
        returns (
            bytes32 username,
            address owner,
            bytes32 kycApprovedDetailsIPFS,
            bytes32 profileDetailsIPFS,
            KYC_STATUS level1
        )
    {
        username = usernames[_wallet];
        return getIdentityByUsername(username);
    }

    function getIdentityByUsername(bytes32 _username)
        public
        override
        view
        returns (
            bytes32 username,
            address owner,
            bytes32 kycApprovedDetailsIPFS,
            bytes32 profileDetailsIPFS,
            KYC_STATUS level1
        )
    {
        require(_username != bytes32(0), "Kyc: Identity does not exist");
        Identity storage indentity = identities[_username];

        username = _username;
        owner = indentity.owner;
        kycApprovedDetailsIPFS = indentity.kycApprovedDetailsIPFS;
        profileDetailsIPFS = indentity.profileDetailsIPFS;
        level1 = indentity.level1;
    }

    function isKycLevel1(address _wallet) public override view returns (bool) {
        bytes32 _username = usernames[_wallet];
        if (_username == bytes32(0)) {
            return false;
        }
        return identities[_username].level1 == KYC_STATUS.APPROVED;
    }

    function isKycApproved(
        address _wallet,
        uint8 _level,
        address _platform,
        bytes32 _specialization
    ) public override view returns (bool) {
        bool _level1 = isKycLevel1(_wallet);
        if (_level == 1) {
            return _level1;
        }
        if (!_level1) {
            return false;
        }
        bytes32 _username = usernames[_wallet];
        return
            identities[_username].nextLevels[_level][_platform][_specialization] ==
            KYC_STATUS.APPROVED;
    }

    function getKycStatusByUsername(
        bytes32 _username,
        uint8 _level,
        address _platform,
        bytes32 _specialization
    ) public override view returns (KYC_STATUS) {
        return identities[_username].nextLevels[_level][_platform][_specialization];
    }

    function getKycStatusByAddress(
        address _wallet,
        uint8 _level,
        address _platform,
        bytes32 _specialization
    ) public override view returns (KYC_STATUS) {
        bytes32 _username = usernames[_wallet];
        return getKycStatusByUsername(_username, _level, _platform, _specialization);
    }

    function resolveAddress(bytes32 _username) public override view returns (address) {
        return identities[_username].owner;
    }

    function resolveUsername(address _wallet) public override view returns (bytes32) {
        return usernames[_wallet];
    }
}
