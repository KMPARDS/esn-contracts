// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { Governable } from "../Governance/Governable.sol";
import { WithAdminMode } from "../Governance/AdminMode.sol";
import { RegistryDependent } from "../KycDapp/RegistryDependent.sol";
import { Initializable } from "@openzeppelin/contracts/proxy/Initializable.sol";

/// @title Newly Released Tokens Manager
/// @notice Releases tokens to platforms and manages burning.
contract NRTManager is Governable, RegistryDependent, WithAdminMode, Initializable {
    using SafeMath for uint256;

    /// @dev 30.4368 days to take account for leap years.
    uint48 public constant SECONDS_IN_MONTH = 2629744;

    /// @notice Annual amount which is released monthly during first year. On end
    ///         of a year, this amount decreases by 10%.
    uint256 public annualNRT = 819000000 ether;

    /// @notice Tracks total NRT released, to be able to calculate total supply.
    uint256 public totalNrtReleased;

    /// @notice Number of NRT releases that have been happened.
    uint32 public currentNrtMonth;

    /// @notice Timestamp of the block in which last NRT transaction was sealed.
    uint256 public lastReleaseTimestamp;

    /// @notice Amount of tokens accrued for the month by luck as per Era Swap Whitepaper.
    uint256 public luckPoolBalance;

    /// @notice Amount of tokens accrued for burning as per Era Swap Whitepaper.
    uint256 public burnPoolBalance;

    /// @dev Platform smart contract addresses on which NRT is to be delivered.
    // address[] platforms;
    bytes32[] platformIdentifiers;

    /// @dev Corresponding per thousand share of NRT amount for above platforms.
    uint256[] perThousands;

    /// @notice A destination for tokens which are destined to be unspendable forever.
    address payable public constant BURN_ADDR = 0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB;

    /// @notice Emits whenever amount is deposited into luck pool.
    event LuckPoolAccrue(uint32 indexed nrtMonth, uint256 value, address sender);

    /// @notice Emits whenever amount is deposited into burn pool.
    event BurnPoolAccrue(uint32 indexed nrtMonth, uint256 value, address sender);

    /// @notice Emits whenever NRT is released.
    event NRT(uint32 indexed nrtMonth, uint256 value, address releaser);

    /// @notice Emits whenever NRT is being sent to a platform.
    event NRTSend(
        uint32 indexed nrtMonth,
        bytes32 indexed platformIdentifier,
        address platform,
        uint256 value
    );

    /// @notice Emits whenever tokens sent to burn address.
    event Burn(uint32 indexed nrtMonth, uint256 value);

    /// @notice Sets deployer wallet and timestamp.
    function initialize() public payable initializer {
        _initializeGovernable();
        _initializeAdminMode();

        if (annualNRT == 0) {
            annualNRT = 819000000 ether;
        }

        require(msg.value == 8190000000 ether, "NRTM: INVALID_NRT_LOCKING");

        lastReleaseTimestamp = block.timestamp;
    }

    /// @notice Sets initial enviornment values.
    /// @param _platformIdentifiers: Addresses of platform smart contracts or wallets.
    /// @param _perThousands: Corresponding perThousand NRT share.
    function setPlatforms(bytes32[] memory _platformIdentifiers, uint256[] memory _perThousands)
        public
        payable
        onlyOwner
    {
        require(_platformIdentifiers.length == _perThousands.length, "NRTM: INVALID_VALUES");

        uint256 _totalPerThousands;
        for (uint256 i = 0; i < _perThousands.length; i++) {
            _totalPerThousands += _perThousands[i];
        }

        require(_totalPerThousands <= 1000, "NRTM: NRT_SHARE_OVERFLOW");

        platformIdentifiers = _platformIdentifiers;
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
        if (!isAdminMode()) {
            require(
                block.timestamp - lastReleaseTimestamp >= SECONDS_IN_MONTH,
                "NRTM: MONTH_NOT_FINISHED"
            );
        }

        uint256 _monthNRT = annualNRT.div(12).add(luckPoolBalance);
        uint256 _burnAmount = getBurnAmount();

        luckPoolBalance = 0;
        burnPoolBalance = burnPoolBalance.sub(_burnAmount);
        currentNrtMonth++;

        if (isAdminMode()) {
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
            (bool _success, ) = BURN_ADDR.call{ value: _burnAmount }("");
            require(_success, "FM_ESN: BURN_NATIVE_TRANSFER_FAILING");

            emit Burn(currentNrtMonth, _burnAmount);
        }

        totalNrtReleased = totalNrtReleased.add(_monthNRT);
        emit NRT(currentNrtMonth, _monthNRT, msg.sender);

        for (uint256 i = 0; i < platformIdentifiers.length; i++) {
            uint256 _platformNRT = _monthNRT.mul(perThousands[i]).div(1000);

            require(
                address(this).balance >= _platformNRT,
                "NRTM: NOT_ENOUGH_BALANCE_TO_RELEASE_NRT"
            );

            address _platform = resolveAddress(platformIdentifiers[i]);

            emit NRTSend(currentNrtMonth, platformIdentifiers[i], _platform, _platformNRT);

            (bool _success, ) = _platform.call{ value: _platformNRT }(
                abi.encodeWithSignature("receiveNrt(uint32)", currentNrtMonth)
            );
            require(
                _success,
                string(
                    abi.encodePacked(
                        "NRTM: PLATFORM_receiveNrt_CALL_FAILING_ON_",
                        platformIdentifiers[i]
                    )
                )
            );
        }
    }

    /// @notice Gets tokens allowed to be burned during upcoming NRT.
    /// @return Number of tokens that will be burned in upcoming NRT.
    function getBurnAmount() public view returns (uint256) {
        uint256 threePercent = totalSupply().mul(3).div(100);
        return burnPoolBalance > threePercent ? threePercent : burnPoolBalance;
    }

    function totalSupply() public view returns (uint256) {
        // Total Supply = Max Supply - NRT Balance + burnpool + luckpool + Burn Address Bal // formula from boss
        // NRT Balance = pending NRT to be released + burn pool + luck pool
        // Total Supply = Max Supply - (819 crore - totalNrtReleased + burn pool + luck pool) + burnpool + luckpool + Burn Address Bal
        // Total Supply = Max Supply - (819 crore - totalNrtReleased) + Burn Address Bal
        // Total Supply = 91 crore + totalNrtReleased + Burn Address Bal
        // return
        //     9100000000 ether -
        //     address(this).balance +
        //     luckPoolBalance +
        //     burnPoolBalance +
        //     BURN_ADDR.balance;

        return totalNrtReleased.add(910000000 ether);
    }

    function availableSupply() public view returns (uint256) {
        return totalSupply().sub(BURN_ADDR.balance);
    }

    /// @notice Gets platforms and their NRT share.
    /// @return Address array of platforms.
    /// @return Corresponding NRT share in per thousand.
    function getPlatformDetails() public view returns (bytes32[] memory, uint256[] memory) {
        return (platformIdentifiers, perThousands);
    }

    /// @notice Gets platform address by index.
    /// @param _platformIndex: Index of platform.
    /// @return Address of platform.
    function getPlatform(uint256 _platformIndex) public view returns (bytes32) {
        return platformIdentifiers[_platformIndex];
    }

    /// @notice Gets all platform addresses.
    /// @return Address array of platforms.
    function getPlatforms() public view returns (bytes32[] memory) {
        return platformIdentifiers;
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
