import { ethers } from 'ethers';
import { fetchBlocks } from './../../kami/src/utils/provider';
import { Bytes } from './../../kami/src/utils/bytes';

export async function generateBlockProposal(
  blockNumber: number,
  provider: ethers.providers.JsonRpcProvider
) {
  const blocks = await fetchBlocks(blockNumber, 0, provider);
  const block = blocks[0];
  return new Bytes(block.blockNumber, 32)
    .concat(block.transactionsRoot)
    .concat(block.receiptsRoot)
    .hex();
}
