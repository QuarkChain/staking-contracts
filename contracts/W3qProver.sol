pragma solidity ^0.8.0;

import "./interfaces/ILightClient.sol";
import "./lib/BlockDecoder.sol";
import "./lib/MerklePatriciaProof.sol";

contract W3qProver {
    using MerklePatriciaProof for bytes;

    ILightClient public client;

    constructor(address _client) {
        client = ILightClient(_client);
    }

    struct HeaderProof {
        bytes headerHash; //value
        bytes rlpParentNodes;
        bytes headerKey; // encodePath
    }

    function proveHeader(uint256 height, HeaderProof memory proof) external view returns (bool) {
        bytes32 root = client.getBlockRoot(height);

        // Check if the header hash exists in this tree
        return MerklePatriciaProof.verify(proof.headerHash, proof.rlpParentNodes, proof.headerKey, root);
    }

    struct TxProof {
        bytes rlpTx;
        bytes rlpParentNodes;
        bytes txKey;
    }

    function proveTx(
        bytes32 headerHash,
        bytes memory headerRlp,
        TxProof memory proof
    ) external pure returns (bool) {
        (bytes32 txRoot, bytes32 hash) = getTxRootAndHeaderHash(headerRlp);
        require(hash == headerHash, "incorrect header");
        return MerklePatriciaProof.verify(proof.rlpTx, proof.rlpParentNodes, proof.txKey, txRoot);
    }

    struct ReceiptProof {
        bytes rlpReceipt;
        bytes rlpParentNodes;
        bytes receiptKey;
    }

    function proveReceipt(
        bytes32 headerHash,
        bytes memory headerRlp,
        ReceiptProof memory proof
    ) external pure returns (bool) {
        (bytes32 recRoot, bytes32 hash) = getReceiptRootAndHeaderHash(headerRlp);
        require(hash == headerHash, "incorrect header");
        return MerklePatriciaProof.verify(proof.rlpReceipt, proof.rlpParentNodes, proof.receiptKey, recRoot);
    }

    function getTxRootAndHeaderHash(bytes memory headerRlp) internal pure returns (bytes32 txRoot, bytes32 headerHash) {
        txRoot = BlockDecoder.decodeTxHash(headerRlp);
        headerHash = BlockDecoder.msgHash(headerRlp);
        return (txRoot, headerHash);
    }

    function getReceiptRootAndHeaderHash(bytes memory headerRlp)
        internal
        pure
        returns (bytes32 receiptRoot, bytes32 headerHash)
    {
        receiptRoot = BlockDecoder.decodeReceiptHash(headerRlp);
        headerHash = BlockDecoder.msgHash(headerRlp);
        return (receiptRoot, headerHash);
    }
}
