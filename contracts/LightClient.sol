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
    address[] public curEpochVals;
    uint256[] public curVotingPowers;
    uint256 public override epochIdx;

    uint256 public override curEpochHeight;
    uint256 public override epochPeriod;

    IStaking public staking;

    constructor(uint256 _epochPeriod, address _staking) {
        epochPeriod = _epochPeriod;
        staking = IStaking(_staking);
    }

    function initEpoch(
        address[] memory _epochSigners,
        uint256[] memory _epochVotingPowers,
        uint256 height,
        bytes32
    ) public virtual override onlyOwner {
        curEpochHeight = height;
        _createEpochValidators(1, _epochSigners, _epochVotingPowers);
    }

    /**
     * Create validator set for an epoch
     */
    function submitHead(
        uint256,
        bytes memory _epochHeaderBytes,
        bytes memory commitBytes
    ) public virtual override {
        //1. verify epoch header
        (uint256 height, , ) = BlockDecoder.verifyHeader(_epochHeaderBytes, commitBytes, curEpochVals, curVotingPowers);

        require(curEpochHeight + epochPeriod == height, "incorrect height");
        curEpochHeight = height;

        address[] memory vals = _epochHeaderBytes.decodeNextValidators();
        uint256[] memory powers = _epochHeaderBytes.decodeNextValidatorPowers();
        require(
            vals.length > 0 && powers.length > 0,
            "both NextValidators and NextValidatorPowers should not be empty"
        );

        _createEpochValidators(epochIdx + 1, vals, powers);
    }

    /**
     * Create validator set for an epoch
     * @param _epochIdx the index of epoch to propose validators
     */
    function _createEpochValidators(
        uint256 _epochIdx,
        address[] memory _epochSigners,
        uint256[] memory _epochVotingPowers
    ) internal {
        require(_epochIdx > epochIdx, "epoch too old");

        // Check if the epoch validators are from proposed.
        // This means that the 2/3+ validators have accepted the proposed validators from the contract.
        require(_epochSigners.length == _epochVotingPowers.length, "incorrect length");

        // TODO: add rewards to validators
        epochIdx = _epochIdx;
        curEpochVals = _epochSigners;
        curVotingPowers = _epochVotingPowers;
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
        return (epochIdx, curEpochVals, curVotingPowers);
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

    function proposalValidators() external view override returns (address[] memory, uint256[] memory) {
        return staking.proposalValidators();
    }
}
