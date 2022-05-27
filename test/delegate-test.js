const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

function check(f, got, want) {
  expect(got).to.eq(want, f);
}

function checkArray(f, got, want) {
  got.forEach((v, i) => {
    expect(v).to.eq(want[i], f);
  });
}

async function deploy(contractName, args) {
  let Contract = await hre.ethers.getContractFactory(contractName);
  console.log(`Deploying contract ${contractName}`);
  const contract = await Contract.deploy(...args);
  await contract.deployed();
  console.log(`Contract ${contractName} deployed to ${contract.address}`);
  return contract;
}

describe.only("delegate test", function () {
  let w3q;
  let staking;
  const vals = [];
  beforeEach(async () => {
    w3q = await deploy("W3Q", []);

    const args = [
      w3q.address,   //_TokenAddress,
      10000,           //_proposalDeposit,
      50,     //_votingPeriod,
      10,              //_unbondingPeriod,
      30,              //_maxBondedValidators,
      BigNumber.from(100).mul(ethers.constants.WeiPerEther),             //_minValidatorTokens,
      BigNumber.from(10).mul(ethers.constants.WeiPerEther),              //_minSelfDelegation,
      1000,            //_advanceNoticePeriod,
      5,               //_validatorBondInterval,
      1000,    		 //_maxSlashFactor,        
    ];

    staking = await deploy("Staking", args);

    const vSize = 4;
    let tx, rt;
    const [owner] = await ethers.getSigners();
    for (let i = 0; i < vSize; i++) {
      let wallet = ethers.Wallet.createRandom();
      vals.push(wallet);
      tx = await w3q.transfer(wallet.address, ethers.utils.parseEther("1000"));
      rt = await tx.wait();
      console.log(`transfer w3q ${wallet.address}: ${rt.status}`)
      rt = await owner.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther("1")
      });
      console.log(`transfer ether ${wallet.address}`)
      wallet = wallet.connect(ethers.provider);
      tx = await w3q.connect(wallet).approve(staking.address, ethers.constants.MaxUint256);
      rt = await tx.wait();
      console.log(`approve ${wallet.address}: ${rt.status}`)
      const amount = ethers.utils.parseEther("10" + i);
      const commissionRate = "10" + i;
      const signer = ethers.Wallet.createRandom();
      tx = await staking.connect(wallet).initializeValidator(signer.address, amount, commissionRate);
      rt = await tx.wait();
      console.log(`signer ${signer.address}: ${rt.status}`)
    }
    const size = await staking.getValidatorNum();
    check("size", size, vSize);
    const tokens = await staking.getValidatorTokens(vals[2].address);
    check("token", tokens, ethers.utils.parseEther("102"));
    const delegators = await staking.getDelegators(vals[2].address);
    checkArray("delegators", delegators, [vals[2].address])
  });


  it("delegate", async function () {
    const validitor = vals[2].connect(ethers.provider);
    const delegator = vals[0].connect(ethers.provider);
    tx = await staking.connect(delegator).delegate(validitor.address, ethers.utils.parseEther("100"));
    rt = await tx.wait();
    let delegators = await staking.getDelegators(validitor.address);
    checkArray("delegators", delegators, [validitor.address, delegator.address]);
    let { tokens } = await staking.getDelegatorInfo(validitor.address, validitor.address);
    tx = await staking.connect(validitor).undelegateTokens(validitor.address, tokens);
    rt = await tx.wait();
    delegators = await staking.getDelegators(validitor.address);
    checkArray("delegators", delegators, [delegator.address]);
    ({ tokens } = await staking.getDelegatorInfo(validitor.address, delegator.address));
    tx = await staking.connect(delegator).undelegateTokens(validitor.address, tokens);
    rt = await tx.wait();
    delegators = await staking.getDelegators(validitor.address);
    checkArray("delegators", delegators, []);
  });
});
