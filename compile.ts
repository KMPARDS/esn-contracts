/*
  Author: Soham Zemse (https://github.com/zemse)

  This script reads your contracts written in contracts folder and compiles them only if you made any changes, creating a standard JSON output file in the build folder.

  USAGE:
  node compile.js (only for compiling)
  npm run test (for compiling + running tests)
*/

import { resolve } from 'path';
import {
  readdirSync,
  readFileSync,
  lstatSync,
  existsSync,
  removeSync,
  ensureDirSync,
  outputJsonSync,
} from 'fs-extra';
import { execSync } from 'child_process';
import { ethers } from 'ethers';
const solc: { compile(input: string): string } = require('solc');

const filesToIgnore: { [key: string]: boolean } = { '.DS_Store': true };
const buildFolderPath = resolve(__dirname, 'build', 'artifacts');
const lastSourceHashFilePath = resolve(__dirname, 'sst-config.json');

let sources = {};

function addSourcesFromThisDirectory(
  sourceFolderPath: string,
  relativePathArray: string[] = []
): void {
  readdirSync(resolve(sourceFolderPath, ...relativePathArray)).forEach((childName) => {
    if (filesToIgnore[childName]) return;
    const childPathArray = [...relativePathArray, childName];
    if (lstatSync(resolve(sourceFolderPath, ...childPathArray)).isDirectory()) {
      addSourcesFromThisDirectory(sourceFolderPath, childPathArray);
    } else {
      const fileExtension = childName.split('.').slice(-1)[0];
      if (['solidity', 'sol', 'solid'].includes(fileExtension)) {
        // console.log(childPathArray.join('/'));
        sources = {
          ...sources,
          [childPathArray.join('/')]: {
            content: readFileSync(resolve(sourceFolderPath, ...childPathArray), 'utf8'),
          },
        };
      }
    }
  });
}

// includes solidity files from contracts dir
addSourcesFromThisDirectory(resolve(__dirname, 'contracts'));

// includes solidity files in node_module but they might not be compatible with latest versions
addSourcesFromThisDirectory(resolve(__dirname, 'node_modules'), ['@openzeppelin']);

// console.log({sources});

function convertToHex(inputString: string): string {
  var hex = '';
  for (var i = 0; i < inputString.length; i++) {
    hex += '' + inputString.charCodeAt(i).toString(16);
  }
  return hex;
}

const sourceHash = ethers.utils.sha256('0x' + convertToHex(JSON.stringify(sources)));

console.log('\n'.repeat(process.stdout.rows));

if (
  existsSync(buildFolderPath) &&
  existsSync(lastSourceHashFilePath) &&
  JSON.parse(readFileSync(lastSourceHashFilePath, 'utf8')).sourceHash === sourceHash
) {
  console.log('No changes in .sol files detected... \nSkiping compile script...\n');
} else {
  // write the source hash there at the end of
  // console.log(lastSourceHash,sourceHash);

  const input = {
    language: 'Solidity',
    sources,
    settings: {
      // Optional: Optimizer settings
      optimizer: {
        // disabled by default
        enabled: true,
        // Optimize for how many times you intend to run the code.
        // Lower values will optimize more for initial deployment cost, higher
        // values will optimize more for high-frequency usage.
        runs: 2000,
      },
      outputSelection: {
        '*': {
          '*': ['*'],
        },
      },
    },
  };

  console.log('Compiling contracts...');

  interface SolcOutput {
    errors: { severity: string; formattedMessage: string }[];
    contracts: any[][];
  }

  const output: SolcOutput = JSON.parse(solc.compile(JSON.stringify(input)));
  console.log('Done');

  let shouldBuild = true;

  if (output.errors) {
    // console.error(output.errors);
    for (const error of output.errors) {
      console.log('-'.repeat(process.stdout.columns));
      console.group(error.severity.toUpperCase());
      console.log(error.formattedMessage);
      console.groupEnd();
    }
    if (Object.values(output.errors).length) console.log('-'.repeat(process.stdout.columns));
    // throw '\nError in compilation please check the contract\n';
    for (const error of output.errors) {
      if (error.severity === 'error') {
        shouldBuild = false;
        throw 'Error found\n';
        break;
      }
    }
  }

  if (shouldBuild) {
    console.log('\nBuilding please wait...');

    removeSync(buildFolderPath);
    ensureDirSync(buildFolderPath);

    let i = 0;
    for (let contractFile in output.contracts) {
      for (let key in output.contracts[contractFile]) {
        // console.log(contractFile, Object.keys(output.contracts[contractFile]).length, key, Object.keys(output.contracts[contractFile][key]));
        outputJsonSync(
          resolve(
            buildFolderPath,
            Object.keys(output.contracts[contractFile]).length > 1
              ? `${contractFile.split('.')[0]}_${key}.json`
              : `${contractFile.split('.')[0]}.json`
          ),
          output.contracts[contractFile][key]
        );
      }
      i++;
    }
    console.log('Build finished successfully!\n');
  } else {
    console.log('\nBuild failed\n');
  }

  outputJsonSync(resolve(lastSourceHashFilePath), { sourceHash });

  console.log('Running TypeChain...');
  execSync('npm run typechain');
  console.log('Done\n');
}
