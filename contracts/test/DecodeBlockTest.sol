// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import "../lib/BlockDecoder.sol";

contract BlockDecoderTest {
    using BlockDecoder for bytes;
    using RLPReader for bytes;

    function DecodeHeaderTest(bytes memory rlpbytes) public pure returns (BlockDecoder.Header memory) {
        return BlockDecoder.decodeHeader(rlpbytes);
    }

    function DecodeHashDataTest(bytes memory rlpbytes) public pure returns (BlockDecoder.HashData memory) {
        return BlockDecoder.decodeHashData(rlpbytes.decodeToHeaderList());
    }

    function DecodeBaseDataTest(bytes memory rlpbytes) public pure returns (BlockDecoder.BaseData memory) {
        return BlockDecoder.decodeBaseData(rlpbytes.decodeToHeaderList());
    }

    function DecodeValidatorDataTest(bytes memory rlpbytes) public pure returns (BlockDecoder.ValidatorData memory) {
        return BlockDecoder.decodeValidatorData(rlpbytes.decodeToHeaderList());
    }

    function DecodeNextValidatorsTest(bytes memory rlpbytes) public pure returns (address[] memory) {
        return BlockDecoder.decodeNextValidators(rlpbytes);
    }

    function DecodeCommitTest(bytes memory commitRLPbytes) public pure returns (BlockDecoder.Commit memory) {
        return BlockDecoder.decodeCommit(commitRLPbytes.toRlpItem());
    }

    function RecoverSignatureTest(bytes calldata signMsg, bytes calldata sig) public pure returns (address) {
        return BlockDecoder.recoverSignature(signMsg, sig);
    }

    function verifySignatureTest(
        address addr,
        bytes calldata signMsg,
        bytes calldata sig
    ) public pure returns (bool) {
        return BlockDecoder.verifySignature(addr, signMsg, sig);
    }

    function verifyAllSignatureTest(
        BlockDecoder.Commit memory commit,
        address[] memory validators,
        uint256[] memory votePowers,
        bool lookUpByIndex,
        bool countAllSignatures,
        uint256 votingPowerNeeded,
        uint256 chainId
    ) public pure returns (bool) {
        return
            BlockDecoder.verifyAllSignature(
                commit,
                validators,
                votePowers,
                lookUpByIndex,
                countAllSignatures,
                votingPowerNeeded,
                chainId
            );
    }

    function verifyHeaderTest(
        bytes memory headerRlpBytes,
        bytes memory commitRlpBytes,
        address[] memory validators,
        uint256[] memory votePowers
    )
        public
        pure
        returns (
            uint256,
            bytes32,
            BlockDecoder.HeadCore memory
        )
    {
        return BlockDecoder.verifyHeader(headerRlpBytes, commitRlpBytes, validators, votePowers,false);
    }

    function voteSignBytesTest(
        BlockDecoder.Commit memory commit,
        uint256 chainId,
        uint256 idx
    ) public pure returns (bytes memory) {
        return BlockDecoder.voteSignBytes(commit, chainId, idx);
    }

    function encodeToRlpBytesTest(BlockDecoder.voteForSign memory vfs) public pure returns (bytes memory) {
        return BlockDecoder.encodeToRlpBytes(vfs);
    }

    function decodeRlpTest(bytes memory rlp) public pure returns (bytes[] memory) {
        return BlockDecoder.decodeRlp(rlp);
    }

    function HashTest(bytes memory signMsg) public pure returns (bytes32) {
        return BlockDecoder.msgHash(signMsg);
    }
}
