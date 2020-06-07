import { ethers } from 'ethers';
import { generateSignedBunchProposal } from './utils';
import assert from 'assert';

// TODO: randomize bunch depth

export const BunchPosting = () =>
  describe('Bunch Posting (of ESN bunches to ETH contract)', () => {
    let firstSignedBunchHeader: any;

    it('posts correct bunch header with valid signatures expecting success', async () => {
      const initialStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();
      assert.strictEqual(
        initialStartBlockNumber.toNumber(),
        0,
        'initial start block number should be 0'
      );

      firstSignedBunchHeader = await generateSignedBunchProposal(0, 1, global.validatorWallets);

      await global.plasmaManagerInstanceETH.submitBunchHeader(firstSignedBunchHeader);

      const afterStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();
      assert.strictEqual(
        afterStartBlockNumber.toNumber(),
        2,
        'after start block number should be 2'
      );
    });

    it('reposts the same bunch header expecting revert invalid start block number', async () => {
      try {
        await global.plasmaManagerInstanceETH.submitBunchHeader(firstSignedBunchHeader);

        assert(false, 'should have thrown error');
      } catch (error) {
        assert.ok(
          error.error.message.includes('revert PLASMA: invalid start block no.'),
          `Invalid error message: ${error.error.message}`
        );
      }
    });

    it('posts correct bunch header with invalid signatures expecting revert', async () => {
      const initialStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();

      const signedHeader = await generateSignedBunchProposal(
        initialStartBlockNumber.toNumber(),
        1,
        [ethers.Wallet.createRandom()]
      );

      try {
        await global.plasmaManagerInstanceETH.submitBunchHeader(signedHeader);

        assert(false, 'should have thrown error');
      } catch (error) {
        assert.ok(
          error.error.message.includes('revert PLASMA: invalid validator sig'),
          `Invalid error message: ${error.error.message}`
        );
      }
    });

    it('posts correct bunch header with 66%+ signatures expecting success', async () => {
      const initialStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();
      const BUNCH_DEPTH = 1;

      const signedHeader = await generateSignedBunchProposal(
        initialStartBlockNumber.toNumber(),
        BUNCH_DEPTH,
        global.validatorWallets.slice(0, Math.ceil((global.validatorWallets.length * 2) / 3))
      );

      await global.plasmaManagerInstanceETH.submitBunchHeader(signedHeader);

      const afterStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();
      assert.strictEqual(
        afterStartBlockNumber.sub(initialStartBlockNumber).toNumber(),
        2 ** BUNCH_DEPTH,
        `block number in plasma contract should move forward by ${2 ** BUNCH_DEPTH}`
      );
    });

    it('posts correct bunch header with 66%- signatures expecting revert', async () => {
      const initialStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();
      const BUNCH_DEPTH = 1;

      const signedHeader = await generateSignedBunchProposal(
        initialStartBlockNumber.toNumber(),
        BUNCH_DEPTH,
        global.validatorWallets.slice(
          0,
          Math.ceil((global.validatorWallets.length * 2) / 3) - 1 // same as Math.floor
        )
      );

      try {
        await global.plasmaManagerInstanceETH.submitBunchHeader(signedHeader);

        assert(false, 'should have thrown error');
      } catch (error) {
        assert.ok(
          error.error.message.includes('revert PLASMA: not 66% validators'),
          `Invalid error message: ${error.error.message}`
        );
      }
    });

    it('posts bunch header with higher start block number expecting revert', async () => {
      const initialStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();
      const BUNCH_DEPTH = 1;

      const signedHeader = await generateSignedBunchProposal(
        initialStartBlockNumber.toNumber() + 1,
        BUNCH_DEPTH,
        global.validatorWallets
      );

      try {
        await global.plasmaManagerInstanceETH.submitBunchHeader(signedHeader);

        assert(false, 'should have thrown error');
      } catch (error) {
        assert.ok(
          error.error.message.includes('revert PLASMA: invalid start block no.'),
          `Invalid error message: ${error.error.message}`
        );
      }
    });

    it('posts invalid rlp to the submitHeader method expecting revert', async () => {
      try {
        await global.plasmaManagerInstanceETH.submitBunchHeader(
          ethers.utils.concat(['0x19', ethers.utils.randomBytes(1000)])
        );

        assert(false, 'should have thrown error');
      } catch (error) {
        assert.ok(
          error.error.message.includes('revert RLP: item is not list'),
          `Invalid error message: ${error.error.message}`
        );
      }
    });

    it('posts a bunch header with invalid v value of in even one signature expecting revert', async () => {
      const initialStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();
      const BUNCH_DEPTH = 1;

      const signedHeader = await generateSignedBunchProposal(
        initialStartBlockNumber.toNumber(),
        BUNCH_DEPTH,
        global.validatorWallets
      );

      const byteArray = ethers.utils.RLP.decode(signedHeader);

      const sig = byteArray[byteArray.length - 1];
      byteArray[byteArray.length - 1] = sig.slice(0, 2 + 64 * 2) + '99'; // passing invalid v value in signature

      const modifiedSignedHeader = ethers.utils.RLP.encode(byteArray);

      try {
        await global.plasmaManagerInstanceETH.submitBunchHeader(modifiedSignedHeader);

        assert(false, 'should have thrown error');
      } catch (error) {
        assert.ok(
          error.error.message.includes('revert PLASMA: ecrecover should success'),
          `Invalid error message: ${error.error.message}`
        );
      }
    });
  });
