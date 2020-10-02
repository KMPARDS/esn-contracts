import { parseEther, formatBytes32String } from 'ethers/lib/utils';
import { parseReceipt } from '../../utils';
import { ok } from 'assert';
import { Wallet, ethers } from 'ethers';

let wallet = Wallet.createRandom();

export const CreateBet = () =>
  describe('Create Bet', () => {
    before(async () => {
      wallet = wallet.connect(global.providerESN);
    });
    it('tries to create a bet from non-kyc account', async () => {
      try {
        await parseReceipt(
          global.betdeexInstanceESN
            .connect(wallet)
            .createBet(
              'hihello',
              0,
              0,
              parseEther('10'),
              980,
              true,
              Math.ceil(Date.now() / 1000) + 100
            )
          // true
        );

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(msg.includes('BetDeEx: KYC_REQUIRED'), `Invalid error message: ${msg}`);
      }
    });
    it('creates a bet from kyc approved account', async () => {
      await global.kycDappInstanceESN.setIdentityOwner(
        formatBytes32String('demobetdeex'),
        wallet.address,
        false,
        1 // kyc gets approved when 1 is passed. Otherwise 0 can be passed
      );
      // await global.kycDappInstanceESN.updateKycStatus(
      //   formatBytes32String('demobetdeex'),
      //   1,
      //   ethers.constants.HashZero,
      //   ethers.constants.HashZero,
      //   1
      // );

      await parseReceipt(
        global.betdeexInstanceESN
          .connect(wallet)
          .createBet(
            'hihello',
            0,
            0,
            parseEther('10'),
            980,
            true,
            Math.ceil(Date.now() / 1000) + 100
          )
        // true
      );
    });
  });
