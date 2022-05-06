pragma solidity ^0.8.0;

import "../lib/BlockDecoder.sol";

interface IW3qProver {
    struct Proof {
        bytes rlpValue;
        bytes rlpParentNodes;
        bytes encodePath;
    }

    /* Prover */
    function submitHead(
        uint256 height,
        bytes memory epochHeaderBytes,
        bytes memory commitBytes
    ) external;

    function proveTx(uint256 height, Proof memory proof) external view returns (bool);

    function proveReceipt(uint256 height, Proof memory proof) external view returns (bool);

    function latestBlockHeight() external view returns (uint256);

    function headHashes(uint256 height) external view returns (bytes32);

    function getTxRoot(uint256 height) external view returns (bytes32);

    function getReceiptRoot(uint256 height) external view returns (bytes32);

    function getStateRoot(uint256 height) external view returns (bytes32);

    function blockExist(uint256 height) external view returns (bool);
}
