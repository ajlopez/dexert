pragma solidity ^0.4.24;

import "./ERC20.sol";

contract Dexert {
    struct Balance {
        uint available;
    }
    
    mapping (address => Balance) private balances;
    mapping (address => mapping (address => Balance)) private tokenBalances;
    
    function deposit() payable public {
        balances[msg.sender].available += msg.value;
    }
    
    function withdraw(uint amount) public returns (bool) {
        require(balances[msg.sender].available >= amount);
        
        balances[msg.sender].available -= amount;
        msg.sender.transfer(amount);
        
        return true;
    }
    
    function getBalance(address addr) public view returns (uint) {
        return balances[addr].available;
    }

    function depositTokens(ERC20 token, uint amount) public returns (bool) {
        require(token.transferFrom(msg.sender, this, amount));
        
        tokenBalances[address(token)][msg.sender].available += amount;
        
        return true;
    }

    function withdrawTokens(ERC20 token, uint amount) public returns (bool) {
        require(tokenBalances[address(token)][msg.sender].available >= amount);
        require(token.transfer(msg.sender, amount));
        
        tokenBalances[address(token)][msg.sender].available -= amount;
        
        return true;
    }
    
    function getTokenBalance(address token, address addr) public view returns (uint) {
        return tokenBalances[token][addr].available;
    }
}