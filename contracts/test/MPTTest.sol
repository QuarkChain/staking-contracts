pragma solidity ^0.8.0;

import "../lib/MerklePatriciaProof.sol";
import "../lib/ReceiptDecoder.sol";

contract MPTTest {
    using MerklePatriciaProof for bytes;
    using ReceiptDecoder for bytes;

    function verify(
        bytes memory value,
        bytes memory encodedPath,
        bytes memory rlpParentNodes,
        bytes32 root
    ) public pure returns (bool) {
        return value.verify(encodedPath, rlpParentNodes, root);
    }

    function getNibbleArray(bytes memory b) public pure returns (bytes memory) {
        return MerklePatriciaProof._getNibbleArray(b);
    }

    function decodeReceipt(bytes memory value) public pure returns (ReceiptDecoder.Receipt memory) {
        return value.decodeReceipt();
    }
}

contract ReceiptTest {
    uint256 public a;
    event setEvent(string indexed name, uint256 setValue);

    function set(uint256 _a) public {
        emit setEvent("set", _a);
        a = _a;
    }
}
