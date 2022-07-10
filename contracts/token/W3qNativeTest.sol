// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "./W3qNative.sol";

contract W3qNativeTest is W3qNative{
    event mintNT(address to, uint256 amount);

     function mintNativeTest(address to,uint256 amount) public {
        bytes memory payload = abi.encodeWithSignature("mintNative(address,uint256)",to,amount);
        (bool succeed , ) = address(systemOptIn).call(payload);
        require(succeed,"mint native token error");
        emit mintNT(to,amount);
    }
    
    function balanceOf(address owner) public view returns(uint256){
        return owner.balance;
    }

}