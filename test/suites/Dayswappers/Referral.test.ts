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

    it('resolves kyc increases tree referral count in upline', async () => {
      const randomWallet = ethers.Wallet.createRandom().connect(global.providerESN);

      await parseReceipt(
        global.dayswappersInstanceESN.connect(randomWallet).join(global.accountsESN[1])
      );

      const currentMonth = (await global.nrtInstanceESN.currentNrtMonth()).toNumber();

      await parseReceipt(global.dayswappersInstanceESN.resolveKyc(randomWallet.address));

      const monthlyData0 = await global.dayswappersInstanceESN.getSeatMonthlyDataByAddress(
        global.accountsESN[0],
        currentMonth
      );
      const monthlyData1 = await global.dayswappersInstanceESN.getSeatMonthlyDataByAddress(
        global.accountsESN[1],
        currentMonth
      );
      console.log(monthlyData0, monthlyData1);
      strictEqual(monthlyData0.treeReferrals, 1, 'tree referral should have become 1');
      strictEqual(monthlyData1.treeReferrals, 1, 'tree referral should have become 1');
    });

    // it('deep referral', async () => {
    //   let w_n = ethers.Wallet.createRandom().connect(global.providerESN);
    //   await global.dayswappersInstanceESN.connect(w_n).join(ethers.constants.AddressZero);

    //   let w_r = ethers.Wallet.createRandom().connect(global.providerESN);
    //   let prevGas = 0;
    //   for (let i = 0; i < 100; i++) {
    //     const receipt = await parseReceipt(
    //       global.dayswappersInstanceESN.connect(w_r).setIntroducer(w_n.address)
    //     );

    //     console.log(
    //       w_r.address.slice(0, 4),
    //       w_n.address.slice(0, 4),
    //       receipt.gasUsed.toNumber(),
    //       receipt.gasUsed.toNumber() - prevGas
    //     );
    //     prevGas = receipt.gasUsed.toNumber();
    //     w_n = w_r;
    //     w_r = ethers.Wallet.createRandom().connect(global.providerESN);
    //   }
    // });
  });
