import { ethers } from 'ethers';
import { strictEqual } from 'assert';
import { parseReceipt } from '../../utils';
import { formatEther } from 'ethers/lib/utils';

let wallet_networker = ethers.Wallet.createRandom();
let wallet_direct = ethers.Wallet.createRandom();

export const Rewards = () =>
  describe('Rewards', () => {
    before(async () => {
      wallet_networker = wallet_networker.connect(global.providerESN);
      wallet_direct = wallet_direct.connect(global.providerESN);

      // estabilishes dayswapper relationship
      await global.dayswappersInstanceESN
        .connect(wallet_networker)
        .join(ethers.constants.AddressZero);
      await global.dayswappersInstanceESN.connect(wallet_direct).join(wallet_networker.address);

      const introducer = await global.dayswappersInstanceESN.resolveIntroducer(
        wallet_direct.address
      );
      strictEqual(introducer, wallet_networker.address, 'networker should be the direct');

      await global.providerESN.getSigner(0).sendTransaction({
        to: wallet_direct.address,
        value: ethers.utils.parseEther('1000'),
      });
    });

    it('gets club rewards when direct stakes', async () => {
      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();

      const membershipBefore = await global.timeallyClubInstanceESN.getMembership(
        wallet_networker.address,
        currentMonth
      );
      const platformBefore = await global.timeallyClubInstanceESN.getPlatformBusiness(
        wallet_networker.address,
        currentMonth,
        global.timeallyInstanceESN.address
      );
      const totalBusinessBefore = await global.timeallyClubInstanceESN.getTotalBusinessVolume(
        currentMonth
      );

      const amount = ethers.utils.parseEther('100');
      await parseReceipt(
        global.timeallyInstanceESN.connect(wallet_direct).stake({
          value: amount,
        })
      );

      const membershipAfter = await global.timeallyClubInstanceESN.getMembership(
        wallet_networker.address,
        currentMonth
      );
      const platformAfter = await global.timeallyClubInstanceESN.getPlatformBusiness(
        wallet_networker.address,
        currentMonth,
        global.timeallyInstanceESN.address
      );
      const totalBusinessAfter = await global.timeallyClubInstanceESN.getTotalBusinessVolume(
        currentMonth
      );

      strictEqual(
        formatEther(membershipAfter.businessVolume.sub(membershipBefore.businessVolume)),
        formatEther(amount),
        'business volume should increase'
      );

      strictEqual(
        formatEther(platformAfter.business.sub(platformBefore.business)),
        formatEther(amount),
        'platform business should increase'
      );

      strictEqual(
        formatEther(totalBusinessAfter.sub(totalBusinessBefore)),
        formatEther(amount),
        'total business should increased'
      );
    });
  });
