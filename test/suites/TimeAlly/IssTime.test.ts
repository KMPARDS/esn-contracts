import assert from 'assert';
import { ethers } from 'ethers';
import { getTimeAllyStakings, parseReceipt, releaseNrt, constants } from '../../utils';
import { TimeAllyStaking } from '../../../build/typechain/ESN/TimeAllyStaking';
import { formatEther } from 'ethers/lib/utils';

let stakingInstance: TimeAllyStaking;
const amount = ethers.utils.parseEther('10');

export const IssTime = () =>
  describe('IssTime', () => {
    before(async () => {
      const stakings = await getTimeAllyStakings(global.accountsESN[0]);
      stakingInstance = stakings[0];
    });

    it('checks for a non-zero IssTime limit', async () => {
      const issTime = await stakingInstance.getTotalIssTime(false);

      assert.ok(issTime.gt(0), 'some issTime should be there');
    });

    it('tries to IssTime more than limit expecting revert', async () => {
      const limit = await stakingInstance.getTotalIssTime(false);

      try {
        await parseReceipt(stakingInstance.startIssTime(limit.add(1), false));

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        assert.ok(msg.includes('TAS: EXCEEDS_ISSTIME_LIMIT'), `Invalid error message: ${msg}`);
      }
    });

    it('starts IssTime within the limit', async () => {
      const startMonth = await stakingInstance.startMonth();
      const endMonth = await stakingInstance.endMonth();
      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      const principal = await stakingInstance.principal();
      // console.log(startMonth, endMonth, currentMonth, principal);

      const totalActiveStakingsBefore: ethers.BigNumber[] = [];
      for (let i = startMonth - 1; i <= endMonth + 1; i++) {
        totalActiveStakingsBefore.push(await global.timeallyInstanceESN.getTotalActiveStaking(i));
      }
      // console.log('before', totalActiveStakingsBefore.map(formatEther));

      const balanceBefore = await global.providerESN.getBalance(global.accountsESN[0]);
      await global.providerESN.send('evm_increaseTime', [400000]);
      await parseReceipt(stakingInstance.startIssTime(amount, false));
      const balanceAfter = await global.providerESN.getBalance(global.accountsESN[0]);

      assert.deepEqual(balanceAfter.sub(balanceBefore), amount, 'should receive amount');

      const totalActiveStakingsAfter: ethers.BigNumber[] = [];
      for (let i = startMonth - 1; i <= endMonth + 1; i++) {
        totalActiveStakingsAfter.push(await global.timeallyInstanceESN.getTotalActiveStaking(i));
      }
      // console.log('after', totalActiveStakingsAfter.map(formatEther));

      for (const [key] of totalActiveStakingsBefore.entries()) {
        const month = key + startMonth - 1;
        if (month > currentMonth && month <= endMonth) {
          assert.strictEqual(
            formatEther(totalActiveStakingsBefore[key].sub(principal)),
            formatEther(totalActiveStakingsAfter[key]),
            `should decrease total active stakings for month ${month}`
          );
        } else {
          assert.strictEqual(
            formatEther(totalActiveStakingsBefore[key]),
            formatEther(totalActiveStakingsAfter[key]),
            `should not change any total active stakings for previous and after endMonth for ${month}`
          );
        }
      }

      const issTimeTimestamp = await stakingInstance.issTimeTimestamp();
      assert.ok(issTimeTimestamp > 0, 'timestamp should be set');

      const issTimeTakenValue = await stakingInstance.issTimeTakenValue();
      assert.deepEqual(issTimeTakenValue, amount, 'taken value should be amount');

      const issTimeInterest = await stakingInstance.getIssTimeInterest();
      assert.ok(issTimeInterest.gt(0), 'interest should be positive immediately');
    });

    it('tries to report with other account before NRT expecting revert', async () => {
      try {
        await parseReceipt(
          stakingInstance.connect(global.providerESN.getSigner(1)).reportIssTime()
        );

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        assert.ok(
          msg.includes('TAS: MONTH_NOT_ELAPSED_FOR_REPORTING'),
          `Invalid error message: ${msg}`
        );
      }
    });

    it('submits IssTime without interest expecting revert', async () => {
      try {
        await parseReceipt(
          stakingInstance.submitIssTime({
            value: amount,
          })
        );

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        assert.ok(
          msg.includes('TAS: INSUFFICIENT_ISSTIME_SUBMIT_VALUE'),
          `Invalid error message: ${msg}`
        );
      }
    });

    it('submits IssTime with interest after nrt before deadline', async () => {
      const startMonth = await stakingInstance.startMonth();
      const endMonth = await stakingInstance.endMonth();

      const principal = await stakingInstance.principal();
      // console.log(startMonth, endMonth, currentMonth, principal);

      const totalActiveStakingsBefore: ethers.BigNumber[] = [];
      for (let i = startMonth - 1; i <= endMonth + 1; i++) {
        totalActiveStakingsBefore.push(await global.timeallyInstanceESN.getTotalActiveStaking(i));
      }
      // console.log('before', totalActiveStakingsBefore.map(formatEther));

      const luckPoolBefore = await global.nrtInstanceESN.luckPoolBalance();

      // await releaseNrt();
      await global.providerESN.send('evm_increaseTime', [constants.SECONDS_IN_MONTH - 400000]);
      await global.nrtInstanceESN.releaseMonthlyNRT();

      await parseReceipt(
        stakingInstance.submitIssTime({
          value: amount.add(amount.mul(32).div(1000)),
        })
      );

      const luckPoolAfter = await global.nrtInstanceESN.luckPoolBalance();
      assert.ok(luckPoolAfter.sub(luckPoolBefore).gt(0), 'interest should go to luckpool');

      const issTimeTimestamp = await stakingInstance.issTimeTimestamp();
      assert.strictEqual(issTimeTimestamp, 0, 'timestamp should be zero');

      const issTimeTakenValue = await stakingInstance.issTimeTakenValue();
      assert.ok(issTimeTakenValue.eq(0), 'taken value should be zero');

      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      const totalActiveStakingsAfter: ethers.BigNumber[] = [];
      for (let i = startMonth - 1; i <= endMonth + 1; i++) {
        totalActiveStakingsAfter.push(await global.timeallyInstanceESN.getTotalActiveStaking(i));
      }
      // console.log('after', totalActiveStakingsAfter.map(formatEther));

      for (const [key] of totalActiveStakingsBefore.entries()) {
        const month = key + startMonth - 1;
        if (month > currentMonth && month <= endMonth) {
          assert.strictEqual(
            formatEther(totalActiveStakingsBefore[key].add(principal)),
            formatEther(totalActiveStakingsAfter[key]),
            `should decrease total active stakings for month ${month}`
          );
        } else {
          assert.strictEqual(
            formatEther(totalActiveStakingsBefore[key]),
            formatEther(totalActiveStakingsAfter[key]),
            `should not change any total active stakings for previous and after endMonth for ${month}`
          );
        }
      }

      const isMonthClaimed = await stakingInstance.isMonthClaimed(currentMonth);
      assert.ok(isMonthClaimed, 'month should be claimed due to submission after nrt release');
    });

    // @TODO beta: add more test cases about destroy staking
  });
