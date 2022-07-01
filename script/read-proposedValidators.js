const { expect } = require("chai");
const { sign } = require("crypto");
const { BigNumber } = require("ethers");
const { ethers, web3 } = require("hardhat");
// const {ethers} = require("ethers")

let main = async function () {
    let staking_addr = "0x3be5d916bA636f0E8291cE587F940Bb609acf91c";
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
  