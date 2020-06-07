import { generateBlockProposal } from './utils';
import assert from 'assert';

// creating reversePlasmaInstanceESN with other wallet
const _reversePlasmaInstanceESN = (walletId: number) =>
  global.reversePlasmaInstanceESN.connect(
    global.validatorWallets[walletId].connect(global.providerESN)
  );

export const ReversePosting = () =>
  describe('Reverse Posting (of ETH blocks to ESN)', () => {
    it('proposes ETH block roots expecting addition of a proposal', async () => {
      const proposalCountBefore = await global.reversePlasmaInstanceESN.getProposalsCount(0);
      assert.strictEqual(proposalCountBefore.toNumber(), 0, 'proposal count should be 0 initially');

      const blockProposal = await generateBlockProposal(0, global.providerETH);
      await _reversePlasmaInstanceESN(0).proposeBlock(blockProposal, {
        gasPrice: 0, // has zero balance initially
      });

      const proposalCountAfter = await global.reversePlasmaInstanceESN.getProposalsCount(0);
      assert.strictEqual(proposalCountAfter.toNumber(), 1, 'proposal count should now be 1');

      const validators = await global.reversePlasmaInstanceESN.getProposalValidators(0, 0);
      assert.strictEqual(validators.length, 1, 'there should now be 2 validators');
      assert.ok(
        validators.includes(global.validatorWallets[0].address),
        'validator should be added to the array'
      );
    });

    it('proposes existing proposal expecting including the validator to validator array', async () => {
      const proposalCountBefore = await global.reversePlasmaInstanceESN.getProposalsCount(0);
      assert.strictEqual(proposalCountBefore.toNumber(), 1, 'proposal count should be 1');

      const blockProposal = await generateBlockProposal(0, global.providerETH);
      await _reversePlasmaInstanceESN(1).proposeBlock(blockProposal, {
        gasPrice: 0, // has zero balance initially
      });

      const proposalCountAfter = await global.reversePlasmaInstanceESN.getProposalsCount(0);
      assert.strictEqual(proposalCountAfter.toNumber(), 1, 'proposal count should be the same');

      const validators = await global.reversePlasmaInstanceESN.getProposalValidators(0, 0);
      assert.strictEqual(validators.length, 2, 'there should now be 2 validators');
      assert.ok(
        validators.includes(global.validatorWallets[1].address),
        'validator should be added to the array'
      );
    });
  });
