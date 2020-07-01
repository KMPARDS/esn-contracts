import { constants } from './constants';

export async function releaseNrt() {
  await global.providerESN.send('evm_increaseTime', [constants.SECONDS_IN_MONTH]);
  await global.nrtInstanceESN.releaseMonthlyNRT();
}
