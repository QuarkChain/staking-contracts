// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

interface ILightClient {
    struct Epoch {
        address[] curEpochVals;
        uint256[] curVotingPowers;
    }

    function initEpoch(
        address[] memory epochSigners,
        uint256[] memory epochVotingPowers,
        uint256 height,
        bytes32 headHash
    ) external;

    function submitHead(
        uint256,
        bytes memory _epochHeaderBytes,
        bytes memory commitBytes
    ) external;

    /* LightClient */
    function getCurrentEpoch()
        external
        view
        returns (
            uint256,
            address[] memory,
            uint256[] memory
        );

    function curEpochIdx() external view returns (uint256);

    function curEpochHeight() external view returns (uint256 height);

    function getNextEpochHeight() external view returns (uint256 height);

    function setEpochPeriod(uint256 _epochPeriod) external;

    function epochPeriod() external view returns (uint256 height);

    function getStaking() external view returns (address);

    function proposedValidators() external view returns (address[] memory, uint256[] memory);

    function getEpochIdx(uint256 height) external view returns (uint256);

    function checkHeightRange(uint256 height) external view returns (bool);

    function minEpochIdx() external view returns (uint256);

    function heightRange() external view returns (uint256 min, uint256 max);
}
