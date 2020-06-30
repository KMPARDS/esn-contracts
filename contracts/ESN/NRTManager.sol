// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "../lib/SafeMath.sol";

contract NRTManager {
    using SafeMath for uint256;

    uint256 public constant SECONDS_IN_MONTH = 2629744;

    uint256 public annualNRT = 819000000 ether;
    uint256 public currentNrtMonth;
    uint256 public lastReleaseTimestamp;

    uint256 public luckPoolBalance;
    uint256 public burnPoolBalance;

    /// @dev keeping deployer private since this wallet will be used for onetime
    ///     calling setInitialValues method, after that it has no special role.
    ///     Hence it doesn't make sence creating a method by marking it public.
    address private deployer;

    // TODO: decide to instead have a dynamic array and percentage array if the
    //     contract only have to push funds to addresses in a similar fashion.
    // address public timeally;
    // address public petsgap;
    // address public esn;
    // address public powertokens;
    // address public club;
    // address public dayswappers;
    // address public timetraders;
    // address public faithminus;
    // address public bounty;
    // address public lifeTimePlan;
    // address public partnerships;
    // address public maintainence;
    // address public research;
    // address public communityWelfare;
    // address public contingencyFunds;
    // address public kmpards;
    address[] platforms;
    uint256[] perThousands;

    // TODO: make a governance to be able to change burn address and platforms
    address payable public BURN_ADDR = 0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB;

    constructor() public payable {
        // TODO: configure a way to account for already released NRT
        //    by passing in nrt month to constructor
        require(msg.value == 8190000000 ether, "NRTM: Invalid NRT locking");

        deployer = msg.sender;
        lastReleaseTimestamp = now;
    }

    function setInitialValues(address[] memory _platforms, uint256[] memory _perThousands) public {
        require(msg.sender == deployer, "NRTM: Only deployer can call");
        deployer = address(0);
        require(_platforms.length == _perThousands.length, "NRTM: Invalid values");
        platforms = _platforms;
        perThousands = _perThousands;
    }

    function releaseMonthlyNRT() public {
        require(now - lastReleaseTimestamp >= SECONDS_IN_MONTH, "NRTM: Month not finished");

        // TODO: add a sufficient gas check

        uint256 _monthNRT = annualNRT.div(12).add(luckPoolBalance);
        uint256 _burnAmount = getBurnAmount();

        luckPoolBalance = 0;
        burnPoolBalance = burnPoolBalance.sub(_burnAmount);
        currentNrtMonth++;
        if (currentNrtMonth % 12 == 0) {
            annualNRT = annualNRT.mul(90).div(100);
        }

        if (_burnAmount > 0) {
            BURN_ADDR.transfer(_burnAmount);
        }
        for (uint256 i = 0; i < platforms.length; i++) {
            uint256 _platformNRT = _monthNRT.mul(perThousands[i]).div(1000);
            (bool _success, ) = platforms[i].call{ value: _platformNRT }("");
            require(_success, "NRTM: ETH transfer failing");
        }
    }

    function getBurnAmount() public view returns (uint256) {
        uint256 totalSupply = 9100000000 ether - address(this).balance;
        uint256 threePercent = totalSupply.mul(3).div(100);
        return burnPoolBalance > threePercent ? threePercent : burnPoolBalance;
    }

    function getPlatformDetails() public view returns (address[] memory, uint256[] memory) {
        return (platforms, perThousands);
    }

    function getPlatform(uint256 _platformIndex) public view returns (address) {
        return platforms[_platformIndex];
    }

    function getPlatforms() public view returns (address[] memory) {
        return platforms;
    }

    function getPerThousand(uint256 _perThousandIndex) public view returns (uint256) {
        return perThousands[_perThousandIndex];
    }

    function getPerThousands() public view returns (uint256[] memory) {
        return perThousands;
    }
}
