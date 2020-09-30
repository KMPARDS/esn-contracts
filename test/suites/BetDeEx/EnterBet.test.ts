import { parseEther } from 'ethers/lib/utils';
import { parseReceipt } from '../../utils';

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

      // TODO: add more checks
    });
  });
