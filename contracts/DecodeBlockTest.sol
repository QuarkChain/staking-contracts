pragma solidity ^0.8.0;

import "./DecodeBlock.sol";

contract DecodeBlockTest {
    using DecodeBlock for bytes;

    function DecodeHeaderTest(bytes memory rlpbytes) public pure returns (DecodeBlock.Header memory) {
        return DecodeBlock.decodeHeader(rlpbytes);
    }

    function DecodeHashDataTest(bytes memory rlpbytes) public pure returns (DecodeBlock.HashData memory) {
        return DecodeBlock.decodeHashData(rlpbytes.decodeToHeaderList());
    }

    function DecodeBaseDataTest(bytes memory rlpbytes) public pure returns (DecodeBlock.BaseData memory) {
        return DecodeBlock.decodeBaseData(rlpbytes.decodeToHeaderList());
    }

    function DecodeValidatorDataTest(bytes memory rlpbytes) public pure returns (DecodeBlock.ValidatorData memory) {
        return DecodeBlock.decodeValidatorData(rlpbytes.decodeToHeaderList());
    }

    function DecodeNextValidatorsTest(bytes memory rlpbytes) public pure returns (address[] memory) {
        return DecodeBlock.decodeNextValidators(rlpbytes);
    }

    function DecodeCommitTest(bytes memory rlpbytes) public pure returns (DecodeBlock.Commit memory) {
        return DecodeBlock.decodeCommit(rlpbytes.decodeToHeaderList());
    }
}
