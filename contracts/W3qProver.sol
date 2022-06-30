// SPDX-License-Identifier: GPL-3.0-only

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

    constructor(
        uint256 _epochPeriod,
        address _staking,
        address _w3qErc20
    ) LightClient(_epochPeriod, _staking, _w3qErc20) {}

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
        bytes memory commitBytes
    ) public override(IW3qProver, LightClient) {
        require(!blockExist(height), "block exist");

        uint256 _epochIdx = getEpochIdx(height);
        uint256 _position = _epochPosition(_epochIdx);

        //  verify and decode header
        (uint256 decodeHeight, bytes32 headHash, BlockDecoder.HeadCore memory core) = BlockDecoder.verifyHeader(
            headBytes,
            commitBytes,
            epochs[_position].curEpochVals,
            epochs[_position].curVotingPowers
        );

        require(decodeHeight == height, "inconsistent height");

        //  the valid range of block height

        if (height == curEpochHeight + epochPeriod) {
            address[] memory vals = headBytes.decodeNextValidators();
            uint256[] memory powers = headBytes.decodeNextValidatorPowers();
            uint256[] memory produceAmountList = headBytes.decodeExtra(); 
             
            require(
                vals.length > 0 && powers.length > 0,
                "both NextValidators and NextValidatorPowers should not be empty"
            );
            require(vals.length == produceAmountList.length && vals.length == powers.length, "incorrect length");

            _createEpochValidators(curEpochIdx + 1, height, vals, powers);
            _perEpochReward(epochs[_position].curEpochVals, produceAmountList);
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
