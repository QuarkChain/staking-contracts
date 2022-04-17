const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

function check(f, got, want) {
  expect(got).to.eq(want);
}

function checkArray(f, got, want) {
  got.forEach((v, i) => {
    expect(v).to.eq(want[i]);
  });
}

function addHexPrefix(str){
    return "0x"+str; 
}

function cutHexPrefix(str){
    return str.slice(2,)
}

function toValidSig(Signature){
    let v = Signature.slice(130,132)
    let v1 = BigNumber.from(addHexPrefix(v)).toNumber()
    if (v1 == 0 || v1 == 1){
        v1 += 27
        Signature = Signature.slice(0,130).concat(cutHexPrefix(BigNumber.from(v1).toHexString())) 
    }

    return Signature
}
describe("decode block test", function () {
  let db;
  beforeEach(async () => {
    let factory = await ethers.getContractFactory("DecodeBlockTest");
    db = await factory.deploy();
    await db.deployed();
  });


  it("verify signature", async function () {
        const msg = "0xf0020601a0000000000000000000000000000000000000000000000000000000000000000086018032a0bfab8474657374"
        const msgHash = "0xf55d9ca8de96e3226794144dcf23408d2ba471808546cfac14f5bdd7a060636e" 
        let Signature = "0xf7adabf0b1c6b8cbea86a027760cb86e48270536498e89f4016f4de3192ee4781d6666b17f36999b6fddd6a3ad66f1fecf181beccd858954080adc4a2c8eb0fd00"
        if (Signature.length == 132){
            Signature = toValidSig(Signature)
        }
        
        const signer = "0xc315Fc6bf9aa31c4B7D584930eABFec07f4fd88C"
        let hash = await db.HashTest(msg);
        check("Hash",hash,msgHash)

        let getAddr = await db.RecoverSignatureTest(msg,Signature);
        check("Recover Address",getAddr,signer);

        let valid = await db.verifySignatureTest(signer,msg,Signature)
        check("Verify Signature",valid,true)
    })

    it("encode test",async function(){
        let vote = [2,10001,20002,"0x2df72819452ebcfdebfea474749cb55fa7d686a026672b0dd18f498879635d38",123456,"evm_3334"]
        let expectVote = ["0x02","0x2711","0x4e22","0x2df72819452ebcfdebfea474749cb55fa7d686a026672b0dd18f498879635d38","0x01e240","0x65766d5f33333334"]
        
        let rlpRes = await db.encodeToRlpBytesTest(vote);
        check("RLP Enocde",rlpRes,"0xf502822711824e22a02df72819452ebcfdebfea474749cb55fa7d686a026672b0dd18f498879635d388301e2408865766d5f33333334")

        let resVote = await db.decodeRlpTest(rlpRes);
        checkArray("RLP Decode",resVote,expectVote)

    })

    it("verify All signatures with enough votePower",async function(){
        // BlockID is headerHash
        let BlockID = "0xf37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e8"
        let sig1 = [2 ,"0x8072113C11cE4F583Ac1104934386a171f5f7c3A", 10007281 , toValidSig("0xeb75b168348c7c01ca360509701779e996cc0e20961b4ec88ec9277417aac71564b47ca3db305b43d1639a2fe29d50941cd695354043db11fbdf933642052eda01")]
        let sig2 = [2 ,"0x81934dF63c39b3c7954ee4ed7aCA4f4448458756", 20017273 , toValidSig("0x38c48cde144e4fe9de510ff6526e4c21e47ed60192cebac793872654cea32d7a5a54f5a44636fc66c4f1426b289d645905d44e1ef16ae1e330f21dff4fb1549400")]
        let sig3 = [2 ,"0xA1c345Ed4810B8dbAd88B8D46f05d91E13Cd1be1", 13217273 , toValidSig("0xed2764e109175046cc5f5459e63ee9e49131ce7ccb5053392ea1d4e2d31f7d856bc9eb6489b769f94e1e27a4c57d668416397795f7807d226a9f2023d3325f9301")]
        let sigs = [sig1, sig2 ,sig3]
        let commit = [100,2, BlockID,sigs]

        let voteSignBytes = ["0xf1026402a0f37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e88398b2f18865766d5f33333334","0xf2026402a0f37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e884013170798865766d5f33333334","0xf1026402a0f37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e883c9adf98865766d5f33333334"]
        let validators = ["0x8072113C11cE4F583Ac1104934386a171f5f7c3A" , "0x81934dF63c39b3c7954ee4ed7aCA4f4448458756" , "0xA1c345Ed4810B8dbAd88B8D46f05d91E13Cd1be1"]
        let powers = [1,1,1]

        for (let i=0;i<3;i++){
            let voteSignByte = await db.voteSignBytesTest(commit,"evm_3334",i)
            check("VoteSignBytes",voteSignByte,voteSignBytes[i])
        }

        try {
            let succeed = await db.verifyAllSignatureTest(commit,validators,powers,true,false,2);
            check("Verify All Signature",succeed,true)
        } catch (error) {
            console.log(error)
        }
    })

    it("verify All signatures with no enough votePower",async function(){
        // BlockID is headerHash
        let BlockID = "0xf37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e8"
        let sig1 = [2 ,"0x8072113C11cE4F583Ac1104934386a171f5f7c3A", 10007281 , toValidSig("0xeb75b168348c7c01ca360509701779e996cc0e20961b4ec88ec9277417aac71564b47ca3db305b43d1639a2fe29d50941cd695354043db11fbdf933642052eda01")]
        let sig2 = [2 ,"0x81934dF63c39b3c7954ee4ed7aCA4f4448458756", 20017273 , toValidSig("0x38c48cde144e4fe9de510ff6526e4c21e47ed60192cebac793872654cea32d7a5a54f5a44636fc66c4f1426b289d645905d44e1ef16ae1e330f21dff4fb1549400")]
        let sig3 = [2 ,"0xA1c345Ed4810B8dbAd88B8D46f05d91E13Cd1be1", 13217273 , toValidSig("0xed2764e109175046cc5f5459e63ee9e49131ce7ccb5053392ea1d4e2d31f7d856bc9eb6489b769f94e1e27a4c57d668416397795f7807d226a9f2023d3325f9301")]
        let sigs = [sig1, sig2 ,sig3]
        let commit = [100,2, BlockID,sigs]

        let voteSignBytes = ["0xf1026402a0f37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e88398b2f18865766d5f33333334","0xf2026402a0f37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e884013170798865766d5f33333334","0xf1026402a0f37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e883c9adf98865766d5f33333334"]
        let validators = ["0x8072113C11cE4F583Ac1104934386a171f5f7c3A" , "0x81934dF63c39b3c7954ee4ed7aCA4f4448458756" , "0xA1c345Ed4810B8dbAd88B8D46f05d91E13Cd1be1"]
        let powers = [1,1,1]

        for (let i=0;i<3;i++){
            let voteSignByte = await db.voteSignBytesTest(commit,"evm_3334",i)
            check("VoteSignBytes",voteSignByte,voteSignBytes[i])
        }

        try {
            let succeed = await db.verifyAllSignatureTest(commit,validators,powers,true,false,3);
            check("Verify All Signature",succeed,false)
        } catch (error) {
            console.log(error)
        }
    })

    it("verify Header",async function(){
        
        let headerRlp = "0xf90319a0112233445566778899001122334455667788990011223344556677889900aabba0000033445566778899001122334455667788990011223344556677889900aabb94d76fb45ed105f1851d74233f884d256c4fdad634a01100000000000000000000000000000000000000000000000000000000000011a02200000000000000000000000000000000000000000000000000000000000022a03300000000000000000000000000000000000000000000000000000000000033b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000822af88227118703328b9554a1b68501dce452ff8405e30a3cb8950301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010102a04400000000000000000000000000000000000000000000000000000000000044880102030405060708820309830c9f1bf85494aa000000000000000000000000000000000000aa94bb000000000000000000000000000000000000bb94dd000000000000000000000000000000000000bb94cc000000000000000000000000000000000000bbc3010101a0cc000000000000000000000000000000000000000000000000000000000000cc"
        let commitRlp = "0xf901446402a0f37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e8f9011ef85d02942615cc01c5a8a222e51052fbb684277818589ccc8398b2f1b84114249dce41d981c15f69673f949259083fe90cb6edfdabdc100bf7488e9a379b47ba364cedf483950a170f42aef92c5c3fc3140e646bcd46e1fdbe46efbc0f5e00f85e02941d1e600261a699ab9538acb53a12ace56a5d5b8b8401317079b84158d1b03187d4c1d1955460e971d1a6e7d93937518706438da14528c42c963efd4d714e3d963538c4c4433dddaea3c117e6ccbd3eb031aec96e7d9c84ed01629801f85d0294d2446fa57c9f6165cc7a1bbf1e78937f31e1f0f783c9adf9b841605223aab67e488b9a92a8d7ea293b9a0c05f002b9453e6ee093053e0153c7773de67de29b9f00323bb5c72109cc5c59a4a94c8bd1375d9090e6492e9c20a61a01"
        let validators = ["0x2615Cc01C5a8a222e51052fbb684277818589cCC" , "0x1D1e600261a699aB9538ACB53a12ACe56a5D5b8B" , "0xD2446fa57C9F6165cc7a1BbF1E78937f31E1f0F7"]
        let powers = [1,1,1]

        // for (let i=0;i<3;i++){
        //     let voteSignByte = await db.voteSignBytesTest(commit,"evm_3334",i)
        //     check("VoteSignBytes",voteSignByte,voteSignBytes[i])
        // }
        try {
            let succeed = await db.verifyHeaderTest(headerRlp,commitRlp,validators,powers,2) 
            console.log(succeed)
        } catch (error) {
            console.log(error)
        }

    })
})