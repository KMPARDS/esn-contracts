import { parseReceipt } from '../../utils';
import { strictEqual, notStrictEqual } from 'assert';

export const Referral = () =>
  describe('Referral', () => {
    it('joins with a introducer', async () => {
      const seatOf0Before = await global.dayswappersInstanceESN.getSeatByAddress(
        global.accountsESN[0]
      );
      const seatOf1Before = await global.dayswappersInstanceESN.getSeatByAddress(
        global.accountsESN[1]
      );

      strictEqual(
        seatOf0Before.seatIndex,
        0,
        'non initialised address should have seat index as 0'
      );
      strictEqual(
        seatOf1Before.seatIndex,
        0,
        'non initialised address should have seat index as 0'
      );

      // account 0 joins with account 1 as introducer
      await parseReceipt(global.dayswappersInstanceESN.setIntroducer(global.accountsESN[1]));

      const seatOf0After = await global.dayswappersInstanceESN.getSeatByAddress(
        global.accountsESN[0]
      );
      const seatOf1After = await global.dayswappersInstanceESN.getSeatByAddress(
        global.accountsESN[1]
      );

      notStrictEqual(seatOf0After.seatIndex, 0, 'address should have seat index as 0');
      notStrictEqual(seatOf1After.seatIndex, 0, 'address should have seat index as 0');
      strictEqual(
        seatOf0After.introducerSeatIndex,
        seatOf1After.seatIndex,
        'introducer must be set'
      );
    });
  });
