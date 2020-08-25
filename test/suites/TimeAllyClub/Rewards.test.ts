import { ethers } from 'ethers';
import { strictEqual, ok } from 'assert';
import { parseReceipt, getTimeAllyStakings, releaseNrt } from '../../utils';
import { formatEther, parseEther } from 'ethers/lib/utils';

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
        value: parseEther('1000'),
      });

      await global.providerESN.getSigner(0).sendTransaction({
        to: wallet_networker.address,
        value: parseEther('100'),
      });

      await global.timeallyInstanceESN
        .connect(wallet_networker)
        .stake({ value: parseEther('100') });
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

      const amount = parseEther('100');
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

    it('tries to withdraw rewards before NRT release', async () => {
      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      const stakingInstances = await getTimeAllyStakings(wallet_networker.address);
      const stakingInstance = stakingInstances[0];

      try {
        await parseReceipt(
          global.timeallyClubInstanceESN
            .connect(wallet_networker)
            .withdrawPlatformIncentive(
              currentMonth,
              global.timeallyInstanceESN.address,
              1,
              stakingInstance.address
            )
        );

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(msg.includes('Club: Month NRT not released'), `Invalid error message: ${msg}`);
      }
    });

    it('withdraws rewards in prepaid', async () => {
      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      await releaseNrt();
      const stakingInstances = await getTimeAllyStakings(wallet_networker.address);
      const stakingInstance = stakingInstances[0];

      const prepaidBefore = await global.prepaidEsInstanceESN.balanceOf(wallet_networker.address);
      const principalBefore = await stakingInstance.principal();
      const issTimeBefore = await stakingInstance.issTimeLimit();

      await parseReceipt(
        global.timeallyClubInstanceESN
          .connect(wallet_networker)
          .withdrawPlatformIncentive(
            currentMonth,
            global.timeallyInstanceESN.address,
            1,
            stakingInstance.address
          )
      );

      const prepaidAfter = await global.prepaidEsInstanceESN.balanceOf(wallet_networker.address);
      const principalAfter = await stakingInstance.principal();
      const issTimeAfter = await stakingInstance.issTimeLimit();

      ok(prepaidAfter.gt(prepaidBefore), 'Should receive some prepaid');
      ok(principalAfter.gt(principalBefore), 'Should receive some topup on staking');
      ok(issTimeAfter.gt(issTimeBefore), 'Should receive some topup on staking');
    });
  });
