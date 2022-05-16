// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
    constructor() ERC20("W3Q", "W3Q") {
        _mint(msg.sender, 100000000000000000000000);
    }
}