import assert from 'assert';
import { ethers, providers } from 'ethers';
import { parseTx, c, generateBlockProposal, generateDepositProof } from '../../utils';
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
      await global.providerESN.send('miner_stop', []);
      const blockProposal = await generateBlockProposal(mainTx.blockNumber, global.providerETH);
      for (let i = 0; i < Math.ceil((global.validatorWallets.length * 2) / 3); i++) {
        // @ts-ignore
        const _reversePlasmaInstanceESN: ReversePlasma = c(
          global.reversePlasmaInstanceESN,
          global.validatorWallets[i]
        );
        await _reversePlasmaInstanceESN.proposeBlock(blockProposal, {
          gasPrice: 0, // has zero balance initially
        });
      }
      await global.providerESN.send('miner_start', []);
      await global.reversePlasmaInstanceESN.finalizeProposal(mainTx.blockNumber, 0);

      // STEP 3: generate a merkle proof
      const depositProof = await generateDepositProof(mainTx.transactionHash);

      // STEP 4: submit it to the fund manager contract on ESN to get funds credited
      await parseTx(global.fundsManagerInstanceESN.claimDeposit(depositProof));
    });
  });
