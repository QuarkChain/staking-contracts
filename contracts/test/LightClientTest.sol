// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import "../Staking.sol";
import "../LightClient.sol";

contract LightClientTest is LightClient {
    constructor(uint256 _epochPeriod, address _staking,address _w3qErc20) LightClient(_epochPeriod, _staking,_w3qErc20) {}
}
