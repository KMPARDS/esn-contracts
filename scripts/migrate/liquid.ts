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

    // const tx = await walletESN.sendTransaction({
    //   to: address,
    //   value: amount,
    //   nonce,
    // });

    tamount = tamount.add(amount);

    console.log(
      // tx.hash,
      nonce,
      address,
      formatEther(amount)
    );
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
