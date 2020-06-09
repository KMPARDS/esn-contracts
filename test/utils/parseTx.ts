import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';

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

export async function parseTx(tx: Promise<ethers.ContractTransaction>, debug_mode: boolean = true) {
  const r = await (await tx).wait();
  if (!debug_mode) return r;
  const gasUsed = r.gasUsed.toNumber();
  console.group();
  console.log(
    `Gas used: ${gasUsed} / ${ethers.utils.formatEther(
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
  console.groupEnd();
  return r;
}
