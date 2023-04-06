const { expect } = require("chai");
const { sign } = require("crypto");
const { BigNumber } = require("ethers");
const { ethers, web3 } = require("hardhat");
const {Config} = require("./config/config")

let epochPeriod = 1000;
async function main() {

  let globalConfig = new Config()
  let deployParams = globalConfig.getLightClientParams()
  
  let staking_addr = deployParams.staking;
  let staking = await ethers.getContractAt("Staking",staking_addr)

  let w3q_addr = globalConfig.getW3QAddress();
  let w3q = await ethers.getContractAt("W3qERC20",w3q_addr)
  
  let signers = await ethers.getSigners();
  let owner = signers[0];

  console.log("deploy light client ...");
  let factory2 = await ethers.getContractFactory("LightClient");
  let lc = await factory2.connect(owner).deploy(BigNumber.from(deployParams.epochPeriod), staking_addr,globalConfig.getW3QAddress(),deployParams.chainId);
  await lc.deployed();
  
  console.log("Initalize Epoch ...");
  let [validators,powers] = await staking.proposedValidators();
  console.log("_____________😄 get proposedValidators() from Staking___________________")
  for (let i =0 ;i < validators.length;i++){
    console.log("Addr:",validators[i],"   Powers:",powers[i].toNumber())
  }

  let tx = await lc.connect(owner).initEpoch(
    validators,
    powers,
    0,
    deployParams.genesisBlockHash
  );
  await tx.wait();
  let [currentEpochIdx, currentVals, currentPowers] = await lc.getCurrentEpoch();
  console.log("__________________________________Current Epoch Info_______________________________")
  console.log("Current Epoch Idx:",currentEpochIdx, "\nCurrent Epoch Validators:", currentVals,"\nCurrent Epoch VotePowers:", currentPowers);
  let nextHeight = await lc.getNextEpochHeight();
  console.log("Next Epoch Block Height:", nextHeight.toNumber());

  console.log("_________________________________Contract Info____________________________________")
  let tx1 = await staking.setLightClient(lc.address);
  await tx1.wait();
  console.log("light client:", lc.address);

  // check w3q and staking 
  let lcAtStaking = await staking.lightClient();
  if (lcAtStaking!=lc.address) {
    console.log("staking_lc:", lcAtStaking, " lignt-client:",lc.address);
  }

  let tx2 = await w3q.transferOwnership(lc.address);
  await tx2.wait();

  let w3qowner = await w3q.owner();
  if (w3q.address!=lc.address) {
    console.log(" w3q owner:", w3qowner, " lighting-client:",lc.address);
  }

  deployParams.validators = validators
  deployParams.votePowers = powers
  globalConfig.setLightClientParams(deployParams)
  globalConfig.LightClient.address = lc.address
  globalConfig.LightClient.owner = owner.address
  globalConfig.save()

};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
