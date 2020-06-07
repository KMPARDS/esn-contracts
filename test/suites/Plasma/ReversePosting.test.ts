import { generateBlockProposal } from './utils';
import assert from 'assert';

export const ReversePosting = () =>
  describe('Reverse Posting (of ETH blocks to ESN)', () => {
    it('proposes ETH block roots to ReversePlasma expecting addition of a proposal', async () => {
      const _reversePlasmaInstanceESN = global.reversePlasmaInstanceESN.connect(
        global.validatorWallets[0].connect(global.providerESN)
      );

      const blockProposal = await generateBlockProposal(0, global.providerETH);
      const proposalCountBefore = await _reversePlasmaInstanceESN.getProposalsCount(
        0
      );

      assert.strictEqual(
        proposalCountBefore.toNumber(),
        0,
        'proposal count should be 0 initially'
      );
      await _reversePlasmaInstanceESN.proposeBlock(blockProposal, {
        gasPrice: 0, // has zero balance initially
      });
      const proposalCountAfter = await _reversePlasmaInstanceESN.getProposalsCount(
        0
      );
      assert.strictEqual(
        proposalCountAfter.toNumber(),
        1,
        'proposal count should be 1 after creation'
      );
    });
  });
