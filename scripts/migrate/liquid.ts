import { ethers } from 'ethers';
import { providerESN, walletESN } from '../commons';
import { formatEther } from 'ethers/lib/utils';

(async () => {
  let excel: LiquidRow[] = require('./liquid.json');
  console.log('Current Block Number', await providerESN.getBlockNumber());

  let nonce: number = await walletESN.getTransactionCount();
  console.log('started', { nonce });

  console.log('balance of wallet', formatEther(await walletESN.getBalance()));

  let tamount = ethers.constants.Zero;

  for (const [index, liquidRow] of excel.entries()) {
    const { address, amount } = parseLiquidRow(liquidRow);

    while (1) {
      try {
        // console.log({ address, claimedMonths, amount });

        const tx = await walletESN.sendTransaction({
          to: address,
          value: amount,
          nonce,
        });

        nonce++;

        break;
      } catch (error) {
        console.log(error.message);
        await new Promise((res) => setTimeout(res, 1000));

        if (error.message.includes('Transaction nonce is too low')) {
          nonce++;
        }
      }
    }

    tamount = tamount.add(amount);

    console.log(nonce, address, formatEther(amount));
  }

  console.log(formatEther(tamount));
})();

interface LiquidRow {
  Wallet: string;
  ES: number;
}

interface LiquidParsed {
  address: string;
  amount: ethers.BigNumber;
}

function parseLiquidRow(input: LiquidRow): LiquidParsed {
  const address = ethers.utils.getAddress(input.Wallet);
  const amount = ethers.utils.parseEther(String(input.ES));

  return { address, amount };
}
