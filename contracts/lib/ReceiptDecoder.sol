// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "./RLPReader.sol";
import "./RLPEncode.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

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

    function decodeReceipt(bytes memory rlpReceipt) internal pure returns (Receipt memory rec) {
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
}
