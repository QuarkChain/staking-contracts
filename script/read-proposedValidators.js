const { expect } = require("chai");
const { sign } = require("crypto");
const { BigNumber } = require("ethers");
const { ethers, web3 } = require("hardhat");
const {Config} = require("./config/config")

let main = async function () {

  let globalConfig = new Config()
  let staking_addr = globalConfig.Staking.address 
  let staking = await ethers.getContractAt("TestStaking",staking_addr);
  let vals
  let powers
  [vals,powers] = await staking.proposedValidators();
  console.log("_____________😄 get proposedValidators() from Staking___________________")
  for (let i =0 ;i < vals.length;i++){
    console.log("Addr:",vals[i],"   Powers:",powers[i].toNumber())
  }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  