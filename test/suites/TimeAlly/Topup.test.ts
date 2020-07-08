import assert from 'assert';
import { ethers } from 'ethers';
import { getTimeAllyStakings } from '../../utils';

export const TopupStaking = () =>
  describe('Topup Staking', () => {
    const topupAmount = 200;
    it(`topups an existing staking by ${topupAmount}`, async () => {
      const stakeInstances = await getTimeAllyStakings(global.accountsESN[0]);
      const stakeInstance = stakeInstances[0];

      const stakingAmount = await stakeInstance.getPrincipalAmount(
        (await global.nrtInstanceESN.currentNrtMonth()).add(1)
      );

      const signer = global.providerESN.getSigner(global.accountsESN[0]);
      await signer.sendTransaction({
        to: stakeInstance.address,
        value: ethers.utils.parseEther(String(topupAmount)),
      });

      assert.deepEqual(
        await stakeInstance.unboundedBasicAmount(),
        stakingAmount
          .add(ethers.utils.parseEther(String(topupAmount)))
          .mul(2)
          .div(100),
        'unbounded basic amount should be set correctly'
      );

      const principalAmounts: ethers.BigNumber[] = [];
      const totalActiveStakings: ethers.BigNumber[] = [];
      const stakingStartMonth = await stakeInstance.stakingStartMonth();
      const stakingEndMonth = await stakeInstance.stakingEndMonth();

      for (let i = stakingStartMonth.toNumber(); i <= stakingEndMonth.toNumber(); i++) {
        principalAmounts.push(await stakeInstance.getPrincipalAmount(i));
        totalActiveStakings.push(await global.timeallyInstanceESN.getTotalActiveStaking(i));
      }

      principalAmounts.map((principalAmount) => {
        assert.deepEqual(
          principalAmount,
          stakingAmount.add(ethers.utils.parseEther(String(topupAmount))),
          'principal amount should be updated correctly'
        );
      });

      totalActiveStakings.map((totalActive) => {
        assert.deepEqual(
          totalActive,
          stakingAmount.add(ethers.utils.parseEther(String(topupAmount))),
          'total active stakings should be updated correctly'
        );
      });
    });
  });
