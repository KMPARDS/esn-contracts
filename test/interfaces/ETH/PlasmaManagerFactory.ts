/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import { Signer } from 'ethers';
import { Provider, TransactionRequest } from '@ethersproject/providers';
import { Contract, ContractFactory, Overrides } from '@ethersproject/contracts';

import { PlasmaManager } from './PlasmaManager';

export class PlasmaManagerFactory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(overrides?: Overrides): Promise<PlasmaManager> {
    return super.deploy(overrides || {}) as Promise<PlasmaManager>;
  }
  getDeployTransaction(overrides?: Overrides): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): PlasmaManager {
    return super.attach(address) as PlasmaManager;
  }
  connect(signer: Signer): PlasmaManagerFactory {
    return super.connect(signer) as PlasmaManagerFactory;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): PlasmaManager {
    return new Contract(address, _abi, signerOrProvider) as PlasmaManager;
  }
}

const _abi = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: '_startBlockNumber',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_bunchDepth',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_bunchIndex',
        type: 'uint256',
      },
    ],
    name: 'NewBunchHeader',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'bunches',
    outputs: [
      {
        internalType: 'uint256',
        name: 'startBlockNumber',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'bunchDepth',
        type: 'uint256',
      },
      {
        internalType: 'bytes32',
        name: 'transactionsMegaRoot',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'receiptsMegaRoot',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'esnDepositAddress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllSigners',
    outputs: [
      {
        internalType: 'address[]',
        name: '',
        type: 'address[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllValidators',
    outputs: [
      {
        internalType: 'address[]',
        name: '',
        type: 'address[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getNextStartBlockNumber',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'isValidator',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lastBunchIndex',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'processedWithdrawals',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_esnDepositAddress',
        type: 'address',
      },
    ],
    name: 'setESNDepositAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_token',
        type: 'address',
      },
      {
        internalType: 'address[]',
        name: '_validators',
        type: 'address[]',
      },
    ],
    name: 'setInitialValues',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'signers',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes',
        name: '_signedHeader',
        type: 'bytes',
      },
    ],
    name: 'submitBunchHeader',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token',
    outputs: [
      {
        internalType: 'contract ERC20',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'validators',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

const _bytecode =
  '0x608060405230600760006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555034801561005157600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550611ba4806100a16000396000f3fe608060405234801561001057600080fd5b50600436106100ea5760003560e01c806376f5e6da1161008c578063d42f2f3511610066578063d42f2f35146104c5578063f3513a3714610524578063facd743b14610583578063fc0c546a146105df576100ea565b806376f5e6da14610380578063974275cf1461043b578063bf49d6311461047f576100ea565b80632ceea82a116100c85780632ceea82a1461027f57806335aa2e441461029d5780634eee08901461030b57806375080de814610329576100ea565b806315c09850146100ef5780632079fb9a1461013957806324f8ecec146101a7575b600080fd5b6100f7610629565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6101656004803603602081101561014f57600080fd5b810190808035906020019092919050505061064f565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b61027d600480360360408110156101bd57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001906401000000008111156101fa57600080fd5b82018360208201111561020c57600080fd5b8035906020019184602083028401116401000000008311171561022e57600080fd5b919080806020026020016040519081016040528093929190818152602001838360200280828437600081840152601f19601f82011690508083019250505050505050919291929050505061068b565b005b6102876109af565b6040518082815260200191505060405180910390f35b6102c9600480360360208110156102b357600080fd5b81019080803590602001909291905050506109bc565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6103136109f8565b6040518082815260200191505060405180910390f35b6103556004803603602081101561033f57600080fd5b8101908080359060200190929190505050610a68565b6040518085815260200184815260200183815260200182815260200194505050505060405180910390f35b6104396004803603602081101561039657600080fd5b81019080803590602001906401000000008111156103b357600080fd5b8201836020820111156103c557600080fd5b803590602001918460018302840111640100000000831117156103e757600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f820116905080830192505050505050509192919290505050610aa5565b005b61047d6004803603602081101561045157600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061109a565b005b6104ab6004803603602081101561049557600080fd5b81019080803590602001909291905050506110de565b604051808215151515815260200191505060405180910390f35b6104cd6110fe565b6040518080602001828103825283818151815260200191508051906020019060200280838360005b838110156105105780820151818401526020810190506104f5565b505050509050019250505060405180910390f35b61052c61118c565b6040518080602001828103825283818151815260200191508051906020019060200280838360005b8381101561056f578082015181840152602081019050610554565b505050509050019250505060405180910390f35b6105c56004803603602081101561059957600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061121a565b604051808215151515815260200191505060405180910390f35b6105e761123a565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b600760009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6004818154811061065c57fe5b906000526020600020016000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461074d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601e8152602001807f504c41534d413a204f6e6c79206465706c6f7965722063616e2063616c6c000081525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161461088757600073ffffffffffffffffffffffffffffffffffffffff16600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614610845576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601e8152602001807f504c41534d413a20546f6b656e206164727320616c726561647920736574000081525060200191505060405180910390fd5b81600660006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505b6000815111156109ab5760006003805490501461090c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601e8152602001807f504c41534d413a2056616c696461746f727320616c726561647920736574000081525060200191505060405180910390fd5b60008090505b815181101561099257600180600084848151811061092c57fe5b602002602001015173ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055508080600101915050610912565b5080600390805190602001906109a9929190611a59565b505b5050565b6000600580549050905090565b600381815481106109c957fe5b906000526020600020016000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000806005805490501415610a105760009050610a65565b600560016005805490500381548110610a2557fe5b90600052602060002090600402016001015460020a600560016005805490500381548110610a4f57fe5b9060005260206000209060040201600001540190505b90565b60058181548110610a7557fe5b90600052602060002090600402016000915090508060000154908060010154908060020154908060030154905084565b6060610ab8610ab383611260565b61128e565b90506060610ad982600081518110610acc57fe5b602002602001015161128e565b90506004815114610b52576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260188152602001807f504c41534d413a20696e76616c69642070726f706f73616c000000000000000081525060200191505060405180910390fd5b610b5a611ae3565b6040518060800160405280610b8284600081518110610b7557fe5b60200260200101516113eb565b8152602001610ba484600181518110610b9757fe5b60200260200101516113eb565b8152602001610bc684600281518110610bb957fe5b60200260200101516114c5565b8152602001610be884600381518110610bdb57fe5b60200260200101516114c5565b8152509050610bf56109f8565b816000015114610c6d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601f8152602001807f504c41534d413a20696e76616c696420737461727420626c6f636b206e6f2e0081525060200191505060405180910390fd5b6060610c8c84600081518110610c7f57fe5b60200260200101516114da565b905060006040518060400160405280600281526020017f19970000000000000000000000000000000000000000000000000000000000008152507f6f3a1e66e989a1cf337b9dd2ce4c98a5e78763cf9f9bdaac5707038c66a4d74e836040516020018084805190602001908083835b60208310610d1e5780518252602082019150602081019050602083039250610cfb565b6001836020036101000a03801982511681845116808217855250505050505090500183815260200182805190602001908083835b60208310610d755780518252602082019150602081019050602083039250610d52565b6001836020036101000a0380198251168184511680821785525050505050509050019350505050604051602081830303815290604052805190602001209050600080600190505b8651811015610f40576060610de3888381518110610dd657fe5b6020026020010151611567565b9050600080610df28684611673565b9150915081610e69576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f504c41534d413a2065637265636f7665722073686f756c64207375636365737381525060200191505060405180910390fd5b600160008273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16610f28576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601d8152602001807f504c41534d413a20696e76616c69642076616c696461746f722073696700000081525060200191505060405180910390fd5b84806001019550505050508080600101915050610dbc565b50610f5a600260038054905061170b90919063ffffffff16565b610f6e60038361170b90919063ffffffff16565b11610fe1576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601a8152602001807f504c41534d413a206e6f74203636252076616c696461746f727300000000000081525060200191505060405180910390fd5b6000600580549050905060058590806001815401808255809150506001900390600052602060002090600402016000909190919091506000820151816000015560208201518160010155604082015181600201556060820151816003015550507f435520ea9b14c682112acef5bc8466234d75b18dce73c44a78d905139def419d856000015186602001518360405180848152602001838152602001828152602001935050505060405180910390a15050505050505050565b80600760006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b60026020528060005260406000206000915054906101000a900460ff1681565b6060600480548060200260200160405190810160405280929190818152602001828054801561118257602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019060010190808311611138575b5050505050905090565b6060600380548060200260200160405190810160405280929190818152602001828054801561121057602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190600101908083116111c6575b5050505050905090565b60016020528060005260406000206000915054906101000a900460ff1681565b600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b611268611b11565b600060208301905060405180604001604052808451815260200182815250915050919050565b6060611299826117ae565b61130b576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260158152602001807f524c503a206974656d206973206e6f74206c697374000000000000000000000081525060200191505060405180910390fd5b6000611316836117fc565b905060608167ffffffffffffffff8111801561133157600080fd5b5060405190808252806020026020018201604052801561136b57816020015b611358611b11565b8152602001906001900390816113505790505b509050600061137d856020015161186d565b8560200151019050600080600090505b848110156113de5761139e836118f6565b91506040518060400160405280838152602001848152508482815181106113c157fe5b60200260200101819052508183019250808060010191505061138d565b5082945050505050919050565b600080826000015111801561140557506021826000015111155b611477576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601d8152602001807f524c503a206c656e206e6f74206265747765656e203020616e6420333300000081525060200191505060405180910390fd5b6000611486836020015161186d565b905060008184600001510390506000808386602001510190508051915060208310156114b957826020036101000a820491505b81945050505050919050565b60006114d0826113eb565b60001b9050919050565b606080826000015167ffffffffffffffff811180156114f857600080fd5b506040519080825280601f01601f19166020018201604052801561152b5781602001600182028036833780820191505090505b5090506000815114156115415780915050611562565b600081602001905061155c84602001518286600001516119ae565b81925050505b919050565b606060008260000151116115e3576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260148152602001807f524c503a206c656e206973206e6f74206774203000000000000000000000000081525060200191505060405180910390fd5b60006115f2836020015161186d565b9050600081846000015103905060608167ffffffffffffffff8111801561161857600080fd5b506040519080825280601f01601f19166020018201604052801561164b5781602001600182028036833780820191505090505b50905060008160200190506116678487602001510182856119ae565b81945050505050919050565b600080600080600060418651146116965760008080905094509450505050611704565b6020860151925060408601519150606086015160001a9050601b8160ff1610156116c157601b810190505b601b8160ff16141580156116d95750601c8160ff1614155b156116f05760008080905094509450505050611704565b6116fc87828585611a15565b945094505050505b9250929050565b60008083141561171e57600090506117a8565b600082840290508284828161172f57fe5b04146117a3576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601f8152602001807f536166654d6174683a204d756c7469706c696361746e206f766572666c6f770081525060200191505060405180910390fd5b809150505b92915050565b600080826000015114156117c557600090506117f7565b60008083602001519050805160001a915060c060ff168260ff1610156117f0576000925050506117f7565b6001925050505b919050565b600080826000015114156118135760009050611868565b60008090506000611827846020015161186d565b84602001510190506000846000015185602001510190505b8082101561186157611850826118f6565b82019150828060010193505061183f565b8293505050505b919050565b600080825160001a9050608060ff1681101561188d5760009150506118f1565b60b860ff168110806118b2575060c060ff1681101580156118b1575060f860ff1681105b5b156118c15760019150506118f1565b60c060ff168110156118e15760018060b80360ff168203019150506118f1565b60018060f80360ff168203019150505b919050565b6000806000835160001a9050608060ff1681101561191757600191506119a4565b60b860ff16811015611934576001608060ff1682030191506119a3565b60c060ff168110156119645760b78103600185019450806020036101000a855104600182018101935050506119a2565b60f860ff1681101561198157600160c060ff1682030191506119a1565b60f78103600185019450806020036101000a855104600182018101935050505b5b5b5b8192505050919050565b60008114156119bc57611a10565b5b602060ff1681106119ec5782518252602060ff1683019250602060ff1682019150602060ff16810390506119bd565b6000600182602060ff16036101000a03905080198451168184511681811785525050505b505050565b60008060008060405188815287602082015286604082015285606082015260208160808360006001610bb8f192508051915050818193509350505094509492505050565b828054828255906000526020600020908101928215611ad2579160200282015b82811115611ad15782518260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555091602001919060010190611a79565b5b509050611adf9190611b2b565b5090565b6040518060800160405280600081526020016000815260200160008019168152602001600080191681525090565b604051806040016040528060008152602001600081525090565b611b6b91905b80821115611b6757600081816101000a81549073ffffffffffffffffffffffffffffffffffffffff021916905550600101611b31565b5090565b9056fea26469706673582212204032bb987a6f7b364387788e32b17f01d2457ca1337d9210b6bfe4bdbe5aeb6464736f6c634300060a0033';