pragma solidity ^0.8.0;

//0x0000000000000000000000000000000000033301
//
//0x0000000000000000000000000000000003330002
contract deployer {
    address public constant systemDeployer = 0x0000000000000000000000000000000000033301;

    string public errmsg;

    function deploySystem(address addr, address target) public returns (bool success, bytes memory result) {
        bytes memory data = abi.encode(target);
        (success, result) = addr.call(data);
        require(success, "failed to deploy");
    }

    function contractCodeSize(address addr) public view returns (uint256) {
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(addr)
        }
        return codeSize;
    }
}
