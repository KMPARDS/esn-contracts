import { fetchBlocks } from '../../../../kami/src/utils/provider';
import { computeMerkleRoot } from '../../../../kami/src/utils/merkle';
import { BunchProposal } from '../../../../kami/src/utils/bunch-proposal';

export async function generateBunchProposal(
  startBlockNumber: number,
  bunchDepth: number
): Promise<BunchProposal> {
  const blocks = await fetchBlocks(
    startBlockNumber,
    bunchDepth,
    global.providerESN
  );

  const bunchProposal: BunchProposal = {
    startBlockNumber,
    bunchDepth,
    transactionsMegaRoot: computeMerkleRoot(
      blocks.map((block) => block.transactionsRoot)
    ),
    receiptsMegaRoot: computeMerkleRoot(
      blocks.map((block) => block.receiptsRoot)
    ),
    signatures: [],
  };

  return bunchProposal;
}

export { signBunchData } from '../../../../kami/src/utils/sign';
export { Bytes } from '../../../../kami/src/utils/bytes';
