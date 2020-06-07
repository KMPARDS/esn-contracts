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
      const blockProposal = await generateBlockProposal(0, global.providerETH);
      const proposalCountBefore = await global.reversePlasmaInstanceESN.getProposalsCount(
        0
      );

      assert.strictEqual(
        proposalCountBefore.toNumber(),
        0,
        'proposal count should be 0 initially'
      );
      await _reversePlasmaInstanceESN(0).proposeBlock(blockProposal, {
        gasPrice: 0, // has zero balance initially
      });
      const proposalCountAfter = await global.reversePlasmaInstanceESN.getProposalsCount(
        0
      );
      assert.strictEqual(
        proposalCountAfter.toNumber(),
        1,
        'proposal count should be 1 after creation'
      );

      const validators = await global.reversePlasmaInstanceESN.getProposalValidators(
        0,
        0
      );

      assert.ok(
        validators.includes(global.validatorWallets[0].address),
        'validator should be added to the array'
      );
    });

    it('proposes existing proposal expecting including the validator to validator array', async () => {
      const blockProposal = await generateBlockProposal(0, global.providerETH);
      const proposalCountBefore = await global.reversePlasmaInstanceESN.getProposalsCount(
        0
      );

      assert.strictEqual(
        proposalCountBefore.toNumber(),
        1,
        'proposal count should be 1 since it was created in last test case'
      );
      await _reversePlasmaInstanceESN(1).proposeBlock(blockProposal, {
        gasPrice: 0, // has zero balance initially
      });
      const proposalCountAfter = await global.reversePlasmaInstanceESN.getProposalsCount(
        0
      );
      assert.strictEqual(
        proposalCountAfter.toNumber(),
        1,
        'proposal count should be the same'
      );

      const validators = await global.reversePlasmaInstanceESN.getProposalValidators(
        0,
        0
      );

      assert.ok(
        validators.includes(global.validatorWallets[1].address),
        'validator should be added to the array'
      );
    });
  });
