pragma solidity ^0.4.24;

import "./ERC20.sol";

contract Dexert {
    struct Balance {
        uint available;
        uint reserved;
    }
    
    struct Order {
        address token;
        address account;
        uint amount;
        uint price;
        bool buying;
    }

    uint public lastOrderId;
    
    mapping (address => Balance) private balances;
    mapping (address => mapping (address => Balance)) private tokenBalances;

    mapping (uint => Order) private ordersById;
    mapping (address => Order[]) private ordersByAccount;

    mapping (address => uint[]) private buyOrdersByToken;
    mapping (address => uint[]) private sellOrdersByToken;
    
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

    function getReserved(address addr) public view returns (uint) {
        return balances[addr].reserved;
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
    
    function getReservedTokens(address token, address addr) public view returns (uint) {
        return tokenBalances[token][addr].reserved;
    }
    
    function sellTokens(address token, uint amount, uint price) public returns (bool) {
        require(tokenBalances[token][msg.sender].available >= amount);
        
        Order memory order = Order(token, msg.sender, amount, price, false);
        
        tokenBalances[token][msg.sender].available -= amount;
        tokenBalances[token][msg.sender].reserved += amount;
        
        uint orderId = ++lastOrderId;
        
        ordersById[orderId] = order;
        
        return true;
    }
    
    function buyTokens(address token, uint amount, uint price) public returns (bool) {
        uint total = amount * price;
        
        require(balances[msg.sender].available >= total);
        
        Order memory order = Order(token, msg.sender, amount, price, true);
        
        balances[msg.sender].available -= total;
        balances[msg.sender].reserved += total;
        
        uint orderId = ++lastOrderId;
        
        ordersById[orderId] = order;
        
        return true;
    }
    
    function getOrderById(uint id) public constant returns(address account, address token, uint amount, uint price, bool buying) {
        Order storage order = ordersById[id];
        
        return (order.token, order.account, order.amount, order.price, order.buying);
    }
    
    function getOrdersByAccount(address account) public constant returns(address[] tokens, uint[] amounts, uint[] prices, bool[] buyings) {
        Order[] storage orders = ordersByAccount[account];
        uint norders = orders.length;
        
        tokens = new address[](norders);
        amounts = new uint[](norders);
        prices = new uint[](norders);
        buyings = new bool[](norders);
        
        for (uint16 k = 0; k < orders.length; k++) {
            Order storage order = orders[k];
            
            tokens[k] = order.token;
            amounts[k] = order.amount;
            prices[k] = order.price;
            buyings[k] = order.buying;
        }
        
        return (tokens, amounts, prices, buyings);
    }
    
    function getBuyOrdersByToken(address token) public constant returns(uint[] ids, address[] accounts, uint[] amounts, uint[] prices) {
        uint[] storage orders = buyOrdersByToken[token];
        uint norders = orders.length;
        
        ids = new uint[](norders);
        accounts = new address[](norders);
        amounts = new uint[](norders);
        prices = new uint[](norders);
        
        for (uint16 k = 0; k < orders.length; k++) {
            uint id = orders[k];
            Order storage order = ordersById[k];
            
            ids[k] = id;
            accounts[k] = order.account;
            amounts[k] = order.amount;
            prices[k] = order.price;
        }
        
        return (ids, accounts, amounts, prices);
    }
    
    function getSellOrdersByToken(address token) public constant returns(uint[] ids, address[] accounts, uint[] amounts, uint[] prices) {
        uint[] storage orders = sellOrdersByToken[token];
        uint norders = orders.length;
        
        ids = new uint[](norders);
        accounts = new address[](norders);
        amounts = new uint[](norders);
        prices = new uint[](norders);
        
        for (uint16 k = 0; k < orders.length; k++) {
            uint id = orders[k];
            Order storage order = ordersById[k];
            
            ids[k] = id;
            accounts[k] = order.account;
            amounts[k] = order.amount;
            prices[k] = order.price;
        }
        
        return (ids, accounts, amounts, prices);
    }
}

