const { expect } = require("chai");
const { ethers, web3, network } = require("hardhat");
const { BigNumber } = require("ethers");
const { Contract } = require("ethers");
const { SignerWithAddress } = require("@nomiclabs/hardhat-ethers/signers");
const { parse } = require("dotenv");
const { encode } = require("rlp");
const { rlp, bufferToHex } = require("ethereumjs-util");

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

    if (validators.length > 0) {
      let pros = [];
      for (let i = 0; i < validators.length; i++) {
        pros.push("0x01");
      }
      this.Extra = rlpdata(pros);
    }
  }

  setBlockHeight(height) {
    this.Number = BigNumber.from(height).toHexString();
  }

  setNextVals(vals, powers) {
    this.NextValidators = vals;
    this.NextValidatorPowers = powers;
  }

  genExtra(amountList) {
    let data = rlpdata(amountList);
    this.Extra = data;
    return this;
  }

  genExtraWithPrefix(amountList, HeaderNumber) {
    let emptyHeaderHash = "0000000000000000000000000000000000000000000000000000000000000000";
    let data = rlpdata(amountList);
    data = cutHexPrefix(data);
    let HeaderNumberStr = "HeaderNumber";
    let hexStr = web3.utils.asciiToHex(HeaderNumberStr);
    // eight byte headerNumber
    let numberStr = BigNumber.from(HeaderNumber).toHexString();
    numberStr = cutHexPrefix(numberStr);
    if (numberStr.length < 16) {
      let zeroPrefix = "0000000000000000";
      zeroPrefix = zeroPrefix.slice(0, 16 - numberStr.length);
      numberStr = zeroPrefix.concat(numberStr);
    }
    numberStr = numberStr.concat(emptyHeaderHash);
    this.Extra = hexStr.concat(numberStr, data);
    return this;
  }
}

function cutHexPrefix(str) {
  if (str.slice(0, 2) == "0x") {
    return str.slice(2);
  }
  return str;
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

    if (_wallets[k] instanceof SignerWithAddress) {
      await _wallets[k].signMessage(dataToSign).then((value) => {
        _commit.signatures[k].push(value);
      });
    } else {
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

    await lishtclient_instance.submitHeader(list[i].Number, genHeadRlp(list[i]), commit_bytes, true);
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

async function checkSubmitEpochs(w3q,w3qOwner,staking,instance, epoch_num, validatorWallets) {
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

  await initStakingValidator(w3q,staking,w3qOwner,wallets);

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

    let tx2 = await instance.submitHeader(epochHeight2.toHexString(), rlpHeader2, commitBytes2, true);
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

async function initStakingValidator(w3q,staking,w3qOwner,signers){
  const w3qUint = BigNumber.from("1000000000000000000");
  let mintAmount = w3qUint.mul(100);

  for (let i = 0; i < signers.length; i++) {
    let _wallet = signers[i];
    await w3q.mint(_wallet.address, mintAmount);
    await w3q.connect(_wallet).approve(staking.address, mintAmount);
    await staking.connect(_wallet).initializeValidator(_wallet.address, _minSelfDelegation, 0);
  }
}


exports.check = check;
exports.checkArray = checkArray;
exports.generateSignature = generateSignature;
exports.Header = Header;
exports.genHeadRlp = genHeadRlp;
exports.genHeadhash = genHeadhash;
exports.rlpdata = rlpdata;
exports.dataHash = dataHash;
exports.Commit = Commit;
exports.signVotes = signVotes;
exports.Vote = Vote;
exports.CHAIN_ID = CHAIN_ID;
exports.submitNormalHead = submitNormalHead;
exports.selectWallet = selectWallet;
exports.checkSubmitEpochs = checkSubmitEpochs;
exports.initStakingValidator = initStakingValidator;
