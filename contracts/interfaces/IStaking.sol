// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import "../lib/DataTypes.sol";

interface IStaking {
    function rewardValidator(address _valAddr, uint256 _tokens) external;

    function proposedValidators() external view returns (address[] memory, uint256[] memory);

    function getValidatorTokens(address _valAddr) external view returns (uint256);

}
