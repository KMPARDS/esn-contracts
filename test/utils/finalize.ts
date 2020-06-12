import { c } from './contractConnect';
import { generateBlockProposalToESN } from './proposal';
import { generateSignedBunchProposalFromESN } from './proposal';

// ---------------------------------------
// ----------- For Deposits -------------
// ---------------------------------------

export async function getBlockFinalizedToESN(blockNumber: number) {
  const latestBlockNumber = await global.reversePlasmaInstanceESN.latestBlockNumber();

  for (let i = latestBlockNumber.toNumber() + 1; i <= blockNumber; i++) {
    await _getBlockFinalized(i);
  }
}

async function _getBlockFinalized(blockNumber: number) {
  await global.providerESN.send('miner_stop', []);
  const blockProposal = await generateBlockProposalToESN(blockNumber, global.providerETH);
  for (let i = 0; i < Math.ceil((global.validatorWallets.length * 2) / 3); i++) {
    // @ts-ignore
    const _reversePlasmaInstanceESN: ReversePlasma = c(
      global.reversePlasmaInstanceESN,
      global.validatorWallets[i]
    );
    await _reversePlasmaInstanceESN.proposeBlock(blockProposal, {
      gasPrice: 0, // has zero balance initially
    });
  }
  await global.providerESN.send('miner_start', []);
  await global.reversePlasmaInstanceESN.finalizeProposal(blockNumber, 0);
}

// ---------------------------------------
// ---------- For Withdrawals ------------
// ---------------------------------------

export async function getBunchFinalizedFromESN(blockNumber: number): Promise<number> {
  const nextStartBlockNumber = (
    await global.plasmaManagerInstanceETH.getNextStartBlockNumber()
  ).toNumber();
  const numberOfBlocks = blockNumber - nextStartBlockNumber + 1;
  const bunchDepth = Math.ceil(Math.log2(numberOfBlocks));
  const pendingBlocks = 2 ** bunchDepth - numberOfBlocks;

  for (const _ of Array(pendingBlocks)) {
    await global.providerESN.send('evm_mine', []);
  }

  const signedBunch = await generateSignedBunchProposalFromESN(
    nextStartBlockNumber,
    bunchDepth,
    global.validatorWallets
  );

  await global.plasmaManagerInstanceETH.submitBunchHeader(signedBunch);

  return (await global.plasmaManagerInstanceETH.lastBunchIndex()).toNumber();
}
