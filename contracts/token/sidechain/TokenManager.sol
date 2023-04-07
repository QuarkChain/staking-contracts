// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

contract TokenManager {
    address public constant tokenMiner = 0x0000000000000000000000000000000000033322;
    address public constant tokenBurner = 0x0000000000000000000000000000000000033323;
    error burnTokenRevert();
    error mintTokenRevert();

    function _mint(address to,uint256 amount) internal virtual {
        (bool succeed, ) = tokenMiner.call(abi.encode( to, amount));
        if (!succeed) revert mintTokenRevert();
    }

    function _burn(address to,uint256 amount) internal virtual {
        (bool succeed, ) = tokenBurner.call(abi.encode(to, amount));
        if (!succeed) revert burnTokenRevert();
    }
}
 