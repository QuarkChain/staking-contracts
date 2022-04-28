pragma solidity ^0.8.0;

import "../lib/MerklePatriciaProof.sol";

contract MPTTest {
    using MerklePatriciaProof for bytes;

    function verifyTx(
        bytes memory value,
        bytes memory encodedPath,
        bytes memory rlpParentNodes,
        bytes32 root
    ) public pure returns (bool) {
        return value.verify(encodedPath, rlpParentNodes, root);
    }
}
