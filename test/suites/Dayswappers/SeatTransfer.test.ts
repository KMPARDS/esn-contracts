import { parseReceipt } from '../../utils';
import { ok, strictEqual } from 'assert';
import { ethers } from 'ethers';
import { formatBytes32String, parseEther, formatEther } from 'ethers/lib/utils';

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

        ok(msg.includes('Dayswappers: Networker not joined'), `Invalid error message: ${msg}`);
      }
    });

    it('tries to transfer seat without being kyc resolved expecting revert', async () => {
      try {
        const otherAddress = ethers.utils.hexlify(ethers.utils.randomBytes(20));
        await parseReceipt(
          global.dayswappersInstanceESN
            .connect(global.providerESN.getSigner(1))
            .transferSeat(otherAddress)
        );

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(msg.includes('Dayswappers: KYC not resolved'), `Invalid error message: ${msg}`);
      }
    });

    it('transfers a seat to seat without seat with kyc approved', async () => {
      // STEP 1: creating a new wallet
      const noobWallet = ethers.Wallet.createRandom().connect(global.providerESN);

      // STEP 2: applying and getting kyc approved on KYC DAPP
      const kycFees = await global.kycDappInstanceESN.getKycFee(
        1,
        ethers.constants.HashZero,
        ethers.constants.HashZero
      );

      await global.providerESN.getSigner(0).sendTransaction({
        to: noobWallet.address,
        value: kycFees,
      });
      await parseReceipt(
        global.kycDappInstanceESN.connect(noobWallet).register(formatBytes32String('nooB'), {
          value: kycFees,
        })
      );
      await parseReceipt(
        global.kycDappInstanceESN.updateKycStatus(
          formatBytes32String('nooB'),
          1,
          ethers.constants.HashZero,
          ethers.constants.HashZero,
          1
        )
      );

      // STEP 3: join dayswappers and resolve kyc
      await parseReceipt(
        global.dayswappersInstanceESN.connect(noobWallet).join(ethers.constants.AddressZero)
      );
      await parseReceipt(global.dayswappersInstanceESN.resolveKyc(noobWallet.address));

      // STEP 4: creating a random address to transfer this seat to
      const otherAddress = ethers.utils.hexlify(ethers.utils.randomBytes(20));
      try {
        // static call
        await global.dayswappersInstanceESN.getSeatByAddressStrict(otherAddress);

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(msg.includes('Dayswappers: Networker not joined'), `Invalid error message: ${msg}`);
      }

      // snapshot of seat before transfer
      const seat0Before = await global.dayswappersInstanceESN.getSeatByAddressStrict(
        noobWallet.address
      );

      /// STEP 5: transfer seat
      await parseReceipt(
        global.dayswappersInstanceESN
          .connect(noobWallet.connect(global.providerESN))
          .transferSeat(otherAddress)
      );

      const seatOtherAfter = await global.dayswappersInstanceESN.getSeatByAddressStrict(
        otherAddress
      );

      // checking if seatIndex is now reflecting in the other address
      strictEqual(seat0Before.seatIndex, seatOtherAfter.seatIndex, 'seat transferred');

      // and that earlier address reverts
      try {
        // static call
        await global.dayswappersInstanceESN.getSeatByAddressStrict(noobWallet.address);

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(msg.includes('Dayswappers: Networker not joined'), `Invalid error message: ${msg}`);
      }
    });
  });
