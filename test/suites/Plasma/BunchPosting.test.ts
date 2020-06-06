import { ethers } from 'ethers';
import { generateSignedBunchProposal } from './utils';
import assert from 'assert';

export const BunchPosting = () =>
  describe('Bunch Posting of ESN bunches to ETH contract', () => {
    let firstSignedBunchHeader: any;

    it('posting correct bunch header with valid signatures should success', async () => {
      const initialStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();
      assert.strictEqual(
        initialStartBlockNumber.toNumber(),
        0,
        'initial start block number should be 0'
      );

      firstSignedBunchHeader = generateSignedBunchProposal(
        0,
        1,
        global.validatorWallets
      );

      await global.plasmaManagerInstanceETH.submitBunchHeader(
        firstSignedBunchHeader
      );

      const afterStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();
      assert.strictEqual(
        afterStartBlockNumber.toNumber(),
        2,
        'after start block number should be 2'
      );
    });

    it('reposting same bunch header should revert invalid start block number', async () => {
      try {
        await global.plasmaManagerInstanceETH.submitBunchHeader(
          firstSignedBunchHeader
        );

        assert(false, 'should have thrown error');
      } catch (error) {
        assert.ok(
          error.error.message.includes('revert invalid start block number'),
          `Invalid error message: ${error.error.message}`
        );
      }
    });

    it('posting correct bunch header with invalid signatures should revert invalid validator', async () => {
      const initialStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();

      const signedHeader = generateSignedBunchProposal(
        initialStartBlockNumber.toNumber(),
        1,
        [ethers.Wallet.createRandom()]
      );

      try {
        await global.plasmaManagerInstanceETH.submitBunchHeader(signedHeader);
      } catch (error) {
        assert.ok(
          error.error.message.includes('revert invalid validator signature'),
          `Invalid error message: ${error.error.message}`
        );
      }
    });
  });
