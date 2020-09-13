import { Wallet } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { TimeAllyManagerFactory, TimeAllyStakingFactory } from '../../build/typechain/ESN';
import { existing, walletESN } from '../commons';

if (!existing.timeallyManager) {
  throw new Error('timeallyManager does not exist');
}

const timeallyManagerInstance = TimeAllyManagerFactory.connect(existing.timeallyManager, walletESN);

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

  let nonce = await walletESN.getTransactionCount();

  for (const stakingTransfer of stakingTransfers) {
    try {
      // console.log(stakingTransfer.to);

      const stakingInstance = TimeAllyStakingFactory.connect(
        stakingTransfer.stakingContract,
        walletESN
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
