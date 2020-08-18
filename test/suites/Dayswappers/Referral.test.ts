import { parseReceipt } from '../../utils';
import { strictEqual, notStrictEqual, ok } from 'assert';
import { ethers } from 'ethers';

export const Referral = () =>
  describe('Referral', () => {
    it('joins with a zero address introducer', async () => {
      try {
        // static call
        await global.dayswappersInstanceESN.getSeatByAddress(global.accountsESN[0]);

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(msg.includes('Dayswappers: Networker not joined'), `Invalid error message: ${msg}`);
      }

      await parseReceipt(
        global.dayswappersInstanceESN
          .connect(global.providerESN.getSigner(global.accountsESN[0]))
          .join(ethers.constants.AddressZero)
      );

      const seatAfter = await global.dayswappersInstanceESN.getSeatByAddress(global.accountsESN[0]);
      notStrictEqual(seatAfter.seatIndex, 0, 'address should have non zero seat index');
      strictEqual(seatAfter.introducerSeatIndex, 0, 'introducer must be set');
    });

    it('joins with a introducer', async () => {
      try {
        // static call
        await global.dayswappersInstanceESN.getSeatByAddress(global.accountsESN[1]);

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(msg.includes('Dayswappers: Networker not joined'), `Invalid error message: ${msg}`);
      }

      // account 0 joins with account 1 as introducer
      await parseReceipt(
        global.dayswappersInstanceESN
          .connect(global.providerESN.getSigner(global.accountsESN[1]))
          .join(global.accountsESN[0])
      );

      const seatAfter = await global.dayswappersInstanceESN.getSeatByAddress(global.accountsESN[1]);
      notStrictEqual(seatAfter.seatIndex, 0, 'address should have non zero seat index');

      const seatOf0 = await global.dayswappersInstanceESN.getSeatByAddress(global.accountsESN[0]);
      strictEqual(seatAfter.introducerSeatIndex, seatOf0.seatIndex, 'introducer must be set');
    });
  });
