import './global';
import { startGanacheServer } from './server';
import { GanacheETH, GanacheESN, SimpleStorageContract } from './suites';

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
    global.serverETH = startGanacheServer(7545);
    global.serverESN = startGanacheServer(8545);
  });

  // test cases for checking ganache server started correctly
  GanacheETH();
  GanacheESN();

  // Add your test hooks between before and after hooks
  SimpleStorageContract();

  after(() => {
    // stopping development blockchain
    global.serverETH.close();
    global.serverESN.close();
  });
});
