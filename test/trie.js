const { Level } = require("level");
const { BaseTrie } = require("merkle-patricia-tree");
const { rlp, bufferToHex } = require("ethereumjs-util");
function hexToBuffer(value) {
  return Buffer.from(value.slice(2), "hex");
}

describe("light client test", function () {
  it("Verify MerklePatriciaProof Test", async function () {
    const db = new Level("./testdb1");
    const trie = new BaseTrie(db);
    // await trie.put(Buffer.from('pp'), Buffer.from('r'))
    await trie.put(Buffer.from("test"), Buffer.from("one"));
    await trie.put(Buffer.from("testa"), Buffer.from("two"));
    await trie.put(Buffer.from("testabc"), Buffer.from("three"));

    console.log("root:", trie.root.toString("hex"));

    let path = await trie.findPath(Buffer.from("test"));
    console.log("Stack", path.stack);

    // let extNode  = path.stack[0]
    // let eKey = extNode.encodedKey()
    // console.log("nibbles:",extNode._nibbles)
    // console.log("encodeKey:",eKey)
    // let eValue = extNode.value
    // console.log("value:",eValue)
    // let eRaw = extNode.raw()
    // console.log("raw:",eRaw)

    // let fullNode  = path.stack[1]
    // console.log("FullNode Raw:",fullNode.raw())
    // console.log("FullNode Hash:",fullNode.hash())

    const proof = await BaseTrie.createProof(trie, Buffer.from("test"));
    let raw = proof.map((_n) => rlp.decode(_n));
    console.log("RAW:", raw);
    console.log("rlp_raw:", bufferToHex(rlp.encode(raw)));
    // console.log("Proof",proof)
    // proof[1].reverse()
    // try {
    //   const value = await BaseTrie.verifyProof(trie.root, Buffer.from('test21'), proof)
    //   console.log(value.toString()) // results in error
    // } catch (err) {
    //   console.log(err) // Missing node in DB
    // }
  });
});
