import { ethers } from 'ethers';
import assert from 'assert';
import { getTimeAllyStakings, parseReceipt, releaseNrt } from '../../utils';
import { start } from 'repl';

const tempWallet = ethers.Wallet.createRandom();
const amount = ethers.utils.parseEther('100');
const splitAmount = ethers.utils.parseEther('40');

const {
  utils: { parseEther, formatEther },
} = ethers;

export const SplitStaking = () =>
  describe('Split Staking', () => {
    before(async () => {
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
    });

    it('checks fees for next 3 years', async () => {
      const stakingInstances = await getTimeAllyStakings(tempWallet.address);
      const startMonth = (await stakingInstances[0].startMonth()).toNumber();
      for (let i = startMonth - 1; i < 50; i++) {
        const fee1 = await stakingInstances[0].getSplitFee(parseEther('100'), i);
        const fee2 = await stakingInstances[0].getSplitFee(parseEther('200'), i);

        // console.log(i, i - startMonth, formatEther(fee1));

        let expectedFee1: string;
        let expectedFee2: string;
        const relativeMonth = i - startMonth;
        if (relativeMonth <= 12) {
          expectedFee1 = '3.0';
          expectedFee2 = '6.0';
        } else if (relativeMonth <= 24) {
          expectedFee1 = '2.0';
          expectedFee2 = '4.0';
        } else if (relativeMonth <= 36) {
          expectedFee1 = '1.0';
          expectedFee2 = '2.0';
        } else {
          expectedFee1 = '0.0';
          expectedFee2 = '0.0';
        }

        assert.strictEqual(
          formatEther(fee1),
          expectedFee1,
          `should charge ${expectedFee1} for relative month ${relativeMonth}`
        );
        assert.strictEqual(
          formatEther(fee2),
          expectedFee2,
          `should charge ${expectedFee2} for relative month ${relativeMonth}`
        );
      }
    });

    it('tries to split staking without paying split fees', async () => {
      try {
        const stakingInstances = await getTimeAllyStakings(tempWallet.address);
        await stakingInstances[0]
          .connect(tempWallet.connect(global.providerESN))
          .split(splitAmount);

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        assert.ok(msg.includes('Insufficient split fees'), `Invalid error message: ${msg}`);
      }
    });

    it('splits a staking', async () => {
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

      const fee = await stakingInstance.getSplitFee(splitAmount, currentMonth);
      await global.providerESN.getSigner(0).sendTransaction({
        to: tempWallet.address,
        value: fee,
      });

      await parseReceipt(
        stakingInstance.split(splitAmount, {
          value: fee,
        })
      );

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

// Fees console log
// 5 0 3.0
// 6 1 3.0
// 7 2 3.0
// 8 3 3.0
// 9 4 3.0
// 10 5 3.0
// 11 6 3.0
// 12 7 3.0
// 13 8 3.0
// 14 9 3.0
// 15 10 3.0
// 16 11 3.0
// 17 12 3.0
// 18 13 2.0
// 19 14 2.0
// 20 15 2.0
// 21 16 2.0
// 22 17 2.0
// 23 18 2.0
// 24 19 2.0
// 25 20 2.0
// 26 21 2.0
// 27 22 2.0
// 28 23 2.0
// 29 24 2.0
// 30 25 1.0
// 31 26 1.0
// 32 27 1.0
// 33 28 1.0
// 34 29 1.0
// 35 30 1.0
// 36 31 1.0
// 37 32 1.0
// 38 33 1.0
// 39 34 1.0
// 40 35 1.0
// 41 36 1.0
// 42 37 0.0
// 43 38 0.0
// 44 39 0.0
// 45 40 0.0
// 46 41 0.0
// 47 42 0.0
// 48 43 0.0
// 49 44 0.0
