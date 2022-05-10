# staking-contracts


## 1.upload header

- _epochHeaderBytes:  rlp encoding epoch Header
  - Note: When the Header is rlp encoded here, you need to ensure that header.Commit needs to be nil, because headerHash() does not include header.Commit

- commitBytes: rlp encoding Commit structure
- lookByIndex: Whether the uploaded validator signature sequence is consistent with the validator sequence in the contract

```
 function submitHead(bytes memory _epochHeaderBytes, bytes memory commitBytes, bool lookByIndex) external
```

## 2.get validators and powers of next epoch

```
function proposedValidators() public view returns (address[] memory, uint256[] memory) 
```
return
- validators of next epoch
- voting powers of validators of next epoch

## 3.get validators and powers of current epoch

```
function getCurrentEpoch() public view returns(uint256,address[] memory _epochSigners,uint256[] memory _epochVotingPowers) 
```
return
- current epochIdx
- validators of current epoch
- voting powers of validators of current epoch

## 4.get validators of current epoch
```
function curEpochVals() external view returns (address[] memory);
```
## 5.get votingPowers of current epoch
```
function curVotingPowers() external view returns (uint64[] memory);
```
## 6.get index of current epoch
```
function epochIdx() external view returns (uint256);
```
## 7.get block height of current epoch

```
function curEpochHeight() external view returns (uint256 height);
```
## 8.get correct block height of next epoch

```
function getNextEpochHeight() external view returns (uint256 height);

```
## 9.set epoch period

```
function setEpochPeriod(uint256 _epochPeriod) external;
```

## 10.get epoch period
```
function epochPeriod() external view returns (uint256 height);
```