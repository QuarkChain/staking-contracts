// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import "../lib/BlockDecoder.sol";
import "../lib/RLPReader.sol";

contract BlockDecoderTest {
    using BlockDecoder for bytes;
    using RLPReader for bytes;
    using RLPReader for RLPReader.RLPItem;

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

    function DecodeExtraTest(bytes memory rlpbytes) public view returns (uint256[] memory, bool succeed) {
        return BlockDecoder.decodeExtra(rlpbytes);
    }

    function DecodeRLPExtraTest(bytes memory rlpbytes) public pure returns (bytes memory) {
        return decodeRLPExtra(rlpbytes);
    }

    function decodeRLPExtra(bytes memory headerRLPBytes) internal pure returns (bytes memory) {
        RLPReader.RLPItem[] memory list = BlockDecoder.decodeToHeaderList(headerRLPBytes);
        RLPReader.RLPItem memory item = list[uint8(BlockDecoder.HeaderProperty.Extra)];
        bytes memory res = item.toRlpBytes();
        return res;
    }

    function CutExtraPrefixTest(bytes memory extra) public view returns (bytes memory, bool) {
        return BlockDecoder.cutExtraPrefix(extra);
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
        uint256[] memory votePowers,
        uint256 _chainId
    )
        public
        pure
        returns (
            uint256,
            bytes32,
            BlockDecoder.HeadCore memory
        )
    {
        return BlockDecoder.verifyHeader(headerRlpBytes, commitRlpBytes, validators, votePowers, false, _chainId);
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
