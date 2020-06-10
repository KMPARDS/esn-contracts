import assert from 'assert';
import { ethers } from 'ethers';
import { ContractJson } from '../../interfaces';
import { parseTx } from '../../utils';

const fundsManagerJSON: ContractJson = require('../../../build/ETH/FundsManager.json');

export const FundsManagerContractETH = () =>
  describe('Funds Manager Contract ETH Setup', async () => {
    it('deploys Funds Manager contract from first account with ETH:ERC20 contract address', async () => {
      const FundsManagerContractFactory = new ethers.ContractFactory(
        fundsManagerJSON.abi,
        fundsManagerJSON.evm.bytecode,
        global.providerETH.getSigner(global.accountsETH[0])
      );

      // @ts-ignore
      global.fundsManagerInstanceETH = await FundsManagerContractFactory.deploy(
        global.esInstanceETH.address,
        global.plasmaManagerInstanceETH.address
      );
      await parseTx(global.fundsManagerInstanceETH.deployTransaction, false);

      assert.ok(global.fundsManagerInstanceETH.address, 'conract address should be present');
    });

    it('checks token address set while deploying', async () => {
      const tokenAddress = await global.fundsManagerInstanceETH.token();

      assert.equal(
        global.esInstanceETH.address,
        tokenAddress,
        'token address should be set properly'
      );
    });

    it('checks plasma manager address set while deploying', async () => {
      const plasmaManagerAddress = await global.fundsManagerInstanceETH.plasmaManager();

      assert.equal(
        global.plasmaManagerInstanceETH.address,
        plasmaManagerAddress,
        'plasma manager address should be set properly'
      );
    });
  });
