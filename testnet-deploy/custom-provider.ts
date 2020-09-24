import { ethers, version, BigNumber } from 'ethers';
import { Deferrable, resolveProperties } from '@ethersproject/properties';
import { TransactionRequest } from '@ethersproject/abstract-provider';
import { ExternallyOwnedAccount } from '@ethersproject/abstract-signer';

import { Logger } from '@ethersproject/logger';
import { isHexString, parseBytes32String, hexStripZeros, hexZeroPad } from 'ethers/lib/utils';
const logger = new Logger(version);

export class CustomProvider extends ethers.providers.StaticJsonRpcProvider {
  async resolveName(name: string | Promise<string>): Promise<string> {
    return await this.resolveAddress(name);
  }

  async lookupAddress(address: string | Promise<string>): Promise<string> {
    return await this.resolveUsername(address);
  }

  async resolveAddress(name: string | Promise<string>): Promise<string | never> {
    name = await name;

    // If it is already an address, nothing to resolve
    try {
      return Promise.resolve(this.formatter.address(name));
    } catch (error) {
      // If is is a hexstring, the address is bad (See #694)
      if (isHexString(name)) {
        throw error;
      }
    }

    if (typeof name !== 'string') {
      logger.throwArgumentError('invalid ENS name', 'name', name);
    }

    if (!this.network.ensAddress) {
      logger.throwError('ens address is not configured');
    }

    // resolveAddress(bytes32)
    const transaction = {
      to: this.network.ensAddress,
      data: '0x6a14920a' + ethers.utils.formatBytes32String(name).substring(2),
    };

    let addr = await this.call(transaction);
    if (addr.length > 42) {
      addr = hexZeroPad(hexStripZeros(addr), 20);
    }

    if (addr === ethers.constants.AddressZero) {
      logger.throwError(`The kycname ${name} does not resolve to a non-zero address`);
    }

    return this.formatter.address(addr);
  }

  async resolveUsername(address: string | Promise<string>): Promise<string | never> {
    address = await address;
    address = this.formatter.address(address);

    // resolveUsername(address)
    const name = parseBytes32String(
      await this.call({
        to: this.network.ensAddress,
        data: '0x1f70693c' + ethers.utils.hexZeroPad(address, 32).substring(2),
      })
    );

    if (name === '') {
      logger.throwError(`The address ${address} does not resolve to a non-empty username`);
    }

    // Make sure the reverse record matches the foward record
    const addr = await this.resolveName(name);
    if (addr != address) {
      logger.throwError(
        `The address ${address} mismatches with the resolved address of ${name} as ${addr}`
      );
    }

    return name;
  }

  async call(
    transaction: Deferrable<TransactionRequest>,
    blockTag?: string | number | undefined
    // @ts-ignore
  ): Promise<string> {
    try {
      const resp = await super.call(transaction, blockTag);
      // console.log(resp);

      return resp;
    } catch (err) {
      const data = err?.error?.data;
      console.log('yey', data);

      if (typeof data === 'string' && data.slice(0, 9) === 'Reverted ') {
        const actualData = data.slice(9);
        const iface = new ethers.utils.Interface(['function Error(string)']);

        logger.throwError(
          actualData !== '0x'
            ? iface.decodeFunctionData('Error', actualData)[0]
            : 'Call was reverted without a revert reason',
          Logger.errors.CALL_EXCEPTION
        );
      } else {
        throw err;
      }
    }
  }

  async estimateGas(transaction: Deferrable<TransactionRequest>): Promise<BigNumber> {
    try {
      const resp = await super.estimateGas(transaction);
      // console.log(resp);

      return resp;
    } catch (err) {
      let { from, to, data, value } = transaction;

      // @ts-ignore
      if (typeof value === 'object' && value._isBigNumber) {
        // @ts-ignore
        value = value.toHexString();
      }

      const provider = this;

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
          error: err,
          tx: transaction,
        }
      );
    }
  }
}
