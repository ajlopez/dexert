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
    
    function sellTokens(address token, uint amount, uint price) public returns (bool) {
        return true;
    }
    
    function buyTokens(address token, uint amount, uint price) public returns (bool) {
        Order memory order = Order(token, msg.sender, amount, price, true);

        uint total = amount * price;
        
        balances[msg.sender].available -= total;
        balances[msg.sender].reserved += total;
        
        uint orderId = ++lastOrderId;
        
        ordersById[orderId] = order;
        
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
    
    function getOrderById(uint id) public constant returns(address account, address token, uint amount, uint price, bool buying) {
        Order storage order = ordersById[id];
        
        return (order.token, order.account, order.amount, order.price, order.buying);
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

