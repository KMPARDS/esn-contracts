import { generateBlockProposal } from './generateBlockProposal';
import { c } from './contractConnect';

export async function getBlockFinalized(blockNumber: number) {
  await global.providerESN.send('miner_stop', []);
  const blockProposal = await generateBlockProposal(blockNumber, global.providerETH);
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
