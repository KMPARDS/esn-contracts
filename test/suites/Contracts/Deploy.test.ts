import assert from 'assert';
import { ethers } from 'ethers';
import { parseReceipt } from '../../utils';

/// @dev importing typechain
import {
  EraSwapTokenFactory,
  PlasmaManagerFactory,
  FundsManagerEthFactory,
} from '../../../build/typechain/ETH';

import { ReversePlasmaFactory, FundsManagerEsnFactory } from '../../../build/typechain/ESN';

export const Deploy = () =>
  describe('Deploying Contracts', async () => {
    it('deploys Era Swap ERC20 contract on ETH from first account', async () => {
      const ESContractFactory = new EraSwapTokenFactory(
        global.providerETH.getSigner(global.accountsETH[0])
      );

      global.esInstanceETH = await ESContractFactory.deploy();
      await parseReceipt(global.esInstanceETH.deployTransaction);

      assert.ok(global.esInstanceETH.address, 'conract address should be present');

      const balance = await global.esInstanceETH.balanceOf(global.accountsETH[0]);
      assert.ok(balance.gte(0), 'must have some ERC20 balance');
    });

    it('deploys Plasma Manager contract on ETH from first account', async () => {
      /// @dev you create a contract factory for deploying contract. Refer to ethers.js documentation at https://docs.ethers.io/ethers.js/html/
      const PlasmaManagerContractFactory = new PlasmaManagerFactory(
        global.providerETH.getSigner(global.accountsETH[0])
      );

      global.plasmaManagerInstanceETH = await PlasmaManagerContractFactory.deploy();
      await parseReceipt(global.plasmaManagerInstanceETH.deployTransaction);

      assert.ok(global.plasmaManagerInstanceETH.address, 'conract address should be present');
    });

    it('deploys Funds Manager contract on ETH from first account', async () => {
      const FundsManagerContractFactory = new FundsManagerEthFactory(
        global.providerETH.getSigner(global.accountsETH[0])
      );

      global.fundsManagerInstanceETH = await FundsManagerContractFactory.deploy();
      await parseReceipt(global.fundsManagerInstanceETH.deployTransaction);

      assert.ok(global.fundsManagerInstanceETH.address, 'conract address should be present');
    });

    it('deploys Reverse Plasma contract on ESN from first account', async () => {
      const ReversePlasmaContractFactory = new ReversePlasmaFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.reversePlasmaInstanceESN = await ReversePlasmaContractFactory.deploy();
      await parseReceipt(global.reversePlasmaInstanceESN.deployTransaction);

      assert.ok(global.reversePlasmaInstanceESN.address, 'conract address should be present');
    });

    it('deploys Funds Manager contract on ESN from first account', async () => {
      const FundsManagerContractFactory = new FundsManagerEsnFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.fundsManagerInstanceESN = await FundsManagerContractFactory.deploy({
        value: ethers.utils.parseEther('910' + '0'.repeat(7)), // 910 crore
      });
      await parseReceipt(global.fundsManagerInstanceESN.deployTransaction);

      assert.ok(global.fundsManagerInstanceESN.address, 'conract address should be present');

      const fundsAtFundsManagerETH = await global.providerESN.getBalance(
        global.fundsManagerInstanceESN.address
      );
      assert.deepEqual(
        fundsAtFundsManagerETH,
        ethers.utils.parseEther('910' + '0'.repeat(7)),
        'funds manager ESN should have all ES funds in ES total supply'
      );
    });
  });
