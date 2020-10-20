import { parseEther, formatBytes32String } from 'ethers/lib/utils';
import { parseReceipt } from '../../utils';
import { BetFactory } from '../../../build/typechain/ESN';

export const EnterBet = () =>
  describe('Enter Bet', () => {
    it('enters a bet', async () => {
      const filter = global.betdeexInstanceESN.filters.NewBetEvent(null, null, null, null, null);
      const logs = await global.betdeexInstanceESN.queryFilter(filter);
      const args = (logs.map((log) => log.args) as unknown) as {
        _deployer: string;
        _contractAddress: string;
        _category: number;
        _subCategory: number;
        _description: string;
      }[];
      // console.log(args);
      const addr = args[0]._contractAddress;
      // console.log(addr);

      if (!(await global.kycDappInstanceESN.isKycLevel1(global.accountsESN[0]))) {
        await global.kycDappInstanceESN.setIdentityOwner(
          formatBytes32String('ERASWAP_TEAM'),
          global.accountsESN[0],
          false,
          1
        );
      }

      const betInstance = BetFactory.connect(addr, global.providerESN.getSigner(0));

      const amount = parseEther('10');
      await parseReceipt(betInstance.enterBet(0, { value: amount }));
    });
  });
