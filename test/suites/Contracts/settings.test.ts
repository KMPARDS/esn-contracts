import assert from 'assert';
import { ethers } from 'ethers';

export const settings = () =>
  describe('Applying settings to deployed contracts', () => {
    it('sets FundsManagerETH address in fundsManagerInstanceESN', async () => {
      await global.fundsManagerInstanceESN.setFundsManagerETHAddress(
        global.fundsManagerInstanceETH.address
      );

      assert.strictEqual(
        await global.fundsManagerInstanceESN.fundsManagerETH(),
        global.fundsManagerInstanceETH.address,
        'fundsManagerETH address must be set'
      );
    });

    it('sets FundsManagerESN address in fundsManagerInstanceETH', async () => {
      await global.fundsManagerInstanceETH.setFundsManagerESNAddress(
        global.fundsManagerInstanceESN.address
      );

      assert.strictEqual(
        await global.fundsManagerInstanceETH.fundsManagerESN(),
        global.fundsManagerInstanceESN.address,
        'fundsManagerETH address must be set'
      );
    });

    it('gives some ERC20 balance to fundsManagerETH', async () => {
      const amount = ethers.utils.parseEther('100');
      await global.esInstanceETH.transfer(global.fundsManagerInstanceETH.address, amount);

      assert.ok(
        (await global.esInstanceETH.balanceOf(global.fundsManagerInstanceETH.address)).eq(amount),
        'fundsManagerETH contract sohuld receive some ES ERC20'
      );
    });
  });
