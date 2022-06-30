const { ethers } = require("hardhat");

let main =async function(){
    const contracts = [
        {
            name: "LightClient",
            address: "0x977CFC676Bb06Daed7DDFa7711bcfE8D50C93081"
        },
        {
            name: "Staking",
            address: "0x45b5F64D9C76c3d4Cfb7a5064051fd60Bf8F819F"
        }
    ]
    
    await hre.tenderly.persistArtifacts(...contracts)
    
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });