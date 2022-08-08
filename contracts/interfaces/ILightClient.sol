pragma solidity ^0.8.0;

interface ILightClient {
    struct Epoch {
        address[] curEpochVals;
        uint256[] curVotingPowers;
    }

    /**
     * @notice Initialize epoch data
     */
    function initEpoch(
        address[] memory epochSigners,
        uint256[] memory epochVotingPowers,
        uint256 height,
        bytes32 headHash
    ) external;

    /**
     * @notice Submit epoch head
     */
    function submitHead(
        uint256,
        bytes memory _epochHeaderBytes,
        bytes memory commitBytes,
        bool lookByIndex
    ) external;

    /**
     * @notice Get the validator, voting weight and block height of the current epoch
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
     * @notice Get the block height of current epoch
     */
    function curEpochHeight() external view returns (uint256 height);

    /**
     * @notice Get the block height of next epoch
     */
    function getNextEpochHeight() external view returns (uint256 height);

    /**
     * @notice set the value of epoch period
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
     * @notice Get proposed validators
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
     * @notice Get the smallest epoch index stored in the contract
     */
    function minEpochIdx() external view returns (uint256);

    /**
     * @notice Get valid block height range
     */
    function heightRange() external view returns (uint256 min, uint256 max);
}
