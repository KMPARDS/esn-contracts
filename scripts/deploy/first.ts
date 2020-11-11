import { ethers } from 'ethers';

import {
  Erc20Factory,
  PlasmaManagerFactory,
  FundsManagerEthFactory,
} from '../../build/typechain/ETH';

import { ReversePlasmaFactory, FundsManagerEsnFactory } from '../../build/typechain/ESN';

import {
  walletETH,
  walletESN,
  deployContract,
  existing,
  gasPrice,
  validatorAddresses,
} from '../commons';

(async () => {
  // ETH
  // esInstanceETH
  const esInstanceETH = Erc20Factory.connect(
    ...(await deployContract({
      wallet: walletETH,
      factory: Erc20Factory,
      name: 'EraSwap ERC20',
      address: existing.esEth,
      overrides: { gasPrice },
    }))
  );

  // plasmaManagerInstanceETH
  const plasmaManagerInstanceETH = PlasmaManagerFactory.connect(
    ...(await deployContract({
      wallet: walletETH,
      factory: PlasmaManagerFactory,
      name: 'Plasma Manager',
      address: existing.plasmaEth,
      overrides: { gasPrice },
    }))
  );

  // fundsManagerInstanceETH
  const fundsManagerInstanceETH = FundsManagerEthFactory.connect(
    ...(await deployContract({
      wallet: walletETH,
      factory: FundsManagerEthFactory,
      name: 'Funds Manager ETH',
      address: existing.fundsManEth,
      overrides: { gasPrice },
    }))
  );

  // ESN
  // reversePlasmaInstanceESN
  const reversePlasmaInstanceESN = ReversePlasmaFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: ReversePlasmaFactory,
      name: 'Reverse Plasma ESN',
      address: existing.rplasmaEsn,
    }))
  );

  // fundsManagerInstanceESN
  const fundsManagerInstanceESN = FundsManagerEsnFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: FundsManagerEsnFactory,
      name: 'Funds Manager ESN',
      address: existing.fundsManEsn,
      overrides: {
        value: ethers.utils.parseEther('910' + '0'.repeat(7)), // 910 crore
      },
    }))
  );

  console.log('\nsetting initial values');
  const tx1 = await plasmaManagerInstanceETH.setInitialValidators(validatorAddresses, { gasPrice });
  await tx1.wait();
  console.log(tx1.hash);

  const tx2a = await fundsManagerInstanceETH.setFundsManagerESNAddress(
    fundsManagerInstanceESN.address, { gasPrice }
  );
  await tx2a.wait();
  console.log(tx2a.hash);
  const tx2b = await fundsManagerInstanceETH.setToken(esInstanceETH.address, { gasPrice });
  await tx2b.wait();
  console.log(tx2b.hash);
  const tx2c = await fundsManagerInstanceETH.setPlasmaManagerAddress(
    plasmaManagerInstanceETH.address, { gasPrice }
  );
  await tx2c.wait();
  console.log(tx2c.hash);

  const tx3 = await reversePlasmaInstanceESN.setInitialValues(
    await walletETH.provider.getBlockNumber(),
    validatorAddresses
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
