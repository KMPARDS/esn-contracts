import assert, { strictEqual } from 'assert';
import { ethers } from 'ethers';
import { parseReceipt, generateDepositProof, getBlockFinalizedToESN } from '../../utils';
import {
  NrtManagerFactory,
  TimeAllyManagerFactory,
  ValidatorManagerFactory,
  RandomnessManagerFactory,
  ValidatorSetFactory,
  BlockRewardFactory,
  PrepaidEsFactory,
  TimeAllyStakingFactory,
  DayswappersWithMigrationFactory,
  KycDappFactory,
  TimeAllyClubFactory,
  TimeAllyPromotionalBucketFactory,
  BetDeExFactory,
  BetFactory,
  BuildSurveyFactory,
  RentingDappManagerFactory,
} from '../../../build/typechain/ESN';
import {
  TransparentUpgradeableProxyFactory,
  ProxyAdminFactory,
} from '../../../build/typechain/@openzeppelin';
import { formatBytes32String } from 'ethers/lib/utils';

const MAX_SUPPLY = 91 * 10 ** 8;
const TOTAL_SUPPLY = 91 * 10 ** 7;
const EXTRA_AMOUNT = 10000;

export const DeployNext = () =>
  describe('Deploying Next Contracts', async () => {
    let proxyFactory: TransparentUpgradeableProxyFactory;

    it('deploys Proxy Admin contract on ESN from first account', async () => {
      const proxyAdminFactory = new ProxyAdminFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.proxyAdminInstanceESN = await proxyAdminFactory.deploy();
      await parseReceipt(global.proxyAdminInstanceESN.deployTransaction);

      assert.ok(global.proxyAdminInstanceESN.address, 'contract address should be present');
    });

    it('deploys Kyc Dapp contract on ESN from first account', async () => {
      proxyFactory = new TransparentUpgradeableProxyFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      const kycDappFactory = new KycDappFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      /**
       * Deploying Proxy for Kyc Dapp
       */
      const kycDappImplementation = await kycDappFactory.deploy();
      await parseReceipt(kycDappImplementation.deployTransaction);

      await parseReceipt(kycDappImplementation.initialize());

      const { data } = await kycDappImplementation.populateTransaction.initialize();
      // console.log({ data });

      const proxyInstance = await proxyFactory.deploy(
        kycDappImplementation.address,
        global.proxyAdminInstanceESN.address,
        data ?? '0x'
      );
      await parseReceipt(proxyInstance.deployTransaction);

      global.kycDappInstanceESN = KycDappFactory.connect(
        proxyInstance.address,
        global.providerESN.getSigner(global.accountsESN[0])
      );

      // await parseReceipt(global.kycDappInstanceESN.initialize());

      assert.ok(global.kycDappInstanceESN.address, 'contract address should be present');

      // checking if initialize has been called
      const owner = await global.kycDappInstanceESN.owner();
      strictEqual(owner, global.accountsESN[0], 'owner should be initialized');

      // setting in registry
      await setIdentityOwner('KYC_DAPP', global.kycDappInstanceESN);
      strictEqual(
        await global.kycDappInstanceESN.resolveAddress(formatBytes32String('KYC_DAPP')),
        global.kycDappInstanceESN.address,
        'kycDapp address should be set'
      );
    });

    it(`deploys NRT manager with ${MAX_SUPPLY - TOTAL_SUPPLY} ES`, async () => {
      // STEP 1 depositing to fundsManagerETH
      const receipt = await parseReceipt(
        global.esInstanceETH.transfer(
          global.fundsManagerInstanceETH.address,
          ethers.utils.parseEther(String(MAX_SUPPLY - TOTAL_SUPPLY + EXTRA_AMOUNT))
        )
      );

      // STEP 2 getting the bunch posted
      await getBlockFinalizedToESN(receipt.blockNumber);

      // Step 3 generate proof
      const depositProof = await generateDepositProof(receipt.transactionHash);

      // Step 4 submit proof to ETH
      await parseReceipt(global.fundsManagerInstanceESN.claimDeposit(depositProof));

      const nrtManagerFactory = new NrtManagerFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      const initialNRTBalance = ethers.utils.parseEther(String(MAX_SUPPLY - TOTAL_SUPPLY));

      /**
       * Deploying Proxy for NRT Manager
       */
      const nrtManagerImplementation = await nrtManagerFactory.deploy();
      await parseReceipt(nrtManagerImplementation.deployTransaction);

      const { data } = await nrtManagerImplementation.populateTransaction.initialize();
      // console.log({ data });

      const proxyInstance = await proxyFactory.deploy(
        nrtManagerImplementation.address,
        global.proxyAdminInstanceESN.address,
        data ?? '0x',
        {
          value: initialNRTBalance,
        }
      );
      await parseReceipt(proxyInstance.deployTransaction);

      global.nrtInstanceESN = NrtManagerFactory.connect(
        proxyInstance.address,
        global.providerESN.getSigner(global.accountsESN[0])
      );

      // await parseReceipt(
      //   global.nrtInstanceESN.initialize({
      //     value: initialNRTBalance,
      //   })
      // );

      // checking if initialize has been called
      const owner = await global.nrtInstanceESN.owner();
      strictEqual(owner, global.accountsESN[0], 'owner should be initialized');

      assert.ok(global.nrtInstanceESN.address, 'contract address should be present');

      const nrtBalance = await global.providerESN.getBalance(global.nrtInstanceESN.address);
      assert.deepEqual(nrtBalance, initialNRTBalance, 'nrt balance should be correct');

      // setting in registry
      await setIdentityOwner('NRT_MANAGER', global.nrtInstanceESN);
      strictEqual(
        await global.kycDappInstanceESN.nrtManager(),
        global.nrtInstanceESN.address,
        'nrtInstanceESN address should be set'
      );
    });

    it('deploys TimeAlly Manager contract on ESN from first account', async () => {
      const timeAllyManagerFactory = new TimeAllyManagerFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      /**
       * Deploying Proxy for TimeAlly Manager
       */
      const timeallyImplementation = await timeAllyManagerFactory.deploy();
      await parseReceipt(timeallyImplementation.deployTransaction);

      await parseReceipt(timeallyImplementation.initialize());

      const { data } = await timeallyImplementation.populateTransaction.initialize();

      const proxyInstance = await proxyFactory.deploy(
        timeallyImplementation.address,
        global.proxyAdminInstanceESN.address,
        data ?? '0x'
      );
      await parseReceipt(proxyInstance.deployTransaction);

      global.timeallyInstanceESN = TimeAllyManagerFactory.connect(
        proxyInstance.address,
        global.providerESN.getSigner(global.accountsESN[0])
      );

      // await parseReceipt(global.timeallyInstanceESN.initialize());

      assert.ok(global.timeallyInstanceESN.address, 'contract address should be present');

      // checking if initialize has been called
      const owner = await global.timeallyInstanceESN.owner();
      strictEqual(owner, global.accountsESN[0], 'owner should be initialized');

      // setting in registry
      await setIdentityOwner('TIMEALLY_MANAGER', global.timeallyInstanceESN);
      strictEqual(
        await global.kycDappInstanceESN.timeallyManager(),
        global.timeallyInstanceESN.address,
        'timeallyInstanceESN address should be set'
      );
    });

    // proxy is not used in case of staking target
    it('deploys TimeAlly Staking Target contract on ESN from first account', async () => {
      const timeAllyStakingFactory = new TimeAllyStakingFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.timeallyStakingTargetInstanceESN = await timeAllyStakingFactory.deploy();
      await parseReceipt(global.timeallyStakingTargetInstanceESN.deployTransaction);

      assert.ok(
        global.timeallyStakingTargetInstanceESN.address,
        'contract address should be present'
      );

      // setting in registry
      await setIdentityOwner('TIMEALLY_STAKING_TARGET', global.timeallyStakingTargetInstanceESN);
    });

    it('deploys TimeAlly Club contract on ESN from first account', async () => {
      const timeAllyClubFactory = new TimeAllyClubFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      /**
       * Deploying Proxy for TimeAlly Club
       */
      const timeallyClubImplementation = await timeAllyClubFactory.deploy();
      await parseReceipt(timeallyClubImplementation.deployTransaction);

      await parseReceipt(timeallyClubImplementation.initialize());

      const { data } = await timeallyClubImplementation.populateTransaction.initialize();

      const proxyInstance = await proxyFactory.deploy(
        timeallyClubImplementation.address,
        global.proxyAdminInstanceESN.address,
        data ?? '0x'
      );
      await parseReceipt(proxyInstance.deployTransaction);

      global.timeallyClubInstanceESN = TimeAllyClubFactory.connect(
        proxyInstance.address,
        global.providerESN.getSigner(global.accountsESN[0])
      );

      // await parseReceipt(global.timeallyClubInstanceESN.initialize());

      assert.ok(global.timeallyClubInstanceESN.address, 'contract address should be present');

      // checking if initialize has been called
      const owner = await global.timeallyClubInstanceESN.owner();
      strictEqual(owner, global.accountsESN[0], 'owner should be initialized');

      // setting in registry
      await setIdentityOwner('TIMEALLY_CLUB', global.timeallyClubInstanceESN);
      strictEqual(
        await global.kycDappInstanceESN.timeallyClub(),
        global.timeallyClubInstanceESN.address,
        'timeallyClubInstanceESN address should be set'
      );
    });

    it('deploys TimeAlly Promotional Bucket contract on ESN from first account', async () => {
      const timeAllyPromotionalBucketFactory = new TimeAllyPromotionalBucketFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      /**
       * Deploying Proxy for TimeAlly Promotional bucket
       */
      const timeallyPromotionalBucketImplementation = await timeAllyPromotionalBucketFactory.deploy();
      await parseReceipt(timeallyPromotionalBucketImplementation.deployTransaction);

      await parseReceipt(timeallyPromotionalBucketImplementation.initialize());

      const {
        data,
      } = await timeallyPromotionalBucketImplementation.populateTransaction.initialize();

      const proxyInstance = await proxyFactory.deploy(
        timeallyPromotionalBucketImplementation.address,
        global.proxyAdminInstanceESN.address,
        data ?? '0x'
      );
      await parseReceipt(proxyInstance.deployTransaction);

      global.timeallyPromotionalBucketESN = TimeAllyPromotionalBucketFactory.connect(
        proxyInstance.address,
        global.providerESN.getSigner(global.accountsESN[0])
      );

      // await parseReceipt(global.timeallyPromotionalBucketESN.initialize());

      assert.ok(global.timeallyPromotionalBucketESN.address, 'contract address should be present');

      // checking if initialize has been called
      const owner = await global.timeallyPromotionalBucketESN.owner();
      strictEqual(owner, global.accountsESN[0], 'owner should be initialized');

      // setting in registry
      await setIdentityOwner('TIMEALLY_PROMOTIONAL_BUCKET', global.timeallyPromotionalBucketESN);
      strictEqual(
        await global.kycDappInstanceESN.timeallyPromotionalBucket(),
        global.timeallyPromotionalBucketESN.address,
        'timeallyPromotionalBucketESN address should be set'
      );
    });

    // proxy is not configured for this contract
    it('deploys Validator Set contract', async () => {
      const validatorSetFactory = new ValidatorSetFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.validatorSetESN = await validatorSetFactory.deploy(
        global.validatorWallets.map((w) => w.address).slice(0, 3),
        global.accountsESN[0] // in actual deployment this should be zero address
      );
      await parseReceipt(global.validatorSetESN.deployTransaction);

      assert.ok(global.validatorSetESN.address, 'contract address should be present');

      // setting in registry
      await setIdentityOwner('VALIDATOR_SET', global.validatorSetESN);
    });

    it('deploys Block Reward contract', async () => {
      const blockRewardFactory = new BlockRewardFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      /**
       * Deploying Proxy for Block Reward Manager
       */
      const blockRewardImplementation = await blockRewardFactory.deploy();
      await parseReceipt(blockRewardImplementation.deployTransaction);

      await parseReceipt(blockRewardImplementation.initialize(ethers.constants.AddressZero));

      const { data } = await blockRewardImplementation.populateTransaction.initialize(
        global.accountsESN[0]
      );

      const proxyInstance = await proxyFactory.deploy(
        blockRewardImplementation.address,
        global.proxyAdminInstanceESN.address,
        data ?? '0x'
      );
      await parseReceipt(proxyInstance.deployTransaction);

      global.blockRewardESN = BlockRewardFactory.connect(
        proxyInstance.address,
        global.providerESN.getSigner(global.accountsESN[0])
      );

      // await parseReceipt(global.blockRewardESN.initialize(global.accountsESN[0]));

      // checking if initialize has been called
      const owner = await global.blockRewardESN.owner();
      strictEqual(owner, global.accountsESN[0], 'owner should be initialized');

      const systemAddr = await global.blockRewardESN.SYSTEM_ADDRESS();
      strictEqual(systemAddr, global.accountsESN[0], 'system addr should be set as acc0');

      assert.ok(global.blockRewardESN.address, 'contract address should be present');

      // setting in registry
      await setIdentityOwner('BLOCK_REWARD', global.blockRewardESN);
    });

    it('deploys Validator Manager contract on ESN from first account', async () => {
      const validatorManagerFactory = new ValidatorManagerFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      /**
       * Deploying Proxy for Validator Manager
       */
      const validatorManagerImplementation = await validatorManagerFactory.deploy();
      await parseReceipt(validatorManagerImplementation.deployTransaction);

      await parseReceipt(validatorManagerImplementation.initialize());

      const { data } = await validatorManagerImplementation.populateTransaction.initialize();

      const proxyInstance = await proxyFactory.deploy(
        validatorManagerImplementation.address,
        global.proxyAdminInstanceESN.address,
        data ?? '0x'
      );
      await parseReceipt(proxyInstance.deployTransaction);

      global.validatorManagerESN = ValidatorManagerFactory.connect(
        proxyInstance.address,
        global.providerESN.getSigner(global.accountsESN[0])
      );

      // await parseReceipt(global.validatorManagerESN.initialize());

      assert.ok(global.validatorManagerESN.address, 'contract address should be present');

      // checking if initialize has been called
      const owner = await global.validatorManagerESN.owner();
      strictEqual(owner, global.accountsESN[0], 'owner should be initialized');

      // setting in registry
      await setIdentityOwner('VALIDATOR_MANAGER', global.validatorManagerESN);
      strictEqual(
        await global.kycDappInstanceESN.validatorManager(),
        global.validatorManagerESN.address,
        'validatorManagerESN address should be set'
      );
    });

    it('deploys Randomness Manager contract on ESN from first account', async () => {
      const randomnessManagerFactory = new RandomnessManagerFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      /**
       * Deploying Proxy for Randomness Manager
       */
      const randomnessImplementation = await randomnessManagerFactory.deploy();
      await parseReceipt(randomnessImplementation.deployTransaction);

      // await randomnessImplementation.initialize();

      const proxyInstance = await proxyFactory.deploy(
        randomnessImplementation.address,
        global.proxyAdminInstanceESN.address,
        '0x'
      );
      await parseReceipt(proxyInstance.deployTransaction);

      global.randomnessMangerESN = RandomnessManagerFactory.connect(
        proxyInstance.address,
        global.providerESN.getSigner(global.accountsESN[0])
      );

      // await global.randomnessMangerESN.initialize();

      assert.ok(global.randomnessMangerESN.address, 'contract address should be present');

      // setting in registry
      await setIdentityOwner('RANDOMNESS_MANAGER', global.randomnessMangerESN);
    });

    it('deploys PrepaidES contract on ESN from first account', async () => {
      const prepaidEsFactory = new PrepaidEsFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      /**
       * Deploying Proxy for Prepaid ES
       */
      const prepaidImplementation = await prepaidEsFactory.deploy();
      await parseReceipt(prepaidImplementation.deployTransaction);

      await prepaidImplementation.initialize();

      const { data } = await prepaidImplementation.populateTransaction.initialize();

      const proxyInstance = await proxyFactory.deploy(
        prepaidImplementation.address,
        global.proxyAdminInstanceESN.address,
        data ?? '0x'
      );
      await parseReceipt(proxyInstance.deployTransaction);

      global.prepaidEsInstanceESN = PrepaidEsFactory.connect(
        proxyInstance.address,
        global.providerESN.getSigner(global.accountsESN[0])
      );

      // await global.prepaidEsInstanceESN.initialize();

      assert.ok(global.prepaidEsInstanceESN.address, 'contract address should be present');

      // checking if initialize has been called
      const owner = await global.prepaidEsInstanceESN.owner();
      strictEqual(owner, global.accountsESN[0], 'owner should be initialized');

      // setting in registry
      await setIdentityOwner('PREPAID_ES', global.prepaidEsInstanceESN);
      strictEqual(
        await global.kycDappInstanceESN.prepaidEs(),
        global.prepaidEsInstanceESN.address,
        'prepaidEsInstanceESN address should be set'
      );
    });

    it('deploys Dayswappers contract on ESN from first account', async () => {
      const dayswappersFactory = new DayswappersWithMigrationFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      /**
       * Deploying Proxy for Dayswappers
       */
      const dayswappersImplementation = await dayswappersFactory.deploy();
      await parseReceipt(dayswappersImplementation.deployTransaction);

      await parseReceipt(dayswappersImplementation.initialize([]));

      const { data } = await dayswappersImplementation.populateTransaction.initialize([
        { required: 0, distributionPercent: 0, leadershipPercent: 0 },
        { required: 5, distributionPercent: 20, leadershipPercent: 0 },
        { required: 20, distributionPercent: 40, leadershipPercent: 0 },
        { required: 100, distributionPercent: 52, leadershipPercent: 0 },
        { required: 500, distributionPercent: 64, leadershipPercent: 0 },
        { required: 2000, distributionPercent: 72, leadershipPercent: 4 },
        { required: 6000, distributionPercent: 84, leadershipPercent: 4 },
        { required: 10000, distributionPercent: 90, leadershipPercent: 2 },
      ]);

      const proxyInstance = await proxyFactory.deploy(
        dayswappersImplementation.address,
        global.proxyAdminInstanceESN.address,
        data ?? '0x'
      );
      await parseReceipt(proxyInstance.deployTransaction);

      global.dayswappersInstanceESN = DayswappersWithMigrationFactory.connect(
        proxyInstance.address,
        global.providerESN.getSigner(global.accountsESN[0])
      );

      // await parseReceipt(
      //   global.dayswappersInstanceESN.initialize([
      //     { required: 0, distributionPercent: 0, leadershipPercent: 0 },
      //     { required: 5, distributionPercent: 20, leadershipPercent: 0 },
      //     { required: 20, distributionPercent: 40, leadershipPercent: 0 },
      //     { required: 100, distributionPercent: 52, leadershipPercent: 0 },
      //     { required: 500, distributionPercent: 64, leadershipPercent: 0 },
      //     { required: 2000, distributionPercent: 72, leadershipPercent: 4 },
      //     { required: 6000, distributionPercent: 84, leadershipPercent: 4 },
      //     { required: 10000, distributionPercent: 90, leadershipPercent: 2 },
      //   ])
      // );

      assert.ok(global.dayswappersInstanceESN.address, 'contract address should be present');

      const owner = await global.dayswappersInstanceESN.owner();
      strictEqual(owner, global.accountsESN[0], 'ERC-173 owner should be deployer');

      // setting in registry
      await setIdentityOwner('DAYSWAPPERS', global.dayswappersInstanceESN);
      strictEqual(
        await global.kycDappInstanceESN.dayswappers(),
        global.dayswappersInstanceESN.address,
        'dayswappersInstanceESN address should be set'
      );
    });

    it('setting charityDapp identity in kycDapp', async () => {
      // setting in registry
      await setIdentityOwner('CHARITY_DAPP', ethers.Wallet.createRandom());
    });

    it('deploys BetDeEx contract on ESN from first account', async () => {
      const betdeexFactory = new BetDeExFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.betdeexInstanceESN = await betdeexFactory.deploy();

      assert.ok(global.betdeexInstanceESN.address, 'contract address should be present');

      // setting in registry
      await setIdentityOwner('BETDEEX', global.betdeexInstanceESN);
      strictEqual(
        await global.kycDappInstanceESN.resolveAddress(formatBytes32String('BETDEEX')),
        global.betdeexInstanceESN.address,
        'betdeexInstanceESN address should be set'
      );
    });

    it('deploys Bet implementation contract on ESN from first account', async () => {
      const betFactory = new BetFactory(global.providerESN.getSigner(global.accountsESN[0]));

      global.betImplementaionInstanceESN = await betFactory.deploy();

      assert.ok(global.betImplementaionInstanceESN.address, 'contract address should be present');

      // setting in registry
      await setIdentityOwner('BET_IMPLEMENTATION', global.betImplementaionInstanceESN);
      strictEqual(
        await global.kycDappInstanceESN.resolveAddress(formatBytes32String('BET_IMPLEMENTATION')),
        global.betImplementaionInstanceESN.address,
        'betImplementaionInstanceESN address should be set'
      );
    });

    it('deploys BuildSurvey contract on ESN from first account', async () => {
      // first deploy contract
      const buildSurveyFactory = new BuildSurveyFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );
      global.buildSurveyInstanceESN = await buildSurveyFactory.deploy();
      //
      // then check whether address is present
      assert.ok(global.buildSurveyInstanceESN.address, 'contract address should be present');
      //
      // register our contract in KycDapp with name BUILD_SURVEY
      await setIdentityOwner('BUILD_SURVEY', global.buildSurveyInstanceESN);
      //
      // check if it got the name BUILD_SURVEY
      assert.strictEqual(
        await global.kycDappInstanceESN.resolveAddress(formatBytes32String('BUILD_SURVEY')),
        global.buildSurveyInstanceESN.address,
        'buildSurveyInstanceESN address should be set'
      );
    });

    it('deploys RentingDappManager contract on ESN from first account', async () => {
      // first deploy contract
      const rentingDappManagerFactory = new RentingDappManagerFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );
      global.rentingDappManagerInstanceESN = await rentingDappManagerFactory.deploy();

      // then check whether address is present
      assert.ok(global.rentingDappManagerInstanceESN.address, 'contract address should be present');

      // register our contract in KycDapp with name RENTING_DAPP
      await setIdentityOwner('RENTING_DAPP', global.rentingDappManagerInstanceESN);

      // check if it got the name RENTING_DAPP
      assert.strictEqual(
        await global.kycDappInstanceESN.resolveAddress(formatBytes32String('RENTING_DAPP')),
        global.rentingDappManagerInstanceESN.address,
        'rentingDappManagerInstanceESN address should be set'
      );
    });
  });

async function setIdentityOwner(username: string, contract: ethers.Contract | { address: string }) {
  await parseReceipt(
    global.kycDappInstanceESN.setIdentityOwner(
      formatBytes32String(username),
      contract.address,
      true,
      1
    )
  );
  strictEqual(
    await global.kycDappInstanceESN.resolveAddress(formatBytes32String(username)),
    contract.address,
    `${username} address should set in registry`
  );
}
