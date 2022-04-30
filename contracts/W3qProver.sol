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
        curEpochHeight = height;
        _createEpochValidators(1, _epochSigners, _epochVotingPowers);
        latestBlockHeight = height;
        headHashes[height] = headHash;
    }

    function submitHead(
        uint256 _height,
        bytes memory headBytes,
        bytes memory commitBytes
    ) public override(IW3qProver, LightClient) {
        // 0.judge block if exist
        require(!blockExist(_height), "block exist");

        //  verify and decode header
        (uint256 height, bytes32 headHash, BlockDecoder.HeadCore memory core) = BlockDecoder.verifyHeader(
            headBytes,
            commitBytes,
            curEpochVals,
            curVotingPowers
        );

        //  the valid range of block height
        uint256 epochStart = curEpochHeight + 1;
        uint256 epochEnd = curEpochHeight + epochPeriod;

        require(_height == height, "incorrect height");

        if (height == epochEnd) {
            curEpochHeight = height;

            address[] memory vals = headBytes.decodeNextValidators();
            uint256[] memory powers = headBytes.decodeNextValidatorPowers();
            require(
                vals.length > 0 && powers.length > 0,
                "both NextValidators and NextValidatorPowers should not be empty"
            );

            _createEpochValidators(epochIdx + 1, vals, powers);
        } else {
            // height should not equal to epochEnd,because the block of epochEnd will be submit through calling 'submitEpochHead()'
            require(epochStart <= height && height < epochEnd, "invalid block height");
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

    function getTxRootAndHeaderHash(bytes memory headerRlp) public pure returns (bytes32 txRoot, bytes32 headerHash) {
        txRoot = BlockDecoder.decodeTxHash(headerRlp);
        headerHash = BlockDecoder.msgHash(headerRlp);
        return (txRoot, headerHash);
    }

    function getReceiptRootAndHeadHash(bytes memory headerRlp)
        public
        pure
        returns (bytes32 receiptRoot, bytes32 headerHash)
    {
        receiptRoot = BlockDecoder.decodeReceiptHash(headerRlp);
        headerHash = BlockDecoder.msgHash(headerRlp);
        return (receiptRoot, headerHash);
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
