pragma solidity ^0.8.0;

interface ILightClient {
    function initEpoch(
        address[] memory _epochSigners,
        uint256[] memory _epochVotingPowers,
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

    function epochIdx() external view returns (uint256);

    function curEpochHeight() external view returns (uint256 height);

    function getNextEpochHeight() external view returns (uint256 height);

    function setEpochPeriod(uint256 _epochPeriod) external;

    function epochPeriod() external view returns (uint256 height);

    function getStaking() external view returns (address);

    function proposedValidators() external view returns (address[] memory, uint256[] memory);
}