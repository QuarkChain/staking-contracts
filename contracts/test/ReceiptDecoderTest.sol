pragma solidity ^0.8.0;

import "../lib/ReceiptDecoder.sol";

contract ReceiptDecoderTest {
    using ReceiptDecoder for bytes;
    function cutTxtype(bytes memory bs)public pure returns(bytes memory){
        return bs.cutTxtype();
    }
    function decodeReceipt(bytes memory value) public pure returns (ReceiptDecoder.Receipt memory) {
        return value.decodeReceipt();
    }
}