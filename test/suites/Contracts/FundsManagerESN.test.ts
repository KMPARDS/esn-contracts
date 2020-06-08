import assert from 'assert';
import { ethers } from 'ethers';

const fundsManagerJSON = require('../../../build/ESN/FundsManager_FundsManager.json');

export const FundsManagerContractESN = () =>
  describe('Funds Manager Contract ESN Setup', async () => {
    it('deploys Funds Manager contract from first account with ESN:ERC20 contract address', async () => {
      const FundsManagerContractFactory = new ethers.ContractFactory(
        fundsManagerJSON.abi,
        fundsManagerJSON.evm.bytecode.object,
        global.providerESN.getSigner(global.accountsESN[0])
      );

      global.fundsManagerInstanceESN = await FundsManagerContractFactory.deploy(
        global.esInstanceETH.address,
        global.reversePlasmaInstanceESN.address
      );

      assert.ok(global.fundsManagerInstanceESN.address, 'conract address should be present');
    });

    it('checks token address set while deploying', async () => {
      const tokenAddress = await global.fundsManagerInstanceESN.tokenOnETH();

      assert.equal(
        global.esInstanceETH.address,
        tokenAddress,
        'token address should be set properly'
      );
    });

    it('checks reverse plasma address set while deploying', async () => {
      const reversePlasmaAddress = await global.fundsManagerInstanceESN.reversePlasma();

      assert.equal(
        global.reversePlasmaInstanceESN.address,
        reversePlasmaAddress,
        'reverse plasma address should be set properly'
      );
    });
  });
