import assert from 'assert';
import { ethers } from 'ethers';
import { getBunchFinalizedFromESN, parseReceipt, generateWithdrawalProof } from '../../utils';

export const Withdrawals = () =>
  describe('Withdrawals (from ESN to ETH)', async () => {
    let firstTx: ethers.providers.TransactionResponse;
    let firstWithdrawProof: string;
    const amount = ethers.utils.parseEther('10');
    it('makes a deposit on ESN and gets withdrawal of ERC20 ES tokens on ETH', async () => {
      // STEP 1: transfer ES into the fund manager contract on ESN
      const signer = global.providerESN.getSigner(1);
      firstTx = await signer.sendTransaction({
        to: global.fundsManagerInstanceESN.address,
        value: amount,
        gasLimit: 30000,
      });

      // STEP 2: getting ESN blocks posted on ETH
      const receipt = await global.providerESN.getTransactionReceipt(firstTx.hash);
      await getBunchFinalizedFromESN(receipt.blockNumber);

      // STEP 3: generate a proof
      firstWithdrawProof = await generateWithdrawalProof(receipt.transactionHash);

      // STEP 4: submit proof to the fund manager contract on ETH
      const balanceBefore = await global.esInstanceETH.balanceOf(await signer.getAddress());
      await global.fundsManagerInstanceETH.claimWithdrawal(firstWithdrawProof);
      const balanceAfter = await global.esInstanceETH.balanceOf(await signer.getAddress());
      assert.ok(balanceAfter.sub(balanceBefore).eq(amount), 'should get ERC20 tokens');
    });

    it('replays the previous withdrawal expecting revert', async () => {
      const addr = await global.providerESN.getSigner(1).getAddress();
      const esBalanceBefore = await global.esInstanceETH.balanceOf(addr);
      try {
        await parseReceipt(global.fundsManagerInstanceETH.claimWithdrawal(firstWithdrawProof));
        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;
        assert.ok(
          msg.includes('revert FM_ETH: Tx already claimed'),
          `Invalid error message: ${msg}`
        );
      }
      const esBalanceAfter = await global.esInstanceETH.balanceOf(addr);
      assert.ok(
        esBalanceAfter.sub(esBalanceBefore).eq(0),
        'should not receive any ES for replayed tx'
      );
    });

    it('tries with a made up transaction expecting revert', async () => {
      const addr = await global.esInstanceETH.signer.getAddress();
      const esBalanceBefore = await global.esInstanceETH.balanceOf(addr);

      const madeUpProof = await generateWithdrawalProof(firstTx.hash, {
        // creating a modifying the transaction would change the hash hence it
        //   would be computationally difficult to prove inclusion in merkle tree
        rawTransaction: ethers.utils.serializeTransaction(
          {
            to: firstTx.to,
            nonce: firstTx.nonce,
            gasPrice: firstTx.gasPrice,
            gasLimit: firstTx.gasLimit,
            data: firstTx.data,
            value: amount.add(ethers.utils.parseEther('1')), // changing actual value
            chainId: firstTx.chainId,
          },
          {
            // @ts-ignore Need this due to r's signature (https://github.com/ethers-io/ethers.js/issues/878)
            r: firstTx.r,
            s: firstTx.s,
            v: firstTx.v,
          }
        ),
      });

      try {
        await parseReceipt(global.fundsManagerInstanceETH.claimWithdrawal(madeUpProof));
        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;
        assert.ok(
          msg.includes('revert FM_ETH: Invalid MPT Tx proof'),
          `Invalid error message: ${msg}`
        );
      }

      const esBalanceAfter = await global.esInstanceETH.balanceOf(addr);
      assert.ok(
        esBalanceAfter.sub(esBalanceBefore).eq(0),
        'should not receive any ES for made up tx'
      );
    });
  });
