import { generateSignedBunchProposalFromESN } from './proposal';

export async function getBunchFinalized(blockNumber: number): Promise<number> {
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
