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

    function RecoverSignatureTest(bytes calldata signMsg, bytes calldata sig) public pure returns(address){
        return DecodeBlock.recoverSignature(signMsg, sig);
    }

    function verifySignatureTest(address addr , bytes calldata signMsg, bytes calldata sig) public pure returns(bool){
        return DecodeBlock.verifySignature(addr, signMsg, sig);
    }

    function verifyAllSignatureTest(DecodeBlock.Commit memory commit,address[] memory validators,uint64[] memory votePowers, bool lookUpByIndex, bool countAllSignatures,uint64 votingPowerNeeded) public pure returns(bool){
        return DecodeBlock.verifyAllSignature(commit,validators,votePowers,lookUpByIndex,countAllSignatures,votingPowerNeeded);
    }

    function voteSignBytesTest(DecodeBlock.Commit memory commit,string memory chainId,uint idx)public pure returns(bytes memory){
        return DecodeBlock.voteSignBytes(commit,chainId,idx);
    }

    function encodeToRlpBytesTest(DecodeBlock.voteForSign memory vfs) public pure returns(bytes memory){
        return DecodeBlock.encodeToRlpBytes(vfs);
    }

    function decodeRlpTest(bytes memory rlp)public pure returns(bytes[] memory){
        return DecodeBlock.decodeRlp(rlp);
    }

    function HashTest(bytes memory signMsg) public pure returns(bytes32){
        return DecodeBlock.msgHash(signMsg);
    }
}
