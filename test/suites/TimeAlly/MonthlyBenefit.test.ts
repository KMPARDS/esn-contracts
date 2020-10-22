import { getTimeAllyStakings, releaseNrt, parseReceipt } from '../../utils';
import { ethers } from 'ethers';
import assert from 'assert';
import { formatEther } from 'ethers/lib/utils';

export const MonthlyBenefit = () =>
  describe('Monthly Benefit', () => {
    it('withdraws monthly benefit in liquid mode for single month and gets 50% staked and 50% liquid', async () => {
      const owner = global.accountsESN[0];
      const staking = (await getTimeAllyStakings(owner))[0];
      const startMonth = await staking.startMonth();
      let currentMonth = await global.nrtInstanceESN.currentNrtMonth();

      while (currentMonth < startMonth) {
        await releaseNrt();
        currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      }

      const monthlyBenefit = await staking.getMonthlyReward(currentMonth);

      const prepaidEsBefore = await global.prepaidEsInstanceESN.balanceOf(owner);
      const principalAmountBefore = await staking.principal();
      const liquidBalanceBefore = await global.providerESN.getBalance(owner);
      const isstimeBefore = await staking.issTimeLimit();

      await parseReceipt(staking.withdrawMonthlyNRT([currentMonth], 0));

      const prepaidEsAfter = await global.prepaidEsInstanceESN.balanceOf(owner);
      const principalAmountAfter = await staking.principal();
      const liquidBalanceAfter = await global.providerESN.getBalance(owner);
      const isstimeAfter = await staking.issTimeLimit();

      assert.deepEqual(
        prepaidEsAfter.sub(prepaidEsBefore),
        ethers.constants.Zero,
        'should receive 0 as prepaid rewards'
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
      assert.strictEqual(
        formatEther(isstimeAfter),
        formatEther(isstimeBefore),
        'should have no change in iss time'
      );
    });

    it('withdraws monthly benefit in prepaid mode for single month and gets 50% staked and 50% prepaid', async () => {
      const owner = global.accountsESN[0];
      const staking = (await getTimeAllyStakings(owner))[0];
      const startMonth = await staking.startMonth();
      let currentMonth = await global.nrtInstanceESN.currentNrtMonth();

      while (currentMonth < startMonth + 1) {
        await releaseNrt();
        currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      }

      const monthlyBenefit = await staking.getMonthlyReward(currentMonth);

      const prepaidEsBefore = await global.prepaidEsInstanceESN.balanceOf(owner);
      const principalAmountBefore = await staking.principal();
      const liquidBalanceBefore = await global.providerESN.getBalance(owner);
      const isstimeBefore = await staking.issTimeLimit();

      await parseReceipt(staking.withdrawMonthlyNRT([currentMonth], 1));

      const prepaidEsAfter = await global.prepaidEsInstanceESN.balanceOf(owner);
      const principalAmountAfter = await staking.principal();
      const liquidBalanceAfter = await global.providerESN.getBalance(owner);
      const isstimeAfter = await staking.issTimeLimit();

      assert.deepEqual(
        prepaidEsAfter.sub(prepaidEsBefore),
        monthlyBenefit.div(2),
        'should receive 50% as prepaid rewards'
      );
      assert.deepEqual(
        principalAmountAfter.sub(principalAmountBefore),
        monthlyBenefit.div(2),
        'should receive 50% as staking rewards'
      );
      assert.deepEqual(
        liquidBalanceAfter.sub(liquidBalanceBefore),
        ethers.constants.Zero,
        'should receive 0 as liquid rewards'
      );

      // TODO: also check for d(isstime) to be zero
      assert.strictEqual(
        formatEther(isstimeAfter.sub(isstimeBefore)),
        formatEther(monthlyBenefit.div(2).mul(100).div(100)), // 100% of liquid part
        'should get 100% iss time'
      );
    });

    it('withdraws monthly benefit in stake mode for single month and gets 100% staked', async () => {
      const owner = global.accountsESN[0];
      const staking = (await getTimeAllyStakings(owner))[0];
      const startMonth = await staking.startMonth();
      let currentMonth = await global.nrtInstanceESN.currentNrtMonth();

      while (currentMonth < startMonth + 2) {
        await releaseNrt();
        currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      }

      const monthlyBenefit = await staking.getMonthlyReward(currentMonth);

      const prepaidEsBefore = await global.prepaidEsInstanceESN.balanceOf(owner);
      const principalAmountBefore = await staking.principal();
      const liquidBalanceBefore = await global.providerESN.getBalance(owner);
      const isstimeBefore = await staking.issTimeLimit();

      await parseReceipt(staking.withdrawMonthlyNRT([currentMonth], 2));

      const prepaidEsAfter = await global.prepaidEsInstanceESN.balanceOf(owner);
      const principalAmountAfter = await staking.principal();
      const liquidBalanceAfter = await global.providerESN.getBalance(owner);
      const isstimeAfter = await staking.issTimeLimit();

      assert.deepEqual(
        prepaidEsAfter.sub(prepaidEsBefore),
        ethers.constants.Zero,
        'should receive 0 as prepaid rewards'
      );
      assert.deepEqual(
        principalAmountAfter.sub(principalAmountBefore),
        monthlyBenefit,
        'should receive 100% as staking rewards'
      );
      assert.deepEqual(
        liquidBalanceAfter.sub(liquidBalanceBefore),
        ethers.constants.Zero,
        'should receive 0 liquid rewards'
      );

      // TODO: also check for d(isstime) to be zero
      assert.strictEqual(
        formatEther(isstimeAfter.sub(isstimeBefore)),
        formatEther(monthlyBenefit.div(2).mul(225).div(100)), // 225% of liquid part
        'should get 225% iss time'
      );
    });

    it('tries to withdraw monthly benefit in unknown mode expecting revert', async () => {
      const owner = global.accountsESN[0];
      const staking = (await getTimeAllyStakings(owner))[0];
      const startMonth = await staking.startMonth();
      let currentMonth = await global.nrtInstanceESN.currentNrtMonth();

      while (currentMonth < startMonth + 3) {
        await releaseNrt();
        currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      }

      try {
        await parseReceipt(staking.withdrawMonthlyNRT([currentMonth], 3));

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        assert.ok(msg.includes('revert'), `Invalid error message: ${msg}`);
      }
    });

    // add a test case to try that timeally manager's process rward method doesnt work for notmal wallets
    it('tries to process rewards on TimeAlly Manager expecting revert', async () => {
      try {
        await global.timeallyInstanceESN.processNrtReward(ethers.utils.parseEther('100'), 0);

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        assert.ok(
          msg.includes('revert TimeAlly: STAKING_NOT_RECOGNIZED'),
          `Invalid error message: ${msg}`
        );
      }
    });
  });
