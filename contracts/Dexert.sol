pragma solidity ^0.4.24;

import "./ERC20.sol";

contract Dexert {
    struct Balance {
        uint available;
    }
    
    struct Order {
        uint amount;
        uint price;
    }
    
    mapping (address => Balance) private balances;
    mapping (address => mapping (address => Balance)) private tokenBalances;
    mapping (address => Order[]) private ordersByAccount;
    mapping (address => Order[]) private ordersByToken;
    
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
    
    function sellTokens(address token, uint amount, uint price) public returns (bool) {
        return true;
    }
    
    function buyTokens(address token, uint amount, uint price) public returns (bool) {
        return true;
    }
    
    function getOrdersByAccount(address account) public constant returns(uint[], uint[]) {
        Order[] storage orders = ordersByAccount[account];
        uint norders = orders.length;
        
        uint[] memory amounts = new uint[](norders);
        uint[] memory prices = new uint[](norders);
        
        
        for (uint16 k = 0; k < orders.length; k++) {
            Order storage order = orders[k];
            amounts[k] = order.amount;
            prices[k] = order.price;
        }
        
        return (amounts, prices);
    }
    
    function getOrdersByToken(address token) public constant returns(uint[], uint[]) {
        Order[] storage orders = ordersByToken[token];
        uint norders = orders.length;
        
        uint[] memory amounts = new uint[](norders);
        uint[] memory prices = new uint[](norders);
        
        
        for (uint16 k = 0; k < orders.length; k++) {
            Order storage order = orders[k];
            amounts[k] = order.amount;
            prices[k] = order.price;
        }
        
        return (amounts, prices);
    }
}

