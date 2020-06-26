import { TimeAllyStakeFactory } from '../../build/typechain/ESN';
import { TimeAllyStake } from '../../build/typechain/ESN/TimeAllyStake';

export async function getTimeAllyStakings(staker: string): Promise<TimeAllyStake[]> {
  return (
    await global.timeallyInstanceESN.queryFilter(
      global.timeallyInstanceESN.filters.NewStaking(staker, null)
    )
  )
    .map((event) => global.timeallyInstanceESN.interface.parseLog(event))
    .map((parsedLog) => {
      const stakingAddress: string = parsedLog.args[1];
      return TimeAllyStakeFactory.connect(
        stakingAddress,
        global.providerESN.getSigner(global.accountsESN[0])
      );
    });
}
