pragma solidity ^0.8.0;

import "./W3qERC20.sol";

contract W3qERC20Test is W3qERC20 {
    constructor(string memory name, string memory symbol) W3qERC20(name, symbol) {}

    function mint(address account, uint256 amount) public virtual override {
        _mint(account, amount);
    }
}
