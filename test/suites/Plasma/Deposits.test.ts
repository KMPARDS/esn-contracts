import { ethers, providers } from 'ethers';
import { generateBlockProposal, _reversePlasmaInstanceESN } from './utils';
import assert from 'assert';

export const Deposits = () =>
  describe('Deposits (from ETH to ESN)', () => {
    it('making a deposit and getting blocks posted', async () => {
      // STEP 1: transfer ES ERC20 into a fund manager contract on ETH
      await global.esInstanceETH.transfer(
        global.fundsManagerInstanceETH.address,
        ethers.utils.parseEther('10')
      );

      // STEP 2: get the block submitted into ReversePlasma
      const uptoblockNumber = await global.providerETH.getBlockNumber();
      let latestBlockNumber = (
        await global.reversePlasmaInstanceESN.latestBlockNumber()
      ).toNumber();

      await global.providerESN.send('miner_stop', []);
      while (latestBlockNumber < uptoblockNumber) {
        const blockProposal = await generateBlockProposal(
          latestBlockNumber + 1,
          global.providerETH
        );

        await global.providerESN.send('miner_stop', []);
        for (let i = 0; i < Math.ceil((global.validatorWallets.length * 2) / 3); i++) {
          await _reversePlasmaInstanceESN(i).proposeBlock(blockProposal, {
            gasPrice: 0, // has zero balance initially
          });
        }
        await global.providerESN.send('miner_start', []);

        await global.reversePlasmaInstanceESN.finalizeProposal(latestBlockNumber + 1, 0);

        latestBlockNumber++;
      }

      let updatedBlockNumber = (
        await global.reversePlasmaInstanceESN.latestBlockNumber()
      ).toNumber();

      assert.strictEqual(updatedBlockNumber, uptoblockNumber, 'should be same now');

      // STEP 3: generate a merkle proof

      // STEP 4: submit it to the fund manager contract on ESN to get funds credited
    });
  });
