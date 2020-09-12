import { ethers } from 'ethers';
import { parseReceipt } from '../../utils';
import { strictEqual } from 'assert';
import { formatBytes32String, parseEther } from 'ethers/lib/utils';

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
    introducer: ethers.Wallet.createRandom().address,
    beltIndex: 4,
  },
];

export const Migration = () =>
  describe('Migration', () => {
    it('migrates few accounts', async () => {
      await parseReceipt(global.dayswappersInstanceESN.migrateSeats(migrationData), true);
    });
  });
