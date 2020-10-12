import { constants } from './constants';
import { parseReceipt } from './parseReceipt';

export async function releaseNrt() {
  await global.providerESN.send('evm_increaseTime', [constants.SECONDS_IN_MONTH]);
  await parseReceipt(global.nrtInstanceESN.releaseMonthlyNRT());
}
