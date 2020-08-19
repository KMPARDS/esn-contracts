import { parseReceipt } from '../../utils';
import { ok, strictEqual } from 'assert';
import { ethers } from 'ethers';
import { formatBytes32String } from 'ethers/lib/utils';

export const SeatTransfer = () =>
  describe('Seat Transfer', () => {
    it('tries to transfer seat to wallet already having seat expecting revert', async () => {
      try {
        await parseReceipt(global.dayswappersInstanceESN.transferSeat(global.accountsESN[1]));

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(
          msg.includes('Dayswappers: New owner already has a seat'),
          `Invalid error message: ${msg}`
        );
      }
    });

    it('tries to transfer seat using a wallet without a seat', async () => {
      try {
        await parseReceipt(
          global.dayswappersInstanceESN
            .connect(ethers.Wallet.createRandom().connect(global.providerESN))
            .transferSeat(ethers.utils.hexlify(ethers.utils.randomBytes(20)))
        );

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(msg.includes('Dayswappers: No seat to transfer'), `Invalid error message: ${msg}`);
      }
    });

    it('tries to transfer seat without being kyc resolved expecting revert', async () => {
      try {
        const otherAddress = ethers.utils.hexlify(ethers.utils.randomBytes(20));
        await parseReceipt(global.dayswappersInstanceESN.transferSeat(otherAddress));

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(msg.includes('Dayswappers: KYC not resolved'), `Invalid error message: ${msg}`);
      }
    });

    it('transfers a seat to seat without seat', async () => {
      const otherAddress = ethers.utils.hexlify(ethers.utils.randomBytes(20));
      const seat0Before = await global.dayswappersInstanceESN.getSeatByAddress(
        global.accountsESN[0]
      );
      try {
        // static call
        await global.dayswappersInstanceESN.getSeatByAddress(otherAddress);

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(msg.includes('Dayswappers: Networker not joined'), `Invalid error message: ${msg}`);
      }

      await parseReceipt(global.kycDappInstanceESN.register(formatBytes32String('randomusername')));
      await parseReceipt(
        global.kycDappInstanceESN.updateKycLevel1Status(formatBytes32String('randomusername'), 1)
      );
      await parseReceipt(global.dayswappersInstanceESN.transferSeat(otherAddress));

      const seatOtherAfter = await global.dayswappersInstanceESN.getSeatByAddress(otherAddress);

      strictEqual(seat0Before.seatIndex, seatOtherAfter.seatIndex, 'seat transferred');

      try {
        // static call
        await global.dayswappersInstanceESN.getSeatByAddress(global.accountsESN[0]);

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(msg.includes('Dayswappers: Networker not joined'), `Invalid error message: ${msg}`);
      }
    });
  });
