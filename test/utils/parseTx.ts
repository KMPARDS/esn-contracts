import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';

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

export async function parseTx(
  tx: Promise<ethers.ContractTransaction>,
  debug_mode: boolean = !!process.env.DEBUG
) {
  const r = await (await tx).wait();
  if (!debug_mode) return r;
  const gasUsed = r.gasUsed.toNumber();
  console.group();
  console.log(
    `\nGas used: ${gasUsed} / ${ethers.utils.formatEther(
      r.gasUsed.mul(ethers.utils.parseUnits('1', 'gwei'))
    )} ETH / ${gasUsed / 50000} ERC20 transfers`
  );

  const buildFolderPath = path.resolve(__dirname, '..', '..', 'build');
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
      console.log({ log });
    } else {
      console.log(i, output.name, removeNumericKeysFromStruct(output.args));
    }
  });

  // Ether Transfers:
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

  resp.structLogs
    .filter((log) => log.op === 'CALL')
    .forEach((log) => {
      const stack = [...log.stack];
      const gas = stack.pop();
      // @ts-ignore
      const address = ethers.utils.hexZeroPad(ethers.utils.hexStripZeros('0x' + stack.pop()), 20);
      const formattedValue = ethers.utils.formatEther(ethers.BigNumber.from('0x' + stack.pop()));

      console.log(`Trace: ${r.from} to ${address}: ${formattedValue} (${+('0x' + gas)} gas)`);
    });
  console.groupEnd();
  return r;
}
