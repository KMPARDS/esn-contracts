import { strictEqual, ok } from 'assert';
import { parseReceipt } from '../../utils';

export const Ownership = () =>
  describe('Ownership', () => {
    it('sets deployer as the owner', async () => {
      const owner = await global.esInstanceETH.owner();

      strictEqual(owner, global.accountsETH[0], 'owner should be first account');
    });

    it('transfers ownership to other wallet', async () => {
      await parseReceipt(global.esInstanceETH.transferOwnership(global.accountsETH[1]));

      const owner = await global.esInstanceETH.owner();
      strictEqual(owner, global.accountsETH[1], 'owner should be first account');
    });

    it('tries to transfer ownership with normal wallet expecting revert', async () => {
      try {
        await parseReceipt(global.esInstanceETH.transferOwnership(global.accountsETH[1]));

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(msg.includes('Ownable: caller is not the owner'), `Invalid error message: ${msg}`);
      }
    });
  });
