import assert from 'assert';
import { parseReceipt } from '../../utils';

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
  });
