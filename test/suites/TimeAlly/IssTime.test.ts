import assert from 'assert';
import { ethers } from 'ethers';
import { getTimeAllyStakings, parseReceipt } from '../../utils';
import { TimeAllyStaking } from '../../../build/typechain/ESN/TimeAllyStaking';

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

        assert.ok(
          msg.includes('TAStaking: Value exceeds IssTime Limit'),
          `Invalid error message: ${msg}`
        );
      }
    });

    it('starts IssTime within the limit', async () => {
      const balanceBefore = await global.providerESN.getBalance(global.accountsESN[0]);
      await parseReceipt(stakingInstance.startIssTime(amount, false));
      const balanceAfter = await global.providerESN.getBalance(global.accountsESN[0]);

      assert.deepEqual(balanceAfter.sub(balanceBefore), amount, 'should receive amount');

      const issTimeTimestamp = await stakingInstance.issTimeTimestamp();
      assert.ok(issTimeTimestamp.gt(0), 'timestamp should be set');

      const issTimeTakenValue = await stakingInstance.issTimeTakenValue();
      assert.deepEqual(issTimeTakenValue, amount, 'taken value should be amount');

      const issTimeInterest = await stakingInstance.getIssTimeInterest();
      assert.deepEqual(issTimeInterest, amount.div(1000), 'interest should be 0.1% immediately');
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
          msg.includes('TAStaking: Month not elapsed for reporting'),
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
          msg.includes('TAStaking: Insufficient IssTime submit value'),
          `Invalid error message: ${msg}`
        );
      }
    });

    it('submits IssTime with interest', async () => {
      const luckPoolBefore = await global.nrtInstanceESN.luckPoolBalance();

      await parseReceipt(
        stakingInstance.submitIssTime({
          value: amount.add(amount.div(1000)),
        })
      );

      const luckPoolAfter = await global.nrtInstanceESN.luckPoolBalance();
      assert.deepEqual(
        luckPoolAfter.sub(luckPoolBefore),
        amount.div(1000),
        'interest should go to luckpool'
      );

      const issTimeTimestamp = await stakingInstance.issTimeTimestamp();
      assert.ok(issTimeTimestamp.eq(0), 'timestamp should be zero');

      const issTimeTakenValue = await stakingInstance.issTimeTakenValue();
      assert.ok(issTimeTakenValue.eq(0), 'taken value should be zero');
    });

    // @TODO: add more test cases about destroy staking
  });
