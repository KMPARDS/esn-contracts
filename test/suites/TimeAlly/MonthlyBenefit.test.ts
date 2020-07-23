import { getTimeAllyStakings, releaseNrt, parseReceipt } from '../../utils';
import { ethers } from 'ethers';
import assert from 'assert';

export const MonthlyBenefit = () =>
  describe('Monthly Benefit', () => {
    it('withdraws monthly benefit for single month and gets 25% prepaid, 25% staked and 50% liquid', async () => {
      const owner = global.accountsESN[0];
      const staking = (await getTimeAllyStakings(owner))[0];
      const startMonth = await staking.startMonth();
      let currentMonth = await global.nrtInstanceESN.currentNrtMonth();

      while (currentMonth.lt(startMonth)) {
        await releaseNrt();
        currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      }

      const monthlyBenefit = await staking.getMonthlyReward(startMonth);

      const prepaidEsBefore = await global.prepaidEsInstanceESN.balanceOf(owner);
      const principalAmountBefore = await staking.nextMonthPrincipalAmount();
      const liquidBalanceBefore = await global.providerESN.getBalance(owner);

      await parseReceipt(staking.withdrawMonthlyNRT([startMonth]));

      const prepaidEsAfter = await global.prepaidEsInstanceESN.balanceOf(owner);
      const principalAmountAfter = await staking.nextMonthPrincipalAmount();
      const liquidBalanceAfter = await global.providerESN.getBalance(owner);

      assert.deepEqual(
        prepaidEsAfter.sub(prepaidEsBefore),
        ethers.constants.Zero,
        'should receive 0 prepaid rewards'
      );
      assert.deepEqual(
        principalAmountAfter.sub(principalAmountBefore),
        monthlyBenefit.div(2),
        'should receive 50% as staking rewards'
      );
      assert.deepEqual(
        liquidBalanceAfter.sub(liquidBalanceBefore),
        monthlyBenefit.div(2),
        'should receive 50% as liquid rewards'
      );
    });

    // add a test case to try that timeally manager's process rward method doesnt work for notmal wallets
    it('tries to process rewards on TimeAlly Manager expecting revert', async () => {
      try {
        await global.timeallyInstanceESN.processNrtReward(ethers.utils.parseEther('100'));

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        assert.ok(
          msg.includes('revert TimeAlly: Staking not recognized'),
          `Invalid error message: ${msg}`
        );
      }
    });
  });
