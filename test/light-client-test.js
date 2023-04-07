const { expect } = require("chai");
const { ethers, web3, network } = require("hardhat");
const { BigNumber } = require("ethers");
const { Contract } = require("ethers");
const { SignerWithAddress } = require("@nomiclabs/hardhat-ethers/signers");
const {
  check,
  checkArray,
  generateSignature,
  Header,
  genHeadRlp,
  genHeadhash,
  rlpdata,
  dataHash,
  Commit,
  signVotes,
  Vote,
  CHAIN_ID,
  CHAINID_UINT,
  submitNormalHead,
  selectWallet,
  checkSubmitEpochs,
  createSignSubmitHeader,
} = require("./lib/head");

describe("light client test", function () {
  let local_wallets;
  let owner;
  let user;
  let signers;

  let test;
  let db;
  let staking;
  let w3q;

  const w3qUint = BigNumber.from("1000000000000000000");

  const _epoch_period = 10000;
  const _unbonding_period = _epoch_period * 3;
  const _maxBondedVal = 10;
  const _minValidatorTokens = w3qUint.mul(1);
  const _minSelfDelegation = w3qUint.mul(1);
  const _validatorBondInterval = 0;
  beforeEach(async () => {
    signers = await ethers.getSigners();
    owner = signers[0];
    user = signers[1];

    let factory1 = await ethers.getContractFactory("BlockDecoderTest");
    db = await factory1.connect(owner).deploy();
    await db.deployed();

    let factory3 = await ethers.getContractFactory("W3qERC20");
    w3q = await factory3.connect(owner).deploy("W3Q ERC20 Token", "W3Q");
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
    epochPeriod = 10000;
    let factory2 = await ethers.getContractFactory("LightClient");
    test = await factory2.deploy(_epoch_period, staking.address, w3q.address,CHAINID_UINT);

    await test.deployed();
    await staking.setLightClient(test.address);
    await w3q.setLightClient(test.address);
  });

  // it("submit epoch header with the whole process",async function(){
  //   let factory3 = await ethers.getContractFactory("W3qERC20");
  //   w3q = await factory3.connect(owner).deploy("W3Q ERC20 Token", "W3Q");
  //   await w3q.deployed();

  //   let provider = network.provider

  //   let factory = await ethers.getContractFactory("Staking");
  //   let staking_test = await factory.connect(owner).deploy(
  //     w3q.address,
  //     10000, // proposal deposit
  //     10000, // voting power
  //     _unbonding_period, // unbonding period
  //     signers.length, //number of validator with state of 'bonded'
  //     _minValidatorTokens,
  //     _minSelfDelegation,
  //     0,
  //     _validatorBondInterval,
  //     1000
  //   );
  //   await staking_test.deployed();

  //   factory = await ethers.getContractFactory("LightClientTest");
  //   let light_client_test = await factory.connect(owner).deploy(_epoch_period, staking_test.address, w3q.address,CHAINID_UINT);
  //   await light_client_test.deployed();

  //   // make sure we have already invoked the setLightClient method of staking-contract to obtain enough power to invoke staking.rewardValidator()   
  //   await staking_test.setLightClient(light_client_test.address);

  //   const valNum = 4;
  //   let wallets2 = [];
  //   let vals2 = [];
  //   let powers2 = [];
  //   let ETHAmount = BigNumber.from("700000000000000000")
  //   for (let i = 0; i < valNum; i++) {
  //     let wallet = await ethers.Wallet.createRandom();
  //     wallets2.push(wallet);
  //     vals2.push(wallet.address);
  //     powers2.push("0x02"); //10
  //   }

  //   console.log(ethers.providers.JsonRpcProvider)
    
  //   let orderVals = [];
  //   let staking_w3q_balance = BigNumber.from(0);
  //   let mintAmount = w3qUint.mul(100);
  //   for (let i = 0; i < wallets2.length; i++) {
  //     let _wallet = wallets2[i];
  //     // todo: get a correct provider
  //     _wallet= _wallet.connect(ethers.providers.JsonRpcProvider)
  //     orderVals.push(_wallet.address);

  //     await owner.sendTransaction({to:_wallet.address,value:ETHAmount})
  //     await w3q.connect(owner).mint(_wallet.address, mintAmount);
  //     await w3q.connect(_wallet).approve(staking_test.address, mintAmount);

  //     await staking_test.connect(_wallet).initializeValidator(_wallet.address, _minSelfDelegation, 0);
  //     let delegateAmount = mintAmount.sub(_minSelfDelegation);
  //     await staking_test.connect(_wallet).delegate(_wallet.address, delegateAmount);
  //     staking_w3q_balance = staking_w3q_balance.add(mintAmount);

  //     await staking_test.connect(_wallet).bondValidator();
  //     check("W3Q_BALANCE", await w3q.balanceOf(_wallet.address), 0);
  //     check("W3Q_BALANCE", await w3q.balanceOf(staking_test.address), staking_w3q_balance);
  //     check("VALIDATOR_TOKENs", await staking_test.getValidatorTokens(_wallet.address), mintAmount);
  //   }

  //   let [vals, powers] = await staking_test.proposedValidators();
  //   let b32Empty = "0x0000000000000000000000000000000000000000000000000000000000000000";
  //   await light_client_test.initEpoch(vals, powers, 0, b32Empty);

  //   let nextEpochHeight = await light_client_test.getNextEpochHeight();
  //   console.log(nextEpochHeight)
  //   // generate a signed epoch header 
  //   await w3q.connect(owner).transferOwnership(light_client_test.address);
  //   await createSignSubmitHeader(light_client_test , nextEpochHeight.toNumber(),wallets2 ,vals,powers)

  // })

  it("reward to validators with w3q", async function () {
    let factory3 = await ethers.getContractFactory("W3qERC20");
    w3q = await factory3.connect(owner).deploy("W3Q ERC20 Token", "W3Q");
    await w3q.deployed();

    let factory = await ethers.getContractFactory("Staking");
    let staking_test = await factory.connect(owner).deploy(
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
    await staking_test.deployed();

    factory = await ethers.getContractFactory("LightClientTest");
    let light_client_test = await factory.connect(owner).deploy(_epoch_period, staking_test.address, w3q.address,CHAINID_UINT);
    await light_client_test.deployed();
    await staking_test.setLightClient(light_client_test.address);
    await w3q.setLightClient(light_client_test.address);

    let orderVals = [];

    let staking_w3q_balance = BigNumber.from(0);
    let mintAmount = w3qUint.mul(100);
    for (let i = 0; i < signers.length; i++) {
      let _wallet = signers[i];
      orderVals.push(_wallet.address);

      await w3q.connect(owner).mint(_wallet.address, mintAmount);
      await w3q.connect(_wallet).approve(staking_test.address, mintAmount);

      await staking_test.connect(_wallet).initializeValidator(_wallet.address, _minSelfDelegation, 0);
      let delegateAmount = mintAmount.sub(_minSelfDelegation);
      await staking_test.connect(_wallet).delegate(_wallet.address, delegateAmount);
      staking_w3q_balance = staking_w3q_balance.add(mintAmount);

      await staking_test.connect(_wallet).bondValidator();
      check("W3Q_BALANCE", await w3q.balanceOf(_wallet.address), 0);
      check("W3Q_BALANCE", await w3q.balanceOf(staking_test.address), staking_w3q_balance);
      check("VALIDATOR_TOKENs", await staking_test.getValidatorTokens(_wallet.address), mintAmount);
    }
    // reward validators
    let [vals, powers] = await staking_test.proposedValidators();
    let b32Empty = "0x0000000000000000000000000000000000000000000000000000000000000000";
    await light_client_test.initEpoch(vals, powers, 0, b32Empty);

    let produces = powers;

    console.log("perEpochWard", (await w3q.perEpochReward()).toString());
    console.log("w3q balance:", (await w3q.balanceOf(staking_test.address)).toString());

    let staking_w3q_origin_blanace = await w3q.balanceOf(staking_test.address);
    let _perEpochReward = await w3q.perEpochReward();
    await w3q.connect(owner).transferOwnership(light_client_test.address);
    await light_client_test.epochReward(produces);

    console.log("_________________________After_Reward________________________");

    let staking_w3q_latest_blanace = await w3q.balanceOf(staking_test.address);
    check("Staking W3q Balance", staking_w3q_origin_blanace.add(_perEpochReward), staking_w3q_latest_blanace);
    for (let i = 0; i < signers.length; i++) {
      let tokenRewarded = _perEpochReward.div(BigNumber.from(signers.length));
      check(
        "Validator Token",
        await staking_test.getValidatorTokens(signers[i].address),
        mintAmount.add(tokenRewarded)
      );
    }
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

  it("submit epoch heads ", async function () {
    let epochs_wallet = [];
    await w3q.connect(owner).transferOwnership(test.address);
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
      await w3q.connect(owner).transferOwnership(test.address);
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
    await w3q.connect(owner).transferOwnership(test.address);

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
    normalHead2.genExtra(["0x01"]);
    normalHead2.setBlockHeight(BigNumber.from(CurrentEpochEnd).toHexString());
    const revertHeadList = [];
    revertHeadList.push(normalHead2);
    await expect(submitNormalHead(revertHeadList, epochs_wallet, period, test)).to.be.revertedWith("incorrect length");

    // begin submit
    await submitNormalHead(headList, epochs_wallet, period, test);
  });

  it("submit epoch head out-of-order signatures", async function () {
    await w3q.transferOwnership(test.address);
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

      let tx2 = await test.submitHeader(epochHeight2, rlpHeader2, commitBytes2, false);
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
