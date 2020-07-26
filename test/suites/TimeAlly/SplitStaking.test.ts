import { ethers } from 'ethers';
import assert from 'assert';
import { getTimeAllyStakings, parseReceipt } from '../../utils';

const tempWallet = ethers.Wallet.createRandom();
const amount = ethers.utils.parseEther('100');

export const SplitStaking = () =>
  describe('Split Staking', () => {
    it('splits a staking', async () => {
      await global.providerESN.getSigner(0).sendTransaction({
        to: tempWallet.address,
        value: amount,
      });

      const balance = await global.providerESN.getBalance(tempWallet.address);
      assert.ok(balance.gte(amount), 'should receive balance to create a new staking');

      await parseReceipt(
        global.timeallyInstanceESN.connect(tempWallet.connect(global.providerESN)).stake({
          value: amount,
        })
      );

      const stakings = await getTimeAllyStakings(tempWallet.address);
      assert.strictEqual(stakings.length, 1, 'there should be 1 staking that we just created');

      const stakingInstance = stakings[0];
      await parseReceipt(
        stakingInstance.connect(tempWallet.connect(global.providerESN)).split(amount.div(2))
      );

      const stakingsAfter = await getTimeAllyStakings(tempWallet.address);

      assert.strictEqual(stakingsAfter.length, 2, 'there should be 2 stakings after split');
    });
  });
