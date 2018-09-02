pragma solidity ^0.4.24;

contract Dexert {
    mapping (address => uint) private balances;
    mapping (address => mapping (address => uint)) private tokenBalances;
    
    function deposit() payable public {
        balances[msg.sender] += msg.value;
    }
    
    function withdraw(uint amount) public returns (bool) {
        require(balances[msg.sender] >= amount);
        balances[msg.sender] -= amount;
        msg.sender.transfer(amount);
        return true;
    }

    function getTokenBalance(address token, address addr) public view returns (uint) {
        return tokenBalances[token][addr];
    }
    
    function getBalance(address addr) public view returns (uint) {
        return balances[addr];
    }
}