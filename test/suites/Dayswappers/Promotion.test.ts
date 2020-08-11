import { ethers } from 'ethers';
import { parseReceipt } from '../../utils';
import { strictEqual } from 'assert';

export const Promotion = () =>
  describe('Promotion', () => {
    it('gets promoted to yellow belt (after about 10 kyc referrals)', async () => {
      // const carry_fwd_wallet = new ethers.Wallet('0x' + '3'.repeat(64)).connect(global.providerESN);
      const currentMonth = (await global.nrtInstanceESN.currentNrtMonth()).toNumber();

      {
        const seat = await global.dayswappersInstanceESN.getSeatByAddress(global.accountsESN[0]);
        strictEqual(seat.beltId, 0, 'should be white belt initially');
      }
      await parseReceipt(
        global.dayswappersInstanceESN
          .connect(global.providerESN.getSigner(0))
          .promoteSelf(currentMonth)
      );
      {
        const seat = await global.dayswappersInstanceESN.getSeatByAddress(global.accountsESN[0]);
        strictEqual(seat.beltId, 1, 'should be promoted to yellow belt');
      }
    });
  });
