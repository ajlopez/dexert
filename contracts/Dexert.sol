pragma solidity ^0.4.24;

contract Dexert {
    mapping (address => uint) private balances;
    
    function deposit() payable public {
        balances[msg.sender] += msg.value;
    }
    
    function getBalance(address addr) public view returns (uint) {
        return balances[addr];
    }
}