pragma solidity ^0.8.0;

interface IStaking {
    function proposedValidators() external view returns (address[] memory, uint256[] memory);
}
