pragma solidity ^0.8.0;

contract CrossChainCall {
    address public constant sysCCC = 0x0000000000000000000000000000000000033321;

    function _doCall(
        uint256 chainId,
        bytes32 txHash,
        uint256 logIdx,
        uint256 maxDataLen,
        uint256 confirms
    )
        internal
        returns (
            bool,
            bytes memory
        )
    {
        bytes memory payload = abi.encode(
            chainId,
            txHash,
            logIdx,
            maxDataLen,
            confirms
        );

        return sysCCC.call(payload);
    }
}