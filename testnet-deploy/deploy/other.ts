import { ethers } from 'ethers';

import { existing } from '../existing-contracts';

if (!process.argv[2]) {
  throw '\nNOTE: Please pass your private key as comand line argument';
}

const providerESN = new ethers.providers.JsonRpcProvider('http://13.127.185.136:80');
// const providerESN = new ethers.providers.JsonRpcProvider('http://localhost:8545');

const walletESN = new ethers.Wallet(process.argv[2]).connect(providerESN);
// const walletESN = new CustomWallet(process.argv[2]).connect(providerESN);

import { TsgapFactory } from '../../build/typechain/ESN';

(async () => {
  const tsgapInstance = TsgapFactory.connect(
    await deployContract(TsgapFactory, 'TSGAP', existing.tsgap),
    walletESN
  );

  {
    console.log('Adding funds');
    const tx = await tsgapInstance.addFunds({
      value: ethers.utils.parseEther('10000'),
    });
    await tx.wait();
    console.log('Done');
  }
})();

async function deployContract(
  factory: any,
  name: string,
  existing: string | undefined,
  overrides?: ethers.PayableOverrides,
  args: any[] = []
): Promise<string> {
  console.log(`\nDeploying ${name}...`);
  const instance = existing
    ? factory.connect(existing, walletESN)
    : await new factory(walletESN).deploy(...args, overrides);
  if (instance.deployTransaction) await instance.deployTransaction.wait();
  if (existing) console.log('existing');
  console.log(`${name} is deployed at:`, instance.address);
  return instance.address;
}
