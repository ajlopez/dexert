pragma solidity ^0.6.0;

contract Token {
    mapping (address => uint) public balances;
    
    constructor() public {
        balances[msg.sender] = 1000000;
    }
    
    function balanceOf(address account) public view returns (uint) {
        return balances[account];
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