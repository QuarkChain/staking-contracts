// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "./RLPReader.sol";

library DecodeBlock {
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for RLPReader.Iterator;
    using RLPReader for bytes;

    struct Header {
        bytes Bloom; //[256]byte
        HashData hashData;
        BaseData baseData;
        ValidatorData validatorData;
        Commit commit;
    }

    struct HashData {
        bytes32 ParentHash;
        bytes32 UncleHash;
        address Coinbase;
        bytes32 Root;
        bytes32 TxHash;
        bytes32 ReceiptHash;
    }

    struct BaseData {
        uint256 Difficulty;
        uint256 Number;
        uint64 GasLimit;
        uint64 GasUsed;
        uint64 Time;
        bytes Extra;
        bytes32 MixDigest;
        bytes8 Nonce;
        uint256 BaseFee;
    }

    struct ValidatorData {
        uint64 TimeMs;
        address[] NextValidators;
        uint64[] NextValidatorPowers;
        bytes32 LastCommitHash;
    }

    struct Commit {
        uint64 Height;
        uint32 Round;
        bytes32 BlockID;
        CommitSig[] Signatures;
    }

    struct CommitSig {
        bytes1 BlockIDFlag;
        address ValidatorAddress;
        uint64 TimestampMs;
        bytes Signature;
    }

    enum HeaderProperty {
        ParentHash,
        UncleHash,
        Coinbase,
        Root,
        TxHash,
        ReceiptHash,
        Bloom, //[256]byte
        Difficulty,
        Number,
        GasLimit,
        GasUsed,
        Time,
        Extra,
        MixDigest,
        Nonce,
        BaseFee,
        TimeMs,
        NextValidators,
        NextValidatorPowers,
        LastCommitHash,
        Commit
    }

    function decodeHeader(bytes memory blockRlpBytes) internal pure returns (Header memory header) {
        // TODO:decode bloom

        RLPReader.RLPItem[] memory list = decodeToHeaderList(blockRlpBytes);
        header.hashData = decodeHashData(list);
        header.baseData = decodeBaseData(list);
        header.validatorData = decodeValidatorData(list);
        header.commit = decodeCommit(list);
    }

    function decodeToHeaderList(bytes memory blockRlpBytes) internal pure returns (RLPReader.RLPItem[] memory) {
        return blockRlpBytes.toRlpItem().toList()[0].toList();
    }

    function decodeHashData(RLPReader.RLPItem[] memory list) internal pure returns (HashData memory Hashs) {
        Hashs.ParentHash = bytes32(list[uint8(HeaderProperty.ParentHash)].toUint());
        Hashs.UncleHash = bytes32(list[uint8(HeaderProperty.UncleHash)].toUint());
        Hashs.Coinbase = list[uint8(HeaderProperty.Coinbase)].toAddress();

        Hashs.Root = bytes32(list[uint8(HeaderProperty.Root)].toUint());
        Hashs.TxHash = bytes32(list[uint8(HeaderProperty.TxHash)].toUint());
        Hashs.ReceiptHash = bytes32(list[uint8(HeaderProperty.ReceiptHash)].toUint());
    }

    function decodeBaseData(RLPReader.RLPItem[] memory list) internal pure returns (BaseData memory Bases) {
        Bases.Difficulty = list[uint8(HeaderProperty.Difficulty)].toUint();
        Bases.Number = list[uint8(HeaderProperty.Number)].toUint();
        Bases.GasLimit = uint64(list[uint8(HeaderProperty.GasLimit)].toUint());

        Bases.GasUsed = uint64(list[uint8(HeaderProperty.GasUsed)].toUint());
        Bases.Time = uint64(list[uint8(HeaderProperty.Time)].toUint());
        Bases.Extra = list[uint8(HeaderProperty.Extra)].toBytes();

        Bases.MixDigest = bytes32(list[uint8(HeaderProperty.MixDigest)].toUint());
        Bases.Nonce = bytes8(uint64(list[uint8(HeaderProperty.Nonce)].toUint()));
        Bases.BaseFee = list[uint8(HeaderProperty.BaseFee)].toUint();
    }

    function decodeValidatorData(RLPReader.RLPItem[] memory list) internal pure returns (ValidatorData memory VData) {
        VData.TimeMs = uint64(list[uint8(HeaderProperty.TimeMs)].toUint());
        VData.NextValidators = _decodeNextValidators(list[uint8(HeaderProperty.NextValidators)]);
        VData.NextValidatorPowers = _decodeNextValidatorPowers(list[uint8(HeaderProperty.NextValidatorPowers)]);

        VData.LastCommitHash = bytes32(list[uint8(HeaderProperty.LastCommitHash)].toUint());
    }

    function decodeCommit(RLPReader.RLPItem[] memory properties) internal pure returns (Commit memory commit) {
        RLPReader.RLPItem[] memory list = property(properties, uint8(HeaderProperty.Commit)).toList();
        commit.Height = uint64(property(list, 0).toUint());
        commit.Round = uint32(property(list, 1).toUint());
        commit.BlockID = bytes32(property(list, 2).toUint());

        // TODO: decode commit.Signatures
    }

    function decodeNextValidators(bytes memory blockRlpBytes) internal pure returns (address[] memory) {
        RLPReader.RLPItem[] memory list = blockRlpBytes.toRlpItem().toList()[0].toList();
        return _decodeNextValidators(list[uint8(HeaderProperty.NextValidators)]);
    }

    function decodeNextValidatorPowers(bytes memory blockRlpBytes) internal pure returns (uint64[] memory array) {
        RLPReader.RLPItem[] memory list = blockRlpBytes.toRlpItem().toList()[0].toList();

        RLPReader.RLPItem memory _NextValidatorPowers = list[uint8(HeaderProperty.NextValidatorPowers)];

        array = _decodeNextValidatorPowers(_NextValidatorPowers);
    }

    function property(RLPReader.RLPItem[] memory list, uint8 index) internal pure returns (RLPReader.RLPItem memory) {
        return list[index];
    }

    function _decodeNextValidators(RLPReader.RLPItem memory item) private pure returns (address[] memory array) {
        array = item.toAddressArray();
    }

    function _decodeNextValidatorPowers(RLPReader.RLPItem memory item) private pure returns (uint64[] memory array) {
        array = item.toUint64Array();
    }
}
