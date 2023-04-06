const { expect } = require("chai");
const { sign } = require("crypto");
const { BigNumber } = require("ethers");
const { ethers, web3 } = require("hardhat");
const {Config} = require("./config/config")

let main = async function () {
  
  let globalConfig = new Config()
  let deployParams = globalConfig.getStakingParams()

  let w3qUint = BigNumber.from("1000000000000000000")
  let ETH = BigNumber.from("700000000000000000")
  let mintAmount = w3qUint.mul(1000)

  let signers = await ethers.getSigners();
  let owner = signers[0]
  let vals = signers.slice(1,signers.length)
  console.log("get from config:",owner.address,vals.length)

  /*
      deploy w3q ERC20 contract
  */
  let w3qcfg = globalConfig.getW3Q()
  let erc20Factory = await ethers.getContractFactory("W3qERC20");
  let w3q = await erc20Factory.deploy(w3qcfg.params.name,w3qcfg.params.symbol);
  await w3q.deployed();
  await w3q.setPerEpochReward(w3qUint);
  w3qcfg.address = w3q.address
  globalConfig.setW3Q(w3qcfg)

  /**
   * deploy staking contract
   */
  let factory = await ethers.getContractFactory("TestStaking");
  let staking = await factory.connect(owner).deploy(
    w3q.address,
    deployParams.proposalDeposit, 
    deployParams.votingPeriod, 
    deployParams.unbondingPerod,
    deployParams.maxBondedValidators,
    deployParams.minValidatorTokens,
    deployParams.minSelfDelegation,
    deployParams.advanceNoticePeriod,
    deployParams.validatorBondInterval,
    deployParams.maxSlashFactor
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
    await staking.connect(vals[i]).initializeValidator(vals[i].address,deployParams.minSelfDelegation,0,{gasLimit:600000});
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
  globalConfig.setStakingAddress(staking.address)
  globalConfig.setStakingOwner(owner.address)
  globalConfig.save()
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
