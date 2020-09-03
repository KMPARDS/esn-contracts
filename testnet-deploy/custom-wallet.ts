import { ethers, version, BigNumber } from 'ethers';
import { Deferrable, resolveProperties } from '@ethersproject/properties';
import { TransactionRequest } from '@ethersproject/abstract-provider';
import { ExternallyOwnedAccount } from '@ethersproject/abstract-signer';

import { Logger } from '@ethersproject/logger';
const logger = new Logger(version);

export class CustomWallet extends ethers.Wallet {
  constructor(
    privateKey: string | ethers.utils.Bytes | ExternallyOwnedAccount | ethers.utils.SigningKey,
    provider?: ethers.providers.JsonRpcProvider
  ) {
    super(privateKey, provider);
  }

  connect(provider: ethers.providers.JsonRpcProvider): CustomWallet {
    return new CustomWallet(this.privateKey, provider);
  }

  async populateTransaction(
    transaction: Deferrable<TransactionRequest>
  ): Promise<TransactionRequest> {
    const tx: Deferrable<TransactionRequest> = await resolveProperties(
      this.checkTransaction(transaction)
    );

    if (tx.gasLimit == null || tx.gasLimit instanceof Promise) {
      tx.gasLimit = await this.estimateGas(tx).catch(async (error) => {
        let { from, to, data, value } = tx;

        // @ts-ignore
        if (typeof value === 'object' && value._isBigNumber) {
          // @ts-ignore
          value = value.toHexString();
        }

        const provider = this.provider as ethers.providers.JsonRpcProvider;

        if (provider.send) {
          let result: any;
          try {
            result = await provider.send('trace_call', [
              { from, to: await to, data, value },
              ['vmtrace', 'trace'],
            ]);
          } catch (error) {
            console.log('trace_call error:', error.message);
          }

          if (result?.output) {
            // console.log(result);

            const i = new ethers.utils.Interface(['function Error(string)']);
            return logger.throwError(
              result?.output !== '0x'
                ? i.decodeFunctionData('Error', result.output)[0]
                : 'Call was reverted without a revert reason',
              Logger.errors.CALL_EXCEPTION
            );
          }
        }

        return logger.throwError(
          'cannot estimate gas; transaction may fail or may require manual gas limit',
          Logger.errors.UNPREDICTABLE_GAS_LIMIT,
          {
            error: error,
            tx: tx,
          }
        );
      });
    }

    return await super.populateTransaction(tx);
  }
}
