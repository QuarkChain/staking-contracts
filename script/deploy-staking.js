const { expect } = require("chai");
const { sign } = require("crypto");
const { BigNumber } = require("ethers");
const { ethers, web3 } = require("hardhat");
// const {ethers} = require("ethers")

let main = async function () {
  
  let epochPeriod = 10000;
  let w3qUint = BigNumber.from("1000000000000000000")
  let ETH = BigNumber.from("300000000000000000")
  let mintAmount = w3qUint.mul(1000)

  let _unbondingPeriod = 3 * epochPeriod;
  let _maxBondedValidators = 5
  let _minValidatorTokens = w3qUint
  let _minSelfDelegation = w3qUint
  let _validatorBondInterval = 1
  
  let signers = await ethers.getSigners();
  let owner = signers[0]
  let vals = signers.slice(1,signers.length)
  console.log("get from config:",owner.address,vals.length)

  let erc20Factory = await ethers.getContractFactory("W3qERC20");
  let w3q = await erc20Factory.connect(owner).deploy("Web3Q Native Token","W3Q");
  await w3q.deployed()

  let factory = await ethers.getContractFactory("TestStaking");
  let staking = await factory.connect(owner).deploy(
    w3q.address,
    10000, //_proposalDeposit
    10000, //_votingPeriod
    _unbondingPeriod,
    _maxBondedValidators,
    _minValidatorTokens,
    _minSelfDelegation,
    10000, //_advanceNoticePeriod
    _validatorBondInterval,
    10000 //_maxSlashFactor
  );
  await staking.deployed();

  for (let i = 0;i<4;i++){
    console.log("_______________[",i,"] validators Bonding__________________")
  
    // transfer eth
    await owner.sendTransaction({to:vals[i].address,value:ETH})
    await w3q.connect(owner).mint(vals[i].address,mintAmount)
    await w3q.connect(vals[i]).approve(staking.address,mintAmount)

    console.log("initializeValidator()....")
    // let gasEst = staking.estimateGas.initializeValidator(vals[i].address,_minSelfDelegation,0)
    await staking.connect(vals[i]).initializeValidator(vals[i].address,_minSelfDelegation,0,{gasLimit:600000});
    await staking.connect(vals[i]).delegate(vals[i].address,w3qUint.mul(10),{gasLimit:300000});
    console.log("bondValidator()....")
    await staking.connect(vals[i]).bondValidator({gasLimit:300000});
  } 

  let [validators,powers] = await staking.proposedValidators();
  console.log("_____________😄 get proposedValidators() from Staking___________________")
  for (let i =0 ;i < validators.length;i++){
    console.log("Addr:",validators[i],"   Powers:",powers[i].toNumber())
  }

  console.log("_________________________________Contract Info____________________________________")
  console.log("w3q:",w3q.address)
  console.log("staking:",staking.address)

};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
