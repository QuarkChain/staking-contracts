require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@tenderly/hardhat-tenderly");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [{
      version: "0.5.17",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }, {
      version: "0.6.12",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }, {
      version: "0.8.9",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }]
  },
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0, // workaround from https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136 . Remove when that issue is closed.
      accounts:
      process.env.PRIVATE_KEY !== undefined ? 
        [
          {privateKey : process.env.PRIVATE_KEY,balance:"10000000000000000000000"},
          {privateKey : "0x7ced114b2cd194d46bc4b9f4d81818b4ed5860e28a2c350849bfe2d4a41ada02",balance:"0"},
          {privateKey : "0x8000a89f9bfbeaf4cd164319481bd675280676d00e4bb12c83802e0b00225527",balance:"0"},
          {privateKey : "0x4a006b3dfd0dfc8131bd596a7f8de2d418e90cb6e7e9effac7166b04fb153337",balance:"0"},
          {privateKey : "0x8de23ff93e1e67c2689ef0fac136631da09dd4f48625578e70816ae0ca6814dd",balance:"0"},
          {privateKey : "0x83f91c53b3b8fcac8a356fab003a90437cad93c0b2f8d8720c58505f144c6ef4",balance:"0"},
        ] 
        : [],
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    rinkeby: {
      url: process.env.RINKEBY_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? 
        [
          process.env.PRIVATE_KEY,
          "0x7ced114b2cd194d46bc4b9f4d81818b4ed5860e28a2c350849bfe2d4a41ada02",
          "0x8000a89f9bfbeaf4cd164319481bd675280676d00e4bb12c83802e0b00225527",
          "0x4a006b3dfd0dfc8131bd596a7f8de2d418e90cb6e7e9effac7166b04fb153337",
          "0x8de23ff93e1e67c2689ef0fac136631da09dd4f48625578e70816ae0ca6814dd",
          "0x83f91c53b3b8fcac8a356fab003a90437cad93c0b2f8d8720c58505f144c6ef4",
          "0x35729b6e6ee10000eb3342215136cbff99b0f2ed9d2841492d3cc25777877f7d",
        ] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
