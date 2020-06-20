const ethers = require('ethers');
const esJSON = require('./build/ETH/ERC20.json');
const plasmaManagerJSON = require('./build/ETH/PlasmaManager.json');
const fundsManagerETHJSON = require('./build/ETH/FundsManager.json');
const reversePlasmaJSON = require('./build/ESN/ReversePlasma.json');
const fundsManagerESNJSON = require('./build/ESN/FundsManager.json');

if (!process.argv[2]) {
  throw '\nNOTE: Please pass your private key as comand line argument';
}

const walletETH = new ethers.Wallet(process.argv[2]).connect(ethers.getDefaultProvider('rinkeby'));
// const walletETH = new ethers.Wallet(process.argv[2]).connect(
//   new ethers.providers.JsonRpcProvider('http://localhost:7545')
// );
const walletESN = new ethers.Wallet(process.argv[2]).connect(
  new ethers.providers.JsonRpcProvider('http://13.127.185.136:80')
);

const validatorAddress = [
  '0x08d85bd1004e3e674042eaddf81fb3beb4853a22',
  '0xb4fb9d198047fe763472d58045f1d9341161eb73',
  '0x36560493644fbb79f1c38d12ff096f7ec5d333b7',
];

(async () => {
  // ETH
  // esInstanceETH
  console.log(`\nDeploying esInstanceETH...`);
  const ESContractFactory = new ethers.ContractFactory(esJSON.abi, esJSON.evm.bytecode, walletETH);
  const esInstanceETH = await ESContractFactory.deploy();
  await esInstanceETH.deployTransaction.wait();
  console.log(`esInstanceETH: ${esInstanceETH.address}`);

  // esInstanceETH
  console.log(`\nDeploying plasmaManagerInstanceETH...`);
  const PlasmaManagerContractFactory = new ethers.ContractFactory(
    plasmaManagerJSON.abi,
    plasmaManagerJSON.evm.bytecode,
    walletETH
  );
  const plasmaManagerInstanceETH = await PlasmaManagerContractFactory.deploy();
  await plasmaManagerInstanceETH.deployTransaction.wait();
  console.log(`plasmaManagerInstanceETH: ${plasmaManagerInstanceETH.address}`);

  // fundsManagerInstanceETH
  console.log(`\nDeploying fundsManagerInstanceETH...`);
  const FundsManagerContractFactoryETH = new ethers.ContractFactory(
    fundsManagerETHJSON.abi,
    fundsManagerETHJSON.evm.bytecode,
    walletETH
  );
  const fundsManagerInstanceETH = await FundsManagerContractFactoryETH.deploy();
  console.log();
  await fundsManagerInstanceETH.deployTransaction.wait();
  console.log(`fundsManagerInstanceETH: ${fundsManagerInstanceETH.address}`);

  // ESN
  // reversePlasmaInstanceESN
  console.log(`\nDeploying reversePlasmaInstanceESN...`);
  const ReversePlasmaContractFactory = new ethers.ContractFactory(
    reversePlasmaJSON.abi,
    reversePlasmaJSON.evm.bytecode,
    walletESN
  );
  const reversePlasmaInstanceESN = await ReversePlasmaContractFactory.deploy();
  await reversePlasmaInstanceESN.deployTransaction.wait();
  console.log(`reversePlasmaInstanceESN: ${reversePlasmaInstanceESN.address}`);

  // fundsManagerInstanceESN
  console.log(`\nDeploying fundsManagerInstanceESN...`);
  const FundsManagerContractFactoryESN = new ethers.ContractFactory(
    fundsManagerESNJSON.abi,
    fundsManagerESNJSON.evm.bytecode,
    walletESN
  );
  const fundsManagerInstanceESN = await FundsManagerContractFactoryESN.deploy({
    value: ethers.utils.parseEther('910' + '0'.repeat(7)), // 910 crore
  });
  await fundsManagerInstanceESN.deployTransaction.wait();
  console.log(`fundsManagerInstanceESN: ${fundsManagerInstanceESN.address}`);

  console.log('\nsetting initial values');
  const tx1 = await plasmaManagerInstanceETH.setInitialValues(
    esInstanceETH.address,
    validatorAddress
  );
  await tx1.wait();
  console.log(tx1.hash);

  const tx2 = await fundsManagerInstanceETH.setInitialValues(
    esInstanceETH.address,
    plasmaManagerInstanceETH.address,
    fundsManagerInstanceESN.address
  );
  await tx2.wait();
  console.log(tx2.hash);

  const tx3 = await reversePlasmaInstanceESN.setInitialValues(
    esInstanceETH.address,
    await walletETH.provider.getBlockNumber(),
    validatorAddress
  );
  await tx3.wait();
  console.log(tx3.hash);

  const tx4 = await fundsManagerInstanceESN.setInitialValues(
    reversePlasmaInstanceESN.address,
    esInstanceETH.address,
    fundsManagerInstanceETH.address
  );
  await tx4.wait();
  console.log(tx4.hash);

  console.log('done');
})();

// if(!process.argv[2]) {
//   throw '\nNOTE: Please pass a file name or all flag, your network (homestead, ropsten, ...) as first comand line argument and private key as second command line argument.\neg => node deploy.js deployall rinkeby 0xa6779f54dc1e9959b81f448769450b97a9fcb2b41c53d4b2ab50e5055a170ce7\n';
// }

// if(!process.argv[3]) {
//   throw '\nNOTE: Please pass your network (homestead, ropsten, ...) as first comand line argument and private key as second command line argument.\neg => node deploy.js deployall rinkeby 0xa6779f54dc1e9959b81f448769450b97a9fcb2b41c53d4b2ab50e5055a170ce7\n';

//   if(!['homestead', 'ropsten', 'kovan', 'rinkeby', 'goerli'].includes(process.argv[3])) {
//     throw `\nNOTE: Network should be: homestead, ropsten, kovan, rinkeby or goerli\n`
//   }
// }

// if(!process.argv[4]) {
//   throw '\nNOTE: Please pass your private key as comand line argument after network.\neg => node deploy.js deployall rinkeby 0xa6779f54dc1e9959b81f448769450b97a9fcb2b41c53d4b2ab50e5055a170ce7\n';
// }

// const provider = ethers.getDefaultProvider(process.argv[3]);
// console.log(`\nUsing ${process.argv[3]} network...`);

// console.log('\nLoading wallet...');
// const wallet = new ethers.Wallet(process.argv[4], provider);
// console.log(`Wallet loaded ${wallet.address}\n`);

// const buildFolderPath = path.resolve(__dirname, 'build');

// const deployFile = async jsonFileName => {
//   console.log(`Preparing to deploy '${jsonFileName}' contract`);
//   const jsonFilePath = path.resolve(__dirname, 'build', jsonFileName);
//   const contractJSON = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

//   const ContractFactory = new ethers.ContractFactory(
//     contractJSON.abi,
//     contractJSON.evm.bytecode.object,
//     wallet
//   );

//   const contractInstance = await ContractFactory.deploy(...process.argv.slice(5));
//   console.log(`Deploying '${jsonFileName}' contract at ${contractInstance.address}\nhttps://${process.argv[3] !== 'homestead' ? process.argv[3] : 'www'}.etherscan.io/tx/${contractInstance.deployTransaction.hash}\nwaiting for confirmation...`);

//   await contractInstance.deployTransaction.wait();
//   console.log(`Contract is deployed at ${contractInstance.address}\n`);
// };

// if(process.argv[2] === 'deployall') {
//   fs.readdirSync(buildFolderPath).forEach(deployFile);
// } else {
//   deployFile(process.argv[2]);
// }
