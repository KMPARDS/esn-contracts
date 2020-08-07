// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "../lib/SafeMath.sol";

/// @title Newly Released Tokens Manager
/// @notice Releases tokens to platforms and manages burning.
contract NRTManager {
    using SafeMath for uint256;

    /// @dev 30.4368 days to take account for leap years.
    uint256 public constant SECONDS_IN_MONTH = 2629744;

    /// @notice Annual amount which is released monthly during first year. On end
    ///         of a year, this amount decreases by 10%.
    uint256 public annualNRT = 819000000 ether;

    /// @notice Number of NRT releases that have been happened.
    uint256 public currentNrtMonth;

    /// @notice Timestamp of the block in which last NRT transaction was sealed.
    uint256 public lastReleaseTimestamp;

    /// @notice Amount of tokens accrued for the month by luck as per Era Swap Whitepaper.
    uint256 public luckPoolBalance;

    /// @notice Amount of tokens accrued for burning as per Era Swap Whitepaper.
    uint256 public burnPoolBalance;

    // TODO: move this into a public governor contract address.
    /// @dev keeping deployer private since this wallet will be used for onetime
    ///     calling setInitialValues method, after that it has no special role.
    ///     Hence it doesn't make sence creating a method by marking it public.
    address private deployer;

    /// @notice To be used for migrating the existing stakings from existing ETH contract.
    /// @dev Once set to false, it cannot be turned on again.
    bool public adminMode;

    /// @dev Platform smart contract addresses on which NRT is to be delivered.
    address[] platforms;

    /// @dev Corresponding per thousand share of NRT amount for above platforms.
    uint256[] perThousands;


    /// @notice A destination for tokens which are destined to be unspendable forever.
    address payable public BURN_ADDR = 0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB;

    /// @notice Emits whenever amount is deposited into luck pool.
    event LuckPoolAccrue(uint256 indexed nrtMonth, uint256 value, address sender);

    /// @notice Emits whenever amount is deposited into burn pool.
    event BurnPoolAccrue(uint256 indexed nrtMonth, uint256 value, address sender);

    /// @notice Emits whenever NRT is released.
    event NRT(uint256 indexed nrtMonth, uint256 value, address releaser);

    /// @notice Emits whenever tokens sent to burn address.
    event Burn(uint256 indexed nrtMonth, uint256 value);

    /// @notice Sets deployer wallet and timestamp.
    constructor() payable {
        // TODO: uncomment below require statement for Mainnet.
        // require(msg.value == 8190000000 ether, "NRTM: Invalid NRT locking");

        deployer = msg.sender;
        lastReleaseTimestamp = block.timestamp;
    }

    // TODO: remove this in Mainnet.
    /// @dev Used to topup NRT contract with NRT release amount.
    receive() external payable {}

    /// @notice Sets initial enviornment values.
    /// @param _adminMode: Status of admin mode.
    /// @param _platforms: Addresses of platform smart contracts or wallets.
    /// @param _perThousands: Corresponding perThousand NRT share.
    function setInitialValues(
        bool _adminMode,
        address[] memory _platforms,
        uint256[] memory _perThousands
    ) public payable {
        require(msg.sender == deployer, "NRTM: Only deployer can call");
        // deployer = address(0);
        require(_platforms.length == _perThousands.length, "NRTM: Invalid values");

        // TODO if admin mode turned off then can't turn on again.
        adminMode = _adminMode;
        platforms = _platforms;
        perThousands = _perThousands;
    }

    /// @notice Adds tokens to luck pool.
    function addToLuckPool() public payable {
        /// @dev This if condition is intentional, instead of require statement to prevent
        ///      undesired revert when other platforms sends zero value.
        if (msg.value > 0) {
            luckPoolBalance = luckPoolBalance.add(msg.value);
            emit LuckPoolAccrue(currentNrtMonth, msg.value, msg.sender);
        }
    }

    /// @notice Adds tokens to burn pool.
    function addToBurnPool() public payable {
        /// @dev This if condition is intentional, instead of require statement to prevent
        ///      undesired revert when other platforms sends zero value.
        if (msg.value > 0) {
            burnPoolBalance = burnPoolBalance.add(msg.value);
            emit BurnPoolAccrue(currentNrtMonth, msg.value, msg.sender);
        }
    }

    /// @notice Sends NRT share to the platforms and burns tokens from burn pool as per Era Swap Whitepaper.
    function releaseMonthlyNRT() public {
        /// @dev The requirement for waiting for a month time is relaxed during admin mode to replay past NRT.
        if (!adminMode) {
            require(block.timestamp - lastReleaseTimestamp >= SECONDS_IN_MONTH, "NRTM: Month not finished");
        }

        uint256 _monthNRT = annualNRT.div(12).add(luckPoolBalance);
        uint256 _burnAmount = getBurnAmount();

        luckPoolBalance = 0;
        burnPoolBalance = burnPoolBalance.sub(_burnAmount);
        currentNrtMonth++;

        if (adminMode) {
            lastReleaseTimestamp = block.timestamp;
        } else {
            /// @dev After admin mode SECONDS_IN_MONTH consistency is maintained.
            lastReleaseTimestamp += SECONDS_IN_MONTH;
        }

        /// @dev Reducing annual NRT by 10% as per Era Swap Whitepaper.
        if (currentNrtMonth % 12 == 0) {
            annualNRT = annualNRT.mul(90).div(100);
        }

        if (_burnAmount > 0) {
            BURN_ADDR.transfer(_burnAmount);
        }

        for (uint256 i = 0; i < platforms.length; i++) {
            uint256 _platformNRT = _monthNRT.mul(perThousands[i]).div(1000);

            require(
                address(this).balance >= _platformNRT,
                "NRTM: Not enough balance to release NRT"
            );

            (bool _success, ) = platforms[i].call{ value: _platformNRT }(
                abi.encodeWithSignature("receiveNrt()")
            );
            require(_success, "NRTM: platform receiveNrt call failing");
        }

        emit NRT(currentNrtMonth, _monthNRT, msg.sender);
        emit Burn(currentNrtMonth, _burnAmount);
    }

    /// @notice Gets tokens allowed to be burned during upcoming NRT.
    /// @return Number of tokens that will be burned in upcoming NRT.
    function getBurnAmount() public view returns (uint256) {
        // TODO: remove the relying on contract balance.
        uint256 totalSupply = 9100000000 ether - address(this).balance;
        uint256 threePercent = totalSupply.mul(3).div(100);
        return burnPoolBalance > threePercent ? threePercent : burnPoolBalance;
    }

    /// @notice Gets platforms and their NRT share.
    /// @return Address array of platforms.
    /// @return Corresponding NRT share in per thousand.
    function getPlatformDetails() public view returns (address[] memory, uint256[] memory) {
        return (platforms, perThousands);
    }

    /// @notice Gets platform address by index.
    /// @param _platformIndex: Index of platform.
    /// @return Address of platform.
    function getPlatform(uint256 _platformIndex) public view returns (address) {
        return platforms[_platformIndex];
    }

    /// @notice Gets all platform addresses.
    /// @return Address array of platforms.
    function getPlatforms() public view returns (address[] memory) {
        return platforms;
    }

    /// @notice Gets NRT share of a platform.
    /// @param _perThousandIndex: Index of platform.
    /// @return NRT share in per thousands.
    function getPerThousand(uint256 _perThousandIndex) public view returns (uint256) {
        return perThousands[_perThousandIndex];
    }

    /// @notice Gets all nrt shares of platforms.
    /// @return Array of per thousands.
    function getPerThousands() public view returns (uint256[] memory) {
        return perThousands;
    }
}
