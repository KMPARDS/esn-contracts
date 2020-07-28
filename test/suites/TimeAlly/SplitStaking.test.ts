import { ethers } from 'ethers';
import assert from 'assert';
import { getTimeAllyStakings, parseReceipt, releaseNrt } from '../../utils';

const tempWallet = ethers.Wallet.createRandom();
const amount = ethers.utils.parseEther('100');
const splitAmount = ethers.utils.parseEther('40');

const {
  utils: { formatEther },
} = ethers;

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

      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      const totalActiveStakingsBefore = await Promise.all(
        Object.keys([...Array(15)])
          .map((key) => currentMonth.add(+key - 1))
          .map((month) => global.timeallyInstanceESN.getTotalActiveStaking(month))
      );

      await parseReceipt(stakingInstance.split(splitAmount));

      const totalActiveStakingsAfter = await Promise.all(
        Object.keys([...Array(15)])
          .map((key) => currentMonth.add(+key - 1))
          .map((month) => global.timeallyInstanceESN.getTotalActiveStaking(month))
      );

      // console.log(totalActiveStakingsBefore.map(formatEther));
      // console.log(totalActiveStakingsAfter.map(formatEther));

      const stakingsAfter = await getTimeAllyStakings(tempWallet.address);
      assert.strictEqual(stakingsAfter.length, 2, 'there should be 2 stakings after split');

      const issTimeAfter = await stakingInstance.issTimeLimit();
      const principalAfter = await stakingInstance.nextMonthPrincipalAmount();

      assert.strictEqual(
        formatEther(principalBefore.sub(principalAfter)),
        formatEther(splitAmount),
        'principal should be reduced by splitAmount'
      );

      assert.ok(
        issTimeBefore.mul(principalAfter).div(principalBefore).sub(issTimeAfter).lte(1), // due to round off
        'isstime should be reduced in master as proportional'
      );

      const childStaking = stakingsAfter[1];
      const childIssTime = await childStaking.issTimeLimit();
      assert.strictEqual(
        formatEther(childIssTime.add(issTimeAfter)),
        formatEther(issTimeBefore),
        'isstime in child and master should sum up to earlier one'
      );

      for (const [key] of totalActiveStakingsBefore.entries()) {
        if (key === 13) {
          assert.strictEqual(
            formatEther(totalActiveStakingsBefore[key].add(splitAmount)),
            formatEther(totalActiveStakingsAfter[key]),
            'should increase total active stakings for further months'
          );
        } else {
          assert.strictEqual(
            formatEther(totalActiveStakingsBefore[key]),
            formatEther(totalActiveStakingsAfter[key]),
            'should not change any total active stakings for common months'
          );
        }
      }
    });
  });
