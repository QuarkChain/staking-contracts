pragma solidity ^0.8.0;

import "./interfaces/IW3qProver.sol";
import "./lib/BlockDecoder.sol";
import "./lib/MerklePatriciaProof.sol";
import "./LightClient.sol";
import "./interfaces/IW3qProver.sol";

contract W3qProver is LightClient, IW3qProver {
    using MerklePatriciaProof for bytes;
    using BlockDecoder for bytes;
    uint256 public override latestBlockHeight;

    mapping(uint256 => bytes32) public override headHashes;
    mapping(uint256 => BlockDecoder.HeadCore) public headCores;

    constructor(uint256 _epochPeriod, address _staking) LightClient(_epochPeriod, _staking) {}

    function initEpoch(
        address[] memory _epochSigners,
        uint256[] memory _epochVotingPowers,
        uint256 height,
        bytes32 headHash
    ) public override(LightClient) onlyOwner {
        _createEpochValidators(1, height, _epochSigners, _epochVotingPowers);
        latestBlockHeight = height;
        headHashes[height] = headHash;
    }

    function submitHead(
        uint256 height,
        bytes memory headBytes,
        bytes memory commitBytes,
        bool lookByIndex
    ) public override(IW3qProver, LightClient) {
        require(!blockExist(height), "block exist");

        uint256 _epochIdx = getEpochIdx(height);
        uint256 _position = _epochPosition(_epochIdx);
        require(epochs[_position].curEpochVals.length != 0,"epoch vals are empty");

        //  verify and decode header
        (uint256 decodeHeight, bytes32 headHash, BlockDecoder.HeadCore memory core) = BlockDecoder.verifyHeader(
            headBytes,
            commitBytes,
            epochs[_position].curEpochVals,
            epochs[_position].curVotingPowers,
            lookByIndex
        );

        require(decodeHeight == height, "inconsistent height");

        if (height == curEpochHeight + epochPeriod) {
            createEpochValidator(height,headBytes);
        }

        headHashes[height] = headHash;
        headCores[height] = core;
        if (latestBlockHeight < height) {
            latestBlockHeight = height;
        }
    }

    function proveTx(uint256 height, IW3qProver.Proof memory proof) external view override returns (bool) {
        bytes32 txRoot = getTxRoot(height);
        return MerklePatriciaProof.verify(proof.rlpValue, proof.rlpParentNodes, proof.encodePath, txRoot);
    }

    function proveReceipt(uint256 height, IW3qProver.Proof memory proof) external view override returns (bool) {
        bytes32 recRoot = getReceiptRoot(height);
        return MerklePatriciaProof.verify(proof.rlpValue, proof.rlpParentNodes, proof.encodePath, recRoot);
    }

    function getStateRoot(uint256 height) public view override returns (bytes32) {
        return headCores[height].Root;
    }

    function getTxRoot(uint256 height) public view override returns (bytes32) {
        return headCores[height].TxHash;
    }

    function getReceiptRoot(uint256 height) public view override returns (bytes32) {
        return headCores[height].ReceiptHash;
    }

    function blockExist(uint256 height) public view override returns (bool) {
        return headHashes[height] != bytes32(0);
    }
}
