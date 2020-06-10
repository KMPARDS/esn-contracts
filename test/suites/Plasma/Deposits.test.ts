import assert from 'assert';
import { ethers, providers } from 'ethers';
import { parseTx, getBlockFinalized, generateDepositProof } from '../../utils';
import { ReversePlasma } from '../../interfaces/ESN';

export const Deposits = () =>
  describe('Deposits (from ETH to ESN)', () => {
    it('makes a deposit on ETH and gets withdrawal on ESN', async () => {
      // STEP 1: transfer ES ERC20 into a fund manager contract on ETH
      const mainTx = await parseTx(
        global.esInstanceETH.transfer(
          global.fundsManagerInstanceETH.address,
          ethers.utils.parseEther('10')
        )
      );

      // STEP 2: getting the ETH block roots finalized on ESN
      await getBlockFinalized(mainTx.blockNumber);

      // STEP 3: generate a merkle proof
      const depositProof = await generateDepositProof(mainTx.transactionHash);

      // STEP 4: submit it to the fund manager contract on ESN to get funds credited
      const addr = await global.esInstanceETH.signer.getAddress();
      const esBalanceBefore = await global.providerESN.getBalance(addr);
      await parseTx(global.fundsManagerInstanceESN.claimDeposit(depositProof));
      const esBalanceAfter = await global.providerESN.getBalance(addr);
      assert.ok(
        esBalanceAfter.sub(esBalanceBefore).eq(amount),
        'should receive the amount on ESN chain'
      );
    });
  });
