import { ethers, BigNumber } from 'ethers';
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
    lastBlockHash: blocks[blocks.length - 1].blockHash,
    signatures: [],
  };

  return bunchProposal;
}

export async function generateSignedBunchProposalFromESN(
  startBlockNumber: number,
  bunchDepth: number,
  wallets: ethers.Wallet[]
): Promise<{
  startBlockNumber: number;
  bunchDepth: number;
  transactionsMegaRoot: string;
  receiptsMegaRoot: string;
  lastBlockHash: string;
  sigs: string[];
}> {
  const bunchProposal = await generateBunchProposalFromESN(startBlockNumber, bunchDepth);

  const arrayfiedBunchProposal = [
    ethers.utils.hexZeroPad('0x' + bunchProposal.startBlockNumber.toString(16), 32),
    ethers.utils.hexZeroPad('0x' + bunchProposal.bunchDepth.toString(16), 32),
    bunchProposal.transactionsMegaRoot.hex(),
    bunchProposal.receiptsMegaRoot.hex(),
    bunchProposal.lastBlockHash.hex(),
  ];

  const encoded = ethers.utils.concat(arrayfiedBunchProposal);
  const digest = ethers.utils.keccak256(
    ethers.utils.concat(['0x1900', global.plasmaManagerInstanceETH.address, encoded])
  );

  const sigs: string[] = [];
  // const rlpArray: any[] = [arrayfiedBunchProposal];

  for (const wallet of wallets.sort((a, b) => (BigNumber.from(a.address).lt(b.address) ? 1 : -1))) {
    // const sig = signBunchData(new Bytes(encoded), wallet);
    const sig = wallet._signingKey().signDigest(digest);
    sigs.push(ethers.utils.joinSignature(sig));
  }

  return {
    startBlockNumber: bunchProposal.startBlockNumber,
    bunchDepth: bunchProposal.bunchDepth,
    transactionsMegaRoot: bunchProposal.transactionsMegaRoot.hex(),
    receiptsMegaRoot: bunchProposal.receiptsMegaRoot.hex(),
    lastBlockHash: bunchProposal.lastBlockHash.hex(),
    sigs: sigs,
  };
}
