// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../lib/ReceiptDecoder.sol";
import "../LightClient.sol";
import "./W3qERC20.sol";

contract EthBridge is W3qERC20, ReentrancyGuard {
    using ReceiptDecoder for bytes;
    LightClient public prover;

    mapping(uint256 => bool) public burnNonceUsed;

    address public constant tokenOnWeb3q = 0x0000000000000000000000000000000003330002;

    event SendToken(address indexed owner, uint256 amount);
    event ReveiveToken(uint256 indexed nonce, uint256 indexed logIdx, address indexed to, uint256 amount);

    constructor(string memory name, string memory symbol) W3qERC20(name, symbol) {}

    function sendToWeb3q(address account, uint256 amount) public {
        // _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
        emit SendToken(account, amount);
    }

    function setProver(LightClient addr) public onlyOwner {
        prover = addr;
    }

    function receiveFromWeb3q(
        uint256 height,
        ILightClient.Proof memory proof,
        uint256 logIdx
    ) public nonReentrant {
        require(prover.proveReceipt(height, proof), "invalid receipt");
        ReceiptDecoder.Receipt memory receipt = proof.value.decodeReceipt();
        // verify contract addr on origin chain
        require(receipt.logs[logIdx].addr == tokenOnWeb3q, "addr no match");
        // verify nonce
        uint256 nonce = uint256(receipt.logs[logIdx].topics[1]);
        // TODO: use a bitmap to optimize store gas
        require(!burnNonceUsed[nonce], "the burn nonce has been used");
        burnNonceUsed[nonce] = true;
        // mint token
        address to = address(uint160(uint256(receipt.logs[logIdx].topics[2])));
        uint256 amount = abi.decode(receipt.logs[logIdx].data, (uint256));
        _mint(to, amount);

        emit ReveiveToken(nonce, logIdx, to, amount);
    }

    function batchReceive(
        uint256 height,
        ILightClient.Proof[] memory proofs,
        uint256[] memory logIdxs
    ) public {
        for (uint256 i = 0; i < proofs.length; i++) {
            receiveFromWeb3q(height, proofs[i], logIdxs[i]);
        }
    }

    function submitHeaderAndBatchReceive(
        uint256 height,
        bytes memory headBytes,
        bytes memory commitBytes,
        bool lookByIndex,
        ILightClient.Proof[] memory proofs,
        uint256[] memory logIdxs
    ) public {
        prover.submitHeader(height, headBytes, commitBytes, lookByIndex);
        batchReceive(height, proofs, logIdxs);
    }
}
