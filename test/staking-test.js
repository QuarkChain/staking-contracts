const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

function check(f, got, want) {
  expect(got).to.eq(want);
}

function checkArray(f, got, want) {
  got.forEach((v, i) => {
    expect(v).to.eq(want[i]);
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
    this.Number = "0x1001";
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
}

function rlpdata(data) {
  return ethers.utils.RLP.encode(data);
}

function dataHash(rlpBytes) {
  return ethers.utils.keccak256(rlpBytes);
}

class Commit {
  constructor(height, round, blockId, sigs) {
    this.height = height;
    this.round = round;
    this.blockId = blockId;
    this.signatures = sigs;
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

describe("staking test", function () {
  let test;
  let db;
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

    let factory1 = await ethers.getContractFactory("DecodeBlockTest");
    db = await factory1.deploy();
    await db.deployed();
  });

  it("createEpochValidators Test", async function () {
    let headerRlp =
      "0xf90304a0112233445566778899001122334455667788990011223344556677889900aabba0000033445566778899001122334455667788990011223344556677889900aabb94d76fb45ed105f1851d74233f884d256c4fdad634a01100000000000000000000000000000000000000000000000000000000000011a02200000000000000000000000000000000000000000000000000000000000022a03300000000000000000000000000000000000000000000000000000000000033b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000822af88227118703328b9554a1b68501dce452ff8405e30a3cb8950301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010102a04400000000000000000000000000000000000000000000000000000000000044880102030405060708820309830c9f1bf83f94aa000000000000000000000000000000000000aa94bb000000000000000000000000000000000000bb94cc000000000000000000000000000000000000ccc3030303a0cc000000000000000000000000000000000000000000000000000000000000cc";

    let commitRlp =
      "0xf901446402a01231b92247299b5fa06ce17819c85a449086ded093407b246793abc87722b8d0f9011ef85d029433ec47f63dcda97930dfbae32c0eebfb5cd476c58398b2f1b8414c9cda1f5837598f74f0b3f92c36553c14190e9b6bea112cf720e34f6d8d8fc3585c70b1408f936655618e659f6f26c9ef3c7400c2302753699a56d83a66f03a01f85e02949188e32b84bd86e03492f2f94442b0965be340cd8401317079b841ac01bd9543e9f42aaaa81a3d506929841fc8940ae14e02628899eff5185db4d15e853eecf149d8ff258b9da28c23aa2926266164869fbea7d0c0b39ae72584b801f85d0294c7b0372fd4e677f628a0919a4bfa5434aa2cdf0f83c9adf9b8417079b71848b74ce144fe14f419117efb4b27390b97a0f201dcf5619b51132b3614b9deb47e6fd3a19587c65d9cca7de34d81259dec7063846f39c828f1ce97d601";
    let validators = [
      "0x33Ec47F63Dcda97930dFbaE32c0EEBFb5cD476c5",
      "0x9188E32b84BD86e03492F2F94442B0965Be340Cd",
      "0xC7B0372fd4E677f628A0919a4bFA5434aa2CDF0f",
    ];
    let powers = [
      BigNumber.from("1000000000000000000"),
      BigNumber.from("1000000000000000000"),
      BigNumber.from("1000000000000000000"),
    ];
    let tx = await test.InitEpochValidatorsTest(1, validators, powers);
    let receipt = await tx.wait();

    let tx1 = await test.createEpochValidators(headerRlp, commitRlp);
    let receipt1 = await tx1.wait();
    // console.log(receipt1)

    let header = await db.DecodeHeaderTest(headerRlp);
    // console.log(header)
    let len = header.validatorData.NextValidators.length;

    let commit = await db.DecodeCommitTest(commitRlp);
    // console.log(commit)

    let vals = [];
    let votePowers = [];
    for (let i = 0; i < len; i++) {
      vals.push(await test.currentEpochIdx(i));
      votePowers.push(await test.currentVotingPowers(i));
    }
    let epochIdx = await test.epochIdx();

    check("check epochIdx", epochIdx, 2);
    checkArray("check current validators", vals, header.validatorData.NextValidators);
    checkArray("check current votePowers", votePowers, header.validatorData.NextValidatorPowers);
  });

  it("verify headder hash signature", async function () {
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

  it("test with large number of validators", async function () {
    try {
      const wallets = [];
      const vals = [];
      const powers = [];
      const initpowers = [];
      let valNum = 100;
      for (let i = 0; i < valNum; i++) {
        const wallet = await ethers.Wallet.createRandom();
        wallets.push(wallet);
        vals.push(wallet.address);
        powers.push("0x0a"); //10
        initpowers.push("0x8ac7230489e80000"); //10 * 10^18
      }

      newHeader = new Header(vals, powers);
      let h1 = Object.values(newHeader);

      let rlpheaderBytes = rlpdata(h1);
      let hash = dataHash(rlpheaderBytes);
      let gethash = await db.HashTest(rlpheaderBytes);
      check("Hash", gethash, hash);

      let sigs = [];
      for (let k = 0; k < valNum; k++) {
        let _sig = ["0x02", vals[k], "0x1234"];
        sigs.push(_sig);
      }
      let commit = new Commit(newHeader.Number, "0x02", hash, sigs);

      for (let k = 0; k < valNum; k++) {
        let dataToSign = voteSignBytes(commit, CHAIN_ID, k);
        let dataSignature = await generateSignature(dataToSign, wallets[k]);
        commit.signatures[k].push(dataSignature);
        let valid = await db.verifySignatureTest(wallets[k].address, dataToSign, dataSignature);
        check("Verify Signature", valid, true);
      }

      let commitBytes = rlpdata(Object.values(commit));
      let tx = await test.InitEpochValidatorsTest(1, vals, initpowers);

      let [currentEpochIdx, currentVals, currentPowers] = await test.getCurrentEpoch();
      let j = 0;
      for (const val of currentVals) {
        check("Index Validator", val, sigs[j][1]);
        j++;
      }

      let tx1 = await test.createEpochValidators(rlpheaderBytes, commitBytes);
      let receipt1 = await tx1.wait();
      console.log("valNum:", valNum, " GasUsed:", receipt1.gasUsed);
    } catch (error) {
      throw error;
    }
  });
});
