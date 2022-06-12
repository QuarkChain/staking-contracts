const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

function check(f, got, want) {
  expect(got).to.eq(want, f);
}

function checkArray(f, got, want) {
  got.forEach((v, i) => {
    expect(v).to.eq(want[i], f);
  });
}

async function generateSignature(data, acc) {
  return ethers.utils.joinSignature(await acc._signingKey().signDigest(dataHash(data)));
}

class Header {
  constructor(validators, powers) {
    this.ParentHash = "0x112233445566778899001122334455667788990011223344556677889900aabb";
    this.UncleHash = "0x000033445566778899001122334455667788990011223344556677889900aabb";
    this.Coinbase = "0xD76Fb45Ed105f1851D74233f884D256C4FdAd634";
    this.Root = "0x1100000000000000000000000000000000000000000000000000000000000011";
    this.TxHash = "0x2200000000000000000000000000000000000000000000000000000000000022";
    this.ReceiptHash = "0x3300000000000000000000000000000000000000000000000000000000000033";
    this.Bloom = "0x1234";
    this.Difficulty = "0x1100";
    this.Number = "0x2710"; //10000
    this.GasLimit = "0x900008";
    this.GasUsed = "0x8000918271";
    this.Time = "0x98765372";
    this.Extra = "0x030101010101010101010101010101010101010101010101010101010101010101010101";
    this.MixDigest = "0x4400000000000000000000000000000000000000000000000000000000000044";
    this.Nonce = "0x0102030405060708";
    this.BaseFee = "0x1777";
    this.TimeMs = "0x221111";
    this.NextValidators = validators;
    this.NextValidatorPowers = powers;
    this.LastCommitHash = "0x7700000000000000000000000000000000000000000000000000000000000011";
  }

  setBlockHeight(height) {
    this.Number = BigNumber.from(height).toHexString();
  }

  setNextVals(vals, powers) {
    this.NextValidators = vals;
    this.NextValidatorPowers = powers;
  }
}

function genHeadRlp(h) {
  return rlpdata(Object.values(h));
}

function genHeadhash(h) {
  return dataHash(rlpdata(Object.values(h)));
}

function rlpdata(data) {
  return ethers.utils.RLP.encode(data);
}

function dataHash(rlpBytes) {
  return ethers.utils.keccak256(rlpBytes);
}

class Commit {
  constructor(height, round, blockId, wallets) {
    this.height = height;
    this.round = round;
    this.blockId = blockId;
    let allsigs = [];
    for (let k = 0; k < wallets.length; k++) {
      let _sig = ["0x02", wallets[k].address, "0x1234"];
      allsigs.push(_sig);
    }
    this.signatures = allsigs;
  }

  genCommitRlp() {
    return rlpdata(Object.values(this));
  }

  shuffleSigsOrder() {
    let newSigs = []
    for (let i=this.signatures.length-1 ; i>=0 ;i--){
      newSigs.push(this.signatures[i])
    }
    this.signatures = newSigs
  }


}

async function signVotes(_wallets, _commit) {
  for (let k = 0; k < _wallets.length; k++) {
    let dataToSign = voteSignBytes(_commit, CHAIN_ID, k);
    // let dataSignature ;
    await generateSignature(dataToSign, _wallets[k]).then((value) => {
      _commit.signatures[k].push(value);
    });
  }
}

class Vote {
  constructor(commit, chainID, sigIdx) {
    this.type = "0x02";
    this.height = commit.height;
    this.round = commit.round;
    this.blockId = commit.blockId;
    this.TimestampMs = commit.signatures[sigIdx][2];
    this.chainID = chainID;
  }
}

// chainID = "evm_3334"
const CHAIN_ID = "0x65766d5f33333334";
function voteSignBytes(commit, chainId, Idx) {
  newVote = new Vote(commit, chainId, Idx);
  return rlpdata(Object.values(newVote));
}

describe("light client test", function () {
  let test;
  let db;
  let staking;
  let epochPeriod;

  beforeEach(async () => {
    let factory = await ethers.getContractFactory("TestStaking");
    staking = await factory.deploy(
      "0x8072113C11cE4F583Ac1104934386a171f5f7c3A",
      10000,
      10000,
      10000,
      4, //number of validator with state of 'bonded'
      100,
      10,
      1000,
      10000,
      1000
    );
    await staking.deployed();

    let factory1 = await ethers.getContractFactory("BlockDecoderTest");
    db = await factory1.deploy();
    await db.deployed();

    epochPeriod = 100800;
    let factory2 = await ethers.getContractFactory("LightClient");
    test = await factory2.deploy(epochPeriod, staking.address);
    await test.deployed();
  });

  it("verify header hash signature", async function () {
    const wallet = await ethers.Wallet.createRandom();
    vals = ["0x33Ec47F63Dcda97930dFbaE32c0EEBFb5cD476c5"];
    powers = ["0x01"];
    let newHeader = new Header(vals, powers);
    let h1 = Object.values(newHeader);

    let rlpheaderBytes = rlpdata(h1);
    let headerhash = dataHash(rlpheaderBytes);

    let dataSignature = await generateSignature(rlpheaderBytes, wallet);

    const signer = wallet.address;
    let hash = await db.HashTest(rlpheaderBytes);
    check("Hash", hash, headerhash);

    let getAddr = await db.RecoverSignatureTest(rlpheaderBytes, dataSignature);
    check("Recover Address", getAddr, signer);

    let valid = await db.verifySignatureTest(signer, rlpheaderBytes, dataSignature);
    check("Verify Signature", valid, true);
  });

  it("submit epoch head with large number of validators", async function () {
    const wallets = [];
    const vals = [];
    const powers = [];
    const initpowers = [];
    let valNum = 4;
    for (let i = 0; i < valNum; i++) {
      const wallet = await ethers.Wallet.createRandom();
      wallets.push(wallet);
      vals.push(wallet.address);
      powers.push("0x01"); //10
      initpowers.push("0x01"); //10 * 10^18
    }

    //1. initalize light client
    const initHeight = 0;
    const genesisBlockHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
    let tx = await test.initEpoch(vals, initpowers, initHeight, genesisBlockHash);

    let [currentEpochIdx, currentVals, currentPowers] = await test.getCurrentEpoch();
    let j = 0;

    checkArray("Validators", currentVals, vals);
    checkArray("Powers", currentPowers, powers);

    let prev_epoch_wallets = wallets;
    let epochHeight2 = BigNumber.from(epochPeriod);
    for (let epochIdx = 2; epochIdx < 10; epochIdx++) {
      let wallets2 = [];
      let vals2 = [];
      let powers2 = [];
      for (let i = 0; i < valNum; i++) {
        const wallet = await ethers.Wallet.createRandom();
        wallets2.push(wallet);
        vals2.push(wallet.address);
        powers2.push("0x02"); //10
      }

      // console.log("H2:",epochHeight2)
      let epochHeader2 = new Header(vals2, powers2);
      epochHeader2.setBlockHeight(epochHeight2.toHexString());
      let rlpHeader2 = genHeadRlp(epochHeader2);
      let hash2 = genHeadhash(epochHeader2);

      let commit2 = new Commit(epochHeight2.toHexString(), "0x02", hash2, prev_epoch_wallets); // wallets should use the wallet of validators of epoch 1
      await signVotes(prev_epoch_wallets, commit2);
      let commitBytes2 = commit2.genCommitRlp();

      let tx2 = await test.submitHead(rlpHeader2, commitBytes2, true);
      let receipt2 = await tx2.wait();
      console.log("EPOCHID:", epochIdx, " VALNUM:", valNum, " GasUsed:", receipt2.gasUsed.toString());

      [currentEpochIdx, currentVals, currentPowers] = await test.getCurrentEpoch();
      check("epochId", currentEpochIdx, epochIdx);
      checkArray("VALIDATORS", currentVals, vals2);
      checkArray("POWERS", currentPowers, powers2);

      prev_epoch_wallets = wallets2;
      epochHeight2 = epochHeight2.add(epochPeriod);
    }
  });

  it("submit epoch head out-of-order signatures", async function () {
    const wallets = [];
    const vals = [];
    const powers = [];
    const initpowers = [];
    let valNum = 4;
    for (let i = 0; i < valNum; i++) {
      const wallet = await ethers.Wallet.createRandom();
      wallets.push(wallet);
      vals.push(wallet.address);
      powers.push("0x01"); //10
      initpowers.push("0x01"); //10 * 10^18
    }

    //1. initalize light client
    const initHeight = 0;
    const genesisBlockHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
    let tx = await test.initEpoch(vals, initpowers, initHeight, genesisBlockHash);

    let [currentEpochIdx, currentVals, currentPowers] = await test.getCurrentEpoch();
    let j = 0;

    checkArray("Validators", currentVals, vals);
    checkArray("Powers", currentPowers, powers);

    let prev_epoch_wallets = wallets;
    let epochHeight2 = BigNumber.from(epochPeriod);
    for (let epochIdx = 2; epochIdx < 10; epochIdx++) {
      let wallets2 = [];
      let vals2 = [];
      let powers2 = [];
      for (let i = 0; i < valNum; i++) {
        const wallet = await ethers.Wallet.createRandom();
        wallets2.push(wallet);
        vals2.push(wallet.address);
        powers2.push("0x02"); //10
      }

      // console.log("H2:",epochHeight2)
      let epochHeader2 = new Header(vals2, powers2);
      epochHeader2.setBlockHeight(epochHeight2.toHexString());
      let rlpHeader2 = genHeadRlp(epochHeader2);
      let hash2 = genHeadhash(epochHeader2);

      let commit2 = new Commit(epochHeight2.toHexString(), "0x02", hash2, prev_epoch_wallets); // wallets should use the wallet of validators of epoch 1
      await signVotes(prev_epoch_wallets, commit2);
      commit2.shuffleSigsOrder();
      let commitBytes2 = commit2.genCommitRlp();

      let tx2 = await test.submitHead(rlpHeader2, commitBytes2, false);
      let receipt2 = await tx2.wait();
      console.log("EPOCHID:", epochIdx, " VALNUM:", valNum, " GasUsed:", receipt2.gasUsed.toString());

      [currentEpochIdx, currentVals, currentPowers] = await test.getCurrentEpoch();
      check("epochId", currentEpochIdx, epochIdx);
      checkArray("VALIDATORS", currentVals, vals2);
      checkArray("POWERS", currentPowers, powers2);

      prev_epoch_wallets = wallets2;
      epochHeight2 = epochHeight2.add(epochPeriod);
    }
  });
});
