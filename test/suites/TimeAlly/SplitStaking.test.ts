import { ethers } from 'ethers';
import assert from 'assert';
import { getTimeAllyStakings, parseReceipt, releaseNrt } from '../../utils';

const tempWallet = ethers.Wallet.createRandom();
const amount = ethers.utils.parseEther('100');
const splitAmount = ethers.utils.parseEther('40');

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

      const stakingsBefore = await getTimeAllyStakings(tempWallet.address);
      assert.strictEqual(
        stakingsBefore.length,
        1,
        'there should be 1 staking that we just created'
      );

      const stakingInstance = stakingsBefore[0].connect(tempWallet.connect(global.providerESN));
      await releaseNrt();
      await stakingInstance.withdrawMonthlyNRT([await global.nrtInstanceESN.currentNrtMonth()], 2);

      const issTimeBefore = await stakingInstance.issTimeLimit();
      const principalBefore = await stakingInstance.nextMonthPrincipalAmount();

      await parseReceipt(stakingInstance.split(splitAmount));

      const stakingsAfter = await getTimeAllyStakings(tempWallet.address);
      assert.strictEqual(stakingsAfter.length, 2, 'there should be 2 stakings after split');

      const issTimeAfter = await stakingInstance.issTimeLimit();
      const principalAfter = await stakingInstance.nextMonthPrincipalAmount();

      assert.deepEqual(
        principalBefore.sub(principalAfter),
        splitAmount,
        'principal should be reduced by splitAmount'
      );

      assert.ok(
        issTimeBefore.mul(principalAfter).div(principalBefore).sub(issTimeAfter).lte(1), // due to round off
        'isstime should be reduced in master as proportional'
      );

      const childStaking = stakingsAfter[1];
      const childIssTime = await childStaking.issTimeLimit();
      assert.strictEqual(
        ethers.utils.formatEther(childIssTime.add(issTimeAfter)),
        ethers.utils.formatEther(issTimeBefore),
        'isstime in child and master should sum up to earlier one'
      );
    });
  });
