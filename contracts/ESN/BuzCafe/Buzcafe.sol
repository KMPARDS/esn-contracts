// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { RegistryDependent } from "../KycDapp/RegistryDependent.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @title Storage
 * @dev Store & retreive value in a variable
 */
contract BufCafe is RegistryDependent {
    using SafeMath for uint256;
    struct ShopEntity {
        bytes32 Category;
        string Location;
        string Name;
        string contactInfo;
        string Image; // per Thousand
    }

    uint256 public distributePerThousand = 1; // 0.1%
    mapping(address => ShopEntity) public Shops;

    event PayTo(address indexed from, address indexed to, uint256 amount, string data);
    event AddShop(address indexed owner, bytes32 indexed category);
    event DeleteShop(address indexed shopAddress);
    event BlockShop(address indexed shopAddress);

    function newShop(
        bytes32 category,
        string memory _location,
        string memory _name,
        string memory _contactInfo,
        string memory _image
    ) public {
        require(Shops[msg.sender].Category == bytes32(0), "Shop Already Exist");
        Shops[msg.sender] = ShopEntity(category, _location, _name, _contactInfo, _image);
        emit AddShop(msg.sender, category);
    }

    function updateShop(
        bytes32 category,
        string memory _location,
        string memory _name,
        string memory _contactInfo,
        string memory _image
    ) public {
        require(Shops[msg.sender].Category != bytes32(0), "Shop is not Exist");
        Shops[msg.sender] = ShopEntity(category, _location, _name, _contactInfo, _image);
        // emit AddShop(msg.sender, category);
    }

    function deleteShop(address shop) public onlyOwner {
        Shops[shop] = ShopEntity(bytes32(0), "", "", "", "");
        emit DeleteShop(shop);
    }

    function blockShop(address shop) public onlyOwner {
        Shops[shop] = ShopEntity(
            0x424c4f434b454400000000000000000000000000000000000000000000000000,
            "",
            "",
            "",
            ""
        );
        emit BlockShop(shop);
    }

    function setDistributePerThousand(uint256 newValue) public onlyOwner {
        distributePerThousand = newValue;
    }

    function payAmount(address to, string memory data) public payable {
        require(msg.value != 0, "Zero Amount");
        uint256 rewards = msg.value.mul(distributePerThousand).div(100);
        payable(to).transfer(msg.value.sub(rewards));
        payRewards(msg.sender, to, msg.value, rewards);
        emit PayTo(msg.sender, to, msg.value, data);
    }

    function payRewards(
        address _buyer,
        address _seller,
        uint256 _value,
        uint256 _reward
    ) internal {
        require(_reward != 0, "Zero_Rewards");

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
