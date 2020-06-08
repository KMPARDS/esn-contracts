import assert from 'assert';
import { ethers } from 'ethers';

const fundsManagerJSON = require('../../../build/ETH/FundsManager_FundsManager.json');

export const FundsManagerContractETH = () =>
  describe('Funds Manager Contract ETH Setup', async () => {
    it('deploys Funds Manager contract from first account with ETH:ERC20 contract address', async () => {
      const FundsManagerContractFactory = new ethers.ContractFactory(
        fundsManagerJSON.abi,
        fundsManagerJSON.evm.bytecode.object,
        global.providerETH.getSigner(global.accountsETH[0])
      );

      global.fundsManagerInstanceETH = await FundsManagerContractFactory.deploy(
        global.esInstanceETH.address
      );

      assert.ok(global.fundsManagerInstanceETH.address, 'conract address should be present');
    });

    it('checks token contract set while deploying', async () => {
      const tokenAddress = await global.fundsManagerInstanceETH.token();

      assert.equal(
        global.esInstanceETH.address,
        tokenAddress,
        'token address should be set properly'
      );
    });
  });
