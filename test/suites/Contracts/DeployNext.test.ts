import assert from 'assert';
import { ethers } from 'ethers';
import { parseReceipt, generateDepositProof, getBlockFinalizedToESN } from '../../utils';
import { NrtManagerFactory, TimeAllyManagerFactory } from '../../../build/typechain/ESN';

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

      global.timeallyInstance = await timeAllyManagerFactory.deploy();
      await parseReceipt(global.timeallyInstance.deployTransaction);

      assert.ok(global.timeallyInstance.address, 'contract address should be present');
    });
  });
