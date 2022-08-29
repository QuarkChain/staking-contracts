// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

contract W3qNative {
    uint256 public constant blockConfirms = 10;
    address public constant crossChainCallContract = 0x0000000000000000000000000000000000033303;
    address public constant systemOptIn = 0x0000000000000000000000000000000000033304;
    // address public constant owner = ;
    address public w3qErc20Addr;
    mapping(bytes32 => mapping(uint256 => bool)) public burnLogUsed;

    uint256 public burnNonce;

    event mintNativeToken(bytes32 indexed txHash, uint256 indexed logIdx, address indexed to, uint256 amount);
    event burnNativeToken(uint256 indexed nonce, address indexed to, uint256 amount);

    function setW3qErc20Addr(address addr) public {
        w3qErc20Addr = addr;
    }

    function getEthereumLog(
        uint256 chainId,
        bytes32 txHash,
        uint256 logIdx,
        uint256 maxDataLen,
        uint256 confirms
    )
        public
        returns (
            address,
            bytes32[] memory,
            bytes memory
        )
    {
        bytes memory payload = abi.encodeWithSignature(
            "getLogByTxHash(uint256,bytes32,uint256,uint256,uint256)",
            chainId,
            txHash,
            logIdx,
            maxDataLen,
            confirms
        );
        (bool succeed, bytes memory res) = crossChainCallContract.call(payload);
        if (!succeed) {
            string memory errMsg = abi.decode(res, (string));
            revert(errMsg);
        }

        (address c, bytes32[] memory topics, bytes memory data) = abi.decode(res, (address, bytes32[], bytes));
        return (c, topics, data);
    }

    function mintNative(bytes32 txHash, uint256 logIdx) public {
        require(!burnLogUsed[txHash][logIdx], "the burn log has been used");
        burnLogUsed[txHash][logIdx] = true;
        (address c, bytes32[] memory topics, bytes memory data) = getEthereumLog(4, txHash, logIdx, 32, blockConfirms);
        require(c == w3qErc20Addr, "contract addr no match");

        address to = address(uint160(uint256(topics[1])));
        uint256 amount = abi.decode(data, (uint256));

        (bool succeed, ) = systemOptIn.call(abi.encodeWithSignature("mintNative(address,uint256)", to, amount));
        require(succeed, "mint native token error");
        emit mintNativeToken(txHash, logIdx, to, amount);
    }

    function burnNative() public payable {
        (bool succeed, ) = systemOptIn.call(abi.encodeWithSignature("burnNative(uint256)", msg.value));
        require(succeed, "burn native token error");
        emit burnNativeToken(burnNonce, msg.sender, msg.value);
    }
}
