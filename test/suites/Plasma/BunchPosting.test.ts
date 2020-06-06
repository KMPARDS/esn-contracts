import { ethers } from 'ethers';
import { generateBunchProposal, signBunchData, Bytes } from './utils';
import assert from 'assert';

export const BunchPosting = () =>
  describe('Bunch Posting of ESN bunches to ETH contract', () => {
    it('posting correct bunch header with valid signatures should success', async () => {
      const initialStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();
      assert.strictEqual(
        initialStartBlockNumber.toNumber(),
        0,
        'initial start block number should be 0'
      );

      const bunchProposal = await generateBunchProposal(0, 1);

      const arrayfiedBunchProposal = [
        new Bytes(bunchProposal.startBlockNumber).hex(),
        new Bytes(bunchProposal.bunchDepth).hex(),
        bunchProposal.transactionsMegaRoot.hex(),
        bunchProposal.receiptsMegaRoot.hex(),
      ];

      const encoded = ethers.utils.RLP.encode(arrayfiedBunchProposal);

      const rlpArray: any[] = [arrayfiedBunchProposal];

      for (const validatorW of global.validatorWallets) {
        const sig = signBunchData(new Bytes(encoded), validatorW);
        rlpArray.push(sig.hex());
      }

      const signedBunchHeader = ethers.utils.RLP.encode(rlpArray);

      await global.plasmaManagerInstanceETH.submitBunchHeader(
        signedBunchHeader
      );

      const afterStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();
      assert.strictEqual(
        afterStartBlockNumber.toNumber(),
        2,
        'after start block number should be 2'
      );
    });
  });
