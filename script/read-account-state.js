import level from 'level'
import { Account, BN, bufferToHex, rlp } from 'ethereumjs-util'
import { SecureTrie as Trie } from 'merkle-patricia-tree'

const stateRoot = 'STATE_ROOT_OF_A_BLOCK'

const db = level('/Users/chenyanlong/Work/go-ethereum/cmd/geth/datadir/geth/chaindata')
const trie = new Trie(db, stateRoot)

const address = 'AN_ETHEREUM_ACCOUNT_ADDRESS'

async function test() {
  const data = await trie.get(address)
  const acc = Account.fromAccountData(data)

  console.log('-------State-------')
  console.log(`nonce: ${acc.nonce}`)
  console.log(`balance in wei: ${acc.balance}`)
  console.log(`storageRoot: ${bufferToHex(acc.stateRoot)}`)
  console.log(`codeHash: ${bufferToHex(acc.codeHash)}`)

  const storageTrie = trie.copy()
  storageTrie.root = acc.stateRoot

  console.log('------Storage------')
  const stream = storageTrie.createReadStream()
  stream
    .on('data', (data) => {
      console.log(`key: ${bufferToHex(data.key)}`)
      console.log(`Value: ${bufferToHex(rlp.decode(data.value))}`)
    })
    .on('end', () => {
      console.log('Finished reading storage.')
    })
}

test()