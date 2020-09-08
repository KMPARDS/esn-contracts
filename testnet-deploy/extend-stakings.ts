import { Wallet } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { TimeAllyManagerFactory, TimeAllyStakingFactory } from '../build/typechain/ESN';

const timeallyManagerAddress = '0x89309551Fb7AbaaB85867ACa60404CDA649751d4';
const providerESN = new JsonRpcProvider('https://node0.testnet.eraswap.network');

if (!process.argv[2]) {
  throw '\nNOTE: Please pass your private key as comand line argument';
}
const wallet = new Wallet(process.argv[2], providerESN);

const timeallyManagerInstance = TimeAllyManagerFactory.connect(timeallyManagerAddress, wallet);

(async () => {
  const stakingTransfers = (
    await timeallyManagerInstance.queryFilter(
      timeallyManagerInstance.filters.StakingTransfer(null, null, null)
    )
  )
    .map((event) => timeallyManagerInstance.interface.parseLog(event))
    .map((parsedLog) => {
      const stakingTransfer: StakingTransferEvent = {
        from: parsedLog.args[0],
        to: parsedLog.args[1],
        stakingContract: parsedLog.args[2],
      };
      return stakingTransfer;
    });
  console.log(stakingTransfers.length);

  let nonce = await wallet.getTransactionCount();

  for (const stakingTransfer of stakingTransfers) {
    try {
      // console.log(stakingTransfer.to);

      const stakingInstance = TimeAllyStakingFactory.connect(
        stakingTransfer.stakingContract,
        wallet
      );
      const endMonth = await stakingInstance.endMonth();
      console.log(stakingInstance.address, endMonth);

      if (endMonth < 20) {
        console.log('extending');

        const tx = await stakingInstance.extend({
          gasPrice: 0,
          // gasLimit: 1000000,
          nonce: nonce++,
        });
        await tx.wait();
        console.log('extended');
      }

      // console.log('success');
    } catch (err) {
      console.log('failed');
    }
  }
})();

interface StakingTransferEvent {
  from: string;
  to: string;
  stakingContract: string;
}
