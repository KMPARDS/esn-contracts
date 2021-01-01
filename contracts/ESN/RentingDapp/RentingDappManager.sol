// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { ProductManager } from "./ProductManager.sol";
import { RegistryDependent } from "../KycDapp/RegistryDependent.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { IRentingDappManager } from "./IRentingDappManager.sol";

contract RentingDappManager is RegistryDependent, IRentingDappManager {
    using SafeMath for uint256;
    address public Owner;
    address[] public items;
    mapping(address => bool) public Admin;
    mapping(address => bool) public isAvailable;

    event ProductDetails(
        address indexed lessor,
        address item,
        string _name,
        string _description,
        string _location,
        uint256 _maxRent,
        uint256 _security,
        uint256 _cancellationFee,
        bytes32 indexed _categoryId,
        uint48 _listDate,
        string image
    );
    event Dispute(address indexed _product, address indexed _rentAgreement, string Details);

    modifier onlyAvailable() {
        require(isAvailable[msg.sender], "This item is no longer available");
        _;
    }

    function setAdmin(address user, bool status) public {
        require(msg.sender == Owner, "Govern_Authorized");
        Admin[user] = status;
    }

    function isAdmin(address user) public view override returns (bool) {
        return Admin[user];
    }

    constructor() {
        Owner = msg.sender;
    }

    function addItem(
        string memory _name,
        string memory _location,
        uint256 _maxRent,
        uint256 _security,
        uint256 _cancellationFee,
        string memory _description,
        bytes32 _categoryId,
        uint48 _listDate,
        uint8 _incentive,
        string memory image
    ) public {
        require(kycDapp().isKycLevel1(msg.sender), "KYC_NOT_APPROVED");
        require(_maxRent > 0, "Rent_is_0");
        ProductManager _newProduct =
            new ProductManager(
                _name,
                _location,
                msg.sender,
                items.length + 1,
                _maxRent,
                _security,
                _cancellationFee,
                _description,
                false, /*can be managed at product manager*/
                _incentive,
                image
            );

        items.push(address(_newProduct));
        isAvailable[address(_newProduct)] = true;

        emit ProductDetails(
            msg.sender,
            address(_newProduct),
            _name,
            _description,
            _location,
            _maxRent,
            _security,
            _cancellationFee,
            _categoryId,
            _listDate,
            image
        );
    }

    function removeItem(address _item) public {
        isAvailable[_item] = false;
    }

    function raiseDispute(
        address _product,
        address _rent,
        string memory _details
    ) external override {
        emit Dispute(_product, _rent, _details);
    }

    // Call this function through child contracts for sending rewards
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
