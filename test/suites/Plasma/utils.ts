import { ethers } from 'ethers';

import { fetchBlocks } from './../../../kami/src/utils/provider';
import { computeMerkleRoot } from './../../../kami/src/utils/merkle';
import { BunchProposal } from './../../../kami/src/utils/bunch-proposal';
import { signBunchData } from './../../../kami/src/utils/sign';
import { Bytes } from './../../../kami/src/utils/bytes';
import { ReversePlasma } from '../../interfaces/ESN';
import { GetProof } from 'eth-proof';

// creating reversePlasmaInstanceESN with other wallet
export const _reversePlasmaInstanceESN = (walletId: number): ReversePlasma =>
  // @ts-ignore
  global.reversePlasmaInstanceESN.connect(
    global.validatorWallets[walletId].connect(global.providerESN)
  );

// export async function generateBlockProposal(
//   blockNumber: number,
//   provider: ethers.providers.JsonRpcProvider
// ) {
//   const blocks = await fetchBlocks(blockNumber, 0, provider);
//   const block = blocks[0];
//   return new Bytes(block.blockNumber, 32)
//     .concat(block.transactionsRoot)
//     .concat(block.receiptsRoot)
//     .hex();
// }

async function generateBunchProposal(
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

export async function generateSignedBunchProposal(
  startBlockNumber: number,
  bunchDepth: number,
  wallets: ethers.Wallet[]
): Promise<string> {
  const bunchProposal = await generateBunchProposal(startBlockNumber, bunchDepth);

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

// --------------- deposits ---------------

export async function generateDepositProof(txHash: string): Promise<string> {
  const gp = new GetProof(global.providerETH.connection.url);
  const txProof = await gp.transactionProof(txHash);
  const rcProof = await gp.receiptProof(txHash);
  // console.log({ txProof, rcProof });

  const tx = await global.providerETH.getTransaction(txHash);
  const rawTransaction = ethers.utils.serializeTransaction(
    {
      to: tx.to,
      nonce: tx.nonce,
      gasPrice: tx.gasPrice,
      gasLimit: tx.gasLimit,
      data: tx.data,
      value: tx.value,
      chainId: tx.chainId,
    },
    {
      // @ts-ignore
      r: tx.r,
      s: tx.s,
      v: tx.v,
    }
  );
  // console.log({ tx, rawTransaction, m: ethers.utils.keccak256(rawTransaction) });

  const rawReceipt = await getRawReceipt(txHash, global.providerETH);

  // console.log({ 'txProof.txProof': txProof.txProof, 'rcProof.receiptProof': rcProof.receiptProof });

  const preparingValues = {
    // @ts-ignore
    blockNumber: ethers.utils.hexlify(tx.blockNumber),
    path: getPathFromTransactionIndex(+txProof.txIndex),
    rawTransaction,
    parentNodesTx: ethers.utils.RLP.encode(txProof.txProof),
    rawReceipt,
    parentNodesReceipt: ethers.utils.RLP.encode(rcProof.receiptProof),
  };
  // console.log({ preparingValues });

  const proofArray = Object.values(preparingValues);
  // console.log(proofArray);

  return ethers.utils.RLP.encode(proofArray);
}

async function getRawReceipt(txHash: string, provider: ethers.providers.Provider): Promise<string> {
  const receiptObj = await provider.getTransactionReceipt(txHash);
  // console.log({ receiptObj });

  return ethers.utils.RLP.encode([
    // @ts-ignore
    ethers.utils.hexlify(receiptObj.status || receiptObj.root),
    receiptObj.cumulativeGasUsed.toHexString(),
    receiptObj.logsBloom,
    receiptObj.logs.map((log) => {
      return [log.address, log.topics, log.data];
    }),
  ]);
}

function getPathFromTransactionIndex(txIndex: number): string | null {
  if (typeof txIndex !== 'number') {
    return null;
  }
  if (txIndex === 0) {
    return '0x0080';
  }
  const hex = txIndex.toString(16);
  // return '0x'+(hex.length%2?'00':'1')+hex;
  return '0x' + '00' + hex;
}
