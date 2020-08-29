import { ethers } from 'ethers';
import { parseEther, formatBytes32String } from 'ethers/lib/utils';
import { parseReceipt } from '../../utils';
import { strictEqual } from 'assert';

let wallet = ethers.Wallet.createRandom();
const username = 'gocart12';

export const UpdateKycStatus = () =>
  describe('Update Kyc Status', () => {
    before(async () => {
      wallet = wallet.connect(global.providerESN);

      try {
        await global.dayswappersInstanceESN.getSeatByAddress(global.accountsESN[0]);
      } catch {
        await global.dayswappersInstanceESN.join(ethers.constants.AddressZero);
      }

      await global.dayswappersInstanceESN.connect(wallet).join(global.accountsESN[0]);

      await global.providerESN.getSigner(0).sendTransaction({
        to: wallet.address,
        value: parseEther('100'),
      });

      await global.kycDappInstanceESN.connect(wallet).register(formatBytes32String(username), {
        value: parseEther('31.5'),
      });
    });

    it('updates Kyc level 1 as resolved', async () => {
      await parseReceipt(
        global.kycDappInstanceESN.updateKycStatus(
          formatBytes32String(username),
          1,
          ethers.constants.AddressZero,
          ethers.constants.HashZero,
          1
        )
      );

      const kycStatus = await global.kycDappInstanceESN.isKycLevel1(wallet.address);
      strictEqual(kycStatus, true, 'kyc should now be approved');
    });
  });
