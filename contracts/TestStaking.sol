// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import "./Staking.sol";

contract TestStaking is Staking {
    /**
     * @notice Staking constructor
     * @param _celerTokenAddress address of Celer Token Contract
     * @param _proposalDeposit required deposit amount for a governance proposal
     * @param _votingPeriod voting timeout for a governance proposal
     * @param _unbondingPeriod the locking time for funds locked before withdrawn
     * @param _maxBondedValidators the maximum number of bonded validators
     * @param _minValidatorTokens the global minimum token amount requirement for bonded validator
     * @param _minSelfDelegation minimal amount of self-delegated tokens
     * @param _advanceNoticePeriod the wait time after the announcement and prior to the effective date of an update
     * @param _validatorBondInterval min interval between bondValidator
     * @param _maxSlashFactor maximal slashing factor (1e6 = 100%)
     */
    constructor(
        address _celerTokenAddress,
        uint256 _proposalDeposit,
        uint256 _votingPeriod,
        uint256 _unbondingPeriod,
        uint256 _maxBondedValidators,
        uint256 _minValidatorTokens,
        uint256 _minSelfDelegation,
        uint256 _advanceNoticePeriod,
        uint256 _validatorBondInterval,
        uint256 _maxSlashFactor
    )
        Staking(
            _celerTokenAddress,
            _proposalDeposit,
            _votingPeriod,
            _unbondingPeriod,
            _maxBondedValidators,
            _minValidatorTokens,
            _minSelfDelegation,
            _advanceNoticePeriod,
            _validatorBondInterval,
            _maxSlashFactor
        )
    {}

    function createEpochValidatorsTest(
        uint256 _epochIdx,
        address[] memory _epochSigners,
        uint256[] memory _epochVotingPowers
    ) public {
        _createEpochValidators(_epochIdx, _epochSigners, _epochVotingPowers);
    }
}
