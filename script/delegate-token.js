const { BigNumber } = require("ethers");
const { ethers, web3 } = require("hardhat");
// const {ethers} = require("ethers")

let main = async function () {
  
  let w3qUint = BigNumber.from("1000000000000000000")
  
  let signers = await ethers.getSigners();
  console.log("Signers Addr:")
  signers.forEach((value,index)=>{
      console.log("[",index,"] Val:",value.address)
  })
  let owner = signers[0]
  let vals = signers.slice(1,signers.length)
  let operator = signers[1];
  console.log("Operator Addr:",operator.address)

  let w3q_addr = "0x2b40280d19AC1a2E236D32F436e536F9a3B66899";
  let staking_addr = "0x45b5F64D9C76c3d4Cfb7a5064051fd60Bf8F819F";
  let w3q = await ethers.getContractAt("W3qERC20",w3q_addr);
  let staking = await ethers.getContractAt("TestStaking",staking_addr);

  console.log("delegate()....")
  await w3q.connect(owner).mint(operator.address,w3qUint)
  await w3q.connect(operator).approve(staking.address,w3qUint)
  await staking.connect(operator).delegate(operator.address,w3qUint,{gasLimit:300000});
//   console.log("bondValidator()....")
//   await staking.connect(operator).bondValidator({gasLimit:300000});
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  