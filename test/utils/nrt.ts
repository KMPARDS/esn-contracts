import { constants } from './constants';

export async function releaseNrt() {
  await global.providerESN.send('evm_increaseTime', [constants.SECONDS_IN_MONTH]);
  const tx = await global.nrtInstanceESN.releaseMonthlyNRT();
  await tx.wait();
}
