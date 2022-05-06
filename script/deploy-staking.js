const { expect } = require("chai");
const { ethers } = require("hardhat");
// const {ethers} = require("ethers")
const epochPeriod = 10000
let main =async function(){

    let factory = await ethers.getContractFactory("TestStaking");
    let staking = await factory.deploy(
            "0x8072113C11cE4F583Ac1104934386a171f5f7c3A",
            10000,//_proposalDeposit
            10000,//_votingPeriod
            10000,//_unbondingPeriod
            4,//_maxBondedValidators
            100,//_minValidatorTokens
            10000,//_minSelfDelegation
            10000,//_advanceNoticePeriod
            10000,//_validatorBondInterval
            10000//_maxSlashFactor
        );
        await staking.deployed();

    let validators = [
        "0xC7B6Ad1038b5a79c12B066d6E3e8972f3EceaDe7",
        "0x90A7BfF0B4b11F365367d4C9fE084223c850B229",
        "0x9b29aD441B195B641aA0A45ad4085c51DA62FE54",
        "0x1B47a4d3266213354d59ECAF338A4698177819d1"
        ]; 
    let powers = [1, 1, 1, 1];

    let tx1= await staking.initProposalVals(validators,powers)
    let receipt1 = await tx1.wait();

    let[ _vals , _powers ] = await staking.proposalValidators()
    console.log(_vals,_powers)


    let factory2 = await ethers.getContractFactory("LightClient");
    let lc = await factory2.deploy(epochPeriod, staking.address);
    await lc.deployed();
    console.log("LC:",lc.address)

    let tx = await lc.initEpoch(validators, powers, 0, "0x864e3e31173c40a384f8b0fd15b80accd229be020d6ae97fcf4036106aee77b1");
    await tx.wait()
    let [currentEpochIdx, currentVals, currentPowers] = await lc.getCurrentEpoch();
    console.log(currentEpochIdx,currentVals,currentPowers)

    
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });