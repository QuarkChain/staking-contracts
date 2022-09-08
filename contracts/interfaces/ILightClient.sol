// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

interface ILightClient {
    struct Proof {
        bytes rlpValue;
        bytes rlpParentNodes;
        bytes encodePath;
    }

    struct Epoch {
        address[] curEpochVals;
        uint256[] curVotingPowers;
    }

    /**
     * @notice Initialize the epochIdx ,validators and votingPowers of the first epoch. And default value of epochIdx is 1, the default value of height is 0 .
     */
    function initEpoch(
        address[] memory epochSigners,
        uint256[] memory epochVotingPowers,
        uint256 height,
        bytes32 headHash
    ) external;

    /**
     * @notice Submit epoch head and common head.
     */
    function submitHeader(
        uint256,
        bytes memory _epochHeaderBytes,
        bytes memory commitBytes,
        bool lookByIndex
    ) external;

    /**
     * @notice Get the eurEpochIdx , validators and votingPowers of the current epoch
     */
    function getCurrentEpoch()
        external
        view
        returns (
            uint256,
            address[] memory,
            uint256[] memory
        );

    /**
     * @notice Get the highest epoch, whose blocks can be verified, i.e., blocks in [(idx - 1) * epochPeriod + 1, idx * epochPeroid]
     */
    function curEpochIdx() external view returns (uint256);

    /**
     * @notice Get the height of the block that set the validators of the current epoch, which is the highest block of the previous epoch.
     */
    function curEpochHeight() external view returns (uint256 height);

    /**
     * @notice Get the height of the block that set the validators of the next epoch, which is the highest block of the current epoch.
     */
    function getNextEpochHeight() external view returns (uint256 height);

    /**
     * @notice Set the value of epoch period
     */
    function setEpochPeriod(uint256 _epochPeriod) external;

    /**
     * @notice Number of blocks in each epoch.
     */
    function epochPeriod() external view returns (uint256 height);

    /**
     * @notice Get address of staking contract
     */
    function getStaking() external view returns (address);

    /**
     * @notice Get proposed validators which depends on the number of tokens staked in the staking contract by the validator.
     */
    function proposedValidators() external view returns (address[] memory, uint256[] memory);

    /**
     * @notice Get available epoch index by block height
     */
    function getEpochIdx(uint256 height) external view returns (uint256);

    /**
     * @notice Check whether the block of the height can be accepted or not
     */
    function isInHeightRange(uint256 height) external view returns (bool);

    /**
     * @notice Get the smallest epoch whose blocks can be verified by the contract.
     */
    function minEpochIdx() external view returns (uint256);

    /**
     * @notice Get verifiable block height range
     */
    function heightRange() external view returns (uint256 min, uint256 max);

    /**
     * @notice Prove whether a transaction is in the block
     */
    function proveTx(uint256 height, Proof memory proof) external view returns (bool);

    /**
     * @notice Prove whether a receipt is in the block
     */
    function proveReceipt(uint256 height, Proof memory proof) external view returns (bool);

    /**
     * @notice The latest block that has been committed to the contract
     */
    function latestBlockHeight() external view returns (uint256);

    /**
     * @notice Return the hash of the block header
     */
    function headHashes(uint256 height) external view returns (bytes32);

    /**
     * @notice Return the block's transaction tree root
     */
    function getTxRoot(uint256 height) external view returns (bytes32);

    /**
     * @notice Return the block's receipt tree root
     */
    function getReceiptRoot(uint256 height) external view returns (bytes32);

    /**
     * @notice Return the block's state tree root
     */
    function getStateRoot(uint256 height) external view returns (bytes32);

    /**
     * @notice Check the block exists or not
     */
    function blockExist(uint256 height) external view returns (bool);
}
