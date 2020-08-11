import { ethers } from 'ethers';
import { parseReceipt } from '../../utils';
import { strictEqual } from 'assert';

export const KycResolve = () =>
  describe('Kyc Resolve', () => {
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
      // console.log(monthlyData0, monthlyData1);
      strictEqual(monthlyData0.treeReferrals, 1, 'tree referral should have become 1');
      strictEqual(monthlyData1.treeReferrals, 1, 'tree referral should have become 1');
    });

    it('deep referrals increment depth and tree referrals', async () => {
      const currentMonth = (await global.nrtInstanceESN.currentNrtMonth()).toNumber();

      let wallet_networker = ethers.Wallet.createRandom().connect(global.providerESN);
      await global.dayswappersInstanceESN
        .connect(wallet_networker)
        .join(ethers.constants.AddressZero);

      let topWallet = wallet_networker;

      let wallet_direct = ethers.Wallet.createRandom().connect(global.providerESN);
      let prevGas = 0;
      let prevGas2 = 0;
      const initialTreeReferrals = (
        await global.dayswappersInstanceESN.getSeatMonthlyDataByAddress(
          topWallet.address,
          currentMonth
        )
      ).treeReferrals;
      const initialDepth = (
        await global.dayswappersInstanceESN.getSeatByAddress(wallet_direct.address)
      ).depth;

      for (let i = 0; i < 10; i++) {
        const receipt = await parseReceipt(
          global.dayswappersInstanceESN.connect(wallet_direct).join(wallet_networker.address)
        );

        // console.log(
        //   wallet_direct.address.slice(0, 4),
        //   wallet_networker.address.slice(0, 4),
        //   receipt.gasUsed.toNumber(),
        //   receipt.gasUsed.toNumber() - prevGas
        // );
        prevGas = receipt.gasUsed.toNumber();

        const receipt2 = await parseReceipt(
          global.dayswappersInstanceESN.connect(wallet_direct).resolveKyc(wallet_direct.address)
        );

        // console.log(
        //   'resolving',
        //   wallet_direct.address.slice(0, 4),
        //   receipt2.gasUsed.toNumber(),
        //   receipt2.gasUsed.toNumber() - prevGas2
        // );
        prevGas2 = receipt2.gasUsed.toNumber();

        const { treeReferrals } = await global.dayswappersInstanceESN.getSeatMonthlyDataByAddress(
          topWallet.address,
          currentMonth
        );

        strictEqual(
          treeReferrals,
          initialTreeReferrals + i + 1,
          'tree referrals should have incremented'
        );

        const { depth } = await global.dayswappersInstanceESN.getSeatByAddress(
          wallet_direct.address
        );

        strictEqual(depth, initialDepth + i + 1, 'tree referrals should have incremented');

        // console.log(
        //   'top wallet tree referrals',
        //   treeReferrals,
        //   'current direct wallet depth',
        //   depth,
        //   '\n'
        // );

        wallet_networker = wallet_direct;
        wallet_direct = ethers.Wallet.createRandom().connect(global.providerESN);
      }
    });
  });
