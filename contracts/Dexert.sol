pragma solidity ^0.6.0;

import "./ERC20.sol";
import "./SafeMath.sol";

contract Dexert {
    using SafeMath for uint256;
    
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
    mapping (address => uint[]) private ordersByAccount;

    mapping (address => uint[]) private buyOrdersByToken;
    mapping (address => uint[]) private sellOrdersByToken;
    
    function deposit() payable public {
        balances[msg.sender].available = balances[msg.sender].available.add(msg.value);
    }
    
    function withdraw(uint amount) public returns (bool) {
        require(balances[msg.sender].available >= amount);
        
        balances[msg.sender].available = balances[msg.sender].available.sub(amount);
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
        require(token.transferFrom(msg.sender, address(this), amount));
        
        tokenBalances[address(token)][msg.sender].available = tokenBalances[address(token)][msg.sender].available.add(amount);
        
        return true;
    }

    function withdrawTokens(ERC20 token, uint amount) public returns (bool) {
        require(tokenBalances[address(token)][msg.sender].available >= amount);
        require(token.transfer(msg.sender, amount));
        
        tokenBalances[address(token)][msg.sender].available = tokenBalances[address(token)][msg.sender].available.sub(amount);
        
        return true;
    }
    
    function getTokenBalance(address token, address addr) public view returns (uint) {
        return tokenBalances[token][addr].available;
    }
    
    function getReservedTokens(address token, address addr) public view returns (uint) {
        return tokenBalances[token][addr].reserved;
    }
    
    function cancelOrder(uint id) public {
        Order storage order = ordersById[id];
        
        address account = order.account;
        address token = order.token;
        
        require(account == msg.sender);
        
        removeId(ordersByAccount[account], id);
        
        if (order.buying) {
            uint total = order.price.mul(order.amount);
            
            balances[account].reserved = balances[account].reserved.sub(total);
            balances[account].available = balances[account].available.add(total);

            removeId(buyOrdersByToken[token], id);
        }
        else {
            tokenBalances[token][account].reserved = tokenBalances[token][account].reserved.sub(order.amount);
            tokenBalances[token][account].available = tokenBalances[token][account].available.add(order.amount);

            removeId(sellOrdersByToken[token], id);
        }

        delete(ordersById[id]);
    }
    
    function removeId(uint[] storage ids, uint id) private {
        uint nids = ids.length;
        
        for (uint k = 0; k < nids; k++)
            if (ids[k] == id) {
                if (k != nids - 1)
                    ids[k] = ids[nids - 1];

                ids.pop();
                
                break;
            }
    }
    
    function sellTokens(address token, uint amount, uint price) public returns (bool) {
        require(tokenBalances[token][msg.sender].available >= amount);
        
        Order memory order = Order(token, msg.sender, amount, price, false);
        
        tokenBalances[token][msg.sender].available = tokenBalances[token][msg.sender].available.sub(amount);
        tokenBalances[token][msg.sender].reserved = tokenBalances[token][msg.sender].reserved.add(amount);
        
        uint orderId = ++lastOrderId;
        
        ordersById[orderId] = order;
        
        sellOrdersByToken[token].push(orderId);
        ordersByAccount[msg.sender].push(orderId);
    
        uint[] storage buyOrdersIds = buyOrdersByToken[token];
        uint nBuyOrders = buyOrdersIds.length;
        
        for (uint k = 0; k < nBuyOrders; k++) {
            uint buyOrderId = buyOrdersIds[k];
            
            if (!matchOrders(ordersById[buyOrderId], ordersById[orderId]))
                continue;
                
            if (ordersById[buyOrderId].amount == 0) {
                removeId(ordersByAccount[ordersById[buyOrderId].account], buyOrderId);
                removeId(buyOrdersByToken[token], buyOrderId);
                delete ordersById[buyOrderId];
                nBuyOrders--;
            }

            if (ordersById[orderId].amount == 0) {
                removeId(ordersByAccount[msg.sender], orderId);
                removeId(sellOrdersByToken[token], orderId);
                delete ordersById[orderId];
                break;
            }
        }
        
        return true;
    }
    
    function buyTokens(address token, uint amount, uint price) public returns (bool) {
        uint total = amount * price;
        
        require(balances[msg.sender].available >= total);
        
        balances[msg.sender].available = balances[msg.sender].available.sub(total);
        balances[msg.sender].reserved = balances[msg.sender].reserved.add(total);
        
        uint orderId = ++lastOrderId;
        
        ordersById[orderId] = Order(token, msg.sender, amount, price, true);
        
        buyOrdersByToken[token].push(orderId);
        ordersByAccount[msg.sender].push(orderId);
    
        uint[] storage sellOrdersIds = sellOrdersByToken[token];
        uint nSellOrders = sellOrdersIds.length;
        
        for (uint k = 0; k < nSellOrders; k++) {
            uint sellOrderId = sellOrdersIds[k];
            
            if (!matchOrders(ordersById[orderId], ordersById[sellOrderId]))
                continue;
                
            if (ordersById[sellOrderId].amount == 0) {
                removeId(ordersByAccount[ordersById[sellOrderId].account], sellOrderId);
                removeId(sellOrdersByToken[token], sellOrderId);
                delete ordersById[sellOrderId];
                nSellOrders--;
            }

            if (ordersById[orderId].amount == 0) {
                removeId(ordersByAccount[msg.sender], orderId);
                removeId(buyOrdersByToken[token], orderId);
                delete ordersById[orderId];
                break;
            }
        }
        
        return true;
    }
    
    function matchOrders(Order storage buyOrder, Order storage sellOrder) private returns (bool) {
        require(buyOrder.buying == true);
        require(sellOrder.buying == false);
        require(buyOrder.token == sellOrder.token);

        if (buyOrder.price < sellOrder.price)
            return false;
            
        uint amount = buyOrder.amount;
        
        if (amount > sellOrder.amount)
            amount = sellOrder.amount;
            
        if (amount == 0)
            return false;
            
        buyOrder.amount = buyOrder.amount.sub(amount);
        sellOrder.amount = sellOrder.amount.sub(amount);
        
        uint price = buyOrder.price.add(sellOrder.price).div(2);
        
        uint total = amount.mul(price);
        uint buyerTotal = amount.mul(buyOrder.price);
        
        balances[buyOrder.account].reserved = balances[buyOrder.account].reserved.sub(buyerTotal);
        balances[buyOrder.account].available = balances[buyOrder.account].available.add(buyerTotal).sub(total);

        balances[sellOrder.account].available = balances[sellOrder.account].available.add(total);
        
        tokenBalances[buyOrder.token][buyOrder.account].available = tokenBalances[buyOrder.token][buyOrder.account].available.add(amount);
        tokenBalances[sellOrder.token][sellOrder.account].reserved = tokenBalances[sellOrder.token][sellOrder.account].reserved.sub(amount);

        return true;
    }
    
    function getOrderById(uint id) public view returns(address account, address token, uint amount, uint price, bool buying) {
        Order storage order = ordersById[id];
        
        return (order.account, order.token, order.amount, order.price, order.buying);
    }
    
    function getOrdersByAccount(address account) public view returns(uint[] memory oids, address[] memory tokens, uint[] memory amounts, uint[] memory prices, bool[] memory buyings) {
        uint[] storage ids = ordersByAccount[account];
        uint norders = ids.length;
        
        oids = new uint[](norders);
        tokens = new address[](norders);
        amounts = new uint[](norders);
        prices = new uint[](norders);
        buyings = new bool[](norders);
        
        for (uint16 k = 0; k < norders; k++) {
            uint oid = ids[k];
            
            Order storage order = ordersById[oid];
            
            oids[k] = oid;
            tokens[k] = order.token;
            amounts[k] = order.amount;
            prices[k] = order.price;
            buyings[k] = order.buying;
        }
                    
        return (oids, tokens, amounts, prices, buyings);
    }
    
    function getBuyOrdersByToken(address token) public view returns(uint[] memory oids, address[] memory accounts, uint[] memory amounts, uint[] memory prices) {
        uint[] storage orders = buyOrdersByToken[token];
        uint norders = orders.length;
        
        oids = new uint[](norders);
        accounts = new address[](norders);
        amounts = new uint[](norders);
        prices = new uint[](norders);
        
        for (uint16 k = 0; k < orders.length; k++) {
            uint id = orders[k];
            
            Order storage order = ordersById[id];
            
            oids[k] = id;
            accounts[k] = order.account;
            amounts[k] = order.amount;
            prices[k] = order.price;
        }
        
        return (oids, accounts, amounts, prices);
    }
    
    function getSellOrdersByToken(address token) public view returns(uint[] memory oids, address[] memory accounts, uint[] memory amounts, uint[] memory prices) {
        uint[] storage orders = sellOrdersByToken[token];
        uint norders = orders.length;
        
        oids = new uint[](norders);
        accounts = new address[](norders);
        amounts = new uint[](norders);
        prices = new uint[](norders);
        
        for (uint16 k = 0; k < orders.length; k++) {
            uint id = orders[k];

            Order storage order = ordersById[id];
            
            oids[k] = id;
            accounts[k] = order.account;
            amounts[k] = order.amount;
            prices[k] = order.price;
        }
        
        return (oids, accounts, amounts, prices);
    }
}

