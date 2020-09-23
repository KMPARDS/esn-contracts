import { ethers } from 'ethers';
import { generateSignedBunchProposalFromESN, parseReceipt } from '../../utils';
import assert from 'assert';

// TODO: randomize bunch depth

export const BunchPosting = () =>
  describe('Bunch Posting (of ESN bunches to ETH contract)', () => {
    let firstSignedBunchHeader: {
      startBlockNumber: number;
      bunchDepth: number;
      transactionsMegaRoot: string;
      receiptsMegaRoot: string;
      lastBlockHash: string;
      sigs: string[];
    };

    it('posts correct bunch header with valid signatures expecting success', async () => {
      const initialStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();
      assert.strictEqual(
        initialStartBlockNumber.toNumber(),
        0,
        'initial start block number should be 0'
      );

      firstSignedBunchHeader = await generateSignedBunchProposalFromESN(
        0,
        1,
        global.validatorWallets
      );

      await parseReceipt(
        global.plasmaManagerInstanceETH.submitBunchHeader(
          firstSignedBunchHeader.startBlockNumber,
          firstSignedBunchHeader.bunchDepth,
          firstSignedBunchHeader.transactionsMegaRoot,
          firstSignedBunchHeader.receiptsMegaRoot,
          firstSignedBunchHeader.lastBlockHash,
          firstSignedBunchHeader.sigs
        )
      );

      const afterStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();
      assert.strictEqual(
        afterStartBlockNumber.toNumber(),
        2,
        'after start block number should be 2'
      );
    });

    it('reposts the same bunch header expecting revert invalid start block number', async () => {
      try {
        await parseReceipt(
          global.plasmaManagerInstanceETH.submitBunchHeader(
            firstSignedBunchHeader.startBlockNumber,
            firstSignedBunchHeader.bunchDepth,
            firstSignedBunchHeader.transactionsMegaRoot,
            firstSignedBunchHeader.receiptsMegaRoot,
            firstSignedBunchHeader.lastBlockHash,
            firstSignedBunchHeader.sigs
          )
        );

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;
        assert.ok(
          msg.includes('revert PLASMA: invalid start block no.'),
          `Invalid error message: ${msg}`
        );
      }
    });

    it('posts correct bunch header with invalid signatures expecting revert', async () => {
      const initialStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();

      const signedHeader = await generateSignedBunchProposalFromESN(
        initialStartBlockNumber.toNumber(),
        1,
        [ethers.Wallet.createRandom()]
      );

      try {
        await parseReceipt(
          global.plasmaManagerInstanceETH.submitBunchHeader(
            signedHeader.startBlockNumber,
            signedHeader.bunchDepth,
            signedHeader.transactionsMegaRoot,
            signedHeader.receiptsMegaRoot,
            signedHeader.lastBlockHash,
            signedHeader.sigs
          )
        );

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;
        assert.ok(
          msg.includes('revert PLASMA: invalid validator sig'),
          `Invalid error message: ${msg}`
        );
      }
    });

    it('posts correct bunch header with 66%+ signatures expecting success', async () => {
      const initialStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();
      const BUNCH_DEPTH = 1;

      const signedHeader = await generateSignedBunchProposalFromESN(
        initialStartBlockNumber.toNumber(),
        BUNCH_DEPTH,
        global.validatorWallets.slice(0, Math.ceil((global.validatorWallets.length * 2) / 3))
      );

      await parseReceipt(
        global.plasmaManagerInstanceETH.submitBunchHeader(
          signedHeader.startBlockNumber,
          signedHeader.bunchDepth,
          signedHeader.transactionsMegaRoot,
          signedHeader.receiptsMegaRoot,
          signedHeader.lastBlockHash,
          signedHeader.sigs
        )
      );

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

      const signedHeader = await generateSignedBunchProposalFromESN(
        initialStartBlockNumber.toNumber(),
        BUNCH_DEPTH,
        global.validatorWallets.slice(
          0,
          Math.ceil((global.validatorWallets.length * 2) / 3) - 1 // same as Math.floor
        )
      );

      try {
        await parseReceipt(
          global.plasmaManagerInstanceETH.submitBunchHeader(
            signedHeader.startBlockNumber,
            signedHeader.bunchDepth,
            signedHeader.transactionsMegaRoot,
            signedHeader.receiptsMegaRoot,
            signedHeader.lastBlockHash,
            signedHeader.sigs
          )
        );

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;
        assert.ok(
          msg.includes('revert PLASMA: not 66% validators'),
          `Invalid error message: ${msg}`
        );
      }
    });

    it('posts bunch header with higher start block number expecting revert', async () => {
      const initialStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();
      const BUNCH_DEPTH = 1;

      const signedHeader = await generateSignedBunchProposalFromESN(
        initialStartBlockNumber.toNumber() + 1,
        BUNCH_DEPTH,
        global.validatorWallets
      );

      try {
        await parseReceipt(
          global.plasmaManagerInstanceETH.submitBunchHeader(
            signedHeader.startBlockNumber,
            signedHeader.bunchDepth,
            signedHeader.transactionsMegaRoot,
            signedHeader.receiptsMegaRoot,
            signedHeader.lastBlockHash,
            signedHeader.sigs
          )
        );

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;
        assert.ok(
          msg.includes('revert PLASMA: invalid start block no.'),
          `Invalid error message: ${msg}`
        );
      }
    });

    // it('posts invalid rlp to the submitHeader method expecting revert', async () => {
    //   try {
    //     await parseReceipt(
    //       global.plasmaManagerInstanceETH.submitBunchHeader(
    //         ethers.utils.concat(['0x19', ethers.utils.randomBytes(1000)])
    //       )
    //     );

    //     assert(false, 'should have thrown error');
    //   } catch (error) {
    //     const msg = error.error?.message || error.message;
    //     assert.ok(msg.includes('revert RLP: item is not list'), `Invalid error message: ${msg}`);
    //   }
    // });

    it('posts a bunch header with invalid v value of in even one signature expecting revert', async () => {
      const initialStartBlockNumber = await global.plasmaManagerInstanceETH.getNextStartBlockNumber();
      const BUNCH_DEPTH = 1;

      const signedHeader = await generateSignedBunchProposalFromESN(
        initialStartBlockNumber.toNumber(),
        BUNCH_DEPTH,
        global.validatorWallets
      );

      // modifiying v value

      const sig = signedHeader.sigs[signedHeader.sigs.length - 1];
      signedHeader.sigs[signedHeader.sigs.length - 1] = sig.slice(0, 2 + 64 * 2) + '99'; // passing invalid v value in signature

      try {
        await parseReceipt(
          global.plasmaManagerInstanceETH.submitBunchHeader(
            signedHeader.startBlockNumber,
            signedHeader.bunchDepth,
            signedHeader.transactionsMegaRoot,
            signedHeader.receiptsMegaRoot,
            signedHeader.lastBlockHash,
            signedHeader.sigs
          )
        );

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;
        assert.ok(
          msg.includes("revert ECDSA: invalid signature 'v' value"),
          `Invalid error message: ${msg}`
        );
      }
    });
  });
