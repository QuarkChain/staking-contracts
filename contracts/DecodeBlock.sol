// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "./RLPReader.sol";
import "./RLPEncode.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

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
        uint8 BlockIDFlag;
        address ValidatorAddress;
        uint64 TimestampMs;
        bytes Signature;//[R || S || V]
    }

    struct voteForSign{
        SignedMsgType  Type;        
        uint64 Height;      
        uint32 Round;       
        bytes32 BlockID;
        uint64 TimestampMs;
        string ChainID;
    }

    uint8 constant BLOCK_FLAG_COMMIT = 2;

    enum SignedMsgType{
        UnknownType,
        // Votes
	    PrevoteType,
	    PrecommitType,
	    // Proposals
	    ProposalType
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

    function verifyHeader(Header memory h,address[] memory validators,uint64[] memory votePowers,uint64 votingPowerNeeded)internal pure returns(bool){
        // ToDo:verify header base data 
    
        // verify all signatures
        require(verifyAllSignature(h.commit,validators,votePowers,true,false,votingPowerNeeded),"failed to verify all signature");

        return true;
    }

    function verifyAllSignature(Commit memory commit,address[] memory validators,uint64[] memory votePowers, bool lookUpByIndex, bool countAllSignatures,uint64 votingPowerNeeded) internal pure returns(bool){
       require(votePowers.length == validators.length,"incorrect length");
       uint64 talliedVotingPower;
       uint256 idx;
       for (uint256 i = 0;i < commit.Signatures.length;i++){
            address vaddr = commit.Signatures[i].ValidatorAddress;

            if (lookUpByIndex) {
                require(vaddr == validators[i] , "no equal");
                idx = i;
		    }else{
                // ToDo:
            }

            bytes memory signMsg =  voteSignBytes(commit,"evm_3334",i);
            require(verifySignature(vaddr , signMsg , commit.Signatures[i].Signature),"failed to verify signature");

            talliedVotingPower += votePowers[idx];

            if (!countAllSignatures && talliedVotingPower > votingPowerNeeded) {
			    return true;
		    }
       }

       if(talliedVotingPower <= votingPowerNeeded){
           return false;
       }
       return true;
    }

    function verifySignature(address addr,bytes memory signMsg, bytes memory sig) internal pure returns(bool){
        bytes32 hash = msgHash(signMsg);
        address recAddr = ECDSA.recover(hash,sig);
        return (recAddr == addr);
    }

    function recoverSignature(bytes memory signMsg, bytes memory sig) internal pure returns(address){
        bytes32 hash = msgHash(signMsg);
        (uint8 v , bytes32 r,bytes32 s) = getVRS(sig);
        address recAddr = ecrecover(hash,v,r,s);
        return recAddr;
    }

    function getVRS(bytes memory sig)internal pure returns(uint8 v, bytes32 r,bytes32 s){
        require(sig.length == 65,"signature with wrong length");
        assembly{    
            v := mload(add(sig,0x41))
            r := mload(add(sig,0x20))
            s := mload(add(sig,0x40))
        }
        return (v,r,s);
    }
    function getVRSCalldata(bytes calldata sig)internal pure returns(uint8 v, bytes32 r,bytes32 s){
        require(sig.length == 65,"signature with wrong length");
        (v ,r, s) = (uint8(sig[64]),bytes32(sig[:32]),bytes32(sig[32:64]));
        return (v,r,s);
    }

    /*
    rlp decode and encode 
    */
    function decodeHeader(bytes memory blockRlpBytes) internal pure returns (Header memory header) {
        // TODO:decode bloom

        RLPReader.RLPItem[] memory list = decodeToHeaderList(blockRlpBytes);
        require(list.length == 21,"Incorrect number of header properties" );
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

        require(property(list, 3).isList(),"commit.Signatures should be list");
        RLPReader.RLPItem[] memory csList = property(list, 3).toList();
        commit.Signatures = new CommitSig[](csList.length);
        for (uint i=0;i<csList.length;i++){
            commit.Signatures[i] = decodeCommitSig(csList[i]);
        }
    }

    function decodeCommitSig(RLPReader.RLPItem memory csItem) internal pure returns (CommitSig memory cs) {
        require(csItem.isList(),"CommmitSig RLP item should be list");
        RLPReader.RLPItem[] memory list  = csItem.toList();
        cs.BlockIDFlag = uint8(property(list,0).toUint());
        cs.ValidatorAddress = property(list,1).toAddress();
        cs.TimestampMs = uint64(property(list,2).toUint());
        cs.Signature = property(list,3).toBytes();
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

    function decodeRlp(bytes memory rlp)internal pure returns(bytes[] memory res){
        RLPReader.RLPItem[] memory list = rlp.toRlpItem().toList();

        res =new bytes[](list.length);
        for (uint256 i = 0;i<list.length;i++){
            res[i] = RLPReader.toBytes(list[i]);
        }
        
    }

    function voteSignBytes(Commit memory commit,string memory chainId,uint idx)internal pure returns(bytes memory){
        voteForSign memory vfs;
        vfs.Type = SignedMsgType.PrecommitType;
        vfs.Height = commit.Height;
        vfs.Round = commit.Round;
        if (commit.Signatures[idx].BlockIDFlag == BLOCK_FLAG_COMMIT){
            vfs.BlockID = commit.BlockID;
        }

        vfs.TimestampMs = commit.Signatures[idx].TimestampMs;
        vfs.ChainID = chainId; 
        return encodeToRlpBytes(vfs);
    }

    function headerHash(bytes memory blockRlpBytes) internal pure returns(bytes32){
        // TODO
    }

    function encodeToRlpBytes(voteForSign memory vfs) internal pure returns(bytes memory){
        bytes[] memory List = new bytes[](6);
        List[0] = RLPEncode.encodeUint(uint256(vfs.Type));
        List[1] = RLPEncode.encodeUint(uint256(vfs.Height));
        List[2] = RLPEncode.encodeUint(uint256(vfs.Round));
        List[3] = RLPEncode.encodeUint(uint256(vfs.BlockID));
        List[4] = RLPEncode.encodeUint(uint256(vfs.TimestampMs));
        List[5] = RLPEncode.encodeString(vfs.ChainID);

        return RLPEncode.encodeList(List);
    }

    function msgHash(bytes memory signMsg) internal pure returns(bytes32) {
        return signMsg.toRlpItem().rlpBytesKeccak256();
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
