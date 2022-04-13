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

    enum HeaderPropertyIndex {
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

        RLPReader.RLPItem[] memory HeaderProperties = decodeToHeaderList(blockRlpBytes);
        header.hashData = decodeHashData(HeaderProperties);
        header.baseData = decodeBaseData(HeaderProperties);
        header.validatorData = decodeValidatorData(HeaderProperties);
        header.commit = decodeCommit(HeaderProperties);
    }

    function decodeToHeaderList(bytes memory blockRlpBytes) internal pure returns (RLPReader.RLPItem[] memory) {
        return blockRlpBytes.toRlpItem().toList()[0].toList();
    }

    function decodeHashData(RLPReader.RLPItem[] memory HeaderProperties) internal pure returns (HashData memory Hashs) {
        Hashs.ParentHash = bytes32(HeaderProperties[uint8(HeaderPropertyIndex.ParentHash)].toUint());
        Hashs.UncleHash = bytes32(HeaderProperties[uint8(HeaderPropertyIndex.UncleHash)].toUint());
        Hashs.Coinbase = HeaderProperties[uint8(HeaderPropertyIndex.Coinbase)].toAddress();

        Hashs.Root = bytes32(HeaderProperties[uint8(HeaderPropertyIndex.Root)].toUint());
        Hashs.TxHash = bytes32(HeaderProperties[uint8(HeaderPropertyIndex.TxHash)].toUint());
        Hashs.ReceiptHash = bytes32(HeaderProperties[uint8(HeaderPropertyIndex.ReceiptHash)].toUint());
    }

    function decodeBaseData(RLPReader.RLPItem[] memory HeaderProperties) internal pure returns (BaseData memory Bases) {
        Bases.Difficulty = HeaderProperties[uint8(HeaderPropertyIndex.Difficulty)].toUint();
        Bases.Number = HeaderProperties[uint8(HeaderPropertyIndex.Number)].toUint();
        Bases.GasLimit = uint64(HeaderProperties[uint8(HeaderPropertyIndex.GasLimit)].toUint());

        Bases.GasUsed = uint64(HeaderProperties[uint8(HeaderPropertyIndex.GasUsed)].toUint());
        Bases.Time = uint64(HeaderProperties[uint8(HeaderPropertyIndex.Time)].toUint());
        Bases.Extra = HeaderProperties[uint8(HeaderPropertyIndex.Extra)].toBytes();

        Bases.MixDigest = bytes32(HeaderProperties[uint8(HeaderPropertyIndex.MixDigest)].toUint());
        Bases.Nonce = bytes8(uint64(HeaderProperties[uint8(HeaderPropertyIndex.Nonce)].toUint()));
        Bases.BaseFee = HeaderProperties[uint8(HeaderPropertyIndex.BaseFee)].toUint();
    }

    function decodeValidatorData(RLPReader.RLPItem[] memory HeaderProperties)
        internal
        pure
        returns (ValidatorData memory VData)
    {
        VData.TimeMs = uint64(HeaderProperties[uint8(HeaderPropertyIndex.TimeMs)].toUint());
        VData.NextValidators = _decodeNextValidators(HeaderProperties[uint8(HeaderPropertyIndex.NextValidators)]);
        VData.NextValidatorPowers = _decodeNextValidatorPowers(
            HeaderProperties[uint8(HeaderPropertyIndex.NextValidatorPowers)]
        );

        VData.LastCommitHash = bytes32(HeaderProperties[uint8(HeaderPropertyIndex.LastCommitHash)].toUint());
    }

    function decodeCommit(RLPReader.RLPItem[] memory HeaderProperties) internal pure returns (Commit memory commit) {
        RLPReader.RLPItem[] memory list = Property(HeaderProperties, uint8(HeaderPropertyIndex.Commit)).toList();
        commit.Height = uint64(Property(list, 0).toUint());
        commit.Round = uint32(Property(list, 1).toUint());
        commit.BlockID = bytes32(Property(list, 2).toUint());

        // TODO: decode commit.Signatures
    }

    function decodeNextValidators(bytes memory blockRlpBytes) internal pure returns (address[] memory) {
        RLPReader.RLPItem[] memory HeaderProperties = blockRlpBytes.toRlpItem().toList()[0].toList();
        return _decodeNextValidators(HeaderProperties[uint8(HeaderPropertyIndex.NextValidators)]);
    }

    function decodeNextValidatorPowers(bytes memory blockRlpBytes) internal pure returns (uint64[] memory array) {
        RLPReader.RLPItem[] memory HeaderProperties = blockRlpBytes.toRlpItem().toList()[0].toList();

        RLPReader.RLPItem memory _NextValidatorPowers = HeaderProperties[
            uint8(HeaderPropertyIndex.NextValidatorPowers)
        ];

        array = _decodeNextValidatorPowers(_NextValidatorPowers);
    }

    function Property(RLPReader.RLPItem[] memory list, uint8 index) internal pure returns (RLPReader.RLPItem memory) {
        return list[uint8(index)];
    }

    function _decodeNextValidators(RLPReader.RLPItem memory item) private pure returns (address[] memory array) {
        array = item.toAddressArray();
    }

    function _decodeNextValidatorPowers(RLPReader.RLPItem memory item) private pure returns (uint64[] memory array) {
        array = item.toUint64Array();
    }
}
