# staking-contracts


## 1.upload header

- _epochHeaderBytes:  rlp encoding epoch Header
  - Note: When the Header is rlp encoded here, you need to ensure that header.Commit needs to be nil, because headerHash() does not include header.Commit

- commitBytes: rlp encoding Commit structure

```
 function createEpochValidators(bytes memory _epochHeaderBytes, bytes memory commitBytes)
```

## 2.get validates of next epoch

```
function proposalValidators() public view returns (address[] memory, uint256[] memory) 
```
return
- validates of next epoch
- voting powers of validates of next epoch

## 3.get validates of current epoch

```
function getCurrentEpoch() public view returns(uint256,address[] memory _epochSigners,uint256[] memory _epochVotingPowers) d
```
return
- current epochIdx
- validates of current epoch
- voting powers of validates of current epoch
