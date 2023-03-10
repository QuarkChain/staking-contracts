// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "./Web3qBridge.sol";

contract Web3qBridgeTest is TokenManager {
    event mintNT(address to, uint256 amount);

    function mintNativeTest(address to, uint256 amount) public {
        _mint(to, amount);
        emit mintNT(to, amount);
    }

    function burnNativeTest(address to, uint256 amount) public {
        _mint(to, amount);
        emit mintNT(to, amount);
    }

    function balanceOf(address owner) public view returns (uint256) {
        return owner.balance;
    }
}
