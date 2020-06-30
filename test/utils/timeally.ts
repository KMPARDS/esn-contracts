import { TimeAllyStakingFactory } from '../../build/typechain/ESN';
import { TimeAllyStaking } from '../../build/typechain/ESN/TimeAllyStaking';

export async function getTimeAllyStakings(staker: string): Promise<TimeAllyStaking[]> {
  return (
    await global.timeallyInstanceESN.queryFilter(
      global.timeallyInstanceESN.filters.NewStaking(staker, null)
    )
  )
    .map((event) => global.timeallyInstanceESN.interface.parseLog(event))
    .map((parsedLog) => {
      const stakingAddress: string = parsedLog.args[1];
      return TimeAllyStakingFactory.connect(
        stakingAddress,
        global.providerESN.getSigner(global.accountsESN[0])
      );
    });
}
