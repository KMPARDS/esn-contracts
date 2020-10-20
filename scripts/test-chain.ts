import { startGanacheServer } from '../test/server';
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
      secretKey: '0xC8C32AE192AB75269C4F1BC030C2E97CC32E63B80B0A3CA008752145CF7ACEEA',
      balance: ethers.utils.parseEther('910' + '0'.repeat(7)).toHexString(),
    },
    {
      secretKey: '0x24C4FE6063E62710EAD956611B71825B778B041B18ED53118CE5DA5F02E494BA',
      balance: ethers.utils.parseEther('910' + '0'.repeat(7)).toHexString(),
    },
  ],
});
