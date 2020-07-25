import assert from 'assert';
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
} from '../../../build/typechain/ESN';

const MAX_SUPPLY = 91 * 10 ** 8;
const TOTAL_SUPPLY = 91 * 10 ** 7;
const NRT_MONTH = 0;

export const DeployNext = () =>
  describe('Deploying Next Contracts', async () => {
    it(`deploys NRT manager with ${MAX_SUPPLY - TOTAL_SUPPLY} ES`, async () => {
      // STEP 1 depositing to fundsManagerETH
      const receipt = await parseReceipt(
        global.esInstanceETH.transfer(
          global.fundsManagerInstanceETH.address,
          ethers.utils.parseEther(String(MAX_SUPPLY - TOTAL_SUPPLY))
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
    });

    it('deploys TimeAlly Manager contract on ESN from first account', async () => {
      const timeAllyManagerFactory = new TimeAllyManagerFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.timeallyInstanceESN = await timeAllyManagerFactory.deploy();
      await parseReceipt(global.timeallyInstanceESN.deployTransaction);

      assert.ok(global.timeallyInstanceESN.address, 'contract address should be present');
    });

    it('deploys TimeAlly Staking Target contract on ESN from first account', async () => {
      const timeAllyStakingFactory = new TimeAllyStakingFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.timeallyStakingTargetInstanceESN = await timeAllyStakingFactory.deploy();
      await parseReceipt(global.timeallyInstanceESN.deployTransaction);

      assert.ok(global.timeallyInstanceESN.address, 'contract address should be present');
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
    });

    it('deploys Block Reward contract', async () => {
      const blockRewardFactory = new BlockRewardFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.blockRewardESN = await blockRewardFactory.deploy(global.accountsESN[0]);
      await parseReceipt(global.blockRewardESN.deployTransaction);

      assert.ok(global.blockRewardESN.address, 'contract address should be present');
    });

    it('deploys Validator Manager contract on ESN from first account', async () => {
      const validatorManagerFactory = new ValidatorManagerFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.validatorManagerESN = await validatorManagerFactory.deploy();
      await parseReceipt(global.validatorManagerESN.deployTransaction);

      assert.ok(global.validatorManagerESN.address, 'contract address should be present');
    });

    it('deploys Randomness Manager contract on ESN from first account', async () => {
      const randomnessManagerFactory = new RandomnessManagerFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.randomnessMangerESN = await randomnessManagerFactory.deploy();
      await parseReceipt(global.randomnessMangerESN.deployTransaction);

      assert.ok(global.randomnessMangerESN.address, 'contract address should be present');
    });

    it('deploy PrepaidES contract on ESN from first account', async () => {
      const prepaidEsFactory = new PrepaidEsFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.prepaidEsInstanceESN = await prepaidEsFactory.deploy();
      await parseReceipt(global.prepaidEsInstanceESN.deployTransaction);

      assert.ok(global.prepaidEsInstanceESN.address, 'contract address should be present');
    });
  });
