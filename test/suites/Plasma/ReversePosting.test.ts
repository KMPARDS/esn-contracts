import { ethers } from 'ethers';
import assert from 'assert';
import { c, generateBlockProposal, getBlockFinalized, parseReceipt } from '../../utils';
import { ReversePlasma } from '../../interfaces/ESN';

function _reversePlasmaInstanceESN(validatorWalletIndex: number): ReversePlasma {
  // @ts-ignore
  return c(global.reversePlasmaInstanceESN, global.validatorWallets[validatorWalletIndex]);
}

export const ReversePosting = () =>
  describe('Reverse Posting (of ETH blocks to ESN)', () => {
    it('proposes ETH block roots expecting addition of a proposal', async () => {
      const proposalCountBefore = await global.reversePlasmaInstanceESN.getProposalsCount(0);
      assert.strictEqual(proposalCountBefore.toNumber(), 0, 'proposal count should be 0 initially');

      const blockProposal = await generateBlockProposal(0, global.providerETH);

      await parseReceipt(
        _reversePlasmaInstanceESN(0).proposeBlock(blockProposal, {
          gasPrice: 0, // has zero balance initially
        })
      );

      const proposalCountAfter = await global.reversePlasmaInstanceESN.getProposalsCount(0);
      assert.strictEqual(proposalCountAfter.toNumber(), 1, 'proposal count should now be 1');

      const validators = await global.reversePlasmaInstanceESN.getProposalValidators(0, 0);
      assert.strictEqual(validators.length, 1, 'there should now be 1 validators');
      assert.ok(
        validators.includes(global.validatorWallets[0].address),
        'validator should be added to the array'
      );
    });

    it('reproposes same proposal expecting nothing no duplication in validator array', async () => {
      const proposalCountBefore = await global.reversePlasmaInstanceESN.getProposalsCount(0);
      assert.strictEqual(proposalCountBefore.toNumber(), 1, 'proposal count should be 1');

      const blockProposal = await generateBlockProposal(0, global.providerETH);
      await parseReceipt(
        _reversePlasmaInstanceESN(0).proposeBlock(blockProposal, {
          gasPrice: 0, // has zero balance initially
        })
      );

      const proposalCountAfter = await global.reversePlasmaInstanceESN.getProposalsCount(0);
      assert.strictEqual(proposalCountAfter.toNumber(), 1, 'proposal count should still be 1');

      const validators = await global.reversePlasmaInstanceESN.getProposalValidators(0, 0);
      assert.strictEqual(validators.length, 1, 'there should still be 1 validators');
    });

    it('proposes existing proposal expecting including the validator to validator array', async () => {
      const proposalCountBefore = await global.reversePlasmaInstanceESN.getProposalsCount(0);
      assert.strictEqual(proposalCountBefore.toNumber(), 1, 'proposal count should be 1');

      const blockProposal = await generateBlockProposal(0, global.providerETH);
      await parseReceipt(
        _reversePlasmaInstanceESN(1).proposeBlock(blockProposal, {
          gasPrice: 0, // has zero balance initially
        })
      );

      const proposalCountAfter = await global.reversePlasmaInstanceESN.getProposalsCount(0);
      assert.strictEqual(proposalCountAfter.toNumber(), 1, 'proposal count should be the same');

      const validators = await global.reversePlasmaInstanceESN.getProposalValidators(0, 0);
      assert.strictEqual(validators.length, 2, 'there should now be 2 validators');
      assert.ok(
        validators.includes(global.validatorWallets[1].address),
        'validator should be added to the array'
      );
    });

    it('proposes new proposal expecting addition of a proposal', async () => {
      const proposalCountBefore = await global.reversePlasmaInstanceESN.getProposalsCount(0);
      assert.strictEqual(proposalCountBefore.toNumber(), 1, 'proposal count should be 1');

      // creating a random block proposal
      const blockProposal = ethers.utils.concat([
        ethers.constants.HashZero,
        ethers.utils.randomBytes(32),
        ethers.utils.randomBytes(32),
      ]);
      await parseReceipt(
        _reversePlasmaInstanceESN(2).proposeBlock(blockProposal, {
          gasPrice: 0, // has zero balance initially
        })
      );

      const proposalCountAfter = await global.reversePlasmaInstanceESN.getProposalsCount(0);
      assert.strictEqual(proposalCountAfter.toNumber(), 2, 'proposal count should increase');

      const validators = await global.reversePlasmaInstanceESN.getProposalValidators(0, 1);
      assert.strictEqual(validators.length, 1, 'there should now be 1 validator');
      assert.ok(
        validators.includes(global.validatorWallets[2].address),
        'validator should be added to the array'
      );
    });

    it('proposes existing proposal while previously already proposed', async () => {
      const blockProposal = await generateBlockProposal(0, global.providerETH);
      await parseReceipt(
        _reversePlasmaInstanceESN(2).proposeBlock(blockProposal, {
          gasPrice: 0, // has zero balance initially
        })
      );

      const validators1 = await global.reversePlasmaInstanceESN.getProposalValidators(0, 1);
      assert.strictEqual(validators1.length, 0, 'validator should be removed');

      const validators0 = await global.reversePlasmaInstanceESN.getProposalValidators(0, 0);
      assert.strictEqual(validators0.length, 3, 'there should now be 3 validators');
      assert.ok(
        validators0.includes(global.validatorWallets[2].address),
        'validator should be added to the array'
      );
    });

    it('tries to finalize block before consensus expecting revert', async () => {
      try {
        await parseReceipt(global.reversePlasmaInstanceESN.finalizeProposal(0, 1));

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;
        assert.ok(
          msg.includes('revert RPLSMA: not 66% validators'),
          `Invalid error message: ${msg}`
        );
      }
    });

    it('finalizes block after 66% votes should work', async () => {
      const minimumVotes = Math.ceil((global.validatorWallets.length * 2) / 3);
      const blockProposal = await generateBlockProposal(0, global.providerETH);
      for (let i = 0; i < minimumVotes; i++) {
        await parseReceipt(
          _reversePlasmaInstanceESN(i).proposeBlock(blockProposal, {
            gasPrice: 0, // has zero balance initially
          })
        );
      }

      const votersBefore = await global.reversePlasmaInstanceESN.getProposalValidators(0, 0);
      assert.strictEqual(
        votersBefore.length,
        minimumVotes,
        `voters count should be ${minimumVotes} instead of ${votersBefore.length}`
      );

      await parseReceipt(global.reversePlasmaInstanceESN.finalizeProposal(0, 0));

      const votersAfter = await global.reversePlasmaInstanceESN.getProposalValidators(0, 0);
      assert.strictEqual(
        votersAfter.length,
        0,
        `voters count should be 0 instead of ${votersAfter.length}`
      );

      const latestBlockNumber: ethers.BigNumber = await global.reversePlasmaInstanceESN.latestBlockNumber();
      assert.strictEqual(latestBlockNumber.toNumber(), 0, 'latest block number is not set');
    });

    it('replays finalizeProposal expecting revert', async () => {
      try {
        await parseReceipt(global.reversePlasmaInstanceESN.finalizeProposal(0, 0));

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;
        assert.ok(
          msg.includes('revert RPLSMA: not 66% validators'),
          `Invalid error message: ${msg}`
        );
      }
    });

    it('gets pending blocks posted', async () => {
      const uptoblockNumber = await global.providerETH.getBlockNumber();

      await getBlockFinalized(uptoblockNumber);

      let updatedBlockNumber = (
        await global.reversePlasmaInstanceESN.latestBlockNumber()
      ).toNumber();

      assert.strictEqual(updatedBlockNumber, uptoblockNumber, 'should be same now');
    });
  });
