// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "./RLP.sol";
import "./RLPEncode.sol";

library EthParser {
	function parseTransaction(bytes memory _rawTx)
		internal
		pure
		returns (
			address,
			address,
			uint256,
			bytes memory
		)
	{
		RLP.RLPItem[] memory _txDecoded = RLP.toList(RLP.toRLPItem(_rawTx));

		address _to = RLP.toAddress(_txDecoded[3]);
		uint256 _value = RLP.toUint(_txDecoded[4]);
		bytes memory _data = RLP.toBytes(_txDecoded[5]);

		uint256 _v = RLP.toUint(_txDecoded[6]);
		bytes32 _r = RLP.toBytes32(_txDecoded[7]);
		bytes32 _s = RLP.toBytes32(_txDecoded[8]);

		bytes[] memory _unsignedTransactionList;

		uint8 _actualV;
		uint256 _chainId;

		if (_v > 28) {
			_unsignedTransactionList = new bytes[](9);
			if (_v % 2 == 0) {
				_actualV = 28;
			} else {
				_actualV = 27;
			}

			_chainId = (_v - _actualV - 8) / 2;

			_unsignedTransactionList[6] = BytesLib.packedBytesFromUint(_chainId);
		} else {
			_unsignedTransactionList = new bytes[](6);
			_actualV = uint8(_v);
		}

		for (uint256 i = 0; i < 6; i++) {
			_unsignedTransactionList[i] = RLP.toBytes(_txDecoded[i]);
		}

		bytes memory _unsignedTransaction = RLPEncode.encodeList(_unsignedTransactionList);

		address _signer = ecrecover(keccak256(_unsignedTransaction), _actualV, _r, _s);

		return (_signer, _to, _value, _data);
	}

	function parseReceiptStatus(bytes memory _rawReceipt) internal pure returns (bool) {
		RLP.RLPItem[] memory _receiptDecoded = RLP.toList(RLP.toRLPItem(_rawReceipt));
		bool _status = RLP.toUint(_receiptDecoded[0]) == 1;
		return _status;
	}
}
