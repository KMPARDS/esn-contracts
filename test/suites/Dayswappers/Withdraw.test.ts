import { formatEther, formatBytes32String } from 'ethers/lib/utils';
import { parseReceipt, getTimeAllyStakings } from '../../utils';
import { ethers } from 'ethers';
import { strictEqual } from 'assert';

export const Withdraw = () =>
  describe('Withdraw', () => {
    before(async () => {
      // sending some reward for global.accountsESN[0]
      await parseReceipt(
        global.dayswappersInstanceESN.payToIntroducer(global.accountsESN[1], [1, 1, 1], {
          value: ethers.utils.parseEther('30'),
        })
      );

      // resolve kyc
      await global.kycDappInstanceESN.register(formatBytes32String('hiii'));

      await global.kycDappInstanceESN.updateKycLevel1Status(
        await global.kycDappInstanceESN.resolveUsername(global.accountsESN[0]),
        1
      );

      await global.dayswappersInstanceESN.resolveKyc(global.accountsESN[0]);
    });

    it('withdraws definite reward', async () => {
      const seat = await global.dayswappersInstanceESN.getSeatByAddress(global.accountsESN[0]);
      // console.log(seat.definiteEarnings.map(formatEther));

      const stakings = await getTimeAllyStakings(global.accountsESN[0]);
      const staking = stakings[0];

      const liquidBefore = await global.providerESN.getBalance(global.accountsESN[0]);
      const prepaidBefore = await global.prepaidEsInstanceESN.balanceOf(global.accountsESN[0]);
      const principalBefore = await staking.principal();
      const issTimeBefore = await staking.issTimeLimit();

      await parseReceipt(
        global.dayswappersInstanceESN.withdrawEarnings(staking.address, true, 1),
        true,
        true
      );

      const liquidAfter = await global.providerESN.getBalance(global.accountsESN[0]);
      const prepaidAfter = await global.prepaidEsInstanceESN.balanceOf(global.accountsESN[0]);
      const principalAfter = await staking.principal();
      const issTimeAfter = await staking.issTimeLimit();

      strictEqual(
        formatEther(liquidAfter.sub(liquidBefore)),
        formatEther(seat.definiteEarnings[0]),
        'liquid received should be received'
      );
      strictEqual(
        formatEther(prepaidAfter.sub(prepaidBefore)),
        formatEther(seat.definiteEarnings[1]),
        'prepaid received should be correct'
      );
      strictEqual(
        formatEther(principalAfter.sub(principalBefore)),
        formatEther(seat.definiteEarnings[2]),
        'staking toppup received should be correct'
      );
      strictEqual(
        formatEther(issTimeAfter.sub(issTimeBefore)),
        formatEther(seat.definiteEarnings[1].add(seat.definiteEarnings[2])),
        'isstime received should be correct'
      );
    });

    // it('withdraws nrt reward', async () => {
    //   const currentMonth = (await global.nrtInstanceESN.currentNrtMonth()).toNumber();

    //   const monthlyData = await global.dayswappersInstanceESN.getSeatMonthlyDataByAddress(
    //     global.accountsESN[0],
    //     currentMonth
    //   );

    //   console.log(monthlyData.nrtEarnings.map(formatEther));

    //   console.log(await global.dayswappersInstanceESN.getSeatByAddress(global.accountsESN[0]));
    // });
  });
