import assert from 'assert';
import { ethers } from 'ethers';
import { getBunchFinalized } from '../../utils';
import { generateWithdrawalProof } from '../../utils';

export const Withdrawals = () =>
  describe('Withdrawals (from ESN to ETH)', async () => {
    it('makes a deposit on ESN and gets withdrawal of ERC20 ES tokens on ETH', async () => {
      // STEP 1: transfer ES into the fund manager contract on ESN
      const amount = ethers.utils.parseEther('10');
      const signer = global.providerESN.getSigner(1);
      const tx = await signer.sendTransaction({
        to: global.fundsManagerInstanceESN.address,
        value: amount,
        gasLimit: 30000,
      });

      // STEP 2: getting ESN blocks posted on ETH
      const receipt = await global.providerESN.getTransactionReceipt(tx.hash);
      await getBunchFinalized(receipt.blockNumber);

      // STEP 3: generate a proof
      const withdrawProof = await generateWithdrawalProof(receipt.transactionHash);

      // STEP 4: submit proof to the fund manager contract on ETH
      const balanceBefore = await global.esInstanceETH.balanceOf(await signer.getAddress());
      await global.fundsManagerInstanceETH.claimWithdrawal(withdrawProof);
      const balanceAfter = await global.esInstanceETH.balanceOf(await signer.getAddress());
      assert.ok(balanceAfter.sub(balanceBefore).eq(amount), 'should get ERC20 tokens');
    });
  });
