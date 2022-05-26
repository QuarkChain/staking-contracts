// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract W3qERC20 is ERC20Pausable, Ownable {
    uint256 public constant PER_EPOCH_REWARD = 1e20;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
    }

    function perEpochReward() public pure returns (uint256) {
        return PER_EPOCH_REWARD;
    }
}
