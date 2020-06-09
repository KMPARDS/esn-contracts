import { ethers } from 'ethers';

// TODO: https://github.com/ethers-io/ethers.js/issues/875
//  if this gets through, we dont need this function
export function c(contract: ethers.Contract, wallet: ethers.Wallet): ethers.Contract {
  return contract.connect(wallet.connect(contract.provider));
}
