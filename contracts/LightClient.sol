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
        _createEpochValidators(1, _height, _epochSigners, _epochVotingPowers);
    }

    /**
     * Create validator set for an epoch
     */
    function submitHead(
        bytes memory _epochHeaderBytes,
        bytes memory commitBytes,
        bool lookByIndex
    ) public virtual override {
        //1. verify epoch header
        uint256 position = _epochPosition(curEpochIdx);
        (uint256 height, , ) = BlockDecoder.verifyHeader(
            _epochHeaderBytes,
            commitBytes,
            epochs[position].curEpochVals,
            epochs[position].curVotingPowers,
            lookByIndex
        );

        address[] memory vals = _epochHeaderBytes.decodeNextValidators();
        uint256[] memory powers = _epochHeaderBytes.decodeNextValidatorPowers();
        require(
            vals.length > 0 && powers.length > 0,
            "both NextValidators and NextValidatorPowers should not be empty"
        );

        require(curEpochHeight + epochPeriod == height, "incorrect height");
        _createEpochValidators(curEpochIdx + 1, height, vals, powers);
    }

    /**
     * Create validator set for an epoch
     * @param _epochIdx the index of epoch to propose validators
     */
    function _createEpochValidators(
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
}
