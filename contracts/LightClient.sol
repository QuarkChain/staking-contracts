// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import "./lib/BlockDecoder.sol";
import "./interfaces/IW3qERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IStaking.sol";
import "./interfaces/ILightClient.sol";
import {DataTypes as dt} from "./lib/DataTypes.sol";

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
    IW3qERC20 public w3qErc20;

    constructor(
        uint256 _epochPeriod,
        address _staking,
        address _w3qErc20
    ) {
        epochPeriod = _epochPeriod;
        staking = IStaking(_staking);
        w3qErc20 = IW3qERC20(_w3qErc20);
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
     * Submit epoch head
     */
    function submitHead(
        uint256,
        bytes memory _epochHeaderBytes,
        bytes memory commitBytes
    ) public virtual override {
        //1. verify epoch header
        uint256 position = _epochPosition(curEpochIdx);
        (uint256 height, , ) = BlockDecoder.verifyHeader(
            _epochHeaderBytes,
            commitBytes,
            epochs[position].curEpochVals,
            epochs[position].curVotingPowers
        );

        address[] memory vals = _epochHeaderBytes.decodeNextValidators();
        uint256[] memory powers = _epochHeaderBytes.decodeNextValidatorPowers();
        require(
            vals.length > 0 && powers.length > 0,
            "both NextValidators and NextValidatorPowers should not be empty"
        );

        require(curEpochHeight + epochPeriod == height, "incorrect height");
        _createEpochValidators(curEpochIdx + 1, height, vals, powers);
        _perEpochReward(epochs[position].curEpochVals, epochs[position].curVotingPowers);
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
        // TODO: add rewards to validators

        curEpochIdx = _epochIdx;
        curEpochHeight = _epochHeight;
        epochs[position].curEpochVals = _epochSigners;
        epochs[position].curVotingPowers = _epochVotingPowers;
    }

    function _perEpochReward(address[] memory rewardVals, uint256[] memory votePowers) internal {
        uint256 totalPower = totalVotePowers(votePowers);
        uint256 epochReward = w3qErc20.perEpochReward();

        // Calculate the amount of tokens to reward validator and delegators
        for (uint256 i = 0; i < rewardVals.length; i++) {
            address valAddr = rewardVals[i];

            uint256 valShares = staking.getValidatorShare(valAddr);
            address[] memory delAddrs = staking.getDelegatorAddrs(valAddr);

            uint256 totalRewardAmount = (epochReward * votePowers[i]) / totalPower;
            uint256 valRewardAmount = totalRewardAmount;

            for (uint256 j = 0; j < delAddrs.length; j++) {
                address delAddr = delAddrs[j];
                uint256 delShare = staking.getDelegatorShare(valAddr, delAddr);
                uint256 delRewardAmount = (totalRewardAmount * delShare) / valShares;

                // reward delegator
                w3qErc20.mint(delAddr, delRewardAmount);
                valRewardAmount -= delRewardAmount;
            }

            // reward validator
            w3qErc20.mint(valAddr, valRewardAmount);
        }
    }

    function totalVotePowers(uint256[] memory votePowers) internal pure returns (uint256 sum) {
        for (uint256 i = 0; i < votePowers.length; i++) {
            sum += votePowers[i];
        }
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
        uint256 _epochPeriod = epochPeriod;
        uint256 _tmp = curEpochHeight + _epochPeriod;
        require(height <= _tmp, "height too high");
        uint256 _distance = (_tmp - height) / _epochPeriod;
        require(_distance < TOTAL_EPOCH, "out of height range");
        return curEpochIdx - _distance;
    }

    function checkHeightRange(uint256 height) public view override returns (bool) {
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
        // when the curEpochHeight is 10000 and TOTAL_EPOCH = 2,
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
        uint256 _curEpochHeight = curEpochHeight;
        uint256 _epochPeriod = epochPeriod;

        return _curEpochHeight + _epochPeriod;
    }
}
