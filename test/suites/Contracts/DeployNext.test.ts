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
} from '../../../build/typechain/ESN';
import { formatBytes32String } from 'ethers/lib/utils';

const MAX_SUPPLY = 91 * 10 ** 8;
const TOTAL_SUPPLY = 91 * 10 ** 7;
const EXTRA_AMOUNT = 10000;
const NRT_MONTH = 0;

export const DeployNext = () =>
  describe('Deploying Next Contracts', async () => {
    it('deploys Kyc Dapp contract on ESN from first account', async () => {
      const kycDappFactory = new KycDappFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.kycDappInstanceESN = await kycDappFactory.deploy();
      await parseReceipt(global.kycDappInstanceESN.deployTransaction);

      assert.ok(global.kycDappInstanceESN.address, 'contract address should be present');

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
      global.nrtInstanceESN = await nrtManagerFactory.deploy({
        value: initialNRTBalance,
      });
      await parseReceipt(global.nrtInstanceESN.deployTransaction);

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

      global.timeallyInstanceESN = await timeAllyManagerFactory.deploy();
      await parseReceipt(global.timeallyInstanceESN.deployTransaction);

      assert.ok(global.timeallyInstanceESN.address, 'contract address should be present');

      // setting in registry
      await setIdentityOwner('TIMEALLY_MANAGER', global.timeallyInstanceESN);
      strictEqual(
        await global.kycDappInstanceESN.timeallyManager(),
        global.timeallyInstanceESN.address,
        'timeallyInstanceESN address should be set'
      );
    });

    it('deploys TimeAlly Staking Target contract on ESN from first account', async () => {
      const timeAllyStakingFactory = new TimeAllyStakingFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.timeallyStakingTargetInstanceESN = await timeAllyStakingFactory.deploy();
      await parseReceipt(global.timeallyInstanceESN.deployTransaction);

      assert.ok(global.timeallyInstanceESN.address, 'contract address should be present');

      // setting in registry
      await setIdentityOwner('TIMEALLY_STAKING_TARGET', global.timeallyStakingTargetInstanceESN);
    });

    it('deploys TimeAlly Club contract on ESN from first account', async () => {
      const timeAllyClubFactory = new TimeAllyClubFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.timeallyClubInstanceESN = await timeAllyClubFactory.deploy();
      await parseReceipt(global.timeallyClubInstanceESN.deployTransaction);

      assert.ok(global.timeallyClubInstanceESN.address, 'contract address should be present');

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

      global.timeallyPromotionalBucketESN = await timeAllyPromotionalBucketFactory.deploy();
      await parseReceipt(global.timeallyClubInstanceESN.deployTransaction);

      assert.ok(global.timeallyPromotionalBucketESN.address, 'contract address should be present');

      // setting in registry
      await setIdentityOwner('TIMEALLY_PROMOTIONAL_BUCKET', global.timeallyPromotionalBucketESN);
      strictEqual(
        await global.kycDappInstanceESN.timeallyPromotionalBucket(),
        global.timeallyPromotionalBucketESN.address,
        'timeallyPromotionalBucketESN address should be set'
      );
    });

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

      global.blockRewardESN = await blockRewardFactory.deploy(global.accountsESN[0]);
      await parseReceipt(global.blockRewardESN.deployTransaction);

      assert.ok(global.blockRewardESN.address, 'contract address should be present');

      // setting in registry
      await setIdentityOwner('BLOCK_REWARD', global.blockRewardESN);
    });

    it('deploys Validator Manager contract on ESN from first account', async () => {
      const validatorManagerFactory = new ValidatorManagerFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.validatorManagerESN = await validatorManagerFactory.deploy();
      await parseReceipt(global.validatorManagerESN.deployTransaction);

      assert.ok(global.validatorManagerESN.address, 'contract address should be present');

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

      global.randomnessMangerESN = await randomnessManagerFactory.deploy();
      await parseReceipt(global.randomnessMangerESN.deployTransaction);

      assert.ok(global.randomnessMangerESN.address, 'contract address should be present');

      // setting in registry
      await setIdentityOwner('RANDOMNESS_MANAGER', global.randomnessMangerESN);
    });

    it('deploys PrepaidES contract on ESN from first account', async () => {
      const prepaidEsFactory = new PrepaidEsFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.prepaidEsInstanceESN = await prepaidEsFactory.deploy();
      await parseReceipt(global.prepaidEsInstanceESN.deployTransaction);

      assert.ok(global.prepaidEsInstanceESN.address, 'contract address should be present');

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

      global.dayswappersInstanceESN = await dayswappersFactory.deploy([
        { required: 0, distributionPercent: 0, leadershipPercent: 0 },
        { required: 5, distributionPercent: 20, leadershipPercent: 0 },
        { required: 20, distributionPercent: 40, leadershipPercent: 0 },
        { required: 100, distributionPercent: 52, leadershipPercent: 0 },
        { required: 500, distributionPercent: 64, leadershipPercent: 0 },
        { required: 2000, distributionPercent: 72, leadershipPercent: 4 },
        { required: 6000, distributionPercent: 84, leadershipPercent: 4 },
        { required: 10000, distributionPercent: 90, leadershipPercent: 2 },
      ]);
      await parseReceipt(global.dayswappersInstanceESN.deployTransaction);

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
  });

async function setIdentityOwner(username: string, contract: ethers.Contract | { address: string }) {
  await parseReceipt(
    global.kycDappInstanceESN.setIdentityOwner(
      formatBytes32String(username),
      contract.address,
      true
    )
  );
  strictEqual(
    await global.kycDappInstanceESN.resolveAddress(formatBytes32String(username)),
    contract.address,
    `${username} address should set in registry`
  );
}
