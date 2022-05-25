const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
// const {ethers} = require("ethers")
const epochPeriod = 10000;
let main = async function () {

  let erc20Factory = await ethers.getContractFactory("W3qERC20");
  let erc20 = await erc20Factory.deploy("w3qErc20","w3q");
  await erc20.deployed()

  let user_addr = "0x6D4a199f603b084a2f1761Dc9F322F92E68bfd5E"
  await erc20.mint(user_addr,BigNumber.from("1000000000000000000000000"))

  let factory = await ethers.getContractFactory("TestStaking");
  let staking = await factory.deploy(
    erc20.address,
    10000, //_proposalDeposit
    10000, //_votingPeriod
    10000, //_unbondingPeriod
    4, //_maxBondedValidators
    100, //_minValidatorTokens
    10000, //_minSelfDelegation
    10000, //_advanceNoticePeriod
    10000, //_validatorBondInterval
    10000 //_maxSlashFactor
  );
  await staking.deployed();

  let validators = [
    "0x2cff0b8e36522eba76f6f5c328d58581243882e4",
    "0x959994471dee37411f579dd2820a8743cba20f46",
    "0x977cfc676bb06daed7ddfa7711bcfe8d50c93081",
    "0xcd21538af6e33ff6fcf1e2ca20f771413004cfd3",
  ];
  let powers = [1, 1, 1, 1];

  let tx1 = await staking.initProposalVals(validators, powers);
  let receipt1 = await tx1.wait();

  let [_vals, _powers] = await staking.proposedValidators();
  console.log(_vals, _powers);

  console.log("deploy light client");
  let factory2 = await ethers.getContractFactory("LightClient");
  let lc = await factory2.deploy(epochPeriod, staking.address);
  await lc.deployed();
  

  console.log("Init epoch");
  let tx = await lc.initEpoch(
    validators,
    powers,
    0,
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  );
  await tx.wait();
  let [currentEpochIdx, currentVals, currentPowers] = await lc.getCurrentEpoch();
  console.log(currentEpochIdx, currentVals, currentPowers);
  let nextHeight = await lc.getNextEpochHeight();
  console.log("next epoch hetight:", nextHeight);


  console.log("w3q:",erc20.address)
  console.log("Balance:",await erc20.balanceOf(user_addr))
  console.log("staking:",staking.address)
  console.log("light client:", lc.address);

};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
