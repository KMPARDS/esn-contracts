import assert from 'assert';
import { ethers } from 'ethers';
import { parseTx, getBlockFinalized, generateDepositProof } from '../../utils';
import { serializeTransaction } from 'ethers/lib/utils';

export const Deposits = () =>
  describe('Deposits (from ETH to ESN)', () => {
    let firstTx: ethers.ContractReceipt;
    let firstDepositProof: string;
    const amount = ethers.utils.parseEther('10');
    it('makes a deposit on ETH and gets withdrawal on ESN', async () => {
      // STEP 1: transfer ES ERC20 into a fund manager contract on ETH
      firstTx = await parseTx(
        global.esInstanceETH.transfer(global.fundsManagerInstanceETH.address, amount)
      );

      // STEP 2: getting the ETH block roots finalized on ESN
      await getBlockFinalized(firstTx.blockNumber);

      // STEP 3: generate a merkle proof
      firstDepositProof = await generateDepositProof(firstTx.transactionHash);

      // STEP 4: submit it to the fund manager contract on ESN to get funds credited
      const addr = await global.esInstanceETH.signer.getAddress();
      const esBalanceBefore = await global.providerESN.getBalance(addr);
      await parseTx(global.fundsManagerInstanceESN.claimDeposit(firstDepositProof));
      const esBalanceAfter = await global.providerESN.getBalance(addr);
      assert.ok(
        esBalanceAfter.sub(esBalanceBefore).eq(amount),
        'should receive the amount on ESN chain'
      );
    });

    it('replays previous deposit expecting revert', async () => {
      const addr = await global.esInstanceETH.signer.getAddress();
      const esBalanceBefore = await global.providerESN.getBalance(addr);

      try {
        await parseTx(global.fundsManagerInstanceESN.claimDeposit(firstDepositProof));
        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;
        assert.ok(
          msg.includes('revert FM_ESN: Tx already claimed'),
          `Invalid error message: ${msg}`
        );
      }

      const esBalanceAfter = await global.providerESN.getBalance(addr);
      assert.ok(
        esBalanceAfter.sub(esBalanceBefore).eq(0),
        'should not receive any ES for replayed tx'
      );
    });

    it('tries with a made up transaction expecting revert', async () => {
      const addr = await global.esInstanceETH.signer.getAddress();
      const esBalanceBefore = await global.providerESN.getBalance(addr);

      const tx = await global.providerETH.getTransaction(firstTx.transactionHash);
      const madeUpProof = await generateDepositProof(firstTx.transactionHash, {
        rawTransaction: serializeTransaction(
          {
            to: tx.to,
            nonce: tx.nonce,
            gasPrice: tx.gasPrice,
            gasLimit: tx.gasLimit,
            data: tx.data,
            value: amount.add(ethers.utils.parseEther('1')),
            chainId: tx.chainId,
          },
          {
            // @ts-ignore
            r: tx.r,
            s: tx.s,
            v: tx.v,
          }
        ),
      });

      try {
        await parseTx(global.fundsManagerInstanceESN.claimDeposit(madeUpProof));
        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;
        assert.ok(
          msg.includes('revert FM_ESN: Invalid MPT Tx proof'),
          `Invalid error message: ${msg}`
        );
      }

      const esBalanceAfter = await global.providerESN.getBalance(addr);
      assert.ok(
        esBalanceAfter.sub(esBalanceBefore).eq(0),
        'should not receive any ES for made up tx'
      );
    });

    it('tries with invalid rlp to claim deposit expecting revert', async () => {
      try {
        await parseTx(
          global.fundsManagerInstanceESN.claimDeposit(
            ethers.utils.concat(['0x19', ethers.utils.randomBytes(1000)])
          )
        );
        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;
        assert.ok(msg.includes('revert RLP: item is not list'), `Invalid error message: ${msg}`);
      }
    });

    it('tries with a failed ERC20 transaction expecting revert', async () => {
      const tempSigner = global.validatorWallets[1]; // has ether but doesn't have ERC20 tokens

      const depositPopulatedTx = await global.esInstanceETH.populateTransaction.transfer(
        global.fundsManagerInstanceETH.address,
        amount
      );

      delete depositPopulatedTx.from;
      const signedTx = await tempSigner.signTransaction({
        ...depositPopulatedTx,
        // gasPrice: 0,
        nonce: 0,
        gasLimit: 1000000,
      });

      // @dev had to do this because ethers library throws if
      //  error object is present in rpc response
      const rpcResponse = await ethers.utils.fetchJson(
        global.providerETH.connection.url,
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_sendRawTransaction',
          params: [signedTx],
          id: 1,
        })
      );

      const depositTx = await global.providerETH.getTransaction(rpcResponse.result);
      // @ts-ignore
      await getBlockFinalized(depositTx.blockNumber);

      const depositProof = await generateDepositProof(depositTx.hash);

      const addr = tempSigner.address;
      const esBalanceBefore = await global.providerESN.getBalance(addr);

      try {
        await parseTx(global.fundsManagerInstanceESN.claimDeposit(depositProof), true, true);
        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;
        console.log(msg);

        assert.ok(
          msg.includes('revert FM_ESN: Failed Rc not acceptable'),
          `Invalid error message: ${msg}`
        );
      }

      const esBalanceAfter = await global.providerESN.getBalance(addr);
      console.log({
        esBalanceBefore: ethers.utils.formatEther(esBalanceBefore),
        esBalanceAfter: ethers.utils.formatEther(esBalanceAfter),
      });
      assert.ok(
        esBalanceAfter.sub(esBalanceBefore).eq(0),
        'should not receive amount for a failed tranasction'
      );
    });
  });
