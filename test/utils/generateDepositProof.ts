import { ethers } from 'ethers';
import { GetProof } from 'eth-proof';

interface PreparingValues {
  blockNumber?: string;
  path?: string;
  rawTransaction?: string;
  parentNodesTx?: string;
  rawReceipt?: string;
  parentNodesReceipt?: string;
}

export async function generateDepositProof(
  txHash: string,
  overides: PreparingValues = {}
): Promise<string> {
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
    blockNumber: overides.blockNumber || ethers.utils.hexlify(tx.blockNumber),
    path: overides.path || getPathFromTransactionIndex(+txProof.txIndex),
    rawTransaction: overides.rawTransaction || rawTransaction,
    parentNodesTx: overides.parentNodesTx || ethers.utils.RLP.encode(txProof.txProof),
    rawReceipt: overides.rawReceipt || rawReceipt,
    parentNodesReceipt:
      overides.parentNodesReceipt || ethers.utils.RLP.encode(rcProof.receiptProof),
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

function getPathFromTransactionIndex(txIndex: number | string) {
  let hex;
  if (typeof txIndex === 'string') {
    if (txIndex.slice(0, 2) === '0x') {
      hex = txIndex.slice(2);
    } else {
      throw new Error('transactionIndexHex being a string should start with 0x or a number');
    }
  } else {
    if (typeof txIndex === 'number') {
      hex = txIndex.toString(16);
    } else {
      throw new Error('transactionIndexHex is not a number or hex string');
    }
  }

  // @dev strippin' off zeros
  while (hex.length && hex[0] === '0') {
    hex = hex.slice(1);
  }

  return ethers.utils.RLP.encode('0x' + (hex.length % 2 === 0 ? hex : '0' + hex));
}
