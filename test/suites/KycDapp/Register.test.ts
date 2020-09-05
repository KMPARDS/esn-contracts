import { ethers } from 'ethers';
import { parseEther, formatBytes32String, formatEther, parseBytes32String } from 'ethers/lib/utils';
import { parseReceipt } from '../../utils';
import { ok, strictEqual } from 'assert';

let wallet = ethers.Wallet.createRandom();

export const Register = () =>
  describe('Register', () => {
    before(async () => {
      wallet = wallet.connect(global.providerESN);

      await global.providerESN.getSigner(0).sendTransaction({
        to: wallet.address,
        value: parseEther('100'),
      });
    });

    it('tries to register on KycDapp without fees expecting revert', async () => {
      try {
        await parseReceipt(
          global.kycDappInstanceESN.connect(wallet).register(formatBytes32String('hello'))
        );

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(msg.includes('Kyc: Insufficient KYC Fees'), `Invalid error message: ${msg}`);
      }
    });

    it('tries to register on KycDapp with excess fees expecting revert', async () => {
      try {
        await parseReceipt(
          global.kycDappInstanceESN.connect(wallet).register(formatBytes32String('hello'), {
            value: parseEther('40'),
          })
        );

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(msg.includes('Kyc: Excess KYC Fees'), `Invalid error message: ${msg}`);
      }
    });

    it('fetches kyc fees and registers', async () => {
      const kycFeeLevel1 = await global.kycDappInstanceESN.getKycFee(
        1,
        ethers.constants.AddressZero,
        ethers.constants.HashZero
      );
      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      const expectedFee = currentMonth < 12 ? '31.5' : String(31.5 * 0.9);
      strictEqual(
        formatEther(kycFeeLevel1),
        expectedFee,
        `Kyc charge should be ${expectedFee} for ${currentMonth < 12 ? 'first' : 'second'} year`
      );

      const charityPool = await global.kycDappInstanceESN.resolveAddress(
        formatBytes32String('CHARITY_DAPP')
      );
      const faithMinus = await global.kycDappInstanceESN.owner();

      const faithMinusBefore = await global.providerESN.getBalance(faithMinus);
      const burnPoolBefore = await global.nrtInstanceESN.burnPoolBalance();
      const charityPoolBefore = await global.providerESN.getBalance(charityPool);

      await parseReceipt(
        global.kycDappInstanceESN.connect(wallet).register(formatBytes32String('hello12x'), {
          value: kycFeeLevel1,
        })
      );

      const faithMinusAfter = await global.providerESN.getBalance(faithMinus);
      const burnPoolAfter = await global.nrtInstanceESN.burnPoolBalance();
      const charityPoolAfter = await global.providerESN.getBalance(charityPool);

      strictEqual(
        formatEther(faithMinusAfter.sub(faithMinusBefore)),
        formatEther(kycFeeLevel1.mul(80).div(100)),
        'faithminus or admin should receive 80% fees'
      );
      strictEqual(
        formatEther(burnPoolAfter.sub(burnPoolBefore)),
        formatEther(kycFeeLevel1.mul(10).div(100)),
        'burn pool should receive 10% fees'
      );
      strictEqual(
        formatEther(charityPoolAfter.sub(charityPoolBefore)),
        formatEther(kycFeeLevel1.mul(10).div(100)),
        'charity pool should receive 10% fees'
      );

      const identity = await global.kycDappInstanceESN.getIdentityByAddress(wallet.address);
      strictEqual(
        parseBytes32String(identity.username),
        'hello12x',
        'identity username should be correct'
      );

      const kycStatus = await global.kycDappInstanceESN.getKycStatusByAddress(
        wallet.address,
        1,
        ethers.constants.AddressZero,
        ethers.constants.HashZero
      );
      strictEqual(kycStatus, 0, 'initially kyc status should be 0');

      const isKycLevel1 = await global.kycDappInstanceESN.isKycLevel1(wallet.address);
      strictEqual(isKycLevel1, false, 'initially kyc level 1 sohuld be false');
    });
  });
