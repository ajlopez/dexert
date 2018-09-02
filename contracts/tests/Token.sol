pragma solidity ^0.4.24;

contract Token {
    mapping (address => uint) public balances;
    
    constructor() public {
        balances[msg.sender] = 1000000;
    }
    
    function transfer(address receiver, uint amount) public returns (bool) {
        require(balances[msg.sender] >= amount);
        balances[msg.sender] -= amount;
        balances[receiver] += amount;
        
        return true;
    }
    
    function transferFrom(address sender, address receiver, uint amount) public returns (bool) {
        require(balances[sender] >= amount);
        balances[sender] -= amount;
        balances[receiver] += amount;
        
        return true;
    }
}