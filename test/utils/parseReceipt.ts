import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';

const COLOR_DIM = '\x1b[2m';
const COLOR_RESET = '\x1b[0m';

interface DebugTrace {
  gas: number;
  returnValue: any;
  structLogs: StructLog[];
}

interface StructLog {
  depth: number;
  error: any;
  gas: number;
  gasCost: number;
  memory: null;
  op: string;
  pc: number;
  stack: string[];
  storage: null;
}

const interfaceArray: ethers.utils.Interface[] = [];

function removeNumericKeysFromStruct(inputStruct: ethers.utils.Result) {
  const returnObj: { [key: string]: any } = {};
  Object.entries(inputStruct)
    .filter((entry, i) => {
      if (entry[0] === 'length') return false;
      if (entry[0] === String(i)) return false;
      return true;
    })
    .forEach((entry) => (returnObj[entry[0]] = entry[1]));
  return returnObj;
}

export async function parseReceipt(
  tx:
    | Promise<ethers.ContractTransaction>
    | ethers.ContractTransaction
    | Promise<ethers.providers.TransactionResponse>
    | ethers.providers.TransactionResponse,
  // traceTransaction: boolean = true, // this can be made false for contract deployments
  debug_mode: boolean = !!process.env.DEBUG
) {
  const r = await (await tx).wait();
  if (!debug_mode) return r;
  const gasUsed = r.gasUsed.toNumber();
  // console.group();
  console.log(
    COLOR_DIM,
    `\nGas used: ${gasUsed} / ${ethers.utils.formatEther(
      r.gasUsed.mul(ethers.utils.parseUnits('1', 'gwei'))
    )} ETH / ${gasUsed / 50000} ERC20 transfers`,
    COLOR_RESET
  );

  const buildFolderPath = path.resolve(__dirname, '..', '..', 'build', 'artifacts');
  const filesToIgnore: { [key: string]: boolean } = { '.DS_Store': true };

  function loadABIFromThisDirectory(relativePathArray: string[] = []) {
    const pathArray = [buildFolderPath, ...relativePathArray];
    fs.readdirSync(path.resolve(buildFolderPath, ...relativePathArray)).forEach((childName) => {
      if (filesToIgnore[childName]) return;
      const childPathArray = [...relativePathArray, childName];
      // console.log({childPathArray});
      if (fs.lstatSync(path.resolve(buildFolderPath, ...childPathArray)).isDirectory()) {
        loadABIFromThisDirectory(childPathArray);
      } else {
        const content = JSON.parse(
          fs.readFileSync(path.resolve(buildFolderPath, ...childPathArray), 'utf8')
        );
        // console.log({content});
        const iface = new ethers.utils.Interface(content.abi);
        interfaceArray.push(iface);
      }
    });
  }

  if (!interfaceArray.length) loadABIFromThisDirectory();

  r.logs.forEach((log, i) => {
    let output;

    for (const iface of interfaceArray) {
      try {
        output = iface.parseLog(log);
        if (output) {
          break;
        }
      } catch {}
    }

    if (!output) {
      console.log(COLOR_DIM, { log }, COLOR_RESET);
    } else {
      console.log(COLOR_DIM, i, output.name, removeNumericKeysFromStruct(output.args), COLOR_RESET);
    }
  });

  // Ether Transfers:
  const traceTransaction = true;
  if (traceTransaction) {
    let resp: DebugTrace;
    try {
      resp = await global.providerESN.send('debug_traceTransaction', [
        r.transactionHash,
        { disableMemory: true, disableStorage: true },
      ]);
    } catch {
      resp = await global.providerETH.send('debug_traceTransaction', [
        r.transactionHash,
        { disableMemory: true, disableStorage: true },
      ]);
    }

    const addressesToExclude = ['0x0000000000000000000000000000000000000001'];

    const fromArr: string[] = [resolveContractName(r.to)];

    resp.structLogs
      .map((log) => log)
      .filter(
        (log, i) =>
          log.op === 'CALL' ||
          log.op === 'STATICCALL' ||
          log.op === 'SELFDESTRUCT' ||
          log.op === 'RETURN'
      )
      .forEach((log) => {
        const stack = [...log.stack];
        const gas = stack.pop();
        let address = resolveContractName(
          ethers.utils.hexZeroPad(ethers.utils.hexStripZeros('0x' + stack.pop()), 20)
        );

        // console.log(log[3].op, log[0].op, log[1].op, log[2].op);
        if (log.op === 'RETURN') {
          console.log(COLOR_DIM, 'RETURN', COLOR_RESET);
          fromArr.pop();
          return;
        } else {
          fromArr.push(address);
        }

        const formattedValue = ethers.utils.formatEther(ethers.BigNumber.from('0x' + stack.pop()));
        if (!addressesToExclude.includes(address)) {
          console.log(
            COLOR_DIM,
            `Trace${log.op}: ${fromArr.slice(-2)[0]} to ${address}: ${formattedValue} (${+(
              '0x' + gas
            )} gas)`,
            COLOR_RESET
          );
        }
      });
    // console.groupEnd();
  }

  return r;
}

function resolveContractName(address: string): string {
  const globalEntries = Object.entries(global);
  for (const [key, value] of globalEntries) {
    if (
      typeof value === 'object' &&
      typeof value.address === 'string' &&
      typeof address === 'string' &&
      address.toLowerCase() === value.address?.toLowerCase()
    ) {
      return `[${key}|${address.slice(0, 6)}]`;
    }
  }

  return `[${address}]`;
}
