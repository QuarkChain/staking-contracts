const { ethers } = require("hardhat");

let main =async function(){

    let test = await ethers.getContractAt("TestStaking","0xD299dB497215ae1A4581eF8BA9A2F932a95E58FF");

    let validators = [
        "0x2cff0b8e36522eba76f6f5c328d58581243882e4",
        "0x959994471dee37411f579dd2820a8743cba20f46",
        "0x977cfc676bb06daed7ddfa7711bcfe8d50c93081",
        "0xcd21538af6e33ff6fcf1e2ca20f771413004cfd3",
        ]; 
    let powers = [1, 1, 1 , 1];

    let tx1= await test.InitProposalVals(validators,powers)
    let receipt1 = await tx1.wait();
    
    let[ _vals , _powers ] = await test.proposalValidators()
    console.log(_vals,_powers)
    console.log("Receipt is:\n",receipt1)

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });