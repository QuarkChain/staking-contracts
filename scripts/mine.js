const { ethers } = require("hardhat");

async function main() {
  console.log("network:", hre.network.name)
  // mine
  while (true) {
    await new Promise(r => setTimeout(r, 2000));
    await ethers.provider.send('evm_mine');
    console.log("block", await ethers.provider.getBlockNumber())
  }

}


main()