pragma solidity ^0.8.0;


contract StakingMock{

    address[] public vals;
    uint256[] public powers;
    function setValidators(address[] memory vs )public {
        vals = vs;
        for(uint i = 0; i < vs.length; i++){
            powers.push(1);
        }
    }
    function rewardValidator(address _valAddr, uint256 _tokens) public{

    }

    function proposedValidators() public view returns (address[] memory , uint256[] memory ){
        // vs = vals;
        // powers = new uint256[](vs.length);
        // for(uint i = 0; i < powers.length; i){
        //     powers[i]= 1;       
        // }
        return (vals,powers);

    }

    function getValidatorTokens(address _valAddr) public view returns (uint256){
        return 1;
    }
}