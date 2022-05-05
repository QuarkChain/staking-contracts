// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import "../Staking.sol";
import "../LightClient.sol";

contract LightClientTest is LightClient {
    constructor(uint256 _epochPeriod, address _staking) LightClient(_epochPeriod, _staking) {}
}
