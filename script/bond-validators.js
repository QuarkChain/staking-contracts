const { expect } = require("chai");
const { sign } = require("crypto");
const { BigNumber } = require("ethers");
const { ethers, web3 } = require("hardhat");
const { globalAgent } = require("http");
const {Config} = require("./config/config")
// const {ethers} = require("ethers")

let main = async function () {
  
  let globalConfig = new Config()

  let epochPeriod = 10000;
  let w3qUint = BigNumber.from("1000000000000000000")
  let ETH = BigNumber.from("500000000000000000")
  let mintAmount = w3qUint.mul(1000)

  let _unbondingPeriod = 3 * epochPeriod;
  let _maxBondedValidators = 5
  let _minValidatorTokens = w3qUint
  let _minSelfDelegation = w3qUint
  let _validatorBondInterval = 1
  
  let signers = await ethers.getSigners();
  console.log("Signers Addr:")
  signers.forEach((value,index)=>{
      console.log("[",index,"] Val:",value.address)
  })
  let owner = signers[0]
  let vals = signers.slice(1,signers.length)
  let operator_addr = "0xcD21538aF6e33fF6fcF1E2Ca20F771413004CFd3"
  let operator = signers[3];
  if (operator.address != operator_addr){
    console.error("error operator address");
    return 
  }
  console.log("Operator Addr:",operator.address)
//   for (let i = 0;i<vals.length;i++){
//     if (vals[i].address == operator_addr){
//         operator = vals[i];
//         break;
//     }
//   }

  let w3q_addr = globalConfig.getW3QAddress();
  let staking_addr = globalConfig.getStakingAddress();
  let w3q = await ethers.getContractAt("W3qERC20",w3q_addr);
  let staking = await ethers.getContractAt("TestStaking",staking_addr);


console.log("_______________[",operator.address,"] validators Bonding__________________")

// transfer eth

await w3q.connect(owner).mint(operator.address,mintAmount.mul(2))

await owner.sendTransaction({to:operator.address,value:ETH})
await w3q.connect(operator).approve(staking.address,mintAmount)

console.log("initializeValidator()....")
await staking.connect(operator).initializeValidator(operator.address,_minSelfDelegation,0,{gasLimit:600000});
await staking.connect(operator).delegate(operator.address,w3qUint.mul(10),{gasLimit:300000});
console.log("bondValidator()....")
await staking.connect(operator).bondValidator({gasLimit:300000});


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  