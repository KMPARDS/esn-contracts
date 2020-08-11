import { parseReceipt } from '../../utils';
import { strictEqual, notStrictEqual } from 'assert';
import { ethers } from 'ethers';

export const Referral = () =>
  describe('Referral', () => {
    it('joins with a zero address introducer', async () => {
      const seatBefore = await global.dayswappersInstanceESN.getSeatByAddress(
        global.accountsESN[0]
      );
      strictEqual(seatBefore.seatIndex, 0, 'non initialised address should have seat index as 0');

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
      const seatBefore = await global.dayswappersInstanceESN.getSeatByAddress(
        global.accountsESN[1]
      );
      strictEqual(seatBefore.seatIndex, 0, 'non initialised address should have seat index as 0');

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
