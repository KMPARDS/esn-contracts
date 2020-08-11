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
  });
