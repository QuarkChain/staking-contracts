const { expect } = require("chai");
const { ethers, web3 } = require("hardhat");
const { BigNumber } = require("ethers");
const { getTxProof } = require("./helper/proof");
const EthereumTx = require("ethereumjs-tx").Transaction;
const { FeeMarketEIP1559Transaction } = require("@ethereumjs/tx");

const { BaseTrie } = require("merkle-patricia-tree");
const { Level } = require("level");

function rlpdata(data) {
  return ethers.utils.RLP.encode(data);
}

function addPrefix(str) {
  return "0x" + str;
}

describe("mpt root proof", async function () {
  let test;
  let db;
  let mpt;
  let leveldb;

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

  it("mpt verify", async function () {
    try {
      leveldb = new Level("./testdb");
      const trie = new BaseTrie(leveldb);
      let key = Buffer.from("test");
      await trie.put(key), Buffer.from("one");
      await trie.put(Buffer.from("test1"), Buffer.from("two"));
      // await trie.put(Buffer.from('testf'), Buffer.from('three'))
      const value = await trie.get(key);

      // const proof = await BaseTrie.createProof(trie,Buffer.from('test'))
      // const recoverValue = await BaseTrie.verifyProof(trie.root,Buffer.from("test"),proof)
      // console.log(recoverValue.toString()) // 'one'

      // console.log(trie.root.toString('hex'))

      let path = await trie.findPath(key);
      // console.log("PATH:",(path.stack))
      console.log("--------node 0 ---------");
      console.log("key:", path.stack[0]._nibbles);
      console.log("value:", path.stack[0]._value.toString("hex"));

      console.log("----------braches---------");
      // path.stack[1]._branches.forEach( (val,Index)=>{
      //   console.log(Index , " => ",val.toString('hex'))
      // } )
      // console.log("vakue:",(path.stack[1]._value.toString('hex'))) // one
      // "_nibbles":[7,4,6,5,7,3,7,4],
      // "_value":{"type":"Buffer","data":[113,229,59,143,252,121,152,44,15,140,215,179,218,254,230,154,4,249,104,156,24,226,27,198,113,208,72,151,47,56,52,190]}

      prf = {
        // blockHash: utils.toBuffer(tx.blockHash),
        parentNodes: path.stack.map((s) => s.raw()),
        root: addPrefix(trie.root.toString("hex")),
        path: addPrefix(Buffer.from("test").toString("hex")),
        value: addPrefix(Buffer.from("one").toString("hex")),
      };

      console.log(prf);
      console.log(rlpdata(prf.parentNodes));

      let res = await mpt.verifyTx(prf.value, prf.path, rlpdata(prf.parentNodes), prf.root);
      console.log("succeed:", res);
    } catch (error) {
      console.error(error);
    }

    // let prf
    // await trie.findPath(
    //   Buffer.from('test'),
    //   (err, rawTxNode, reminder, stack) => {
    //     if (err) {
    //       throw err
    //     }

    //     if (reminder.length > 0) {
    //       return reject(new Error('Node does not contain the key'))
    //     }

    //     prf = {
    //       // blockHash: utils.toBuffer(tx.blockHash),
    //       parentNodes: stack.map(s => s.raw),
    //       root: trie.root,
    //       path: Buffer.from('test'),
    //       value: rawTxNode.value
    //     }
    //     // resolve(prf)
    //   }
    // )
  });

  it("mpt proof test", async function () {
    // let validators = [
    //   "0x91dfd865Ee79B1Fc880Ab7f3BA506D156758Df18",
    //   "0xBc8f08Df1E4375D1Aff198D0127e410563eB71a5",
    //   "0xD1Fdb495842601fb34F9A42Af0e3B7b5aF0D0D0B",
    // ];
    // let powers = [
    //   BigNumber.from("1000000000000000000"),
    //   BigNumber.from("1000000000000000000"),
    //   BigNumber.from("1000000000000000000"),
    // ];
    // let tx0 = await test.InitEpochValidatorsTest(1, validators, powers);
    // console.log("Block number:", tx0.blockNumber);
    // let resBlock = await ethers.provider.getBlockWithTransactions(tx0.blockNumber);
    // // console.log(resBlock)
    // let resBlock1 = await web3.eth.getBlock(tx0.blockNumber);
    // console.log("TxRoot", resBlock1.transactionsRoot);
    // const txBytes = ethers.utils.serializeTransaction(tx0);
    // const tx3 = ethers.utils.parseTransaction(txBytes);
    // // console.log(tx3)
    // let proof = await getTxProof(tx0, resBlock);
    // console.log("TTxRoot:", proof);
    // console.log(arrays[0])
    // function print(_proof){
    //     console,log(_proof)
    // }
    // function happenErr(err){
    //     throw err
    // }
    // let prf = await tx_proof(print,happenErr);
    // console.log(prf
  });
});
