const { ethers } = require("hardhat");

let main = async function () {
  let test = await ethers.getContractAt("LightClient", "0x1B44d7D20d19e5B4D6b03cE1f2d21e7dE01683Db");
  const header =
    "0xf90281a0b73d8a8249ca978ac4a0a5e23c74ae6b1a40b6411c220e55b9a0425ea555f9f4a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347941b47a4d3266213354d59ecaf338a4698177819d1a0ea152f2c399e0606157c5ffa82a1a519c6ec223827c3864273748dd301bcd930a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421b901000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001830189c08402faf0808084623330a380a0000000000000000000000000000000000000000000000000000000000000000088000000000000000085012a05f20086017f97f5fd10f85494c7b6ad1038b5a79c12b066d6e3e8972f3eceade79490a7bff0b4b11f365367d4c9fe084223c850b229949b29ad441b195b641aa0a45ad4085c51da62fe54941b47a4d3266213354d59ecaf338a4698177819d1c401010101a030cc982a485e3a690dbe1e236b42ff3977e7fcfbf2554bc206357207113b3113";
  const commit =
    "0xf90168830189c080a0b42ac18017f2282498699a6a2b245c5dfbd1f8b05fcf64b695005067492839a2f9013fd8019400000000000000000000000000000000000000008080f860029490a7bff0b4b11f365367d4c9fe084223c850b22986017f9a4abba6b841e3b6b6f4ace6792b2584c69cf877d83558af13e54b4c02dae6ad147e74f53b6d08b393bb59111151c15c9c2d257dfaa48abd0fa76a000bf05265a0af5abacbde01f86002949b29ad441b195b641aa0a45ad4085c51da62fe5486017f9a4abbf7b841616e2e7087bee8eee7b5283b703fe6740fa81832ea5dcf33547dfead7acb12a62028b273bffd58d5a8c596170a36453102907d44eef38041369d9c8e1b7e92a701f86002941b47a4d3266213354d59ecaf338a4698177819d186017f9a4abc1fb841c6b43fd27f7b0377dd6dddaaff45831e2b48a314dc2c387c709eb6c639d8a1a1747786d19e4b1774f101b2ac6874fa6fb0aa62978456f4fdd213baec61807e6d019e4b1774f101b2ac6874fa6fb0aa62978456f4fdd213baec61807e6d01";
  const overrides = { gasLimit: 8000000 };
  let tx = await test.submitHead(header, commit, false, overrides);

  let receipt = await tx.wait();
  console.log("RECEIPT:", receipt);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});