pragma solidity ^0.8.0;

import "../lib/MerklePatriciaProof.sol";

contract MPTTest {
    using MerklePatriciaProof for bytes;

    function verify(
        bytes memory value,
        bytes memory encodedPath,
        bytes memory rlpParentNodes,
        bytes32 root
    ) public pure returns (bool) {
        return value.verify(encodedPath, rlpParentNodes, root);
    }
}

contract ReceiptTest{

    uint256 public a;

    function set(uint _a) public {
        a = _a;
    }
}