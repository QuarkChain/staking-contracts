// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import "./lib/BlockDecoder.sol";
import "./lib/MerklePatriciaProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IStaking.sol";
import "./interfaces/ILightClient.sol";

contract LightClient is ILightClient, Ownable {
    using BlockDecoder for bytes;
    using BlockDecoder for uint256[];

    // Current validator info from side-chain's epoch header
    // Use to verify commit if the side-chain does not change validators.
    uint8 public constant TOTAL_EPOCH = 4;
    Epoch[TOTAL_EPOCH] epochs;

    uint256 public override curEpochIdx;
    uint256 public override epochPeriod;

    // A contract address used to pledge w3q token to obtain voting rights.
    IStaking public staking;

    // Record the block with the highest block height among the blocks submitted via submitHead()
    uint256 public override latestBlockHeight;
    mapping(uint256 => bytes32) public override headHashes;
    mapping(uint256 => BlockDecoder.HeadCore) public headCores;

    constructor(uint256 _epochPeriod, address _staking) {
        epochPeriod = _epochPeriod;
        staking = IStaking(_staking);
    }

    /**
     * @notice Get the index of the current epoch data stored in epochs.
     */
    function _epochPosition(uint256 _epochIdx) internal pure returns (uint256) {
        return _epochIdx % TOTAL_EPOCH;
    }

    /**
     * @notice Initialize the epochIdx ,validators and votingPowers of the first epoch. And default value of epochIdx is 1, the default value of height is 0 .
     */
    function initEpoch(
        address[] memory _epochSigners,
        uint256[] memory _epochVotingPowers,
        uint256 height,
        bytes32 headHash
    ) public virtual override onlyOwner {
        require(height == 0, "hieight should be 0");
        _setEpochValidators(1, _epochSigners, _epochVotingPowers);
        latestBlockHeight = height;
        headHashes[height] = headHash;
    }

    /**
     * @notice Submit an epoch header or non-epoch header.
     */
    function submitHeader(
        uint256 height,
        bytes memory headBytes,
        bytes memory commitBytes,
        bool lookByIndex
    ) public virtual override {
        require(!blockExist(height), "block exist");
        uint256 _epochIdx = getEpochIdx(height);

        // verify and decode header
        (uint256 decodedHeight, bytes32 headHash, BlockDecoder.HeadCore memory core) = _submitHeader(
            _epochIdx,
            headBytes,
            commitBytes,
            lookByIndex
        );
        require(decodedHeight == height, "inconsistent height");

        headHashes[height] = headHash;
        headCores[height] = core;
        if (latestBlockHeight < height) {
            latestBlockHeight = height;
        }
    }

    function _submitHeader(
        uint256 epochIdx,
        bytes memory headBytes,
        bytes memory commitBytes,
        bool lookByIndex
    )
        internal
        returns (
            uint256,
            bytes32,
            BlockDecoder.HeadCore memory
        )
    {
        uint256 _position = _epochPosition(epochIdx);
        require(epochs[_position].curEpochVals.length != 0, "epoch vals are empty");
        // verify and decode header
        (uint256 decodedHeight, bytes32 headHash, BlockDecoder.HeadCore memory core) = BlockDecoder.verifyHeader(
            headBytes,
            commitBytes,
            epochs[_position].curEpochVals,
            epochs[_position].curVotingPowers,
            lookByIndex
        );

        // Update Validators if the height of the submitted block header is equal to the height of the next EpochHeight
        if (decodedHeight == getNextEpochHeight()) {
            _updateEpochValidator(headBytes);
        }

        return (decodedHeight, headHash, core);
    }

    /**
     * Decode validator from headrlpbytes and create validator set for an epoch
     */
    function _updateEpochValidator(bytes memory _epochHeaderBytes) internal {
        address[] memory vals = _epochHeaderBytes.decodeNextValidators();
        uint256[] memory powers = _epochHeaderBytes.decodeNextValidatorPowers();
        require(
            vals.length > 0 && powers.length > 0,
            "both NextValidators and NextValidatorPowers should not be empty"
        );

        _setEpochValidators(curEpochIdx + 1, vals, powers);
    }

    /**
     * Create validator set for an epoch
     * @param _epochIdx the index of epoch to propose validators
     */
    function _setEpochValidators(
        uint256 _epochIdx,
        address[] memory _epochSigners,
        uint256[] memory _epochVotingPowers
    ) internal {
        require(_epochIdx == curEpochIdx + 1, "epoch too old");
        // Check if the epoch validators are from proposed.
        // This means that the 2/3+ validators have accepted the proposed validators from the contract.
        require(_epochSigners.length == _epochVotingPowers.length, "incorrect length");

        uint256 position = _epochPosition(_epochIdx);
        curEpochIdx = _epochIdx;
        epochs[position].curEpochVals = _epochSigners;
        epochs[position].curVotingPowers = _epochVotingPowers;

        // TODO: add rewards to validators
    }

    function getCurrentEpoch()
        public
        view
        override
        returns (
            uint256,
            address[] memory,
            uint256[] memory
        )
    {
        uint256 position = _epochPosition(curEpochIdx);
        return (curEpochIdx, epochs[position].curEpochVals, epochs[position].curVotingPowers);
    }

    function setEpochPeriod(uint256 _epochPeriod) external override onlyOwner {
        epochPeriod = _epochPeriod;
    }

    function getNextEpochHeight() public view override returns (uint256 height) {
        return curEpochHeight() + epochPeriod;
    }

    function getStaking() external view override returns (address) {
        return address(staking);
    }

    function proposedValidators() external view override returns (address[] memory, uint256[] memory) {
        return staking.proposedValidators();
    }

    function getEpochIdx(uint256 height) public view override returns (uint256) {
        require(isInHeightRange(height), "out of height range");
        // Reduce the times of Sload
        uint256 _epochPeriod = epochPeriod;
        return (height + _epochPeriod - 1) / _epochPeriod;
    }

    function isInHeightRange(uint256 height) public view override returns (bool) {
        (uint256 min, uint256 max) = heightRange();
        if (height >= min && height <= max) {
            return true;
        } else {
            return false;
        }
    }

    function minEpochIdx() public view override returns (uint256) {
        if (curEpochIdx >= TOTAL_EPOCH) {
            return curEpochIdx - TOTAL_EPOCH + 1;
        }
        return 0;
    }

    function heightRange() public view override returns (uint256 min, uint256 max) {
        min = _minHeight();
        max = _maxHeight();
        // when the latestEpochHeight is 10000 and TOTAL_EPOCH = 2,
        // the range of the block ,can be verified by contract, is [1,20000]
    }

    function _minHeight() internal view returns (uint256) {
        uint256 _minEpochId = minEpochIdx();
        if (_minEpochId == 0) {
            return 0;
        } else {
            return (_minEpochId - 1) * epochPeriod + 1;
        }
    }

    function _maxHeight() internal view returns (uint256) {
        return curEpochHeight() + epochPeriod;
    }

    /**
     * @notice Calculate the height of EpochHeight by epochIdx and epochPeriod.
     * Their relationship is as follows: epochHeight = (epochIdx - 1) * epochPeriod
     */
    function _deriveEpochHeight(uint256 _epochIdx, uint256 _epochPeriod) internal pure returns (uint256) {
        require(_epochIdx != 0, "epochIdx can not be 0");
        uint256 _curEpochHeight = (_epochIdx - 1) * _epochPeriod;
        return _curEpochHeight;
    }

    function curEpochHeight() public view override returns (uint256) {
        return _deriveEpochHeight(curEpochIdx, epochPeriod);
    }

    function proveTx(uint256 height, ILightClient.Proof memory proof) external view override returns (bool) {
        bytes32 txRoot = getTxRoot(height);
        return MerklePatriciaProof.verify(proof.rlpValue, proof.rlpParentNodes, proof.encodePath, txRoot);
    }

    function proveReceipt(uint256 height, ILightClient.Proof memory proof) external view override returns (bool) {
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
