// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "./sidechain/TokenManager.sol";
import "./sidechain/CrossChainCall.sol";

contract Web3qBridge is TokenManager, CrossChainCall {
    uint256 public constant blockConfirms = 10;
    
    // address public constant owner = ;
    address public w3qOnEthereum;
    mapping(bytes32 => mapping(uint256 => bool)) public burnlogConsumed;

    uint256 public burnNonce;

    event ReceiveToken(bytes32 indexed txHash, uint256 indexed logIdx, address indexed to, uint256 amount);
    event SendToken(uint256 indexed nonce, address indexed to, uint256 amount);

    function setW3qErc20Addr(address addr) public {
        w3qOnEthereum = addr;
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
        (bool succeed, bytes memory res) = _doCall(chainId,txHash,logIdx,maxDataLen,confirms);
        if (!succeed) {
            string memory errMsg = abi.decode(res, (string));
            revert(errMsg);
        }

        (address c, bytes32[] memory topics, bytes memory data) = abi.decode(res, (address, bytes32[], bytes));
        return (c, topics, data);
    }

    function receiveFromEth(bytes32 txHash, uint256 logIdx) public {
        require(!burnlogConsumed[txHash][logIdx], "the burn log has been used");
        burnlogConsumed[txHash][logIdx] = true;
        (address _w3qOnEthereum, bytes32[] memory topics, bytes memory data) = getEthereumLog(4, txHash, logIdx, 32, blockConfirms);
        require(_w3qOnEthereum == w3qOnEthereum, "contract addr no match");

        address to = address(uint160(uint256(topics[1])));
        uint256 amount = abi.decode(data, (uint256));

        _mint(to,amount);
        emit ReceiveToken(txHash, logIdx, to, amount);
    }

    function sendToEth()public payable {
        _burn(msg.sender,msg.value);
        burnNonce ++;
        
        emit SendToken(burnNonce, msg.sender, msg.value);

    }
}
