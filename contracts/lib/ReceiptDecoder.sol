// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "./RLPReader.sol";
import "./RLPEncode.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/ILightClient.sol";

library ReceiptDecoder {
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for RLPReader.Iterator;
    using RLPReader for bytes;
    using Strings for uint256;

    struct Receipt {
        bytes root;
        uint256 gasUsed;
        bytes logsBloom;
        Log[] logs;
    }

    struct Log {
        address addr;
        bytes32[] topics;
        bytes data;
    }

        
    function cutTxtype(bytes memory rlpReceiptWithPrefix) internal pure returns(bytes memory rlpReceipt){
        uint256 prefix;
        assembly {
            prefix := mload(add(rlpReceiptWithPrefix,0x20))
            prefix := shr(0xf8,prefix)
        }

        if (prefix==1 || prefix==2){
            assembly{
                let len := mload(rlpReceiptWithPrefix)
                let actualLen := sub(len,1)
                rlpReceipt := add(rlpReceiptWithPrefix,1)
                mstore(rlpReceipt,actualLen)
            }
        }else{
            rlpReceipt = rlpReceiptWithPrefix;
        }
    }

    function decodeReceipt(bytes memory rlpReceiptWithPrefix) internal pure returns (Receipt memory rec) {
        bytes memory rlpReceipt = cutTxtype(rlpReceiptWithPrefix);
        RLPReader.RLPItem[] memory list = rlpReceipt.toRlpItem().toList();

        rec.root = list[0].toBytes();
        rec.gasUsed = list[1].toUint();
        rec.logsBloom = list[2].toBytes();
        rec.logs = decodeLogs(list[3]);
        return rec;
    }

    function decodeLogs(RLPReader.RLPItem memory item) internal pure returns (Log[] memory data) {
        RLPReader.RLPItem[] memory list = item.toList();
        data = new Log[](list.length);
        for (uint256 i = 0; i < list.length; i++) {
            RLPReader.RLPItem[] memory properties = list[i].toList();
            data[i].addr = properties[0].toAddress();
            data[i].topics = decodeTopics(properties[1]);
            data[i].data = properties[2].toBytes();
        }
    }

    function decodeTopics(RLPReader.RLPItem memory item) internal pure returns (bytes32[] memory data) {
        RLPReader.RLPItem[] memory list = item.toList();
        data = new bytes32[](list.length);
        for (uint256 i = 0; i < list.length; i++) {
            data[i] = bytes32(list[i].toUint());
        }
    }

    function decodeProof(bytes memory rlpProofPath) internal pure returns(ILightClient.Proof memory prf){
        RLPReader.RLPItem[] memory list = rlpProofPath.toRlpItem().toList();
        prf.value = list[0].toBytes();
        prf.proofPath = list[1].toBytes();
        prf.hpKey = list[2].toBytes();
    }

}
