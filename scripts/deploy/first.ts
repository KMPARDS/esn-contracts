import { ethers } from 'ethers';

import {
  Erc20Factory,
  PlasmaManagerFactory,
  FundsManagerFactory as FundsManagerETHFactory,
} from '../../build/typechain/ETH';

import {
  ReversePlasmaFactory,
  FundsManagerFactory as FundsManagerESNFactory,
} from '../../build/typechain/ESN';

import { walletETH, walletESN } from '../commons';

const validatorAddress = [
  '0x08d85bd1004e3e674042eaddf81fb3beb4853a22',
  '0xb4fb9d198047fe763472d58045f1d9341161eb73',
  '0x36560493644fbb79f1c38d12ff096f7ec5d333b7',
];

(async () => {
  // ETH
  // esInstanceETH
  console.log(`\nDeploying esInstanceETH...`);
  const ESContractFactory = new Erc20Factory(walletETH);
  const esInstanceETH = await ESContractFactory.deploy();
  await esInstanceETH.deployTransaction.wait();
  console.log(`esInstanceETH: ${esInstanceETH.address}`);

  // esInstanceETH
  console.log(`\nDeploying plasmaManagerInstanceETH...`);
  const PlasmaManagerContractFactory = new PlasmaManagerFactory(walletETH);
  const plasmaManagerInstanceETH = await PlasmaManagerContractFactory.deploy();
  await plasmaManagerInstanceETH.deployTransaction.wait();
  console.log(`plasmaManagerInstanceETH: ${plasmaManagerInstanceETH.address}`);

  // fundsManagerInstanceETH
  console.log(`\nDeploying fundsManagerInstanceETH...`);
  const FundsManagerContractFactoryETH = new FundsManagerETHFactory(walletETH);
  const fundsManagerInstanceETH = await FundsManagerContractFactoryETH.deploy();
  console.log();
  await fundsManagerInstanceETH.deployTransaction.wait();
  console.log(`fundsManagerInstanceETH: ${fundsManagerInstanceETH.address}`);

  // ESN
  // reversePlasmaInstanceESN
  console.log(`\nDeploying reversePlasmaInstanceESN...`);
  const ReversePlasmaContractFactory = new ReversePlasmaFactory(walletESN);
  const reversePlasmaInstanceESN = await ReversePlasmaContractFactory.deploy();
  await reversePlasmaInstanceESN.deployTransaction.wait();
  console.log(`reversePlasmaInstanceESN: ${reversePlasmaInstanceESN.address}`);

  // fundsManagerInstanceESN
  console.log(`\nDeploying fundsManagerInstanceESN...`);
  const FundsManagerContractFactoryESN = new FundsManagerESNFactory(walletESN);
  const fundsManagerInstanceESN = await FundsManagerContractFactoryESN.deploy({
    value: ethers.utils.parseEther('910' + '0'.repeat(7)), // 910 crore
  });
  await fundsManagerInstanceESN.deployTransaction.wait();
  console.log(`fundsManagerInstanceESN: ${fundsManagerInstanceESN.address}`);

  console.log('\nsetting initial values');
  const tx1 = await plasmaManagerInstanceETH.setInitialValidators(validatorAddress);
  await tx1.wait();
  console.log(tx1.hash);

  const tx2a = await fundsManagerInstanceETH.setFundsManagerESNAddress(
    fundsManagerInstanceESN.address
  );
  await tx2a.wait();
  console.log(tx2a.hash);
  const tx2b = await fundsManagerInstanceETH.setToken(esInstanceETH.address);
  await tx2b.wait();
  console.log(tx2b.hash);
  const tx2c = await fundsManagerInstanceETH.setPlasmaManagerAddress(
    plasmaManagerInstanceETH.address
  );
  await tx2c.wait();
  console.log(tx2c.hash);

  const tx3 = await reversePlasmaInstanceESN.setInitialValues(
    esInstanceETH.address,
    await walletETH.provider.getBlockNumber(),
    validatorAddress
  );
  await tx3.wait();
  console.log(tx3.hash);

  const tx4 = await fundsManagerInstanceESN.setInitialValues(
    reversePlasmaInstanceESN.address,
    esInstanceETH.address,
    fundsManagerInstanceETH.address
  );
  await tx4.wait();
  console.log(tx4.hash);

  console.log('done');
})();
