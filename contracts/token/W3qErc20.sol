// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../LightClient.sol";

contract W3qERC20 is ERC20Pausable, Ownable {
    LightClient public prover;

    mapping(uint256 => bool) public burnNonceUsed;
    uint256 public constant PER_EPOCH_REWARD = 1e20;

    address public tokenOnWeb3q;

    event burnToken(address indexed owner, uint256 amount);
    event mintToken(uint256 indexed nonce, uint256 indexed logIdx, address indexed to, uint256 amount);

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address account, uint256 amount) public virtual onlyOwner {
        _mint(account, amount);
    }

    function perEpochReward() public pure returns (uint256) {
        return PER_EPOCH_REWARD;
    }

}
