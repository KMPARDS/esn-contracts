import { ethers } from 'ethers';
import { parseReceipt } from '../../utils';
import { strictEqual } from 'assert';
import { formatBytes32String, parseEther } from 'ethers/lib/utils';

export const Migration = () =>
  describe('Migration', () => {
    it('migrates few accounts', async () => {
      const migrationData: {
        owner: string;
        kycResolved: boolean;
        incompleteKycResolveSeatIndex: ethers.BigNumberish;
        depth: ethers.BigNumberish;
        introducer: string;
        beltIndex: ethers.BigNumberish;
      }[] = [
        {
          owner: ethers.Wallet.createRandom().address,
          kycResolved: true,
          incompleteKycResolveSeatIndex: 0,
          depth: 3,
          introducer: global.accountsESN[0],
          beltIndex: 4,
        },
      ];

      await parseReceipt(global.dayswappersInstanceESN.migrateSeats(migrationData));
    });
  });
