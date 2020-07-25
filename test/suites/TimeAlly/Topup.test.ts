import assert from 'assert';
import { ethers } from 'ethers';
import { getTimeAllyStakings } from '../../utils';

export const TopupStaking = () =>
  describe('Topup Staking', () => {
    const topupAmount = 200;
    it(`topups an existing staking by ${topupAmount}`, async () => {
      const stakingInstances = await getTimeAllyStakings(global.accountsESN[0]);
      const stakingInstance = stakingInstances[0];

      const stakingAmount = await stakingInstance.getPrincipalAmount(
        (await global.nrtInstanceESN.currentNrtMonth()).add(1)
      );

      const signer = global.providerESN.getSigner(global.accountsESN[0]);
      await signer.sendTransaction({
        to: stakingInstance.address,
        value: ethers.utils.parseEther(String(topupAmount)),
      });

      const principalAmounts: ethers.BigNumber[] = [];
      const totalActiveStakings: ethers.BigNumber[] = [];
      const startMonth = await stakingInstance.startMonth();
      const endMonth = await stakingInstance.endMonth();

      for (let i = startMonth.toNumber(); i <= endMonth.toNumber(); i++) {
        principalAmounts.push(await stakingInstance.getPrincipalAmount(i));
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
