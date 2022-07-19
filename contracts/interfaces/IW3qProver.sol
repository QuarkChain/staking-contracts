pragma solidity ^0.8.0;

import "../lib/BlockDecoder.sol";

interface IW3qProver {
    struct Proof {
        bytes rlpValue;
        bytes rlpParentNodes;
        bytes encodePath;
    }

    /**
     * @notice submit epoch head and common head
     */
    function submitHead(
        uint256 height,
        bytes memory epochHeaderBytes,
        bytes memory commitBytes,
        bool lookByIndex
    ) external;

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
