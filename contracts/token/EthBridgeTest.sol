// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import "./EthBridge.sol";

contract EthBridgeTest is EthBridge {
    constructor(string memory name, string memory symbol) EthBridge(name, symbol) {}

    function mint(address account, uint256 amount) public virtual override {
        _mint(account, amount);
    }
}
