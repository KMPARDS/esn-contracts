import assert from 'assert';
import { ethers } from 'ethers';
import { parseReceipt } from '../../utils';

const SECONDS_IN_MONTH = 2629744;

export const NrtRelease = () =>
  describe('Monthly NRT Release', () => {
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
      const increasedTime = await global.providerESN.send('evm_increaseTime', [SECONDS_IN_MONTH]);

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

      assert.deepEqual(
        nrtBalanceBefore.sub(nrtBalanceAfter),
        annualNRT.div(12),
        'monthly nrt should be released'
      );

      assert.deepEqual(
        timeallyBalanceAfter.sub(timeallyBalanceBefore),
        ethers.utils.parseEther('10237500'),
        'timeally contract should receive NRT'
      );
    });
  });
