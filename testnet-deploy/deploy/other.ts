import { ethers } from 'ethers';
import { existing, walletESN } from '../commons';
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
