import { formatEther, formatBytes32String, parseEther } from 'ethers/lib/utils';
import { parseReceipt, getTimeAllyStakings, releaseNrt } from '../../utils';
import { ethers } from 'ethers';
import { strictEqual, ok } from 'assert';

export const Withdraw = () =>
  describe('Withdraw', () => {
    before(async () => {
      // sending some reward for global.accountsESN[0]
      await parseReceipt(
        global.dayswappersInstanceESN.payToNetworker(global.accountsESN[0], [1, 1, 1], {
          value: ethers.utils.parseEther('30'),
        })
      );

      await parseReceipt(
        global.dayswappersInstanceESN.updateAuthorization(
          await global.kycDappInstanceESN.resolveUsername(global.accountsESN[0]),
          true
        )
      );
      await parseReceipt(
        global.dayswappersInstanceESN.rewardToTree(
          global.accountsESN[1],
          ethers.utils.parseEther('30'),
          [1, 1, 1]
        )
      );

      // resolve kyc8
      // await parseReceipt(
      //   global.kycDappInstanceESN.register(formatBytes32String('hiii'), {
      //     value: parseEther('31.5'),
      //   })
      // );

      const username = await global.kycDappInstanceESN.resolveUsername(global.accountsESN[0]);
      await parseReceipt(
        global.kycDappInstanceESN.updateKycStatus(
          username,
          1,
          ethers.constants.HashZero,
          ethers.constants.HashZero,
          1
        )
      );

      await parseReceipt(global.dayswappersInstanceESN.resolveKyc(global.accountsESN[0]));
    });

    it('withdraws definite reward in liquid mode', async () => {
      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      const monthlyData = await global.dayswappersInstanceESN.getSeatMonthlyDataByAddress(
        global.accountsESN[0],
        currentMonth
      );

      const stakings = await getTimeAllyStakings(global.accountsESN[0]);
      const staking = stakings[0];

      const liquidBefore = await global.providerESN.getBalance(global.accountsESN[0]);
      const prepaidBefore = await global.prepaidEsInstanceESN.balanceOf(global.accountsESN[0]);
      const principalBefore = await staking.principal();
      const issTimeBefore = await staking.issTimeLimit();

      // reporting volume
      await global.dayswappersInstanceESN.reportVolume(global.accountsESN[0], parseEther('100'));

      await parseReceipt(
        global.dayswappersInstanceESN.withdrawDefiniteEarnings(staking.address, currentMonth, 0)
      );

      const liquidAfter = await global.providerESN.getBalance(global.accountsESN[0]);
      const prepaidAfter = await global.prepaidEsInstanceESN.balanceOf(global.accountsESN[0]);
      const principalAfter = await staking.principal();
      const issTimeAfter = await staking.issTimeLimit();

      strictEqual(
        formatEther(liquidAfter.sub(liquidBefore)),
        formatEther(monthlyData.definiteEarnings[0]),
        'liquid received should be received'
      );
      strictEqual(
        formatEther(prepaidAfter.sub(prepaidBefore)),
        formatEther(monthlyData.definiteEarnings[1]),
        'prepaid received should be correct'
      );
      strictEqual(
        formatEther(principalAfter.sub(principalBefore)),
        formatEther(monthlyData.definiteEarnings[2]),
        'staking toppup received should be correct'
      );
      strictEqual(
        formatEther(issTimeAfter.sub(issTimeBefore)),
        '0.0', // formatEther(seat.definiteEarnings[1].add(seat.definiteEarnings[2])),
        'no isstime should received for liquid mode'
      );
    });

    it('tries to withdraw nrt reward before NRT released', async () => {
      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      try {
        await parseReceipt(
          global.dayswappersInstanceESN.withdrawNrtEarnings(
            ethers.constants.AddressZero,
            currentMonth,
            0
          )
        );

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(
          msg.includes('Dayswappers: NRT_AMOUNT_NOT_RECEIVED_FOR_MONTH'),
          `Invalid error message: ${msg}`
        );
      }
    });

    it('withdraws NRT reward after NRT release in prepaid', async () => {
      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();

      const monthlyData = await global.dayswappersInstanceESN.getSeatMonthlyDataByAddress(
        global.accountsESN[0],
        currentMonth
      );

      const stakings = await getTimeAllyStakings(global.accountsESN[0]);
      const staking = stakings[0];

      // reporting volume
      await global.dayswappersInstanceESN.reportVolume(global.accountsESN[0], parseEther('100'));

      // releasing NRT before withdrawing
      await releaseNrt();

      const liquidBefore = await global.providerESN.getBalance(global.accountsESN[0]);
      const prepaidBefore = await global.prepaidEsInstanceESN.balanceOf(global.accountsESN[0]);
      const principalBefore = await staking.principal();
      const issTimeBefore = await staking.issTimeLimit();

      await parseReceipt(
        global.dayswappersInstanceESN.withdrawNrtEarnings(staking.address, currentMonth, 1)
      );

      const liquidAfter = await global.providerESN.getBalance(global.accountsESN[0]);
      const prepaidAfter = await global.prepaidEsInstanceESN.balanceOf(global.accountsESN[0]);
      const principalAfter = await staking.principal();
      const issTimeAfter = await staking.issTimeLimit();

      strictEqual(
        formatEther(liquidAfter.sub(liquidBefore)),
        '0.0', // formatEther(monthlyData.nrtEarnings[0]),
        'liquid should not be received in prepaid mode'
      );
      strictEqual(
        formatEther(prepaidAfter.sub(prepaidBefore)),
        formatEther(monthlyData.nrtEarnings[0].add(monthlyData.nrtEarnings[1])),
        'prepaid received should be correct'
      );
      strictEqual(
        formatEther(principalAfter.sub(principalBefore)),
        formatEther(monthlyData.nrtEarnings[2]),
        'staking toppup received should be correct'
      );
      strictEqual(
        formatEther(issTimeAfter.sub(issTimeBefore)),
        formatEther(monthlyData.nrtEarnings[0]),
        'isstime received should be correct'
      );
    });
  });
