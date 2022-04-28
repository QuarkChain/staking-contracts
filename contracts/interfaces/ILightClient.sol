pragma solidity ^0.8.0;

interface ILightClient {
    function initEpoch(
        address[] memory _epochSigners,
        uint256[] memory _epochVotingPowers,
        uint256 height,
        bytes32 headHash
    ) external;

    function submitHead(bytes memory _epochHeaderBytes, bytes memory commitBytes) external;

    function getBlockHeight() external view returns (uint256);

    function setBlockHash(uint256 height, bytes32 hash) external returns (bytes32);

    function getBlockHash(uint256 height) external view returns (bytes32);

    function setBlockRoot(uint256 height, bytes32 hash) external returns (bytes32);

    function getBlockRoot(uint256 height) external view returns (bytes32);

    function setTxRoot(uint256 height, bytes32 hash) external returns (bytes32);

    function getTxRoot(uint256 height) external view returns (bytes32);

    function setReceiptRoot(uint256 height, bytes32 hash) external returns (bytes32);

    function getReceiptRoot(uint256 height) external view returns (bytes32);

    function getCurrentEpoch()
        external
        view
        returns (
            uint256,
            address[] memory,
            uint256[] memory
        );

    function curEpochVals() external view returns (address[] memory);

    function curVotingPowers() external view returns (uint64[] memory);

    function epochIdx() external view returns (uint256);

    function curEpochHeight() external view returns (uint256 height);

    function getNextEpochHeight() external view returns (uint256 height);

    function setEpochPeriod(uint256 _epochPeriod) external;

    function epochPeriod() external view returns (uint256 height);

    function staking() external view returns (address);

    function proposalValidators() external view returns (address[] memory, uint256[] memory);
}
