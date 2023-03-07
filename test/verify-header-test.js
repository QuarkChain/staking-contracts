const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const {
  check,
  checkArray,
  CHAINID_UINT,
} = require("./lib/head");

function addHexPrefix(str) {
  return "0x" + str;
}

function cutHexPrefix(str) {
  return str.slice(2);
}

function toValidSig(Signature) {
  let v = Signature.slice(130, 132);
  let v1 = BigNumber.from(addHexPrefix(v)).toNumber();
  if (v1 == 0 || v1 == 1) {
    v1 += 27;
    Signature = Signature.slice(0, 130).concat(cutHexPrefix(BigNumber.from(v1).toHexString()));
  }

  return Signature;
}
describe("verify header test", function () {
  let db;
  beforeEach(async () => {
    let factory = await ethers.getContractFactory("BlockDecoderTest");
    db = await factory.deploy();
    await db.deployed();
  });

  it("verify signature", async function () {
    const msg = "0xf0020601a0000000000000000000000000000000000000000000000000000000000000000086018032a0bfab8474657374";
    const msgHash = "0xf55d9ca8de96e3226794144dcf23408d2ba471808546cfac14f5bdd7a060636e";
    let Signature =
      "0xf7adabf0b1c6b8cbea86a027760cb86e48270536498e89f4016f4de3192ee4781d6666b17f36999b6fddd6a3ad66f1fecf181beccd858954080adc4a2c8eb0fd00";
    if (Signature.length == 132) {
      Signature = toValidSig(Signature);
    }

    const signer = "0xc315Fc6bf9aa31c4B7D584930eABFec07f4fd88C";
    let hash = await db.HashTest(msg);
    check("Hash", hash, msgHash);

    let getAddr = await db.RecoverSignatureTest(msg, Signature);
    check("Recover Address", getAddr, signer);

    let valid = await db.verifySignatureTest(signer, msg, Signature);
    check("Verify Signature", valid, true);
  });

  it("encode test", async function () {
    let vote = [
      2,
      10001,
      20002,
      "0x2df72819452ebcfdebfea474749cb55fa7d686a026672b0dd18f498879635d38",
      123456,
      "evm_3334",
    ];
    let expectVote = [
      "0x02",
      "0x2711",
      "0x4e22",
      "0x2df72819452ebcfdebfea474749cb55fa7d686a026672b0dd18f498879635d38",
      "0x01e240",
      "0x65766d5f33333334",
    ];

    let rlpRes = await db.encodeToRlpBytesTest(vote);
    check(
      "RLP Enocde",
      rlpRes,
      "0xf502822711824e22a02df72819452ebcfdebfea474749cb55fa7d686a026672b0dd18f498879635d388301e2408865766d5f33333334"
    );

    let resVote = await db.decodeRlpTest(rlpRes);
    checkArray("RLP Decode", resVote, expectVote);
  });

  it("verify All signatures with enough votePower", async function () {
    // BlockID is headerHash
    let BlockID = "0xf37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e8";
    let sig1 = [
      2,
      "0x8072113C11cE4F583Ac1104934386a171f5f7c3A",
      10007281,
      toValidSig(
        "0xeb75b168348c7c01ca360509701779e996cc0e20961b4ec88ec9277417aac71564b47ca3db305b43d1639a2fe29d50941cd695354043db11fbdf933642052eda01"
      ),
    ];
    let sig2 = [
      2,
      "0x81934dF63c39b3c7954ee4ed7aCA4f4448458756",
      20017273,
      toValidSig(
        "0x38c48cde144e4fe9de510ff6526e4c21e47ed60192cebac793872654cea32d7a5a54f5a44636fc66c4f1426b289d645905d44e1ef16ae1e330f21dff4fb1549400"
      ),
    ];
    let sig3 = [
      2,
      "0xA1c345Ed4810B8dbAd88B8D46f05d91E13Cd1be1",
      13217273,
      toValidSig(
        "0xed2764e109175046cc5f5459e63ee9e49131ce7ccb5053392ea1d4e2d31f7d856bc9eb6489b769f94e1e27a4c57d668416397795f7807d226a9f2023d3325f9301"
      ),
    ];
    let sigs = [sig1, sig2, sig3];
    let commit = [100, 2, BlockID, sigs];
    let chainId = 3334;

    let voteSignBytes = [
      "0xf1026402a0f37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e88398b2f18865766d5f33333334",
      "0xf2026402a0f37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e884013170798865766d5f33333334",
      "0xf1026402a0f37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e883c9adf98865766d5f33333334",
    ];
    let validators = [
      "0x8072113C11cE4F583Ac1104934386a171f5f7c3A",
      "0x81934dF63c39b3c7954ee4ed7aCA4f4448458756",
      "0xA1c345Ed4810B8dbAd88B8D46f05d91E13Cd1be1",
    ];
    let powers = [1, 1, 1];

    for (let i = 0; i < 3; i++) {
      let voteSignByte = await db.voteSignBytesTest(commit, 3334, i);
      check("VoteSignBytes", voteSignByte, voteSignBytes[i]);
    }

    try {
      let succeed = await db.verifyAllSignatureTest(commit, validators, powers, true, false, 2, chainId);
      check("Verify All Signature", succeed, true);
    } catch (error) {
      console.log(error);
    }
  });

  it("verify All signatures with no enough votePower", async function () {
    // BlockID is headerHash
    let BlockID = "0xf37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e8";
    let sig1 = [
      2,
      "0x8072113C11cE4F583Ac1104934386a171f5f7c3A",
      10007281,
      toValidSig(
        "0xeb75b168348c7c01ca360509701779e996cc0e20961b4ec88ec9277417aac71564b47ca3db305b43d1639a2fe29d50941cd695354043db11fbdf933642052eda01"
      ),
    ];
    let sig2 = [
      2,
      "0x81934dF63c39b3c7954ee4ed7aCA4f4448458756",
      20017273,
      toValidSig(
        "0x38c48cde144e4fe9de510ff6526e4c21e47ed60192cebac793872654cea32d7a5a54f5a44636fc66c4f1426b289d645905d44e1ef16ae1e330f21dff4fb1549400"
      ),
    ];
    let sig3 = [
      2,
      "0xA1c345Ed4810B8dbAd88B8D46f05d91E13Cd1be1",
      13217273,
      toValidSig(
        "0xed2764e109175046cc5f5459e63ee9e49131ce7ccb5053392ea1d4e2d31f7d856bc9eb6489b769f94e1e27a4c57d668416397795f7807d226a9f2023d3325f9301"
      ),
    ];
    let sigs = [sig1, sig2, sig3];
    let commit = [100, 2, BlockID, sigs];
    let chainId = 3334;

    let voteSignBytes = [
      "0xf1026402a0f37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e88398b2f18865766d5f33333334",
      "0xf2026402a0f37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e884013170798865766d5f33333334",
      "0xf1026402a0f37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e883c9adf98865766d5f33333334",
    ];
    let validators = [
      "0x8072113C11cE4F583Ac1104934386a171f5f7c3A",
      "0x81934dF63c39b3c7954ee4ed7aCA4f4448458756",
      "0xA1c345Ed4810B8dbAd88B8D46f05d91E13Cd1be1",
    ];
    let powers = [1, 1, 1];

    for (let i = 0; i < 3; i++) {
      let voteSignByte = await db.voteSignBytesTest(commit, 3334, i);
      check("VoteSignBytes", voteSignByte, voteSignBytes[i]);
    }

    try {
      let succeed = await db.verifyAllSignatureTest(commit, validators, powers, true, false, 3, chainId);
      check("Verify All Signature", succeed, false);
    } catch (error) {
      console.log(error);
    }
  });

  it("verify out-of-order signatures", async function () {
    // BlockID is headerHash
    let BlockID = "0xf37408df54bc50498ee191212106d581d262bc382c985aa994809d4844b196e8";
    let sig1 = [
      2,
      "0x8072113C11cE4F583Ac1104934386a171f5f7c3A",
      10007281,
      toValidSig(
        "0xeb75b168348c7c01ca360509701779e996cc0e20961b4ec88ec9277417aac71564b47ca3db305b43d1639a2fe29d50941cd695354043db11fbdf933642052eda01"
      ),
    ];
    let sig2 = [
      2,
      "0x81934dF63c39b3c7954ee4ed7aCA4f4448458756",
      20017273,
      toValidSig(
        "0x38c48cde144e4fe9de510ff6526e4c21e47ed60192cebac793872654cea32d7a5a54f5a44636fc66c4f1426b289d645905d44e1ef16ae1e330f21dff4fb1549400"
      ),
    ];
    let sig3 = [
      2,
      "0xA1c345Ed4810B8dbAd88B8D46f05d91E13Cd1be1",
      13217273,
      toValidSig(
        "0xed2764e109175046cc5f5459e63ee9e49131ce7ccb5053392ea1d4e2d31f7d856bc9eb6489b769f94e1e27a4c57d668416397795f7807d226a9f2023d3325f9301"
      ),
    ];
    let sigs = [sig2, sig3, sig1];
    let commit = [100, 2, BlockID, sigs];
    let chainId = 3334;

    let validators = [
      "0x8072113C11cE4F583Ac1104934386a171f5f7c3A",
      "0x81934dF63c39b3c7954ee4ed7aCA4f4448458756",
      "0xA1c345Ed4810B8dbAd88B8D46f05d91E13Cd1be1",
    ];
    let powers = [1, 1, 1];
    let succeed = await db.verifyAllSignatureTest(commit, validators, powers, false, false, 2, chainId);
    check("Verify All Signature", succeed, true);

    let powers_anotherOrderSigs = [5, 6, 9];
    let anotherOrderSigs = [sig3, sig2, sig1];
    let anotherCommit = [100, 2, BlockID, anotherOrderSigs];
    let anotherSucceed = await db.verifyAllSignatureTest(
      anotherCommit,
      validators,
      powers_anotherOrderSigs,
      false,
      false,
      19,
      chainId
    );
    check("Verify All Signature", anotherSucceed, true);

    let fail_anotherOrderSigs = await db.verifyAllSignatureTest(
      anotherCommit,
      validators,
      powers_anotherOrderSigs,
      false,
      false,
      20,
      chainId
    );
    check("Verify All Signature", fail_anotherOrderSigs, false);

    // fail to verify the third signature
    let doubleSigs = [sig1, sig2, sig1];
    let powers_doubleSigs = [1, 2, 1];
    let commitWithDouleSigs = [100, 2, BlockID, doubleSigs];
    let fail = await db.verifyAllSignatureTest(
      commitWithDouleSigs,
      validators,
      powers_doubleSigs,
      false,
      false,
      3,
      chainId
    );
    check("Verify All Signature", fail, false);

    let succeed1 = await db.verifyAllSignatureTest(
      commitWithDouleSigs,
      validators,
      powers_doubleSigs,
      false,
      false,
      2,
      chainId
    );
    check("Verify All Signature", succeed1, true);
  });

  it("verify Header", async function () {
    let headerRlp =
      "0xf90302a0112233445566778899001122334455667788990011223344556677889900aabba0000033445566778899001122334455667788990011223344556677889900aabb94d76fb45ed105f1851d74233f884d256c4fdad634a01100000000000000000000000000000000000000000000000000000000000011a02200000000000000000000000000000000000000000000000000000000000022a03300000000000000000000000000000000000000000000000000000000000033b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000822af8648703328b9554a1b68501dce452ff8405e30a3cb8950301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010102a04400000000000000000000000000000000000000000000000000000000000044880102030405060708820309830c9f1bf83f94aa000000000000000000000000000000000000aa94bb000000000000000000000000000000000000bb94cc000000000000000000000000000000000000ccc3030303a0cc000000000000000000000000000000000000000000000000000000000000cc";
    let commitRlp =
      "0xf901446402a0646687ec4ad27786570a40f080714034d663f698dd392b74fc6083b298d955ccf9011ef85d029491dfd865ee79b1fc880ab7f3ba506d156758df188398b2f1b841a5593a0ea80d12729398257b838bfa6c2f82e1cce6a4f54c7bd49b9173a610e027e88c8f443a3056cce7395758fb1081bd2df9ff228d2ba29d72f0307adaceea00f85e0294bc8f08df1e4375d1aff198d0127e410563eb71a58401317079b841a0b3a798bb0264b1ca1d2a04834fe80b592c31a98fceaf400f1a88780ac8f1c013c290a78f92423bff6f26613f26d6aeb0ae67914abcfb72b65f620b85c74b4000f85d0294d1fdb495842601fb34f9a42af0e3b7b5af0d0d0b83c9adf9b8417d6cbbec3b33b4d20617272abefbd7aca113d8f612da53394b510783dd5f8e9d57e3854fea2ade2a3033be8ef0c10e2099a2afdabe958a8115648087b0ddd5d801";
    let validators = [
      "0x91dfd865Ee79B1Fc880Ab7f3BA506D156758Df18",
      "0xBc8f08Df1E4375D1Aff198D0127e410563eB71a5",
      "0xD1Fdb495842601fb34F9A42Af0e3B7b5aF0D0D0B",
    ];
    let powers = [1, 1, 1];

    let res = await db.DecodeHeaderTest(headerRlp);

    let commit = await db.DecodeCommitTest(commitRlp);
    check("header height", commit.Height, res.baseData.Number);

    try {
      let [height, hash] = await db.verifyHeaderTest(headerRlp, commitRlp, validators, powers, CHAINID_UINT);
      check("Verify Header", height, commit.Height);
    } catch (error) {
      throw error;
    }
  });
});
