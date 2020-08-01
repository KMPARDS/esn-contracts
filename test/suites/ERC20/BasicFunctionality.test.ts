import { EraSwapTokenFactory } from '../../../build/typechain/ETH';
import { formatEther, parseEther, hexlify, randomBytes } from 'ethers/lib/utils';
import { ok, strictEqual } from 'assert';
import { parseReceipt } from '../../utils';

export const BasicFunctionality = () =>
  describe('Basic Functionality', () => {
    it('gives 910 crore ES balance to deployer', async () => {
      const eraswapTokenFactory = new EraSwapTokenFactory(
        global.providerETH.getSigner(global.accountsETH[0])
      );

      // deploying a temporary contract to check deployment balance since existing
      //  global contract has made some transfers.
      const _esInstance = await eraswapTokenFactory.deploy();
      const balance = await _esInstance.balanceOf(global.accountsETH[0]);

      await parseReceipt(_esInstance.deployTransaction);

      strictEqual(formatEther(balance), `910${'0'.repeat(7)}.0`, 'should get 910 crore balance');
    });

    it('transfers tokens to other address', async () => {
      const amount = parseEther('10');

      const balanceSenderBefore = await global.esInstanceETH.balanceOf(global.accountsETH[0]);
      const balanceReceiverBefore = await global.esInstanceETH.balanceOf(global.accountsETH[1]);

      await parseReceipt(global.esInstanceETH.transfer(global.accountsETH[1], amount));

      const balanceSenderAfter = await global.esInstanceETH.balanceOf(global.accountsETH[0]);
      const balanceReceiverAfter = await global.esInstanceETH.balanceOf(global.accountsETH[1]);

      strictEqual(
        formatEther(balanceSenderBefore.sub(balanceSenderAfter)),
        formatEther(amount),
        'senders balance should be reduced by 10 ES'
      );

      strictEqual(
        formatEther(balanceReceiverAfter.sub(balanceReceiverBefore)),
        formatEther(amount),
        'receivers balance should be increased by 10 ES'
      );
    });

    it('tries to transfer more than balance expecting revert', async () => {
      try {
        await parseReceipt(
          global.esInstanceETH
            .connect(global.providerETH.getSigner(1))
            .transfer(global.accountsETH[0], parseEther('20'))
        );

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(msg.includes('ERC20: transfer amount exceeds balance'), `Invalid error message: ${msg}`);
      }
    });

    it('approves a wallet to spend some tokens', async () => {
      const amount = parseEther('30');

      const balanceSenderBefore = await global.esInstanceETH.balanceOf(global.accountsETH[0]);
      const balanceReceiverBefore = await global.esInstanceETH.balanceOf(global.accountsETH[1]);
      const allowanceBefore = await global.esInstanceETH.allowance(
        global.accountsETH[0],
        global.accountsETH[1]
      );

      await parseReceipt(global.esInstanceETH.approve(global.accountsETH[1], amount));

      const balanceSenderAfter = await global.esInstanceETH.balanceOf(global.accountsETH[0]);
      const balanceReceiverAfter = await global.esInstanceETH.balanceOf(global.accountsETH[1]);
      const allowanceAfter = await global.esInstanceETH.allowance(
        global.accountsETH[0],
        global.accountsETH[1]
      );

      strictEqual(
        formatEther(balanceSenderAfter.sub(balanceSenderBefore)),
        '0.0',
        'sender balance should not change'
      );
      strictEqual(
        formatEther(balanceReceiverAfter.sub(balanceReceiverBefore)),
        '0.0',
        'receiver balance should not change'
      );
      strictEqual(
        formatEther(allowanceAfter.sub(allowanceBefore)),
        formatEther(amount),
        'allowance should increase'
      );
    });

    it('spends some of the allowance', async () => {
      const randomAddress = hexlify(randomBytes(20));
      const amount = parseEther('5');

      const balanceSpenderBefore = await global.esInstanceETH.balanceOf(global.accountsETH[1]);
      const balanceSenderBefore = await global.esInstanceETH.balanceOf(global.accountsETH[0]);
      const balanceReceiverBefore = await global.esInstanceETH.balanceOf(randomAddress);

      await parseReceipt(
        global.esInstanceETH
          .connect(global.providerETH.getSigner(1))
          .transferFrom(global.accountsETH[0], randomAddress, amount)
      );

      const balanceSpenderAfter = await global.esInstanceETH.balanceOf(global.accountsETH[1]);
      const balanceSenderAfter = await global.esInstanceETH.balanceOf(global.accountsETH[0]);
      const balanceReceiverAfter = await global.esInstanceETH.balanceOf(randomAddress);

      strictEqual(
        formatEther(balanceSenderBefore.sub(balanceSenderAfter)),
        formatEther(amount),
        'sender balance should not change'
      );
      strictEqual(
        formatEther(balanceReceiverAfter.sub(balanceReceiverBefore)),
        formatEther(amount),
        'receiver balance should not change'
      );
      strictEqual(
        formatEther(balanceSpenderAfter.sub(balanceSpenderBefore)),
        '0.0',
        'allowance should not change'
      );
    });

    it('tries to spend more than allowance expecting revert', async () => {
      try {
        await parseReceipt(
          global.esInstanceETH
            .connect(global.providerETH.getSigner(1))
            .transferFrom(global.accountsETH[0], hexlify(randomBytes(20)), parseEther('100'))
        );

        ok(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        ok(
          msg.includes('ERC20: transfer amount exceeds allowance'),
          `Invalid error message: ${msg}`
        );
      }
    });
  });
