declare module 'eth-proof' {
  interface EthObject {
    serialize(): Buffer;
    toBuffer(): Buffer;
    toHex(): string;
    toObject(): Object;
    toString(): string;
    toJson(): string;
  }

  export class Verify {
    getRootFromProof(proof: any[]): Buffer;
    accountContainsStorageRoot(account: any): any;
    getBlockHashFromHeader(header: EthObject): any;
    getElemFromHeaderAt(header: EthObject, indexOfRoot: number): any;
    getStateRootFromHeader(header: EthObject): any;
    getTxsRootFromHeader(header: EthObject): any;
    getReceiptsRootFromHeader(header: EthObject): any;
    receiptContainsLogAt(receipt: any, indexOfLog: any): any;
    getStorageFromStorageProofAt(proof: any, position: any): Promise<any>;
    getAccountFromProofAt(proof: any, address: any): Promise<any>;
    getTxFromTxProofAt(proof: any, indexOfTx: any): Promise<any>;
    getReceiptFromReceiptProofAt(proof: any, indexOfTx: any): Promise<any>;
    proofContainsValueAt(proof: any, path: any): Promise<any>;
  }

  export class GetProof {
    constructor(rpcProvider: string);
    transactionProof(
      txHash: string
    ): Promise<{
      header: EthObject;
      txProof: EthObject;
      txIndex: string;
    }>;
    receiptProof(
      txHash: string
    ): Promise<{
      header: EthObject;
      receiptProof: EthObject;
      txIndex: string;
    }>;
    accountProof(
      address: string,
      blockHash: string
    ): Promise<{
      header: EthObject;
      accountProof: EthObject;
    }>;
    storageProof(
      address: string,
      storageAddress: string,
      blockHash: string
    ): Promise<{
      header: EthObject;
      accountProof: EthObject;
      storageProof: EthObject;
    }>;
  }

  export class GetAndVerify {
    txAgainstBlockHash(txHash: string, trustedBlockHash: string): Promise<any>;
    receiptAgainstBlockHash(txHash: string, trustedBlockHash: string): Promise<any>;
    accountAgainstBlockHash(accountAddress: string, trustedBlockHash: string): Promise<any>;
    storageAgainstBlockHash(
      accountAddress: string,
      position: string,
      trustedBlockHash: string
    ): Promise<any>;
    _logAgainstBlockHash(
      txHash: string,
      indexOfLog: string,
      trustedBlockHash: string
    ): Promise<any>;
  }
}
