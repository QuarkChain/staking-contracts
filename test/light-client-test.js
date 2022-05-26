const { expect } = require("chai");
const { ethers, web3, network } = require("hardhat");
const { BigNumber } = require("ethers");
const { Contract } = require("ethers");
const { SignerWithAddress } = require("@nomiclabs/hardhat-ethers/signers");

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
}

async function signVotes(_wallets, _commit) {
  for (let k = 0; k < _wallets.length; k++) {
    let dataToSign = voteSignBytes(_commit, CHAIN_ID, k);
    
    if ( _wallets[k] instanceof SignerWithAddress) {
      await _wallets[k].signMessage(dataToSign).then((value) => {
        _commit.signatures[k].push(value);
      });
    }else{
      await generateSignature(dataToSign, _wallets[k]).then((value) => {
        _commit.signatures[k].push(value);
      });
    }
    
  }
}

async function signVotesWithSigner(_singers, _commit) {
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

async function submitNormalHead(list, walletSet, period, lishtclient_instance) {
  let res = [];
  for (let i = 0; i < list.length; i++) {
    let signer_wallets = selectWallet(walletSet, list[i], period);
    // console.log("SINGER_WALLET_LIST:", signer_wallets);
    let head_commit = new Commit(list[i].Number, "0x02", genHeadhash(list[i]), signer_wallets);
    await signVotes(signer_wallets, head_commit);
    let commit_bytes = head_commit.genCommitRlp();

    await lishtclient_instance.submitHead(list[i].Number, genHeadRlp(list[i]), commit_bytes);
    let exist = await lishtclient_instance.blockExist(list[i].Number);
    check("BLOCK_EXIST", exist, true);
  }
}

function selectWallet(walletSet, head, period) {
  // height[1,10000] -> walletSet[1]
  index = (head.Number - 1) / period;
  index = Math.floor(index);
  // console.log("INDEX:",index)
  return walletSet[index];
}

async function checkSubmitEpochs(instance, epoch_num, validatorWallets) {
  const wallets = [];
  const vals = [];
  const powers = [];
  const initpowers = [];
  let valNum = 10;
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
  let tx = await instance.initEpoch(vals, initpowers, initHeight, genesisBlockHash);

  let [currentEpochIdx, currentVals, currentPowers] = await instance.getCurrentEpoch();
  check("EPOCH_INDEX", currentEpochIdx, 1);
  checkArray("Validators", currentVals, vals);
  checkArray("Powers", currentPowers, powers);

  let prev_epoch_wallets = wallets;
  let epochHeight2 = BigNumber.from(10000);
  validatorWallets.push(wallets);
  for (let epochIdx = 2; epochIdx <= epoch_num; epochIdx++) {
    let wallets2 = [];
    let vals2 = [];
    let powers2 = [];
    for (let i = 0; i < valNum; i++) {
      const wallet = await ethers.Wallet.createRandom();
      wallets2.push(wallet);
      vals2.push(wallet.address);
      powers2.push("0x02"); //10
    }

    let epochHeader2 = new Header(vals2, powers2);
    epochHeader2.setBlockHeight(epochHeight2.toHexString());
    let rlpHeader2 = genHeadRlp(epochHeader2);
    let hash2 = genHeadhash(epochHeader2);

    let commit2 = new Commit(epochHeight2.toHexString(), "0x02", hash2, prev_epoch_wallets); // wallets should use the wallet of validators of epoch 1
    await signVotes(prev_epoch_wallets, commit2);
    let commitBytes2 = commit2.genCommitRlp();

    let tx2 = await instance.submitHead(epochHeight2.toHexString(), rlpHeader2, commitBytes2);
    let receipt2 = await tx2.wait();
    console.log("EPOCHID:", epochIdx, " VALNUM:", valNum, " GasUsed:", receipt2.gasUsed.toString());

    [currentEpochIdx, currentVals, currentPowers] = await instance.getCurrentEpoch();
    check("epochId", currentEpochIdx, epochIdx);
    checkArray("VALIDATORS", currentVals, vals2);
    checkArray("POWERS", currentPowers, powers2);

    prev_epoch_wallets = wallets2;
    epochHeight2 = epochHeight2.add(10000);

    validatorWallets.push(wallets2);
  }
}

describe("light client test", function () {
  let local_wallets;
  let owner;
  let user;
  let signers;

  let test;
  let db;
  let staking;
  let w3q;

  const w3qUint = BigNumber.from("1000000000000000000")

  const _epoch_period = 10000
  const _unbonding_period = _epoch_period * 3
  const _maxBondedVal = 10
  const _minValidatorTokens = w3qUint.mul(1)
  const _minSelfDelegation = w3qUint.mul(1)
  const _validatorBondInterval = 0
  beforeEach(async () => {
    
   signers= await ethers.getSigners();
   owner = signers[0]
   user = signers[1]

  //  [owner,]= await ethers.getSigners();
    
    // owner = local_wallets[0];

    let factory1 = await ethers.getContractFactory("BlockDecoderTest");
    db = await factory1.connect(owner).deploy();
    await db.deployed();

    let factory3 = await ethers.getContractFactory("W3qERC20")
    w3q = await factory3.connect(owner).deploy("W3Q ERC20 Token","W3Q");
    await w3q.deployed();

    let factory = await ethers.getContractFactory("TestStaking");
    staking = await factory.connect(owner).deploy(
      w3q.address,
      10000, // proposal deposit
      10000, // voting power 
      _unbonding_period, // unbonding period 
      signers.length, //number of validator with state of 'bonded'
      _minValidatorTokens,
      _minSelfDelegation,
      0,
      _validatorBondInterval,
      1000
    );
    await staking.deployed();

    let factory2 = await ethers.getContractFactory("W3qProver");
    test = await factory2.connect(owner).deploy(_epoch_period, staking.address,w3q.address);
    await test.deployed();

  });

  it("reward to validators with w3q",async function(){
    let factory = await ethers.getContractFactory("LightClientTest");
    let light_client_test = await factory.connect(owner).deploy(_epoch_period, staking.address,w3q.address);
    await light_client_test.deployed();
    

    let orderVals = [];
    const wallets = [];
    const valnum  = 10
    
    let staking_w3q_balance = BigNumber.from(0)
    for (let i = 0; i < signers.length; i++) {
      let _wallet = signers[i]
      orderVals.push(_wallet.address)

      let mintAmount = w3qUint.mul(100)
      await w3q.connect(owner).mint(_wallet.address,mintAmount);
      await w3q.connect(_wallet).approve(staking.address,mintAmount);

      await staking.connect(_wallet).initializeValidator(_wallet.address,_minSelfDelegation,0);
      let delegateAmount = mintAmount.sub(_minSelfDelegation)
      await staking.connect(_wallet).delegate(_wallet.address,delegateAmount);
      staking_w3q_balance = staking_w3q_balance.add(mintAmount)

      await staking.connect(_wallet).bondValidator();
      check("W3Q_BALANCE",await w3q.balanceOf(_wallet.address),0)
      check("W3Q_BALANCE",await w3q.balanceOf(staking.address),staking_w3q_balance)
      console.log("w3q balance:",(await w3q.balanceOf(_wallet.address)).toString(), "  (Address:",_wallet.address,")")
      console.log("w3q balance:",(await w3q.balanceOf(staking.address)).toString(), "  (Address:Staking Contract)")
    }
    // reward validators
    let [vals,powers] = await staking.proposedValidators();
    let b32Empty = "0x0000000000000000000000000000000000000000000000000000000000000000"
    await light_client_test.initEpoch(vals,powers,0,b32Empty)
    await w3q.connect(owner).transferOwnership(light_client_test.address)
    await light_client_test.epochReward();

    console.log("_________________________After_Reward________________________")
    for (let i = 0; i < signers.length; i++) {
      let _wallet = signers[i]
      console.log("w3q balance:",(await w3q.balanceOf(_wallet.address)).toString(), "  (Address:",_wallet.address,")")
      check("W3Q_BALANCE",await w3q.balanceOf(_wallet.address),BigNumber.from("5000000000000000000"))
    }

  })

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

  it("submit epoch heads ", async function () {
    let epochs_wallet = [];
    await w3q.connect(owner).transferOwnership(test.address)
    await checkSubmitEpochs(test, 10, epochs_wallet);
  });

  it("check getEpochIdx", async function () {
    const wallets = [];
    const vals = [];
    const powers = [];
    const initpowers = [];
    let valNum = 10;
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
    console.log("CurrentEpochIdx:", currentEpochIdx);

    checkArray("Validators", currentVals, vals);
    checkArray("Powers", currentPowers, powers);

    let resEpochIdx1 = await test.getEpochIdx(0);
    check("EPOCH_INDEX", resEpochIdx1, currentEpochIdx - 1);

    let resEpochIdx2 = await test.getEpochIdx(1);
    check("EPOCH_INDEX", resEpochIdx2, currentEpochIdx);

    let resEpochIdx3 = await test.getEpochIdx(10000);
    check("EPOCH_INDEX", resEpochIdx3, currentEpochIdx);

    // reverted with 'height too high'
    await expect(test.getEpochIdx(10001)).to.be.reverted;

    await expect(test.getEpochIdx(20000)).to.be.reverted;
  });

  it("check height range ", async function () {

    try {
      await w3q.connect(owner).transferOwnership(test.address)
      const epochs_wallet = [];
      await checkSubmitEpochs(test, 6, epochs_wallet);

      let [currentEpochIdx, ,] = await test.getCurrentEpoch();
      let period = (await test.epochPeriod()).toNumber();
      let CurrentEpochEnd = currentEpochIdx * period;
      let CurrentEpochBegin = CurrentEpochEnd - period + 1;

      let total_epoch = await test.TOTAL_EPOCH();
      let maxHeight = CurrentEpochEnd;
      let minHeight = CurrentEpochEnd - total_epoch * period + 1;
      // console.log("Current Epoch:",CurrentEpochBegin  ," , ", CurrentEpochEnd);
      // console.log("Height Range:",minHeight  ," , ", maxHeight);

      let resEpochIdx1 = await test.getEpochIdx(CurrentEpochEnd);
      check("EPOCH_INDEX", resEpochIdx1, currentEpochIdx);

      let resEpochIdx2 = await test.getEpochIdx(CurrentEpochBegin);
      check("EPOCH_INDEX", resEpochIdx2, currentEpochIdx);

      // reverted with 'height too high'
      await expect(test.getEpochIdx(CurrentEpochEnd + 1)).to.be.reverted;

      let resEpochIdx3 = await test.getEpochIdx(CurrentEpochBegin - 1);
      check("EPOCH_INDEX", resEpochIdx3, currentEpochIdx - 1);

      let [min, max] = await test.heightRange();
      console.log(min, max);
      check("HEIGHT_MAX", max, maxHeight);
      check("HEIGHT_MIN", min, minHeight);

      // _period = period.toNumber()
      let minEpochIdx = (await test.minEpochIdx()).toNumber();
      let resEpochIdx4 = await test.getEpochIdx(minHeight);
      let resEpochIdx5 = await test.getEpochIdx(period + minHeight - 1);
      let resEpochIdx6 = await test.getEpochIdx(period + minHeight);
      check("EPOCH_INDEX", resEpochIdx4, minEpochIdx);
      check("EPOCH_INDEX", resEpochIdx5, minEpochIdx);
      check("EPOCH_INDEX", resEpochIdx6, minEpochIdx + 1);

      // reverted with 'out of height range'
      await expect(test.getEpochIdx(minHeight - 1)).to.be.reverted;
    } catch (error) {
      console.error(error);
    }
  });

  it("submit normal head and epoch head ", async function () {
    await w3q.connect(owner).transferOwnership(test.address)

    // epochs_wallet[i] can verify block in range of [i * epochPeriod - epochPeriod +1,i * epochPeriod]
    let epochs_wallet = [];
    await checkSubmitEpochs(test, 6, epochs_wallet);
    // console.log("epochs_wallet:",epochs_wallet.length)
    let [currentEpochIdx, ,] = await test.getCurrentEpoch();
    let minEpochIdx = (await test.minEpochIdx()).toNumber();
    let period = await test.epochPeriod();
    let [minHeight, maxHeight] = await test.heightRange();
    let CurrentEpochEnd = currentEpochIdx * period;
    let CurrentEpochBegin = CurrentEpochEnd - period + 1;

    // test case
    const headList = [];
    let normalHead1 = new Header([], []);
    normalHead1.setBlockHeight(BigNumber.from(CurrentEpochBegin).toHexString());
    headList.push(normalHead1);

    let normalHead3 = new Header([], []);
    normalHead3.setBlockHeight(BigNumber.from(CurrentEpochBegin - 2).toHexString());
    headList.push(normalHead3);

    let normalHead4 = new Header([], []);
    normalHead4.setBlockHeight(BigNumber.from(minHeight).toHexString());
    headList.push(normalHead4);

    let normalHead5 = new Header([], []);
    normalHead5.setBlockHeight(BigNumber.from(maxHeight.toNumber() - 1).toHexString());
    headList.push(normalHead5);

    // let normalHead6 = new Header([], []);
    // normalHead6.setBlockHeight(BigNumber.from(maxHeight.toNumber() + 1).toHexString());
    // const revertHeadList6 = []
    // revertHeadList6.push(normalHead6)
    // await expect(submitNormalHead(revertHeadList6 , epochs_wallet , period ,test)).to.be.reverted

    let normalHead7 = new Header([], []);
    normalHead7.setBlockHeight(BigNumber.from(minHeight.toNumber() - 1).toHexString());
    const revertHeadList7 = [];
    revertHeadList7.push(normalHead7);
    // await submitNormalHead(revertHeadList7 , epochs_wallet , period ,test)
    await expect(submitNormalHead(revertHeadList7, epochs_wallet, period, test)).to.be.revertedWith("block exist");

    let normalHead8 = new Header([], []);
    normalHead8.setBlockHeight(BigNumber.from(minHeight.toNumber() - 2).toHexString());
    const revertHeadList8 = [];
    revertHeadList8.push(normalHead8);
    await expect(submitNormalHead(revertHeadList8, epochs_wallet, period, test)).to.be.revertedWith(
      "out of height range"
    );

    // will revert with  "both NextValidators and NextValidatorPowers should not be empty"
    check("MAX_HEIGHT", maxHeight, CurrentEpochEnd);
    let normalHead2 = new Header([], []);
    normalHead2.setBlockHeight(BigNumber.from(CurrentEpochEnd).toHexString());
    const revertHeadList = [];
    revertHeadList.push(normalHead2);
    await expect(submitNormalHead(revertHeadList, epochs_wallet, period, test)).to.be.revertedWith(
      "both NextValidators and NextValidatorPowers should not be empty"
    );

    // begin submit
    await submitNormalHead(headList, epochs_wallet, period, test);
  });

});
