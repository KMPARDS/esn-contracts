import assert from 'assert';
import { ethers } from 'ethers';

const BUCKET_AMOUNT = ethers.utils.parseEther('50');

export const MoreSettings = () =>
  describe('Setting enviornment', () => {
    it('gives some ERC20 balance to fundsManagerETH', async () => {
      await global.esInstanceETH.transfer(global.fundsManagerInstanceETH.address, BUCKET_AMOUNT);

      const balance = await global.esInstanceETH.balanceOf(global.fundsManagerInstanceETH.address);
      assert.deepEqual(
        balance,
        BUCKET_AMOUNT,
        'fundsManagerETH contract sohuld receive sent ES ERC20'
      );
    });

    it('gives some ES Native balance to fundsManagerESN', async () => {
      await global.providerESN.getSigner(0).sendTransaction({
        to: global.fundsManagerInstanceESN.address,
        value: BUCKET_AMOUNT,
      });

      const balance = await global.providerESN.getBalance(global.fundsManagerInstanceESN.address);
      assert.deepEqual(
        balance,
        BUCKET_AMOUNT,
        'fundsManagerESN contract sohuld receive sent ES Native'
      );
    });
  });
