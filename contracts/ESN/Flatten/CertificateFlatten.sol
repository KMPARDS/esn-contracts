    // SPDX-License-Identifier: MIT
    // File: @openzeppelin/contracts/math/SafeMath.sol
    
    
    pragma solidity ^0.7.0;
    
    /**
     * @dev Wrappers over Solidity's arithmetic operations with added overflow
     * checks.
     *
     * Arithmetic operations in Solidity wrap on overflow. This can easily result
     * in bugs, because programmers usually assume that an overflow raises an
     * error, which is the standard behavior in high level programming languages.
     * `SafeMath` restores this intuition by reverting the transaction when an
     * operation overflows.
     *
     * Using this library instead of the unchecked operations eliminates an entire
     * class of bugs, so it's recommended to use it always.
     */
    library SafeMath {
        /**
         * @dev Returns the addition of two unsigned integers, reverting on
         * overflow.
         *
         * Counterpart to Solidity's `+` operator.
         *
         * Requirements:
         *
         * - Addition cannot overflow.
         */
        function add(uint256 a, uint256 b) internal pure returns (uint256) {
            uint256 c = a + b;
            require(c >= a, "SafeMath: addition overflow");
    
            return c;
        }
    
        /**
         * @dev Returns the subtraction of two unsigned integers, reverting on
         * overflow (when the result is negative).
         *
         * Counterpart to Solidity's `-` operator.
         *
         * Requirements:
         *
         * - Subtraction cannot overflow.
         */
        function sub(uint256 a, uint256 b) internal pure returns (uint256) {
            return sub(a, b, "SafeMath: subtraction overflow");
        }
    
        /**
         * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
         * overflow (when the result is negative).
         *
         * Counterpart to Solidity's `-` operator.
         *
         * Requirements:
         *
         * - Subtraction cannot overflow.
         */
        function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
            require(b <= a, errorMessage);
            uint256 c = a - b;
    
            return c;
        }
    
        /**
         * @dev Returns the multiplication of two unsigned integers, reverting on
         * overflow.
         *
         * Counterpart to Solidity's `*` operator.
         *
         * Requirements:
         *
         * - Multiplication cannot overflow.
         */
        function mul(uint256 a, uint256 b) internal pure returns (uint256) {
            // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
            // benefit is lost if 'b' is also tested.
            // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
            if (a == 0) {
                return 0;
            }
    
            uint256 c = a * b;
            require(c / a == b, "SafeMath: multiplication overflow");
    
            return c;
        }
    
        /**
         * @dev Returns the integer division of two unsigned integers. Reverts on
         * division by zero. The result is rounded towards zero.
         *
         * Counterpart to Solidity's `/` operator. Note: this function uses a
         * `revert` opcode (which leaves remaining gas untouched) while Solidity
         * uses an invalid opcode to revert (consuming all remaining gas).
         *
         * Requirements:
         *
         * - The divisor cannot be zero.
         */
        function div(uint256 a, uint256 b) internal pure returns (uint256) {
            return div(a, b, "SafeMath: division by zero");
        }
    
        /**
         * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
         * division by zero. The result is rounded towards zero.
         *
         * Counterpart to Solidity's `/` operator. Note: this function uses a
         * `revert` opcode (which leaves remaining gas untouched) while Solidity
         * uses an invalid opcode to revert (consuming all remaining gas).
         *
         * Requirements:
         *
         * - The divisor cannot be zero.
         */
        function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
            require(b > 0, errorMessage);
            uint256 c = a / b;
            // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    
            return c;
        }
    
        /**
         * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
         * Reverts when dividing by zero.
         *
         * Counterpart to Solidity's `%` operator. This function uses a `revert`
         * opcode (which leaves remaining gas untouched) while Solidity uses an
         * invalid opcode to revert (consuming all remaining gas).
         *
         * Requirements:
         *
         * - The divisor cannot be zero.
         */
        function mod(uint256 a, uint256 b) internal pure returns (uint256) {
            return mod(a, b, "SafeMath: modulo by zero");
        }
    
        /**
         * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
         * Reverts with custom message when dividing by zero.
         *
         * Counterpart to Solidity's `%` operator. This function uses a `revert`
         * opcode (which leaves remaining gas untouched) while Solidity uses an
         * invalid opcode to revert (consuming all remaining gas).
         *
         * Requirements:
         *
         * - The divisor cannot be zero.
         */
        function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
            require(b != 0, errorMessage);
            return a % b;
        }
    }
    
    // File: contracts/ESN/KycDapp/IKycDapp.sol
    
    
    pragma solidity ^0.7.0;
    
    interface IKycDapp {
        enum KYC_STATUS { NULL, APPROVED, SUSPENDED }
    
        event IdentityTransfer(address indexed from, address indexed to, bytes32 indexed username);
    
        event KycDetailsUpdated(bytes32 indexed username, bytes32 newKycDetailsIPfS);
    
        event ProfileDetailsUpdated(bytes32 indexed username, bytes32 newProfileDetailsIPfS);
    
        event KycApplied(
            bytes32 indexed username,
            uint8 indexed level,
            bytes32 platformIdentifier,
            bytes32 specialization
        );
    
        event KycStatusUpdated(
            bytes32 indexed username,
            uint8 indexed level,
            bytes32 platformIdentifier,
            bytes32 specialization,
            KYC_STATUS newKycStatus
        );
    
        event KycFeeUpdated(
            uint8 indexed level,
            bytes32 indexed platformIdentifier,
            bytes32 indexed specialization,
            uint256 amount
        );
    
        function isKycLevel1(address _wallet) external view returns (bool);
    
        function isKycApproved(
            address _wallet,
            uint8 _level,
            bytes32 _platformIdentifier,
            bytes32 _specialization
        ) external view returns (bool);
    
        function resolveAddress(bytes32 _username) external view returns (address);
    
        function resolveUsername(address _wallet) external view returns (bytes32);
    
        function getIdentityByUsername(bytes32 _username)
            external
            view
            returns (
                bytes32 username,
                address owner,
                bytes32 kycApprovedDetailsIPFS,
                bytes32 profileDetailsIPFS,
                KYC_STATUS level1,
                bool isGovernanceControllable
            );
    
        function getIdentityByAddress(address _wallet)
            external
            view
            returns (
                bytes32 username,
                address owner,
                bytes32 kycApprovedDetailsIPFS,
                bytes32 profileDetailsIPFS,
                KYC_STATUS level1,
                bool isGovernanceControllable
            );
    
        function getKycStatusByUsername(
            bytes32 _username,
            uint8 _level,
            bytes32 _platformIdentifier,
            bytes32 _specialization
        ) external view returns (KYC_STATUS);
    
        function getKycStatusByAddress(
            address _wallet,
            uint8 _level,
            bytes32 _platformIdentifier,
            bytes32 _specialization
        ) external view returns (KYC_STATUS);
    }
    
    // File: contracts/ESN/KycDapp/IRegistryDependent.sol
    
    
    pragma solidity ^0.7.0;
    
    
    interface IRegistryDependent {
        function setKycDapp(address _kycDapp) external;
    
        // function resolveAddress(bytes32 _username) external view returns (address);
    
        // function resolveUsername(address _wallet) external view returns (bytes32);
    
        function kycDapp() external view returns (IKycDapp);
    }
    
    // File: @openzeppelin/contracts/GSN/Context.sol
    
    
    pragma solidity ^0.7.0;
    
    /*
     * @dev Provides information about the current execution context, including the
     * sender of the transaction and its data. While these are generally available
     * via msg.sender and msg.data, they should not be accessed in such a direct
     * manner, since when dealing with GSN meta-transactions the account sending and
     * paying for execution may not be the actual sender (as far as an application
     * is concerned).
     *
     * This contract is only required for intermediate, library-like contracts.
     */
    abstract contract Context {
        function _msgSender() internal view virtual returns (address payable) {
            return msg.sender;
        }
    
        function _msgData() internal view virtual returns (bytes memory) {
            this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
            return msg.data;
        }
    }
    
    // File: contracts/ESN/Governance/Governable.sol
    
    
    pragma solidity ^0.7.0;
    
    
    // import { Initializable } from "@openzeppelin/contracts/proxy/Initializable.sol";
    
    contract Ownable is Context {
        address private _owner;
    
        event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
        /**
         * @dev Initializes the contract setting the deployer as the initial owner.
         */
        constructor() {
            address msgSender = _msgSender();
            _owner = msgSender;
            emit OwnershipTransferred(address(0), msgSender);
        }
    
        /**
         * @dev Returns the address of the current owner.
         */
        function owner() public view returns (address) {
            return _owner;
        }
    
        /**
         * @dev Throws if called by any account other than the owner.
         */
        modifier onlyOwner() {
            require(_owner == _msgSender(), "Ownable: CALLER_IS_NOT_THE_OWNER");
            _;
        }
    
        /**
         * @dev Leaves the contract without owner. It will not be possible to call
         * `onlyOwner` functions anymore. Can only be called by the current owner.
         *
         * NOTE: Renouncing ownership will leave the contract without an owner,
         * thereby removing any functionality that is only available to the owner.
         */
        // function renounceOwnership() public virtual onlyOwner {
        //     emit OwnershipTransferred(_owner, address(0));
        //     _owner = address(0);
        // }
    
        /**
         * @dev Transfers ownership of the contract to a new account (`newOwner`).
         * Can only be called by the current owner.
         */
        function transferOwnership(address newOwner) public virtual onlyOwner {
            _transferOwnership(newOwner);
        }
    
        function _transferOwnership(address newOwner) internal {
            require(newOwner != address(0), "Ownable: NEW_OWNER_IS_ZERO_ADDR");
            emit OwnershipTransferred(_owner, newOwner);
            _owner = newOwner;
        }
    }
    
    /// @notice ERC173 Contract Ownership
    abstract contract Governable is Ownable {
        /// @notice Adding an extra modifier to prevent confusion between faith minus and governance
        modifier onlyGovernance() virtual {
            require(owner() == msg.sender, "Ownable: CALLER_IS_NOT_THE_OWNER");
            _;
        }
    
        function _initializeGovernable() internal {
            _transferOwnership(msg.sender);
        }
    }
    
    // File: contracts/ESN/NRT/INRTManager.sol
    
    
    pragma solidity ^0.7.0;
    
    interface INRTManager {
        function currentNrtMonth() external view returns (uint32);
    
        function addToLuckPool() external payable;
    
        function addToBurnPool() external payable;
    }
    
    // File: contracts/ESN/NRT/INRTReceiver.sol
    
    
    pragma solidity ^0.7.0;
    
    interface INRTReceiver {
        function receiveNrt(uint32 _currentNrtMonth) external payable;
    
        function getMonthlyNRT(uint32 _month) external view returns (uint256);
    }
    
    // File: contracts/ESN/TimeAlly/1LifeTimes/ITimeAllyManager.sol
    
    
    pragma solidity ^0.7.0;
    
    
    
    interface ITimeAllyManager is INRTReceiver, IRegistryDependent {
        enum RewardType { Liquid, Prepaid, Staked }
    
        function stake() external payable;
    
        function isStakingContractValid(address _stakingContract) external view returns (bool);
    
        function getTotalActiveStaking(uint32 _month) external view returns (uint256);
    
        // Methods callable only from valid staking contracts:
    
        function emitStakingTransfer(address _oldOwner, address _newOwner) external;
    
        function emitStakingMerge(address _childStaking) external;
    
        function increaseActiveStaking(
            uint256 _amount,
            uint32 _startMonth,
            uint32 _endMonth
        ) external;
    
        function decreaseActiveStaking(
            uint256 _amount,
            uint32 _startMonth,
            uint32 _endMonth
        ) external;
    
        function splitStaking(
            address _owner,
            uint256 _initialIssTime,
            uint32 _masterEndMonth
        ) external payable;
    
        function removeStaking(address _owner) external;
    
        function processNrtReward(uint256 _reward, RewardType _rewardType) external;
    }
    
    // File: contracts/ESN/TimeAlly/1LifeTimes/ITimeAllyPromotionalBucket.sol
    
    
    pragma solidity ^0.7.0;
    
    interface ITimeAllyPromotionalBucket {
        function rewardToStaker(address _wallet, uint256 _stakingReward) external;
    
        function claimReward(address stakingContract) external;
    }
    
    // File: contracts/ESN/TimeAlly/Club/ITimeAllyClub.sol
    
    
    pragma solidity ^0.7.0;
    pragma experimental ABIEncoderV2;
    
    interface ITimeAllyClub {
        enum RewardType { Liquid, Prepaid, Staked }
    
        struct Membership {
            uint256 businessVolume;
            uint256 otherVolume;
            mapping(address => PlatformBusiness) platformBusiness;
        }
    
        struct PlatformBusiness {
            uint256 business;
            uint256 calculatedReward;
            bool claimed;
        }
    
        struct Incentive {
            string label;
            uint256 target;
            uint32 directBountyPerTenThousand;
            uint32 treeBountyPerTenThousand;
        }
    
        function rewardToIntroducer(address _networker, uint256 _value) external;
    
        function rewardToNetworker(address _networker, uint256 _value) external;
    
        function withdrawPlatformIncentive(
            uint32 _month,
            address _platform,
            RewardType _rewardType,
            address stakingContract
        ) external;
    
        function getReward(
            address _networker,
            uint32 _month,
            address _platform
        ) external view returns (uint256 direct, uint256 tree);
    
        function getIncentiveSlab(uint256 _volume, address _platform)
            external
            view
            returns (Incentive memory);
    
        function getMembershipVolume(address _network, uint32 _month)
            external
            view
            returns (uint256 businessVolume, uint256 otherVolume);
    
        function getPlatformBusiness(
            address _network,
            uint32 _month,
            address _platform
        ) external view returns (PlatformBusiness memory);
    
        function getTotalBusinessVolume(uint32 _month) external view returns (uint256);
    }
    
    // File: @openzeppelin/contracts/token/ERC20/IERC20.sol
    
    
    pragma solidity ^0.7.0;
    
    /**
     * @dev Interface of the ERC20 standard as defined in the EIP.
     */
    interface IERC20 {
        /**
         * @dev Returns the amount of tokens in existence.
         */
        function totalSupply() external view returns (uint256);
    
        /**
         * @dev Returns the amount of tokens owned by `account`.
         */
        function balanceOf(address account) external view returns (uint256);
    
        /**
         * @dev Moves `amount` tokens from the caller's account to `recipient`.
         *
         * Returns a boolean value indicating whether the operation succeeded.
         *
         * Emits a {Transfer} event.
         */
        function transfer(address recipient, uint256 amount) external returns (bool);
    
        /**
         * @dev Returns the remaining number of tokens that `spender` will be
         * allowed to spend on behalf of `owner` through {transferFrom}. This is
         * zero by default.
         *
         * This value changes when {approve} or {transferFrom} are called.
         */
        function allowance(address owner, address spender) external view returns (uint256);
    
        /**
         * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
         *
         * Returns a boolean value indicating whether the operation succeeded.
         *
         * IMPORTANT: Beware that changing an allowance with this method brings the risk
         * that someone may use both the old and the new allowance by unfortunate
         * transaction ordering. One possible solution to mitigate this race
         * condition is to first reduce the spender's allowance to 0 and set the
         * desired value afterwards:
         * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
         *
         * Emits an {Approval} event.
         */
        function approve(address spender, uint256 amount) external returns (bool);
    
        /**
         * @dev Moves `amount` tokens from `sender` to `recipient` using the
         * allowance mechanism. `amount` is then deducted from the caller's
         * allowance.
         *
         * Returns a boolean value indicating whether the operation succeeded.
         *
         * Emits a {Transfer} event.
         */
        function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    
        /**
         * @dev Emitted when `value` tokens are moved from one account (`from`) to
         * another (`to`).
         *
         * Note that `value` may be zero.
         */
        event Transfer(address indexed from, address indexed to, uint256 value);
    
        /**
         * @dev Emitted when the allowance of a `spender` for an `owner` is set by
         * a call to {approve}. `value` is the new allowance.
         */
        event Approval(address indexed owner, address indexed spender, uint256 value);
    }
    
    // File: contracts/ESN/PrepaidEs/IPrepaidEs.sol
    
    
    pragma solidity ^0.7.0;
    
    
    interface IPrepaidEs is IERC20 {
        function convertToESP(address _destination) external payable;
    
        function transferLiquid(address _receiver, uint256 _value) external;
    }
    
    // File: contracts/ESN/Dayswappers/IDayswappers.sol
    
    
    pragma solidity ^0.7.0;
    
    interface IDayswappers {
        enum RewardType { Liquid, Prepaid, Staked }
    
        /// @notice Emits when a networker joins or transfers their seat
        event SeatTransfer(address indexed from, address indexed to, uint32 indexed seatIndex);
    
        /// @notice Emits when a networker marks another networker as their introducer
        event Introduce(uint32 indexed introducerSeatIndex, uint32 indexed networkerSeatIndex);
    
        event Promotion(uint32 indexed seatIndex, uint32 indexed beltIndex);
    
        /// @notice Emits when kyc is resolved on Dayswappers
        event KycResolve(uint32 indexed seatIndex);
    
        event Volume(
            address indexed platform,
            uint32 indexed seatIndex,
            uint32 indexed month,
            uint256 amount
        );
    
        /// @notice Emits when a networker becomes active
        event Active(uint32 indexed seatIndex, uint32 indexed month);
    
        event Reward(
            address indexed platform,
            uint32 indexed seatIndex,
            uint32 indexed month,
            bool isDefinite,
            bool fromTree,
            uint256 reward,
            uint256[3] rewardRatio
        );
    
        event Withdraw(
            uint32 indexed seatIndex,
            bool indexed isDefinite,
            RewardType rewardType,
            uint32 month,
            uint256[3] adjustedRewards
        );
    
        function join(address _introducer) external;
    
        function resolveKyc(address _networker) external;
    
        function promoteBelt(address _networker, uint32 _month) external;
    
        function getBeltIdFromTreeReferrals(uint32 treeReferrals)
            external
            view
            returns (uint32 _newBeltIndex);
    
        function payToTree(address _networker, uint256[3] memory _rewardRatio) external payable;
    
        function payToNetworker(address _networker, uint256[3] memory _rewardRatio) external payable;
    
        function payToIntroducer(address _networker, uint256[3] memory _rewardRatio) external payable;
    
        function rewardToTree(
            address _networker,
            uint256 _value,
            uint256[3] memory _rewardRatio
        ) external;
    
        function reportVolume(address _networker, uint256 _amount) external;
    
        function transferSeat(address _newOwner) external;
    
        function withdrawDefiniteEarnings(
            address _stakingContract,
            uint32 _month,
            RewardType _rewardType
        ) external;
    
        function withdrawNrtEarnings(
            address _stakingContract,
            uint32 _month,
            RewardType _rewardType
        ) external;
    
        function getSeatByIndex(uint32 _seatIndex)
            external
            view
            returns (
                uint32 seatIndex,
                address owner,
                bool kycResolved,
                uint32 incompleteKycResolveSeatIndex,
                uint32 depth,
                uint32 introducerSeatIndex,
                uint32 beltIndex
            );
    
        function getSeatByAddress(address _networker)
            external
            view
            returns (
                uint32 seatIndex,
                address owner,
                bool kycResolved,
                uint32 incompleteKycResolveSeatIndex,
                uint32 depth,
                uint32 introducerSeatIndex,
                uint32 beltIndex
            );
    
        function getSeatByAddressStrict(address _networker)
            external
            view
            returns (
                uint32 seatIndex,
                address owner,
                bool kycResolved,
                uint32 incompleteKycResolveSeatIndex,
                uint32 depth,
                uint32 introducerSeatIndex,
                uint32 beltIndex
            );
    
        function getSeatMonthlyDataByIndex(uint32 _seatIndex, uint32 _month)
            external
            view
            returns (
                uint32 treeReferrals,
                uint256 volume,
                uint256[3] memory definiteEarnings,
                uint256[3] memory nrtEarnings,
                bool isActive
            );
    
        function getSeatMonthlyDataByAddress(address _networker, uint32 _month)
            external
            view
            returns (
                uint32 treeReferrals,
                uint256 volume,
                uint256[3] memory definiteEarnings,
                uint256[3] memory nrtEarnings,
                bool isActive
            );
    
        function getSeatMonthlyDataByAddressStrict(address _networker, uint32 _month)
            external
            view
            returns (
                uint32 treeReferrals,
                uint256 volume,
                uint256[3] memory definiteEarnings,
                uint256[3] memory nrtEarnings,
                bool isActive
            );
    
        function isActiveAddress(address _networker) external view returns (bool);
    
        function isActiveSeat(uint32 _seatIndex) external view returns (bool);
    
        function resolveIntroducer(address _networker) external view returns (address);
    
        function getTotalMonthlyActiveDayswappers(uint32 _month) external view returns (uint256);
    
        function volumeTarget() external view returns (uint256);
    }
    
    // File: contracts/ESN/Validator/IValidatorManager.sol
    
    
    pragma solidity ^0.7.0;
    
    interface IValidatorManager {
        struct Validator {
            address wallet;
            uint256 amount;
            uint256 adjustedAmount;
            uint256 perThousandCommission;
            uint256 blocksSealed;
            bool withdrawn;
            Delegator[] delegators;
        }
    
        struct Delegator {
            address stakingContract;
            uint256 amount;
            bool withdrawn;
        }
    
        function registerDelegation(uint32 _month, bytes memory _extraData) external;
    
        function registerBlock(address _sealer) external;
    
        function withdrawDelegationShare(
            uint32 _month,
            address _validator,
            address _stakingContract
        ) external;
    
        function setCommission(uint32 _month, uint256 _perThousandCommission) external;
    
        function withdrawCommission(uint32 _month) external;
    
        function getValidatorEarning(uint32 _month, address _validator) external returns (uint256);
    
        function getLuckyValidatorAddress() external returns (address);
    
        function pickValidator(uint32 _month, uint256 _seed) external view returns (uint256);
    
        function getValidatorByIndex(uint32 _month, uint256 _validatorIndex)
            external
            view
            returns (Validator memory);
    
        function getValidatorByAddress(uint32 _month, address _validator)
            external
            view
            returns (Validator memory);
    
        function getValidators(uint32 _month) external view returns (Validator[] memory);
    
        function getDelegatorByIndex(
            uint32 _month,
            uint256 _validatorIndex,
            uint256 _delegatorIndex
        ) external view returns (Delegator memory);
    
        function getDelegatorByAddress(
            uint32 _month,
            address _validator,
            address _stakingContract
        ) external view returns (Delegator memory);
    
        function getTotalAdjustedStakings(uint32 _month) external view returns (uint256);
    
        function getTotalBlocksSealed(uint32 _month) external view returns (uint256);
    
        function getValidatorIndex(uint32 _month, address _validator) external view returns (uint256);
    
        function getDelegatorIndex(
            uint32 _month,
            uint256 _validatorIndex,
            address _stakingContract
        ) external view returns (uint256);
    
        function getAdjustedAmount(
            uint256 _amount,
            uint256 _base,
            uint256 _premiumFactor
        ) external pure returns (uint256);
    }
    
    // File: contracts/ESN/Validator/IRandomnessManager.sol
    
    
    pragma solidity ^0.7.0;
    
    interface IRandomnessManager {
        function getRandomBytes32() external returns (bytes32);
    
        function getRandomBytes(uint256 _numberOfBytes) external returns (bytes memory);
    }
    
    // File: contracts/ESN/Validator/RandomnessManager.sol
    
    
    pragma solidity ^0.7.0;
    
    
    /// @title Randomness Manager
    /// @notice Generates pseudo random bytes.
    /// @dev Relies on last block hash as the source of entropy.
    contract RandomnessManager is IRandomnessManager {
        /// @dev Stores last used seed in case of multiple calls in same block
        bytes32 existingSeed;
    
        /// @dev Number of calls in the same block
        uint256 nonce;
    
        /// @notice Generates pseudo random bytes
        /// @return Pseudo random bytes
        function getRandomBytes32() public override returns (bytes32) {
            bytes32 _latestSeed = getSeed();
            if (_latestSeed != existingSeed) {
                existingSeed = _latestSeed;
                nonce = 0;
            }
    
            /// @dev Increments the nonce for multiple calls in same block
            nonce++;
    
            return keccak256(abi.encodePacked(existingSeed, nonce));
        }
    
        /// @notice Generates pseudo random bytes as per requirement
        /// @param _numberOfBytes Number of bytes32
        /// @return Pseudo random bytes
        function getRandomBytes(uint256 _numberOfBytes) external override returns (bytes memory) {
            bytes memory _concat;
            for (uint256 i = 0; i < _numberOfBytes; i++) {
                _concat = abi.encodePacked(_concat, getRandomBytes32());
            }
            return _concat;
        }
    
        /// @dev Gets the seed to work with
        /// @return Last block hash
        function getSeed() private view returns (bytes32) {
            return blockhash(block.number - 1);
        }
    }
    
    // File: contracts/ESN/KycDapp/RegistryDependent.sol
    
    
    pragma solidity ^0.7.0;
    
    
    abstract contract RegistryDependent is IRegistryDependent, Governable {
        IKycDapp private kycDapp_;
    
        function setKycDapp(address _kycDapp) public virtual override onlyGovernance {
            _setKycDapp(_kycDapp);
        }
    
        function _setKycDapp(address _kycDapp) internal {
            kycDapp_ = IKycDapp(_kycDapp);
        }
    
        function resolveAddress(bytes32 _username) public virtual view returns (address) {
            return kycDapp_.resolveAddress(_username);
        }
    
        function resolveAddressStrict(bytes32 _username) public virtual view returns (address) {
            address _addr = resolveAddress(_username);
            require(_addr != address(0), "Registry: RESOLVED_ZERO_ADDR_IN_STRICT");
            return _addr;
        }
    
        function resolveUsername(address _wallet) public virtual view returns (bytes32) {
            return kycDapp_.resolveUsername(_wallet);
        }
    
        function resolveUsernameStrict(address _wallet) public virtual view returns (bytes32) {
            bytes32 _username = resolveUsername(_wallet);
            require(_username != bytes32(0), "Registry: RESOLVED_NULL_USERNAME_IN_STRICT");
            return _username;
        }
    
        function kycDapp() public virtual override view returns (IKycDapp) {
            return kycDapp_;
        }
    
        function nrtManager() public view returns (INRTManager) {
            return INRTManager(resolveAddressStrict("NRT_MANAGER"));
        }
    
        // TODO beta create interfaces of all contracts and put their functins here
        // most of show stopper ones have been added, more can be added if new project wants to consume it
    
        function timeallyManager() public view returns (ITimeAllyManager) {
            return ITimeAllyManager(resolveAddressStrict("TIMEALLY_MANAGER"));
        }
    
        function validatorManager() public view returns (IValidatorManager) {
            return IValidatorManager(resolveAddressStrict("VALIDATOR_MANAGER"));
        }
    
        function randomnessManager() public view returns (RandomnessManager) {
            return RandomnessManager(resolveAddressStrict("RANDOMNESS_MANAGER"));
        }
    
        function timeallyPromotionalBucket() public view returns (ITimeAllyPromotionalBucket) {
            return ITimeAllyPromotionalBucket(resolveAddressStrict("TIMEALLY_PROMOTIONAL_BUCKET"));
        }
    
        function timeallyClub() public view returns (ITimeAllyClub) {
            return ITimeAllyClub(resolveAddressStrict("TIMEALLY_CLUB"));
        }
    
        function prepaidEs() public view returns (IPrepaidEs) {
            return IPrepaidEs(resolveAddressStrict("PREPAID_ES"));
        }
    
        function dayswappers() public view returns (IDayswappers) {
            return IDayswappers(resolveAddressStrict("DAYSWAPPERS"));
        }
    }
    
    // File: contracts/ESN/CertiDapp/Certificate.sol
    
    
    pragma solidity ^0.7.0;
    
    
    /**
     * @title Storage
     * @dev Store & retreive value in a variable
     */
    contract Certificate is Governable, RegistryDependent {
        
        using SafeMath for uint256;
        
        enum List {NOT_Listed ,Listed,Approved}
        struct Certi{
          string hash;
          address Signer;
          address Verifier;
          uint Balance;
          
       }
       struct Authorized{ 
           string name;
           string website;
           string image;
           List status;
       }
       
       mapping(bytes32 => Certi) public certificates;
       mapping(address => Authorized) public authorities;
       mapping(address => uint256) public Incentives;
    
       event RegisterCertificates(bytes32 hashedinput,address _signer, address _verifier);
       event Donate(bytes32 hashedinput,address doner);
       event Authorities(address _auth);
       event SignCertificate(bytes32 hashedinput, address  _signer);
       
        modifier onlyKycApproved() {
            require(kycDapp().isKycLevel1(msg.sender), "CertiDapp: KYC_NOT_APPROVED");
            // require(kycDapp().isKycApproved(msg.sender, 2, 'CERTI_DAPP', 'AUTHOR'), "CertiDapp: Authorities KYC_NOT_APPROVED for level 2");
            _;
        }
       
        function announceIncentive(uint256 _value) public {
            require(_value <= 99,"Incentives can't be 100%");
            Incentives[msg.sender] = _value;
        }
       
       function addAuthority(string memory _name,string memory _website,string memory _image) payable public{
           require(authorities[msg.sender].status == List.NOT_Listed,"You have already listed on CertiDApp");
           require(msg.value == 5 ether,"You need to add 5ES as PoS");
           authorities[msg.sender].name = _name;
           authorities[msg.sender].website = _website;
           authorities[msg.sender].image = _image;
           authorities[msg.sender].status = List.Listed;
           if(kycDapp().isKycLevel1(msg.sender)){
               authorities[msg.sender].status = List.Approved;
           }
           emit Authorities(msg.sender);
           
           
           //Rewards
           uint256 _reward = msg.value.mul(Incentives[msg.sender]+1).div(100);
            dayswappers().payToIntroducer{ value: _reward.mul(40).div(100)  }(
                msg.sender,
                [uint256(50), uint256(0), uint256(50)]
            );
            dayswappers().payToTree{ value: _reward.mul(40).div(100) }(
                msg.sender,
                [uint256(50), uint256(0), uint256(50)]
            );
            nrtManager().addToBurnPool{ value: _reward.mul(10).div(100) }();
            (bool _success, ) = owner().call{ value: msg.value.sub(_reward) }("");
            require(_success, "CertiDApp: PROFIT_TRANSFER_FAILING");
           
       }
    
        function registerCertificates(string memory _hash,bytes memory _signature,address _Signer) payable  public returns (bytes32) {
            bytes32 hashedinput = keccak256(abi.encodePacked(_signature, msg.sender));
            require(certificates[hashedinput].Signer != _Signer, "you have already Sign this Certificates");
            require(msg.value == 1 ether,"Insufficient Fund(1ES)");
            address temp = verifyString(_hash,_signature);
            require(temp == _Signer,"INVALID Certificate hash");
            certificates[hashedinput].hash = _hash;
            certificates[hashedinput].Signer = _Signer;
            // certificates[hashedinput].Signer.push(_Signer);
            certificates[hashedinput].Verifier = msg.sender;
            certificates[hashedinput].Balance = 0;
            emit RegisterCertificates(hashedinput, _Signer,msg.sender);
            address a = _Signer;
            
            
            uint256 _reward = msg.value.mul(Incentives[a]+1).div(100);
            
            //Seller Introducer
            dayswappers().payToIntroducer{ value: _reward.mul(20).div(100) }(
                _Signer,
                [uint256(50), uint256(0), uint256(50)]
            );
            
            //Seller Tree
            dayswappers().payToTree{ value: _reward.mul(20).div(100) }(
                _Signer,
                [uint256(50), uint256(0), uint256(50)]
            );
            // Buyer Introducer
            dayswappers().payToIntroducer{ value: _reward.mul(20).div(100) }(
                msg.sender,
                [uint256(50), uint256(0), uint256(50)]
            );
            
            // Buyer Tree
            dayswappers().payToTree{ value: _reward.mul(20).div(100) }(
                msg.sender,
                [uint256(50), uint256(0), uint256(50)]
            );
            nrtManager().addToBurnPool{ value: _reward.mul(10).div(100) }();
            
            // Transfer rest amount to owner
            (bool _success, ) = payable(_Signer).call{ value: msg.value.sub(_reward) }("");
            require(_success, "CertiDApp: PROFIT_TRANSFER_FAILING");
            
            return hashedinput;
       }
        
        // function signCertificates(bytes32 hashedinput ) public {
        //     certificates[hashedinput].Signer.push(msg.sender);
        //     emit SignCertificate(hashedinput,msg.sender);
            
        // }
       
       function donate(bytes32 input) public payable{
           require(msg.value > 1 ether,"Invalid amount");
           certificates[input].Balance = certificates[input].Balance + msg.value;
           emit Donate(input,msg.sender);
           
           // Pay reward 
           address a = certificates[input].Verifier;
           uint256 _reward = msg.value.mul(Incentives[a]+1).div(100);
            
            //Seller Introducer
            dayswappers().payToIntroducer{ value: _reward.mul(20).div(100) }(
                a,
                [uint256(50), uint256(0), uint256(50)]
            );
            
            //Seller Tree
            dayswappers().payToTree{ value: _reward.mul(20).div(100) }(
                a,
                [uint256(50), uint256(0), uint256(50)]
            );
            // Buyer Introducer
            dayswappers().payToIntroducer{ value: _reward.mul(20).div(100) }(
                msg.sender,
                [uint256(50), uint256(0), uint256(50)]
            );
            
            // Buyer Tree
            dayswappers().payToTree{ value: _reward.mul(20).div(100) }(
                msg.sender,
                [uint256(50), uint256(0), uint256(50)]
            );
            nrtManager().addToBurnPool{ value: _reward.mul(10).div(100) }();
            
            // Transfer rest amount to owner
            (bool _success, ) = payable(a).call{ value: msg.value.sub(_reward) }("");
            require(_success, "CertiDApp: PROFIT_TRANSFER_FAILING");
          
       }
       function collect(bytes32 input) public payable  {
           require(msg.sender == certificates[input].Verifier,"You are not authorized for it");
           msg.sender.transfer(certificates[input].Balance);
           certificates[input].Balance = 0;
       }
       function getBalance(bytes32 input) public view returns(uint){
           return certificates[input].Balance;
       }
       // ------------------------------------------ for Signature Verification ----------------------------------------------------------
       function splitSignature(bytes memory sig) public pure returns (uint8, bytes32, bytes32){
            require(sig.length == 65);
            bytes32 r;
            bytes32 s;
            uint8 v;
    
            assembly {
                // first 32 bytes, after the length prefix
                r := mload(add(sig, 32))
                // second 32 bytes
                s := mload(add(sig, 64))
                // final byte (first byte of the next 32 bytes)
                v := byte(0, mload(add(sig, 96)))
            }
    
            return (v, r, s);
        }
        
         // Returns the address that signed a given string message
      function verifyString(string memory message, bytes memory signature) public pure  returns (address signer) {
        // The message header we will fill in the length next
        string memory header = "\x19Ethereum Signed Message:\n000000";
        uint256 lengthOffset;
        uint256 length;
        assembly {
          // The first word of a string is its length
          length := mload(message)
          // The beginning of the base-10 message length in the prefix
          lengthOffset := add(header, 57)
        }
        // Maximum length we support
        require(length <= 999999);
        // The length of the message's length in base-10
        uint256 lengthLength = 0;
        // The divisor to get the next left-most message length digit
        uint256 divisor = 100000;
        // Move one digit of the message length to the right at a time
        while (divisor != 0) {
          // The place value at the divisor
          uint256 digit = length / divisor;
          if (digit == 0) {
            // Skip leading zeros
            if (lengthLength == 0) {
              divisor /= 10;
              continue;
            }
          }
          // Found a non-zero digit or non-leading zero digit
          lengthLength++;
          // Remove this digit from the message length's current value
          length -= digit * divisor;
          // Shift our base-10 divisor over
          divisor /= 10;
          
          // Convert the digit to its ASCII representation (man ascii)
          digit += 0x30;
          // Move to the next character and write the digit
          lengthOffset++;
          assembly {
            mstore8(lengthOffset, digit)
          }
        }
        // The null string requires exactly 1 zero (unskip 1 leading 0)
        if (lengthLength == 0) {
          lengthLength = 1 + 0x19 + 1;
        } else {
          lengthLength += 1 + 0x19;
        }
        // Truncate the tailing zeros from the header
        assembly {
          mstore(header, lengthLength)
        }
        
        uint8 v;bytes32 r;bytes32 s;
    
            (v, r, s) = splitSignature(signature);
        // Perform the elliptic curve recover operation
        bytes32 check = keccak256(abi.encodePacked(header, message));
        return ecrecover(check, v, r, s);
      }
       
    }
