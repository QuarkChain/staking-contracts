const { expect } = require("chai");
const { ethers, web3 } = require("hardhat");
const { rlp, bufferToHex } = require("ethereumjs-util");
const { buildReceiptProof, getReceiptBytes, getFullBlockByHash } = require("@tomfrench/matic-proofs");
const { hexConcat } = require("@ethersproject/bytes");

function check(f, got, want) {
  expect(got).to.eq(want);
}

function checkArray(f, got, want) {
  got.forEach((v, i) => {
    expect(v).to.eq(want[i]);
  });
}

function hexToBuffer(value) {
  return Buffer.from(value.slice(2), "hex");
}

describe("MerklePatriciaProof With Receipt Test", async function () {
  let test;
  let db;
  let mpt;

  beforeEach(async () => {
    let factory = await ethers.getContractFactory("TestStaking");
    test = await factory.deploy(
      "0x8072113C11cE4F583Ac1104934386a171f5f7c3A",
      10000,
      10000,
      10000,
      30,
      100,
      10,
      1000,
      10000,
      1000
    );
    await test.deployed();

    let factory1 = await ethers.getContractFactory("BlockDecoderTest");
    db = await factory1.deploy();
    await db.deployed();

    let factory2 = await ethers.getContractFactory("MPTTest");
    mpt = await factory2.deploy();
    await mpt.deployed();
  });

  it("Verify MerklePatriciaProof Test", async function () {
    let fac = await ethers.getContractFactory("ReceiptTest");
    let receiptTest = await fac.deploy();
    await receiptTest.deployed();

    let tx = await receiptTest.set(1);

    let receiptProof = await buildReceiptProof(ethers.provider, tx.hash);

    const path = hexConcat(["0x00", bufferToHex(rlp.encode(receiptProof.receipt.transactionIndex))]);
    const rlpParentNodes = bufferToHex(
      rlp.encode(receiptProof.parentNodes.map((node) => rlp.decode(hexToBuffer(node))))
    );

    let result = await mpt.verify(getReceiptBytes(receiptProof.receipt), path, rlpParentNodes, receiptProof.root);

    expect(result).to.eq(true);
  });

  it("decode Receipt onChain", async function () {
    let fac = await ethers.getContractFactory("ReceiptTest");
    let receiptTest = await fac.deploy();
    await receiptTest.deployed();

    let tx = await receiptTest.set(1);

    let receiptProof = await buildReceiptProof(ethers.provider, tx.hash);

    const path = hexConcat(["0x00", bufferToHex(rlp.encode(receiptProof.receipt.transactionIndex))]);
    const rlpParentNodes = bufferToHex(
      rlp.encode(receiptProof.parentNodes.map((node) => rlp.decode(hexToBuffer(node))))
    );

    let result = await mpt.verify(getReceiptBytes(receiptProof.receipt), path, rlpParentNodes, receiptProof.root);

    let receiptBytes = await mpt.decodeReceipt(getReceiptBytes(receiptProof.receipt));
    console.log(receiptProof.receipt.logs);
    // console.log(receiptBytes)
    console.log(receiptBytes[3][0]);

    // check("RECEIPT_ROOT",receiptProof.receipt.root,receiptBytes[0])
    check("RECEIPT_gasUsed", receiptProof.receipt.gasUsed, receiptBytes[1]);
    check("RECEIPT_logsBloom", receiptProof.receipt.logsBloom, receiptBytes[2]);
    checkReceiptLogs(receiptProof.receipt, receiptBytes);

    expect(result).to.eq(true);
  });
});

function checkReceiptLogs(receipt, receiptBytes) {
  let onchainLogs = receiptBytes[3];
  let offchainLogs = receipt.logs;

  for (let i = 0; i < offchainLogs.length; i++) {
    let index = offchainLogs[i].logIndex;
    check("RECEIPT_contract_addr", offchainLogs[i].address, onchainLogs[index].addr);
    check("RECEIPT_data", offchainLogs[i].data, onchainLogs[index].data);
    checkArray("RECEIPT_data", offchainLogs[i].topics, onchainLogs[index].topics);
  }
}
