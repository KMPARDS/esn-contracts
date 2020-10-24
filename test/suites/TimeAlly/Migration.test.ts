import assert from 'assert';
import { ethers } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import { parseReceipt } from '../../utils';

export const Migration = () =>
  describe('Migration', () => {
    it('sends stake through migration', async () => {
      await parseReceipt(
        global.timeallyInstanceESN.sendStake(ethers.Wallet.createRandom().address, 0, [], {
          value: parseEther('100'),
        }),
        true
      );
    });
  });
