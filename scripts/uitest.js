const fs = require("fs");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const fetch = require('node-fetch');

const epochPeriod = 50;
const unbondingPeriod = 10;

const sideChainProvider = ethers.getDefaultProvider('https://galileo.web3q.io:8545');

async function generateSignature(data, acc) {
  return ethers.utils.joinSignature(await acc.signDigest(dataHash(data)));
}

class Header {
  constructor(validators, powers) {
    this.ParentHash = "0x112233445566778899001122334455667788990011223344556677889900aabb";
    this.UncleHash = "0x000033445566778899001122334455667788990011223344556677889900aabb";
    this.Coinbase = "0xD76Fb45Ed105f1851D74233f884D256C4FdAd634";
    this.Root = "0x1100000000000000000000000000000000000000000000000000000000000011";
    this.TxHash = "0x2200000000000000000000000000000000000000000000000000000000000022";
    this.ReceiptHash = "0x3300000000000000000000000000000000000000000000000000000000000033";
    this.Bloom = "0x1234";
    this.Difficulty = "0x1100";
    this.Number = "0x2710"; //10000
    this.GasLimit = "0x900008";
    this.GasUsed = "0x8000918271";
    this.Time = "0x98765372";
    this.Extra = "0x030101010101010101010101010101010101010101010101010101010101010101010101";
    this.MixDigest = "0x4400000000000000000000000000000000000000000000000000000000000044";
    this.Nonce = "0x0102030405060708";
    this.BaseFee = "0x1777";
    this.TimeMs = "0x221111";
    this.NextValidators = validators;
    this.NextValidatorPowers = powers;
    this.LastCommitHash = "0x7700000000000000000000000000000000000000000000000000000000000011";
  }

  setBlockHeight(height) {
    this.Number = BigNumber.from(height).toHexString();
  }

  genHeadRlp(head) {
    return rlpdata(Object.values(head))
  }

  genHeadhash(head) {
    return dataHash(rlpdata(Object.values(head)))
  }

  setNextVals(vals, powers) {
    this.NextValidators = vals
    this.NextValidatorPowers = powers;
  }

}

function rlpdata(data) {
  return ethers.utils.RLP.encode(data);
}

function dataHash(rlpBytes) {
  return ethers.utils.keccak256(rlpBytes);
}

class Commit {
  constructor(height, round, blockId, vals) {
    this.height = height;
    this.round = round;
    this.blockId = blockId;
    let allsigs = [];
    for (let k = 0; k < vals.length; k++) {
      let _sig = ["0x02", vals[k], "0x1234"];
      allsigs.push(_sig);
    }
    this.signatures = allsigs;
  }

  genCommitRlp(commit) {
    return rlpdata(Object.values(commit))
  }
}
class Vote {
  constructor(commit, chainID, sigIdx) {
    this.type = "0x02";
    this.height = commit.height;
    this.round = commit.round;
    this.blockId = commit.blockId;
    this.TimestampMs = commit.signatures[sigIdx][2];
    this.chainID = chainID;
  }
}

// chainID = "evm_3334"
const CHAIN_ID = "0x65766d5f33333334";
function voteSignBytes(commit, chainId, Idx) {
  let newVote = new Vote(commit, chainId, Idx);
  return rlpdata(Object.values(newVote));
}

async function deploy(contractName, args) {
  let Contract = await hre.ethers.getContractFactory(contractName);
  console.log(`Deploying contract ${contractName}`);
  const contract = await Contract.deploy(...args);
  await contract.deployed();
  console.log(`Contract ${contractName} deployed to ${contract.address}`);
  return contract;
}

async function deployContracts() {
  let erc20Addr = "0x763a0d8B5FfF0Ae766bA643d666e53B7Df6b3C6d"; //rinkeby
  if (hre.network.name === "localhost") {
    const erc20 = await deploy("ERC20Mock", []);
    const wallet = new ethers.Wallet('0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a')
    const wlt = wallet.connect(ethers.provider);
    const signers = await hre.ethers.getSigners();
    erc20Addr = erc20.address;
    for (let v of signers) {
      const tx = await erc20.transfer(v.address, ethers.utils.parseEther("1000"));
      await tx.wait();
      await wlt.sendTransaction({
        to: v.address,
        value: ethers.utils.parseEther("1")
      });
      const erc = await erc20.balanceOf(v.address);
      const bal = await ethers.provider.getBalance(v.address);
      console.log("signer", v.address, "eth", ethers.utils.formatEther(bal), "w3q", ethers.utils.formatEther(erc))
    }
  }

  const args = [
    erc20Addr,   //_TokenAddress,
    10000,           //_proposalDeposit,
    epochPeriod,     //_votingPeriod,
    unbondingPeriod,              //_unbondingPeriod,
    30,              //_maxBondedValidators,
    BigNumber.from(100).mul(ethers.constants.WeiPerEther),             //_minValidatorTokens,
    BigNumber.from(10).mul(ethers.constants.WeiPerEther),              //_minSelfDelegation,
    1000,            //_advanceNoticePeriod,
    5,               //_validatorBondInterval,
    1000,    		 //_maxSlashFactor,        
  ];

  const staking = await deploy("Staking", args);
  const light = await deploy("LightClient", [epochPeriod, staking.address]);

  fs.writeFileSync(
    __dirname + "/contract-address-" + hre.network.name + ".json",
    JSON.stringify({ erc20: erc20Addr, staking: staking.address, lightClient: light.address }, null, 2)
  );
}

function getSignerByAddr(addr) {
  const keys = require("./keys.json");
  const item = keys.find(s => s.address.toLowerCase() === addr.toLowerCase());
  if (!item) {
    throw "privateKey is not available for " + addr;
  }
  return new ethers.utils.SigningKey(item.privateKey);
}

async function getLightClient() {
  let lightAddr = require("./contract-address-" + hre.network.name + ".json").lightClient;
  let Contract = await hre.ethers.getContractFactory("LightClient");
  const light = await Contract.attach(lightAddr);
  return light;
}

async function initLightClient() {

  let light = await getLightClient();
  let [vals, powers] = await light.proposedValidators();
  powers = powers.map(p => p.toHexString())
  console.log("vals", vals, "powers", powers)
  try {
    let newHeader = new Header(vals, powers);
    const curHeight = await sideChainProvider.getBlockNumber();
    newHeader.setBlockHeight(curHeight);
    console.log("curHeight", curHeight)
    let headerHash = newHeader.genHeadhash(newHeader);

    let tx = await light.initEpoch(vals, powers, curHeight, headerHash);
    await tx.wait();

  } catch (error) {
    throw error;
  }
}


async function toNextEpoch() {
  let light = await getLightClient();
  let [[epoch, curSigners,], next, curHeight] = await Promise.all([light.getCurrentEpoch(), light.getNextEpochHeight(), sideChainProvider.getBlockNumber()]);
  console.log("current Epoch=" + epoch, "NextEpochHeight=" + next, "current height=" + curHeight);
  if (next > curHeight) {
    console.log("too early to submit head")
    return
  }
  console.log("curSigners=", curSigners);
  let [vals, powers] = await light.proposedValidators();
  console.log("proposedValidators: ", "vals", vals)
  powers = powers.map(p => p.toHexString())
  let newHeader = new Header(vals, powers);
  newHeader.setBlockHeight(next);
  let rlpheaderBytes = newHeader.genHeadRlp(newHeader);
  let headerHash = newHeader.genHeadhash(newHeader);
  let commit = new Commit(newHeader.Number, "0x02", headerHash, curSigners);

  for (let k = 0; k < curSigners.length; k++) {
    const wallet = getSignerByAddr(curSigners[k]);
    let dataToSign = voteSignBytes(commit, CHAIN_ID, k);
    let dataSignature = await generateSignature(dataToSign, wallet);
    commit.signatures[k].push(dataSignature);
  }
  let commitBytes = rlpdata(Object.values(commit));
  let tx1 = await light.submitHead(rlpheaderBytes, commitBytes);
  let receipt1 = await tx1.wait();
  console.log("submitHead done", receipt1.status);

  [currentEpochIdx, vals,] = await light.getCurrentEpoch();
  console.log("current Epoch", currentEpochIdx, "vals", vals)

}
async function mineBlocks(n) {
  for (let index = 0; index < n; index++) {
    await ethers.provider.send('evm_mine');
  }
}

async function register(initValidatorCount) {
  let tx;
  let rt;
  const path = "scripts/png-64/";
  const files = fs.readdirSync(path);
  const keys = require("./keys.json");
  const validators = keys.slice(0, initValidatorCount);
  const signers = keys.slice(initValidatorCount, initValidatorCount * 2);
  let stakingAddr = require("./contract-address-" + hre.network.name + ".json").staking;
  let stakingContract = await hre.ethers.getContractFactory("Staking");
  const staking = await stakingContract.attach(stakingAddr);
  const tokenAddr = await staking.CELER_TOKEN();
  const tokenContract = await hre.ethers.getContractFactory("ERC20Mock");
  const token = await tokenContract.attach(tokenAddr);
  for (let i = 0; i < initValidatorCount; i++) {
    let { privateKey, address } = validators[i];
    console.log(`validator ${i}: ${address}`);
    const name = "validator" + i;
    const avatar = "data:image/png;base64," + fs.readFileSync(path + files[i], { encoding: 'base64' });
    const profile = {
      name,
      url: "http://" + name + ".com",
      avatar,
    };
    const _validatorBondInterval = 5; // FIXME
    try {
      const res = await upload(address, profile);
      console.log("uploaded", res);

      const wallet = new ethers.Wallet(privateKey).connect(ethers.provider);
      tx = await token.connect(wallet).approve(stakingAddr, ethers.constants.MaxUint256, { gasLimit: 50000 });
      rt = await tx.wait();
      console.log(`approve ${address}: ${rt.status}`)
      const amount = ethers.utils.parseEther("10" + i);
      const commissionRate = "10" + i;
      tx = await staking.connect(wallet).initializeValidator(signers[i].address, amount, commissionRate, { gasLimit: 400000 });
      rt = await tx.wait();
      console.log(`signer ${signers[i].address}: ${rt.status}`)
      tx = await staking.connect(wallet).bondValidator({ gasLimit: 140000 });
      rt = await tx.wait();
      console.log(`bond ${signers[i].address}: ${rt.status}`)
      if (hre.network.name === 'localhost') {
        await new Promise(r => setTimeout(r, _validatorBondInterval * 2 * 1000));
      }
      if (hre.network.name === 'rinkeby') {
        await new Promise(r => setTimeout(r, _validatorBondInterval * 4 * 1000));
      }
    } catch (e) {
      console.error(e);
      break;
    }
  }
}

async function upload(address, profile) {
  const url = "http://35.89.131.53:3000/" + address.toLocaleLowerCase();
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  };
  const response = await fetch(url, requestOptions);
  return response.json();
}

async function main() {
  console.log("network:", hre.network.name)
  // step 1 deploy
  // await deployContracts();

  // step 2 PoS register and bond
  // await register(3);

  // step 3 init Epoch
  // await initLightClient();

  // step 4 move submit header

  // await toNextEpoch()
  // setInterval(async () => {
  //   await toNextEpoch()
  // }, 10000);
  
  while (true) {
    await new Promise(r => setTimeout(r, 2000));
    await ethers.provider.send('evm_mine');
    console.log("block", await ethers.provider.getBlockNumber())
  }

}


main()