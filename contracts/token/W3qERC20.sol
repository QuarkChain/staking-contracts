// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../LightClient.sol";

contract W3qERC20 is ERC20Pausable, Ownable {
    uint256 public PER_EPOCH_REWARD;

    event burnToken(address indexed owner, uint256 amount);
    event mintToken(uint256 indexed nonce, uint256 indexed logIdx, address indexed to, uint256 amount);

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        PER_EPOCH_REWARD = 1e20;
    }

    function mint(address account, uint256 amount) public virtual onlyOwner {
        _mint(account, amount);
    }

    function setPerEpochReward(uint256 amount) public onlyOwner{
        PER_EPOCH_REWARD = amount;
    }

    function perEpochReward() public view returns (uint256) {
        return PER_EPOCH_REWARD;
    }
}
