// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IW3qERC20 is IERC20 {
    function perEpochReward() external view returns (uint256);

    function mint(address, uint256) external;
}
