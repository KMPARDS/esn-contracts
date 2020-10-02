// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { ProductManager } from "./ProductManager.sol";

//import './Abstracts/KycDapp.sol';

contract RentingDappManager {
    //KycDapp kycContract;

    address public owner;
    address[] public items;
    mapping(address => bool) public isAuthorised;
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
        uint48 _listDate
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only manager can call this");
        _;
    }

    modifier onlyAuthorised() {
        require(isAuthorised[msg.sender], "Only authorised (Lessee) can call");
        _;
    }

    modifier onlyAvailable() {
        require(isAvailable[msg.sender], "This item is no longer available");
        _;
    }

    constructor() {
        owner = msg.sender;
        isAuthorised[msg.sender] = true;
    }

    function addItem(
        string memory _name,
        string memory _location,
        uint256 _maxRent,
        uint256 _security,
        uint256 _cancellationFee,
        string memory _description,
        bytes32 _categoryId,
        uint48 _listDate /*onlyAuthorised*/
    ) public {
        //require(kycContract.isKycLevel3(_lessor), 'KYC is not approved');

        ProductManager _newProduct = new ProductManager(
            _name,
            _location,
            msg.sender,
            items.length + 1,
            _maxRent,
            _security,
            _cancellationFee,
            _description,
            false /*can be managed at product manager*/
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
            _listDate
        );
    }

    function removeItem(
        address _item /*onlyAuthorised*/
    ) public {
        isAvailable[_item] = false;
    }
}
