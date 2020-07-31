import { startGanacheServer } from './test/server';
import { ethers } from 'ethers';

startGanacheServer({
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
