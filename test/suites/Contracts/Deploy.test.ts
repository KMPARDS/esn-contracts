import assert from 'assert';
import { ethers } from 'ethers';
import { ContractJson } from '../../interfaces';
import { parseReceipt } from '../../utils';

/// @dev importing build files
const esJSON: ContractJson = require('../../../build/ETH/ERC20.json');
const plasmaManagerJSON: ContractJson = require('../../../build/ETH/PlasmaManager.json');
const fundsManagerETHJSON: ContractJson = require('../../../build/ETH/FundsManager.json');
const reversePlasmaJSON: ContractJson = require('../../../build/ESN/ReversePlasma.json');
const fundsManagerESNJSON: ContractJson = require('../../../build/ESN/FundsManager.json');

export const Deploy = () =>
  describe('Deploying Contracts', async () => {
    it('deploys Era Swap ERC20 contract on ETH from first account', async () => {
      const ESContractFactory = new ethers.ContractFactory(
        esJSON.abi,
        esJSON.evm.bytecode,
        global.providerETH.getSigner(global.accountsETH[0])
      );

      // @ts-ignore Need this until I modify TypeChain ethers-v5 plugin
      global.esInstanceETH = await ESContractFactory.deploy();
      await parseReceipt(global.esInstanceETH.deployTransaction, false);

      assert.ok(global.esInstanceETH.address, 'conract address should be present');

      const balance = await global.esInstanceETH.balanceOf(global.accountsETH[0]);
      assert.ok(balance.gte(0), 'must have some ERC20 balance');
    });

    it('deploys Plasma Manager contract on ETH from first account', async () => {
      /// @dev you create a contract factory for deploying contract. Refer to ethers.js documentation at https://docs.ethers.io/ethers.js/html/
      const PlasmaManagerContractFactory = new ethers.ContractFactory(
        plasmaManagerJSON.abi,
        plasmaManagerJSON.evm.bytecode,
        global.providerETH.getSigner(global.accountsETH[0])
      );

      // @ts-ignore Need this until I modify TypeChain ethers-v5 plugin
      global.plasmaManagerInstanceETH = await PlasmaManagerContractFactory.deploy();
      await parseReceipt(global.plasmaManagerInstanceETH.deployTransaction, false);

      assert.ok(global.plasmaManagerInstanceETH.address, 'conract address should be present');
    });

    it('deploys Funds Manager contract on ETH from first account', async () => {
      const FundsManagerContractFactory = new ethers.ContractFactory(
        fundsManagerETHJSON.abi,
        fundsManagerETHJSON.evm.bytecode,
        global.providerETH.getSigner(global.accountsETH[0])
      );

      // @ts-ignore Need this until I modify TypeChain ethers-v5 plugin
      global.fundsManagerInstanceETH = await FundsManagerContractFactory.deploy();
      await parseReceipt(global.fundsManagerInstanceETH.deployTransaction, false);

      assert.ok(global.fundsManagerInstanceETH.address, 'conract address should be present');
    });

    it('deploys Reverse Plasma contract on ESN from first account', async () => {
      const ReversePlasmaContractFactory = new ethers.ContractFactory(
        reversePlasmaJSON.abi,
        reversePlasmaJSON.evm.bytecode,
        global.providerESN.getSigner(global.accountsESN[0])
      );

      // @ts-ignore Need this until I modify TypeChain ethers-v5 plugin
      global.reversePlasmaInstanceESN = await ReversePlasmaContractFactory.deploy();
      await parseReceipt(global.reversePlasmaInstanceESN.deployTransaction, false);

      assert.ok(global.reversePlasmaInstanceESN.address, 'conract address should be present');
    });

    it('deploys Funds Manager contract on ESN from first account', async () => {
      const FundsManagerContractFactory = new ethers.ContractFactory(
        fundsManagerESNJSON.abi,
        fundsManagerESNJSON.evm.bytecode,
        global.providerESN.getSigner(global.accountsESN[0])
      );

      // @ts-ignore Need this until I modify TypeChain ethers-v5 plugin
      global.fundsManagerInstanceESN = await FundsManagerContractFactory.deploy();
      await parseReceipt(global.fundsManagerInstanceESN.deployTransaction, false);

      assert.ok(global.fundsManagerInstanceESN.address, 'conract address should be present');
    });
  });
