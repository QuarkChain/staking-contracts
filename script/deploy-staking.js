const { ethers } = require("hardhat");

let main =async function(){

    let factory = await ethers.getContractFactory("TestStaking");
    let test = await factory.deploy(
            "0x8072113C11cE4F583Ac1104934386a171f5f7c3A",
            10000,//_proposalDeposit
            10000,//_votingPeriod
            10000,//_unbondingPeriod
            100,//_maxBondedValidators
            100,//_minValidatorTokens
            10000,//_minSelfDelegation
            10000,//_advanceNoticePeriod
            10000,//_validatorBondInterval
            10000//_maxSlashFactor
        );
        await test.deployed();

    let validators = [
        "0x5C935469C5592Aeeac3372e922d9bCEabDF8830d",
        "0xf2281287ED0b4711c5249f6FE749dC792E37B4e8",
        "0x9317D5F30ff07ff091b2cC6fA170Ca418ca14380",
        ]; 
    let powers = [3, 3, 3];

    let tx = await test.InitEpochValidatorsTest(1,validators,powers)
    let receipt = await tx.wait();
    console.log("deploy succeed! Receipt is:\n",receipt)

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });