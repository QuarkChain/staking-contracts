const { BigNumber } = require("ethers");
const { ethers, web3 } = require("hardhat");
const {Config} = require("./config/config")
// const {ethers} = require("ethers")

let main = async function () {
  
  let signers = await ethers.getSigners();
  let owner = signers[0]

  console.log(signers)

  let preConfig = new Config('./config.yaml')
  let w3qcfg = preConfig.getW3Q()
  let erc20Factory = await ethers.getContractFactory("W3qERC20");
  let w3q = await erc20Factory.deploy(w3qcfg.params.name,w3qcfg.params.symbol);
  await w3q.deployed()

  w3qcfg.address = w3q.address
  preConfig.setW3Q(w3qcfg)
  preConfig.save('./config.yaml')
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  