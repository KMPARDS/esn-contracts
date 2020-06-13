import { ethers } from 'ethers';
import { fetchBlocks } from './../../kami/src/utils/provider';
import { Bytes } from './../../kami/src/utils/bytes';
import { computeMerkleRoot } from '../../kami/src/utils/merkle';
import { BunchProposal } from '../../kami/src/utils/bunch-proposal';
import { signBunchData } from './../../kami/src/utils/sign';

// ---------------------------------------
// ----------- For Deposits -------------
// ---------------------------------------

export async function generateBlockProposalToESN(
  blockNumber: number,
  provider: ethers.providers.JsonRpcProvider
) {
  const blocks = await fetchBlocks(blockNumber, 0, provider);
  const block = blocks[0];
  return blocks[0];
}

// ---------------------------------------
// ---------- For Withdrawals ------------
// ---------------------------------------

async function generateBunchProposalFromESN(
  startBlockNumber: number,
  bunchDepth: number
): Promise<BunchProposal> {
  const blocks = await fetchBlocks(startBlockNumber, bunchDepth, global.providerESN);

  const bunchProposal: BunchProposal = {
    startBlockNumber,
    bunchDepth,
    transactionsMegaRoot: computeMerkleRoot(blocks.map((block) => block.transactionsRoot)),
    receiptsMegaRoot: computeMerkleRoot(blocks.map((block) => block.receiptsRoot)),
    signatures: [],
  };

  return bunchProposal;
}

export async function generateSignedBunchProposalFromESN(
  startBlockNumber: number,
  bunchDepth: number,
  wallets: ethers.Wallet[]
): Promise<string> {
  const bunchProposal = await generateBunchProposalFromESN(startBlockNumber, bunchDepth);

  const arrayfiedBunchProposal = [
    new Bytes(bunchProposal.startBlockNumber).hex(),
    new Bytes(bunchProposal.bunchDepth).hex(),
    bunchProposal.transactionsMegaRoot.hex(),
    bunchProposal.receiptsMegaRoot.hex(),
  ];

  const encoded = ethers.utils.RLP.encode(arrayfiedBunchProposal);

  const rlpArray: any[] = [arrayfiedBunchProposal];

  for (const wallet of wallets) {
    const sig = signBunchData(new Bytes(encoded), wallet);
    rlpArray.push(sig.hex());
  }

  return ethers.utils.RLP.encode(rlpArray);
}
