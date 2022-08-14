const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { check, checkArray, Header, genHeadRlp } = require("./lib/head");

const BlockRlpBytes =
  "0xf903a9f903a4a0112233445566778899001122334455667788990011223344556677889900aabba0000033445566778899001122334455667788990011223344556677889900aabb94d76fb45ed105f1851d74233f884d256c4fdad634a01100000000000000000000000000000000000000000000000000000000000011a02200000000000000000000000000000000000000000000000000000000000022a03300000000000000000000000000000000000000000000000000000000000033b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000822af88227118703328b9554a1b68501dce452ff8405e30a3cb8950301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010102a04400000000000000000000000000000000000000000000000000000000000044880102030405060708820309830c9f1bf85494aa000000000000000000000000000000000000aa94bb000000000000000000000000000000000000bb94dd000000000000000000000000000000000000bb94cc000000000000000000000000000000000000bbc401020304a0cc000000000000000000000000000000000000000000000000000000000000ccf8886402a0cc000000000000000000000000000000000000000000000000000000000000aaf863df0294aa000000000000000000000000000000000000aa8203e8850102030405e00294bb000000000000000000000000000000000000bb8203e986010203040506e10294cc000000000000000000000000000000000000cc8203ea8701020304050607c0c0";
const headerRlpBytes =
  "0xf903a4a0112233445566778899001122334455667788990011223344556677889900aabba0000033445566778899001122334455667788990011223344556677889900aabb94d76fb45ed105f1851d74233f884d256c4fdad634a01100000000000000000000000000000000000000000000000000000000000011a02200000000000000000000000000000000000000000000000000000000000022a03300000000000000000000000000000000000000000000000000000000000033b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000822af88227118703328b9554a1b68501dce452ff8405e30a3cb8950301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010102a04400000000000000000000000000000000000000000000000000000000000044880102030405060708820309830c9f1bf85494aa000000000000000000000000000000000000aa94bb000000000000000000000000000000000000bb94dd000000000000000000000000000000000000bb94cc000000000000000000000000000000000000bbc401020304a0cc000000000000000000000000000000000000000000000000000000000000ccf8886402a0cc000000000000000000000000000000000000000000000000000000000000aaf863df0294aa000000000000000000000000000000000000aa8203e8850102030405e00294bb000000000000000000000000000000000000bb8203e986010203040506e10294cc000000000000000000000000000000000000cc8203ea8701020304050607";
let nextValidators = [
  "0xAa000000000000000000000000000000000000Aa",
  "0xbB000000000000000000000000000000000000bb",
  "0xDD000000000000000000000000000000000000Bb",
  "0xcc000000000000000000000000000000000000BB",
];

// notice ,the uint in contract is 1e18
let nextValidatorPowers = [BigNumber.from("1"), BigNumber.from("2"), BigNumber.from("3"), BigNumber.from("4")];

describe("decode block test", function () {
  let db;
  beforeEach(async () => {
    let factory = await ethers.getContractFactory("BlockDecoderTest");
    db = await factory.deploy();
    await db.deployed();
  });

  it("decode extra of Header", async function () {
    const wallets = [];
    const vals = [];
    const powers = [];
    const produces = [];
    let valNum = 10;
    for (let i = 0; i < valNum; i++) {
      const wallet = await ethers.Wallet.createRandom();
      wallets.push(wallet);
      vals.push(wallet.address);
      powers.push("0x01"); //10
      produces.push("0x02");
    }

    let head = new Header(vals, powers);
    head.genExtra(produces);
    let headrlp = genHeadRlp(head);
    let res1 = await db.DecodeExtraTest(headrlp);
    checkArray("CHECK_PRODUCES", res1, produces);
    head.genExtraWithPrefix(produces, head.Number);
    let headrlp1 = genHeadRlp(head);
    let res2 = await db.DecodeExtraTest(headrlp1);
    checkArray("PRODUCE_LIST", res2, produces);
    let [res, succeed] = await db.CutExtraPrefixTest(head.Extra);
    check("CUT_EXTRA_PREFIX_INPUT", res, head.genExtra(produces).Extra);
  });

  it("decode Header", async function () {
    let res = await db.DecodeHeaderTest(headerRlpBytes);

    check("ParentHash", res.hashData.ParentHash, "0x112233445566778899001122334455667788990011223344556677889900aabb");
    check("UncleHash", res.hashData.UncleHash, "0x000033445566778899001122334455667788990011223344556677889900aabb");
    check("Coinbase", res.hashData.Coinbase, "0xD76Fb45Ed105f1851D74233f884D256C4FdAd634");
    check("Root", res.hashData.Root, "0x1100000000000000000000000000000000000000000000000000000000000011");
    check("TxHash", res.hashData.TxHash, "0x2200000000000000000000000000000000000000000000000000000000000022");
    check(
      "ReceiptHash",
      res.hashData.ReceiptHash,
      "0x3300000000000000000000000000000000000000000000000000000000000033"
    );

    check("Difficulty", res.baseData.Difficulty, BigNumber.from(11000));
    check("Number", res.baseData.Number, BigNumber.from(10001));
    check("GasLimit", res.baseData.GasLimit, BigNumber.from(900000017326518));
    check("GasUsed", res.baseData.GasUsed, BigNumber.from(8000918271));
    check("Time", res.baseData.Time, BigNumber.from(98765372));
    check(
      "Extra",
      res.baseData.Extra,
      "0x0301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010102"
    );
    check("MixDigest", res.baseData.MixDigest, "0x4400000000000000000000000000000000000000000000000000000000000044");
    check("Nonce", res.baseData.Nonce, "0x0102030405060708");
    check("BaseFee", res.baseData.BaseFee, BigNumber.from(777));

    check("TimeMs", res.validatorData.TimeMs, BigNumber.from(827163));
    checkArray("NextValidators", res.validatorData.NextValidators, nextValidators);
    checkArray("NextValidatorPowers", res.validatorData.NextValidatorPowers, nextValidatorPowers);
    check(
      "LastCommitHash",
      res.validatorData.LastCommitHash,
      "0xcc000000000000000000000000000000000000000000000000000000000000cc"
    );

    check("TimeMs", res.validatorData.TimeMs, BigNumber.from(827163));
    checkArray("NextValidators", res.validatorData.NextValidators, nextValidators);
    checkArray("NextValidatorPowers", res.validatorData.NextValidatorPowers, nextValidatorPowers);
    check(
      "LastCommitHash",
      res.validatorData.LastCommitHash,
      "0xcc000000000000000000000000000000000000000000000000000000000000cc"
    );

    check("Commit.Height", res.commit.Height, BigNumber.from(100));
    check("Commit.Round", res.commit.Round, 2);
    check("Commit.BlockID", res.commit.BlockID, "0xcc000000000000000000000000000000000000000000000000000000000000aa");

    // check("Signatures", res.commit.Signatures , [])
  });

  it("decode hashData", async function () {
    let res = await db.DecodeHashDataTest(headerRlpBytes);
    check("ParentHash", res.ParentHash, "0x112233445566778899001122334455667788990011223344556677889900aabb");
    check("UncleHash", res.UncleHash, "0x000033445566778899001122334455667788990011223344556677889900aabb");
    check("Coinbase", res.Coinbase, "0xD76Fb45Ed105f1851D74233f884D256C4FdAd634");
    check("Root", res.Root, "0x1100000000000000000000000000000000000000000000000000000000000011");
    check("TxHash", res.TxHash, "0x2200000000000000000000000000000000000000000000000000000000000022");
    check("ReceiptHash", res.ReceiptHash, "0x3300000000000000000000000000000000000000000000000000000000000033");
  });

  it("decode baseData", async function () {
    let res = await db.DecodeBaseDataTest(headerRlpBytes);

    check("Difficulty", res.Difficulty, BigNumber.from(11000));
    check("Number", res.Number, BigNumber.from(10001));
    check("GasLimit", res.GasLimit, BigNumber.from(900000017326518));
    check("GasUsed", res.GasUsed, BigNumber.from(8000918271));
    check("Time", res.Time, BigNumber.from(98765372));
    check(
      "Extra",
      res.Extra,
      "0x0301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010102"
    );
    check("MixDigest", res.MixDigest, "0x4400000000000000000000000000000000000000000000000000000000000044");
    check("Nonce", res.Nonce, "0x0102030405060708");
    check("BaseFee", res.BaseFee, BigNumber.from(777));
  });

  it("decode ValidatorData", async function () {
    let res = await db.DecodeValidatorDataTest(headerRlpBytes);

    check("TimeMs", res.TimeMs, BigNumber.from(827163));
    checkArray("NextValidators", res.NextValidators, nextValidators);
    checkArray("NextValidatorPowers", res.NextValidatorPowers, nextValidatorPowers);
    check("LastCommitHash", res.LastCommitHash, "0xcc000000000000000000000000000000000000000000000000000000000000cc");
  });

  it("decode NextValidators", async function () {
    // only one validator
    let oneValidator = ["0xAa000000000000000000000000000000000000Aa"];
    const OneValidatorRlpBytes =
      "0xf90364a0112233445566778899001122334455667788990011223344556677889900aabba0000033445566778899001122334455667788990011223344556677889900aabb94d76fb45ed105f1851d74233f884d256c4fdad634a01100000000000000000000000000000000000000000000000000000000000011a02200000000000000000000000000000000000000000000000000000000000022a03300000000000000000000000000000000000000000000000000000000000033b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000822af88227118703328b9554a1b68501dce452ff8405e30a3cb8950301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010102a04400000000000000000000000000000000000000000000000000000000000044880102030405060708820309830c9f1bd594aa000000000000000000000000000000000000aac401020304a0cc000000000000000000000000000000000000000000000000000000000000ccf8886402a0cc000000000000000000000000000000000000000000000000000000000000aaf863df0294aa000000000000000000000000000000000000aa8203e8850102030405e00294bb000000000000000000000000000000000000bb8203e986010203040506e10294cc000000000000000000000000000000000000cc8203ea8701020304050607";
    let res = await db.DecodeNextValidatorsTest(OneValidatorRlpBytes);
    checkArray("NextValidators", res, oneValidator);

    // more than one validator
    res = await db.DecodeNextValidatorsTest(headerRlpBytes);
    checkArray("NextValidators", res, nextValidators);
  });

  it("decode commit", async function () {
    let commitRlp =
      "0xf901446402a01231b92247299b5fa06ce17819c85a449086ded093407b246793abc87722b8d0f9011ef85d029433ec47f63dcda97930dfbae32c0eebfb5cd476c58398b2f1b8414c9cda1f5837598f74f0b3f92c36553c14190e9b6bea112cf720e34f6d8d8fc3585c70b1408f936655618e659f6f26c9ef3c7400c2302753699a56d83a66f03a01f85e02949188e32b84bd86e03492f2f94442b0965be340cd8401317079b841ac01bd9543e9f42aaaa81a3d506929841fc8940ae14e02628899eff5185db4d15e853eecf149d8ff258b9da28c23aa2926266164869fbea7d0c0b39ae72584b801f85d0294c7b0372fd4e677f628a0919a4bfa5434aa2cdf0f83c9adf9b8417079b71848b74ce144fe14f419117efb4b27390b97a0f201dcf5619b51132b3614b9deb47e6fd3a19587c65d9cca7de34d81259dec7063846f39c828f1ce97d601";
    let res = await db.DecodeCommitTest(commitRlp);
    check("Commit.Height", res.Height, BigNumber.from(100));
    check("Commit.Round", res.Round, 2);
    check("Commit.BlockID", res.BlockID, "0x1231b92247299b5fa06ce17819c85a449086ded093407b246793abc87722b8d0");

    let sig0 = [
      2,
      "0x33Ec47F63Dcda97930dFbaE32c0EEBFb5cD476c5",
      BigNumber.from(10007281),
      "0x4c9cda1f5837598f74f0b3f92c36553c14190e9b6bea112cf720e34f6d8d8fc3585c70b1408f936655618e659f6f26c9ef3c7400c2302753699a56d83a66f03a01",
    ];
    checkArray("Commit.Signatures[0]", res.Signatures[0], sig0);

    let sig1 = [
      2,
      "0x9188E32b84BD86e03492F2F94442B0965Be340Cd",
      BigNumber.from(20017273),
      "0xac01bd9543e9f42aaaa81a3d506929841fc8940ae14e02628899eff5185db4d15e853eecf149d8ff258b9da28c23aa2926266164869fbea7d0c0b39ae72584b801",
    ];
    checkArray("Commit.Signatures[1]", res.Signatures[1], sig1);

    let sig2 = [
      2,
      "0xC7B0372fd4E677f628A0919a4bFA5434aa2CDF0f",
      BigNumber.from(13217273),
      "0x7079b71848b74ce144fe14f419117efb4b27390b97a0f201dcf5619b51132b3614b9deb47e6fd3a19587c65d9cca7de34d81259dec7063846f39c828f1ce97d601",
    ];
    checkArray("Commit.Signatures[2]", res.Signatures[2], sig2);
  });
});
