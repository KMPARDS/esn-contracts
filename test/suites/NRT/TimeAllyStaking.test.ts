import assert from 'assert';
import { ethers } from 'ethers';
import { parseReceipt, getBlockFinalizedToESN, generateDepositProof } from '../../utils';

export const TimeAllyStaking = () =>
  describe('TimeAlly Staking', () => {
    it('tries to stake 0 ES expecting revert', async () => {
      try {
        await parseReceipt(global.timeallyInstance.stake(0));

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        assert.ok(msg.includes('TimeAlly: No value'), `Invalid error message: ${msg}`);
      }
    });

    it('stakes 100 ES tokens in TimeAlly', async () => {
      // STEP 1 depositing to fundsManagerETH
      const receipt = await parseReceipt(
        global.esInstanceETH.transfer(
          global.fundsManagerInstanceETH.address,
          ethers.utils.parseEther('1000')
        )
      );

      // STEP 2 getting the bunch posted
      await getBlockFinalizedToESN(receipt.blockNumber);

      // Step 3 generate proof
      const depositProof = await generateDepositProof(receipt.transactionHash);

      // Step 4 submit proof to ETH
      await parseReceipt(global.fundsManagerInstanceESN.claimDeposit(depositProof));

      // Step 5 staking
      await parseReceipt(
        global.timeallyInstance.stake(0, {
          value: ethers.utils.parseEther('100'),
        })
      );
    });
  });
