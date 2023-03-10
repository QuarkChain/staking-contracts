// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../lib/ReceiptDecoder.sol";
import "../LightClient.sol";

contract EthBridge is ERC20Pausable, Ownable {

    using ReceiptDecoder for bytes;
    LightClient public prover;

    mapping(uint256 => bool) public burnNonceUsed;
    uint256 public constant PER_EPOCH_REWARD = 1e20;

    address public constant tokenOnWeb3q = 0x0000000000000000000000000000000003330002;
    mapping (uint256 => bool) nonceUsed;


    event sendToken(address indexed owner, uint256 amount);
    event reveiveToken(uint256 indexed nonce, uint256 indexed logIdx, address indexed to, uint256 amount);

    constructor(string memory name, string memory symbol)ERC20(name, symbol) {
    }

    function mint(address account, uint256 amount) public virtual onlyOwner {
        _mint(account, amount);
    }

    function perEpochReward() public pure returns (uint256) {
        return PER_EPOCH_REWARD;
    }

    function sendToWeb3q(address account , uint256 amount) public{
        // _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
        emit sendToken(account, amount);
    }

    function setProver(LightClient addr)public {
        prover = addr;
    }


    function receiveFromWeb3q(uint256 height, ILightClient.Proof memory proof,uint256 logIdx) public {
        require(prover.proveReceipt(height,proof),"invalid receipt");
        ReceiptDecoder.Receipt memory receipt = proof.value.decodeReceipt();
        // verify contract addr on origin chain 
        require(receipt.logs[logIdx].addr == tokenOnWeb3q,"addr no match");
        //veridy nonce
        uint256 nonce = uint256(receipt.logs[logIdx].topics[1]);
        require(!burnNonceUsed[nonce],"the burn nonce has been used");
        burnNonceUsed[nonce] = true;
        //mint token 
        address to = address(uint160(uint256(receipt.logs[logIdx].topics[2])));
        uint256 amount = abi.decode(receipt.logs[logIdx].data,(uint256));
        _mint(to,amount);

        emit reveiveToken(nonce,logIdx,to,amount);
    }

    function batchReceive(uint256 height, ILightClient.Proof[] memory proofs,uint256[] memory logIdxs) public {
        for (uint256 i = 0; i < proofs.length ; i ++) {
           receiveFromWeb3q(height,proofs[i],logIdxs[i]);
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
        batchReceive(height,proofs,logIdxs);
    }

}
