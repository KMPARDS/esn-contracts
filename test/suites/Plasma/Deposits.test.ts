import assert from 'assert';
import { ethers } from 'ethers';
import { parseReceipt, getBlockFinalizedToESN, generateDepositProof } from '../../utils';
import { Erc20Factory } from '../../../build/typechain/ETH/';

export const Deposits = () =>
  describe('Deposits (from ETH to ESN)', () => {
    let firstTx: ethers.ContractReceipt;
    let firstDepositProof: string;
    const amount = ethers.utils.parseEther('10');
    it('makes a deposit on ETH and gets withdrawal on ESN', async () => {
      // STEP 1: transfer ES ERC20 into a fund manager contract on ETH
      firstTx = await parseReceipt(
        global.esInstanceETH.transfer(global.fundsManagerInstanceETH.address, amount)
      );

      // STEP 2: getting the ETH block roots finalized on ESN
      await getBlockFinalizedToESN(firstTx.blockNumber);

      // STEP 3: generate a merkle proof
      firstDepositProof = await generateDepositProof(firstTx.transactionHash);

      // STEP 4: submit it to the fund manager contract on ESN to get funds credited
      const addr = await global.esInstanceETH.signer.getAddress();
      const esBalanceBefore = await global.providerESN.getBalance(addr);
      await parseReceipt(global.fundsManagerInstanceESN.claimDeposit(firstDepositProof));
      const esBalanceAfter = await global.providerESN.getBalance(addr);
      assert.ok(
        esBalanceAfter.sub(esBalanceBefore).eq(amount),
        'should receive the amount on ESN chain'
      );
    });

    it('replays the previous deposit expecting revert', async () => {
      const addr = await global.esInstanceETH.signer.getAddress();
      const esBalanceBefore = await global.providerESN.getBalance(addr);

      try {
        await parseReceipt(global.fundsManagerInstanceESN.claimDeposit(firstDepositProof));
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
        // creating a modifying the transaction would change the hash hence it
        //   would be computationally difficult to prove inclusion in merkle tree
        rawTransaction: ethers.utils.serializeTransaction(
          {
            to: tx.to,
            nonce: tx.nonce,
            gasPrice: tx.gasPrice,
            gasLimit: tx.gasLimit,
            data: tx.data,
            value: amount.add(ethers.utils.parseEther('1')), // changing actual value
            chainId: tx.chainId,
          },
          {
            r: tx.r || '0x',
            s: tx.s,
            v: tx.v,
          }
        ),
      });

      try {
        await parseReceipt(global.fundsManagerInstanceESN.claimDeposit(madeUpProof));
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

    it('tries with an invalid rlp to claim deposit expecting revert', async () => {
      try {
        await parseReceipt(
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

      const depositReceipt = await global.providerETH.getTransactionReceipt(rpcResponse.result);

      await getBlockFinalizedToESN(depositReceipt.blockNumber);

      const depositProof = await generateDepositProof(depositReceipt.transactionHash);

      const addr = tempSigner.address;
      const esBalanceBefore = await global.providerESN.getBalance(addr);

      try {
        await parseReceipt(global.fundsManagerInstanceESN.claimDeposit(depositProof));
        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;
        assert.ok(
          msg.includes('revert FM_ESN: Failed Rc not acceptable'),
          `Invalid error message: ${msg}`
        );
      }

      const esBalanceAfter = await global.providerESN.getBalance(addr);

      assert.ok(
        esBalanceAfter.sub(esBalanceBefore).eq(0),
        'should not receive amount for a failed tranasction'
      );
    });

    it('tries with an ERC20 approve transaction expecting revert', async () => {
      const tx = await parseReceipt(
        global.esInstanceETH.approve(
          global.fundsManagerInstanceETH.address,
          ethers.utils.parseEther('1.5')
        )
      );

      await getBlockFinalizedToESN(tx.blockNumber);

      const depositProof = await generateDepositProof(tx.transactionHash);

      const addr = await global.esInstanceETH.signer.getAddress();
      const esBalanceBefore = await global.providerESN.getBalance(addr);
      try {
        await parseReceipt(global.fundsManagerInstanceESN.claimDeposit(depositProof));
        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;
        assert.ok(
          msg.includes('revert FM_ESN: Not ERC20 transfer'),
          `Invalid error message: ${msg}`
        );
      }

      const esBalanceAfter = await global.providerESN.getBalance(addr);
      assert.ok(
        esBalanceAfter.sub(esBalanceBefore).eq(0),
        'should not receive amount for a invalid tranasction'
      );
    });

    it('tries with an ERC20 transfer to other wallet address expecting revert', async () => {
      const tx = await parseReceipt(
        global.esInstanceETH.transfer(
          ethers.utils.hexlify(ethers.utils.randomBytes(20)),
          ethers.utils.parseEther('1.5')
        )
      );

      await getBlockFinalizedToESN(tx.blockNumber);

      const depositProof = await generateDepositProof(tx.transactionHash);

      const addr = await global.esInstanceETH.signer.getAddress();
      const esBalanceBefore = await global.providerESN.getBalance(addr);
      try {
        await parseReceipt(global.fundsManagerInstanceESN.claimDeposit(depositProof));
        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;
        assert.ok(
          msg.includes('revert FM_ESN: Incorrect deposit addrs'),
          `Invalid error message: ${msg}`
        );
      }

      const esBalanceAfter = await global.providerESN.getBalance(addr);
      assert.ok(
        esBalanceAfter.sub(esBalanceBefore).eq(0),
        'should not receive amount for a tranasction to incorrect address'
      );
    });

    it('tries with an another ERC20 contract expecting revert', async () => {
      const deployTx = global.esInstanceETH.deployTransaction;
      const signer = global.providerETH.getSigner(1);
      const signerAddress = await signer.getAddress();

      await signer.sendTransaction({
        to: ethers.constants.AddressZero,
        data: deployTx.data,
        gasLimit: deployTx.gasLimit,
        nonce: await global.providerETH.getTransactionCount(signerAddress),
      });

      const hash = ethers.utils.keccak256(ethers.utils.RLP.encode([signerAddress, '0x']));

      const contractAddress = '0x' + hash.slice(12 * 2 + 2);

      const _esInstanceETH = Erc20Factory.connect(contractAddress, signer);

      const receipt = await parseReceipt(
        _esInstanceETH.transfer(
          global.fundsManagerInstanceETH.address,
          ethers.utils.parseEther('1.5')
        )
      );

      await getBlockFinalizedToESN(receipt.blockNumber);

      const depositProof = await generateDepositProof(receipt.transactionHash);

      const esBalanceBefore = await global.providerESN.getBalance(signerAddress);
      try {
        await parseReceipt(global.fundsManagerInstanceESN.claimDeposit(depositProof));
        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;
        assert.ok(
          msg.includes('revert FM_ESN: Incorrect ERC20 contract'),
          `Invalid error message: ${msg}`
        );
      }

      const esBalanceAfter = await global.providerESN.getBalance(signerAddress);
      assert.ok(
        esBalanceAfter.sub(esBalanceBefore).eq(0),
        'should not receive amount for a tranasction using incorrect contract'
      );
    });

    it('tries with multiple transactions in one block should work', async () => {
      const txArray: ethers.ContractTransaction[] = [];

      await global.providerETH.send('miner_stop', []);
      for (const _ of Array(10)) {
        txArray.push(
          await global.esInstanceETH.transfer(
            global.fundsManagerInstanceETH.address,
            ethers.utils.parseEther('2')
          )
        );
      }
      await global.providerETH.send('miner_start', []);

      const firstReceipt = await global.providerETH.getTransactionReceipt(txArray[0].hash);
      await getBlockFinalizedToESN(firstReceipt.blockNumber);

      for (const tx of txArray) {
        const depositProof = await generateDepositProof(tx.hash);

        const addr = await global.esInstanceETH.signer.getAddress();
        const esBalanceBefore = await global.providerESN.getBalance(addr);

        await parseReceipt(global.fundsManagerInstanceESN.claimDeposit(depositProof));

        const esBalanceAfter = await global.providerESN.getBalance(addr);
        assert.ok(
          esBalanceAfter.sub(esBalanceBefore).eq(ethers.utils.parseEther('2')),
          'should recieve 2 ES Natives through this tranasction'
        );
      }
    });
  });
