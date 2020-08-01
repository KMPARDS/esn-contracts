import { parseReceipt } from '../../utils';
import { parseEther } from 'ethers/lib/utils';
import { ok } from 'assert';

export const Pauser = () =>
  describe('Pauser', () => {
    it('tries to pause with normal wallet expecting revert', async () => {
      try {
        await parseReceipt(global.esInstanceETH.pause());

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(msg.includes('Ownable: caller is not the owner'), `Invalid error message: ${msg}`);
      }
    });

    it('pauses the token contract', async () => {
      const isPausedBefore = await global.esInstanceETH.paused();
      ok(!isPausedBefore, 'should not be paused before');

      await parseReceipt(global.esInstanceETH.connect(global.providerETH.getSigner(1)).pause());

      const isPausedAfter = await global.esInstanceETH.paused();
      ok(isPausedAfter, 'should be paused');
    });

    it('tries to transfer tokens while paused expecting revert', async () => {
      try {
        await parseReceipt(global.esInstanceETH.transfer(global.accountsETH[0], parseEther('2')));

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(
          msg.includes('ERC20Pausable: token transfer while paused'),
          `Invalid error message: ${msg}`
        );
      }
    });

    it('unpauses the token contract', async () => {
      await parseReceipt(global.esInstanceETH.connect(global.providerETH.getSigner(1)).unpause());

      const isPaused = await global.esInstanceETH.paused();
      ok(!isPaused, 'should be unpaused');
    });

    it('transfers tokens after after unpausing', async () => {
      await parseReceipt(global.esInstanceETH.transfer(global.accountsETH[0], parseEther('2')));

      ok(true, 'transfer should not revert');
    });
  });
