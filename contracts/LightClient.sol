pragma solidity ^0.8.0;

import "./lib/BlockDecoder.sol";
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
    uint256 public override curEpochHeight;
    uint256 public override epochPeriod;

    IStaking public staking;

    constructor(uint256 _epochPeriod, address _staking) {
        epochPeriod = _epochPeriod;
        staking = IStaking(_staking);
    }

    function _epochPosition(uint256 _epochIdx) internal pure returns (uint256) {
        return _epochIdx % TOTAL_EPOCH;
    }

    function initEpoch(
        address[] memory _epochSigners,
        uint256[] memory _epochVotingPowers,
        uint256 _height,
        bytes32
    ) public virtual override onlyOwner {
        _setEpochValidators(1, _height, _epochSigners, _epochVotingPowers);
    }

    /**
     * Create validator set for an epoch
     */
    function submitHead(
        uint256,
        bytes memory epochHeaderBytes,
        bytes memory commitBytes,
        bool lookByIndex
    ) public virtual override {
        //1. verify epoch header
        _submitHead(curEpochIdx, epochHeaderBytes, commitBytes, lookByIndex);
    }

    function _submitHead(
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
        //  verify and decode header
        (uint256 decodedHeight, bytes32 headHash, BlockDecoder.HeadCore memory core) = BlockDecoder.verifyHeader(
            headBytes,
            commitBytes,
            epochs[_position].curEpochVals,
            epochs[_position].curVotingPowers,
            lookByIndex
        );

        if (decodedHeight == curEpochHeight + epochPeriod) {
            _updateEpochValidator(decodedHeight, headBytes);
        }

        return (decodedHeight, headHash, core);
    }

    /**
     * Decode validator from headrlpbytes and create validator set for an epoch
     */
    function _updateEpochValidator(uint256 height, bytes memory _epochHeaderBytes) internal {
        address[] memory vals = _epochHeaderBytes.decodeNextValidators();
        uint256[] memory powers = _epochHeaderBytes.decodeNextValidatorPowers();
        require(
            vals.length > 0 && powers.length > 0,
            "both NextValidators and NextValidatorPowers should not be empty"
        );

        _setEpochValidators(curEpochIdx + 1, height, vals, powers);
    }

    /**
     * Create validator set for an epoch
     * @param _epochIdx the index of epoch to propose validators
     */
    function _setEpochValidators(
        uint256 _epochIdx,
        uint256 _epochHeight,
        address[] memory _epochSigners,
        uint256[] memory _epochVotingPowers
    ) internal {
        require(_epochIdx > curEpochIdx, "epoch too old");

        // Check if the epoch validators are from proposed.
        // This means that the 2/3+ validators have accepted the proposed validators from the contract.
        require(_epochSigners.length == _epochVotingPowers.length, "incorrect length");

        uint256 position = _epochPosition(_epochIdx);
        curEpochIdx = _epochIdx;
        curEpochHeight = _epochHeight;
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

    function getNextEpochHeight() external view override returns (uint256 height) {
        return curEpochHeight + epochPeriod;
    }

    function getStaking() external view override returns (address) {
        return address(staking);
    }

    function proposedValidators() external view override returns (address[] memory, uint256[] memory) {
        return staking.proposedValidators();
    }

    function getEpochIdx(uint256 height) public view override returns (uint256) {
        require(isInHeightRange(height), "out of height range");
        //Reduce the times of Sload
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

        return (min, max);
    }

    function _minHeight() internal view returns (uint256) {
        uint256 _curEpochHeight = curEpochHeight;
        uint256 _epochPeriod = epochPeriod;

        uint256 _range = (TOTAL_EPOCH - 1) * _epochPeriod;
        uint256 minHeight = 0;
        if (_curEpochHeight >= _range) {
            minHeight = _curEpochHeight - _range + 1;
        }
        return minHeight;
    }

    function _maxHeight() internal view returns (uint256) {
        return curEpochHeight + epochPeriod;
    }
}
