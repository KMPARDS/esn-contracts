import './global';
import { startGanacheServer } from './server';
import { Suites } from './suites';
import { ethers } from 'ethers';

let name = require('../package.json').name;
if (name) {
  const convertName = (rawName: string, symbol: string) => {
    return rawName
      .split(symbol)
      .map((word) => {
        return word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };
  name = convertName(name, '_');
  name = convertName(name, '-');
} else {
  name = 'Project';
}

describe(`${name} Test Cases`, () => {
  before(() => {
    // starting ganache development blockchain
    global.serverETH = startGanacheServer({
      port: 7545,
      gasPrice: '0x00',
      accounts: [
        {
          secretKey: '0x1111111111111111111111111111111111111111111111111111111111111111',
          balance: '0x00',
        },
        {
          secretKey: '0x2222222222222222222222222222222222222222222222222222222222222222',
          balance: '0x00',
        },
      ],
    });
    global.serverESN = startGanacheServer({
      port: 8545,
      gasPrice: '0x00',
      accounts: [
        {
          secretKey: '0x1111111111111111111111111111111111111111111111111111111111111111',
          balance: ethers.utils.parseEther('910' + '0'.repeat(7)).toHexString(),
        },
        {
          secretKey: '0x2222222222222222222222222222222222222222222222222222222222222222',
          balance: '0x00',
        },
      ],
    });
  });

  Suites();

  after(() => {
    // stopping development blockchain
    global.serverETH.close();
    global.serverESN.close();
  });
});
