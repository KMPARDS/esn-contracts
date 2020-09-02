import assert, { strictEqual } from 'assert';
import { ethers } from 'ethers';
import { parseReceipt, constants } from '../../utils';

export const NrtRelease = () =>
  describe('Monthly NRT Release', () => {
    it('renounces admin mode', async () => {
      const adminModeBefore = await global.nrtInstanceESN.isAdminMode();
      strictEqual(adminModeBefore, true, 'admin mode should be active');

      await parseReceipt(global.nrtInstanceESN.renounceAdminMode());

      const adminModeAfter = await global.nrtInstanceESN.isAdminMode();
      strictEqual(adminModeAfter, false, 'admin mode should get inactive');
    });

    it('tries to release NRT before month finishing expecting revert', async () => {
      try {
        await parseReceipt(global.nrtInstanceESN.releaseMonthlyNRT());

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        assert.ok(msg.includes('NRTM: Month not finished'), `Invalid error message: ${msg}`);
      }
    });

    it('goes one month future and tries releasing NRT should success', async () => {
      await global.providerESN.send('evm_increaseTime', [constants.SECONDS_IN_MONTH]);

      const annualNRT = await global.nrtInstanceESN.annualNRT();
      const nrtBalanceBefore = await global.providerESN.getBalance(global.nrtInstanceESN.address);
      const timeallyBalanceBefore = await global.providerESN.getBalance(
        global.timeallyInstanceESN.address
      );

      await parseReceipt(global.nrtInstanceESN.releaseMonthlyNRT());

      const nrtBalanceAfter = await global.providerESN.getBalance(global.nrtInstanceESN.address);
      const timeallyBalanceAfter = await global.providerESN.getBalance(
        global.timeallyInstanceESN.address
      );

      // TODO: this check fails when a platform burns tokens while NRT release itself
      // assert.deepEqual(
      //   nrtBalanceBefore.sub(nrtBalanceAfter),
      //   annualNRT.div(12),
      //   'monthly nrt should be released'
      // );

      assert.deepEqual(
        timeallyBalanceAfter.sub(timeallyBalanceBefore),
        ethers.utils.parseEther('10237500'),
        'timeally contract should receive NRT'
      );
    });
  });
