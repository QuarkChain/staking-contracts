const { ethers } = require("hardhat");

let main =async function(){

    let test = await ethers.getContractAt("LightClient","0x34803e21ba27db4e05989e4e97804b00510a3cd1");

    let validators = [
        "0x2cfF0b8e36522eBA76F6f5c328D58581243882e4",
        "0xcD21538aF6e33fF6fcF1E2Ca20F771413004CFd3",
        "0x977CFC676Bb06Daed7DDFa7711bcfE8D50C93081",
        "0x959994471dEe37411f579DD2820A8743Cba20f46",
        ]; 
    let powers = [1, 1, 1 , 1];

    let tx = await test.initEpoch(validators,powers,0,"0x0000000000000000000000000000000000000000000000000000000000000000")
    let receipt = await tx.wait();
    console.log("Receipt is:\n",receipt)
    
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });