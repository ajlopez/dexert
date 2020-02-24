
const Dexert = artifacts.require('./Dexert.sol');
const Token = artifacts.require('./Token.sol');

const expectThrow = require('./utils').expectThrow;

contract('Dexert', function (accounts) {
    const ownerAccount = accounts[0];
    const aliceAccount = accounts[1];
    const bobAccount = accounts[2];
    
    const TOTAL_SUPPLY = 1000000;

    beforeEach(async function() {
        this.dexert = await Dexert.new();
        this.token = await Token.new();
    });
    
    function ordersById(orders, ids) {
        assert.ok(orders);
        assert.equal(orders.oids.length, ids.length);

        const l = ids.length;
        
        for (var k = 0; k < l; k++) {
            const id = ids[k];
            
            for (var j = 0; j < l; j++)
                if (orders.oids[j] == id)
                    break;
                
            if (j >= l)
                return false;
        }
                
        return true;
    }
    
    async function ordersByAccount(dexert, account, ids) {
        const orders = await dexert.getOrdersByAccount(account);

        return ordersById(orders, ids);
    }
    
    async function sellOrdersByToken(dexert, token, ids) {
        const orders = await dexert.getSellOrdersByToken(token);

        return ordersById(orders, ids);
    }

    async function buyOrdersByToken(dexert, token, ids) {
        const orders = await dexert.getBuyOrdersByToken(token);

        return ordersById(orders, ids);
    }

    async function orderExists(dexert, id, account, token, amount, price, buying) {
        const order = await dexert.getOrderById(id);

        if (!order)
            return false;

        const exists = order.token == token
            && order.account == account
            && order.amount.toNumber() == amount
            && order.price.toNumber() == price
            && order.buying == buying;
            
        if (!exists)
            return false;
        
        const ordersByAccount = await dexert.getOrdersByAccount(account);
        
        assert.ok(ordersByAccount);

        if (!ordersByAccount.oids.length)
            return false;

        var existsByAccount = false;
        
        for (var k = 0; k < ordersByAccount.oids.length; k++) {
            if (ordersByAccount.oids[k].toNumber() != id)
                continue;
            
            if (ordersByAccount.tokens[k] == token
                && ordersByAccount.amounts[k].toNumber() == amount
                && ordersByAccount.prices[k].toNumber() == price
                && ordersByAccount.buyings[k] == buying) {
             
                existsByAccount = true;
                
                break;
             }
        }
        
        if (!existsByAccount)
            return false;

        var ordersByToken;
        
        if (buying)
            ordersByToken = await dexert.getBuyOrdersByToken(token);
        else
            ordersByToken = await dexert.getSellOrdersByToken(token);
        
        assert.ok(ordersByToken);
        
        if (!ordersByToken.oids.length)
            return false;

        var existsByToken = false;
        
        for (var k = 0; k < ordersByToken.oids.length; k++) {
            if (ordersByToken.oids[k].toNumber() != id)
                continue;
            
            if (ordersByToken.accounts[k] == account
                && ordersByToken.amounts[k].toNumber() == amount
                && ordersByToken.prices[k].toNumber() == price) {
             
                existsByToken = true;
                
                break;
             }
        }
        
        if (!existsByToken)
            return false;

        return true;
    }

    async function orderDoesNotExist(dexert, id) {
        const order = await dexert.getOrderById(id);
        
        if (!order)
            return false;
        
        const empty = order.token == 0
            && order.account == 0
            && order.amount == 0
            && order.price == 0
            && order.buying == false;
            
        return empty;
    }

    describe('transfer value', function() {
        it('initial balances are zero', async function() {
            const ownerBalance = await this.dexert.getBalance(ownerAccount);
            assert.equal(ownerBalance, 0);
            
            const aliceBalance = await this.dexert.getBalance(aliceAccount);
            assert.equal(aliceBalance, 0);
            
            const bobBalance = await this.dexert.getBalance(bobAccount);
            assert.equal(bobBalance, 0);
        });
     
        it('one deposit', async function() {
            await this.dexert.deposit({ from: aliceAccount, value: 100 });
            
            const ownerBalance = await this.dexert.getBalance(ownerAccount);
            assert.equal(ownerBalance, 0);
            
            const aliceBalance = await this.dexert.getBalance(aliceAccount);
            assert.equal(aliceBalance, 100);
            
            const bobBalance = await this.dexert.getBalance(bobAccount);
            assert.equal(bobBalance, 0);
        });
        
        it('two deposits', async function() {
            await this.dexert.deposit({ from: aliceAccount, value: 100 });
            await this.dexert.deposit({ from: bobAccount, value: 200 });
            
            const ownerBalance = await this.dexert.getBalance(ownerAccount);
            assert.equal(ownerBalance, 0);
            
            const aliceBalance = await this.dexert.getBalance(aliceAccount);
            assert.equal(aliceBalance, 100);
            
            const bobBalance = await this.dexert.getBalance(bobAccount);
            assert.equal(bobBalance, 200);
        });
        
        it('two deposits to the same account', async function() {
            await this.dexert.deposit({ from: aliceAccount, value: 100 });
            await this.dexert.deposit({ from: aliceAccount, value: 200 });
            
            const ownerBalance = await this.dexert.getBalance(ownerAccount);
            assert.equal(ownerBalance, 0);
            
            const aliceBalance = await this.dexert.getBalance(aliceAccount);
            assert.equal(aliceBalance, 300);
            
            const bobBalance = await this.dexert.getBalance(bobAccount);
            assert.equal(bobBalance, 0);
        });
        
        it('withdraw', async function() {
            await this.dexert.deposit({ from: aliceAccount, value: 100 });

            const initialAliceEtherBalance = await web3.eth.getBalance(aliceAccount);
            
            await this.dexert.withdraw(50, { from: aliceAccount, gasPrice: 0 });
            
            const aliceBalance = await this.dexert.getBalance(aliceAccount);
            assert.equal(aliceBalance, 50);
            
            const finalAliceEtherBalance = await web3.eth.getBalance(aliceAccount);
            assert.equal(parseInt(initialAliceEtherBalance) + 50, finalAliceEtherBalance);
        });
        
        it('withdraw all balance', async function() {
            await this.dexert.deposit({ from: aliceAccount, value: 100 });        
            await this.dexert.withdraw(100, { from: aliceAccount, gasPrice: 0 });
            
            const aliceBalance = await this.dexert.getBalance(aliceAccount);
            assert.equal(aliceBalance, 0);
         });
        
        it('cannot withdraw without enough balance', async function() {
            await this.dexert.deposit({ from: aliceAccount, value: 100 });

            expectThrow(this.dexert.withdraw(150, { from: aliceAccount, gasPrice: 0 }));
            
            const aliceBalance = await this.dexert.getBalance(aliceAccount);
            assert.equal(aliceBalance, 100);
        });
    });
    
    describe('transfer tokens', function() {
        it('initial token balances are zero', async function() {
            const ownerBalance = await this.dexert.getTokenBalance(this.token.address, ownerAccount);
            assert.equal(ownerBalance, 0);
            
            const aliceBalance = await this.dexert.getTokenBalance(this.token.address, aliceAccount);
            assert.equal(aliceBalance, 0);
            
            const bobBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);
            assert.equal(bobBalance, 0);
        });

        it('deposit tokens', async function() {
            await this.dexert.depositTokens(this.token.address, 100);
            
            const tokenBalance = await this.token.balanceOf(ownerAccount);
            assert.equal(tokenBalance, TOTAL_SUPPLY - 100);
            
            const ownerBalance = await this.dexert.getTokenBalance(this.token.address, ownerAccount);
            assert.equal(ownerBalance, 100);
            
            const aliceBalance = await this.dexert.getTokenBalance(this.token.address, aliceAccount);
            assert.equal(aliceBalance, 0);
            
            const bobBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);
            assert.equal(bobBalance, 0);
        });

        it('cannot deposit tokens without enough balance', async function() {
            expectThrow(this.dexert.depositTokens(this.token.address, 100, { from: aliceAccount }));
            
            const tokenBalance = await this.token.balanceOf(aliceAccount);
            assert.equal(tokenBalance, 0);
            
            const aliceBalance = await this.dexert.getTokenBalance(this.token.address, aliceAccount);
            assert.equal(aliceBalance, 0);
        });        

        it('withdraw tokens', async function() {
            await this.dexert.depositTokens(this.token.address, 100);
            await this.dexert.withdrawTokens(this.token.address, 40);
            
            const tokenBalance = await this.token.balanceOf(ownerAccount);
            assert.equal(tokenBalance, TOTAL_SUPPLY - 60);
            
            const ownerBalance = await this.dexert.getTokenBalance(this.token.address, ownerAccount);
            assert.equal(ownerBalance, 60);
            
            const aliceBalance = await this.dexert.getTokenBalance(this.token.address, aliceAccount);
            assert.equal(aliceBalance, 0);
            
            const bobBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);
            assert.equal(bobBalance, 0);
        });

        it('withdraw all tokens', async function() {
            await this.dexert.depositTokens(this.token.address, 100);
            await this.dexert.withdrawTokens(this.token.address, 100);
            
            const tokenBalance = await this.token.balanceOf(ownerAccount);
            assert.equal(tokenBalance, TOTAL_SUPPLY);
            
            const ownerBalance = await this.dexert.getTokenBalance(this.token.address, ownerAccount);
            assert.equal(ownerBalance, 0);
            
            const aliceBalance = await this.dexert.getTokenBalance(this.token.address, aliceAccount);
            assert.equal(aliceBalance, 0);
            
            const bobBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);
            assert.equal(bobBalance, 0);
        });

        it('cannot withdraw tokens without enough balance', async function() {
            expectThrow(this.dexert.withdrawTokens(this.token.address, 100, { from: aliceAccount }));
            
            const tokenBalance = await this.token.balanceOf(aliceAccount);
            assert.equal(tokenBalance, 0);
            
            const aliceBalance = await this.dexert.getTokenBalance(this.token.address, aliceAccount);
            assert.equal(aliceBalance, 0);
        });        
    });
   
    describe('orders', function() {
        it('no orders by account', async function() {
            assert.ok(await ordersByAccount(this.dexert, aliceAccount, []));
            assert.ok(await ordersByAccount(this.dexert, bobAccount, []));
        });

        it('no sell orders by token', async function() {
            assert.ok(await sellOrdersByToken(this.dexert, this.token.address, []));
        });

        it('no buy orders by token', async function() {
            assert.ok(await buyOrdersByToken(this.dexert, this.token.address, []));
        });

        it('orders by account', async function() {
            const orders = await this.dexert.getOrdersByAccount(aliceAccount, { from: bobAccount });
           
            assert.ok(orders);
            assert.equal(orders.oids.length, 0);
            assert.equal(orders.tokens.length, 0);
            assert.equal(orders.amounts.length, 0);
            assert.equal(orders.prices.length, 0);
            assert.equal(orders.buyings.length, 0);
        });

        it('buy orders by token', async function() {
            const orders = await this.dexert.getBuyOrdersByToken(this.token.address, { from: aliceAccount });
           
            assert.ok(orders);
            assert.equal(orders.oids.length, 0);
            assert.equal(orders.accounts.length, 0);
            assert.equal(orders.amounts.length, 0);
            assert.equal(orders.prices.length, 0);
        });

        it('sell orders by token', async function() {
            const orders = await this.dexert.getSellOrdersByToken(this.token.address, { from: aliceAccount });
           
            assert.ok(orders);
            assert.equal(orders.oids.length, 0);
            assert.equal(orders.accounts.length, 0);
            assert.equal(orders.amounts.length, 0);
            assert.equal(orders.prices.length, 0);
        });
        
        it('last order id is zero', async function() {
            const lastOrderId = await this.dexert.lastOrderId({ from: aliceAccount });
           
            assert.equal(lastOrderId, 0  );
        });

        it('get no order', async function() {
            const order = await this.dexert.getOrderById(1, { from: aliceAccount });
           
            assert.ok(order);
            assert.equal(order.account, 0);
            assert.equal(order.token, 0);
            assert.equal(order.amount, 0);
            assert.equal(order.price, 0);
            assert.equal(order.buying, false);
        });
       
        it('buy order', async function () {
            await this.dexert.deposit({ from: aliceAccount, value: 200 });
            await this.dexert.buyTokens(this.token.address, 50, 2, { from: aliceAccount });
           
            const aliceBalance = await this.dexert.getBalance(aliceAccount);           
            assert.equal(aliceBalance, 100);

            const aliceReserved = await this.dexert.getReserved(aliceAccount);           
            assert.equal(aliceReserved, 100);

            const lastOrderId = (await this.dexert.lastOrderId()).toNumber();
           
            assert.equal(lastOrderId, 1);

            assert.ok(await orderExists(this.dexert, lastOrderId, aliceAccount, this.token.address, 50, 2, true));
            assert.ok(await ordersByAccount(this.dexert, aliceAccount, [ lastOrderId ]));
            assert.ok(await ordersByAccount(this.dexert, bobAccount, []));

            assert.ok(await buyOrdersByToken(this.dexert, this.token.address, [ lastOrderId ]));
            assert.ok(await sellOrdersByToken(this.dexert, this.token.address, []));
        });

        it('buy and cancel order', async function () {
            await this.dexert.deposit({ from: aliceAccount, value: 200 });
            await this.dexert.buyTokens(this.token.address, 50, 2, { from: aliceAccount });

            const lastOrderId = await this.dexert.lastOrderId();

            await this.dexert.cancelOrder(lastOrderId, { from: aliceAccount });
            
            const aliceBalance = await this.dexert.getBalance(aliceAccount);           
            assert.equal(aliceBalance, 200);

            const aliceReserved = await this.dexert.getReserved(aliceAccount);           
            assert.equal(aliceReserved, 0);

            const newLastOrderId = await this.dexert.lastOrderId();

            assert.ok(await ordersByAccount(this.dexert, aliceAccount, []));
            assert.ok(await ordersByAccount(this.dexert, bobAccount, []));

            assert.equal(newLastOrderId, 1);            

            assert.ok(await orderDoesNotExist(this.dexert, 1));
            
            assert.ok(await buyOrdersByToken(this.dexert, this.token.address, []));
            assert.ok(await sellOrdersByToken(this.dexert, this.token.address, []));
        });

        it('two buy orders and cancel first one', async function () {
            await this.dexert.deposit({ from: aliceAccount, value: 200 });
            await this.dexert.buyTokens(this.token.address, 50, 2, { from: aliceAccount });
            const firstOrderId = (await this.dexert.lastOrderId()).toNumber();
            await this.dexert.buyTokens(this.token.address, 25, 3, { from: aliceAccount });
            const secondOrderId = (await this.dexert.lastOrderId()).toNumber();

            await this.dexert.cancelOrder(firstOrderId, { from: aliceAccount });

            assert.ok(await ordersByAccount(this.dexert, aliceAccount, [ secondOrderId ]));
            assert.ok(await ordersByAccount(this.dexert, bobAccount, []));
            
            const aliceBalance = await this.dexert.getBalance(aliceAccount);           
            assert.equal(aliceBalance, 125);

            const aliceReserved = await this.dexert.getReserved(aliceAccount);           
            assert.equal(aliceReserved, 75);

            const newLastOrderId = (await this.dexert.lastOrderId()).toNumber();
           
            assert.equal(newLastOrderId, 2);
           
            assert.ok(orderDoesNotExist(this.dexert, firstOrderId));           
            assert.ok(orderExists(this.dexert, secondOrderId, this.token.address, aliceAccount, 25, 3, true));
            assert.ok(await buyOrdersByToken(this.dexert, this.token.address, [ secondOrderId ]));
            assert.ok(await sellOrdersByToken(this.dexert, this.token.address, []));
        });

        it('sell and cancel order', async function () {
            await this.token.transfer(bobAccount, 500);
            await this.dexert.depositTokens(this.token.address, 200, { from: bobAccount });
            await this.dexert.sellTokens(this.token.address, 50, 2, { from: bobAccount });

            const lastOrderId = await this.dexert.lastOrderId();

            await this.dexert.cancelOrder(lastOrderId, { from: bobAccount });

            assert.ok(await ordersByAccount(this.dexert, aliceAccount, []));
            assert.ok(await ordersByAccount(this.dexert, bobAccount, []));
            assert.ok(await orderDoesNotExist(this.dexert, lastOrderId));
            
            const bobTokenBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);           
            assert.equal(bobTokenBalance, 200);
            
            const bobReservedTokens = await this.dexert.getReservedTokens(this.token.address, bobAccount);           
            assert.equal(bobReservedTokens, 0);

            const newLastOrderId = await this.dexert.lastOrderId();
           
            assert.equal(newLastOrderId, 1);

            assert.ok(await orderDoesNotExist(this.dexert, newLastOrderId));
            
            const orders = await this.dexert.getSellOrdersByToken(this.token.address);
            
            assert.ok(orders);
            
            assert.equal(orders.oids.length, 0);

            assert.ok(await buyOrdersByToken(this.dexert, this.token.address, []));
            assert.ok(await sellOrdersByToken(this.dexert, this.token.address, []));
        });

        it('only account order could cancel an order', async function () {
            await this.token.transfer(bobAccount, 500);
            await this.dexert.depositTokens(this.token.address, 200, { from: bobAccount });
            await this.dexert.sellTokens(this.token.address, 50, 2, { from: bobAccount });

            const lastOrderId = await this.dexert.lastOrderId();

            expectThrow(this.dexert.cancelOrder(lastOrderId, { from: aliceAccount }));
        });

        it('cannot put a buy order without enough balance', async function () {
            await this.dexert.deposit({ from: aliceAccount, value: 50 });
           
            expectThrow(this.dexert.buyTokens(this.token.address, 50, 2, { from: aliceAccount }));

            const aliceBalance = await this.dexert.getBalance(aliceAccount);           
            assert.equal(aliceBalance, 50);

            const aliceReserved = await this.dexert.getReserved(aliceAccount);           
            assert.equal(aliceReserved, 0);

            const lastOrderId = await this.dexert.lastOrderId();
           
            assert.equal(lastOrderId, 0);
        });

        it('sell order', async function () {
            await this.token.transfer(bobAccount, 500);
            await this.dexert.depositTokens(this.token.address, 200, { from: bobAccount });
            await this.dexert.sellTokens(this.token.address, 50, 2, { from: bobAccount });

            const lastOrderId = (await this.dexert.lastOrderId()).toNumber();
           
            assert.equal(lastOrderId, 1);
            
            assert.ok(await ordersByAccount(this.dexert, aliceAccount, []));
            assert.ok(await ordersByAccount(this.dexert, bobAccount, [ lastOrderId ]));

            assert.ok(orderExists(this.dexert, lastOrderId, bobAccount, this.token.address, 50, 2, false));
            
            const bobTokenBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);           
            assert.equal(bobTokenBalance, 150);

            const bobReservedTokens = await this.dexert.getReservedTokens(this.token.address, bobAccount);           
            assert.equal(bobReservedTokens, 50);

            assert.ok(await buyOrdersByToken(this.dexert, this.token.address, []));
            assert.ok(await sellOrdersByToken(this.dexert, this.token.address, [ lastOrderId ]));
        });

        it('sell and buy order, completing buy order', async function () {
            await this.token.transfer(bobAccount, 500);
            await this.dexert.depositTokens(this.token.address, 200, { from: bobAccount });
            await this.dexert.sellTokens(this.token.address, 50, 2, { from: bobAccount });

            const sellOrderId = (await this.dexert.lastOrderId()).toNumber();
            
            await this.dexert.deposit({ from: aliceAccount, value: 200 });
            await this.dexert.buyTokens(this.token.address, 25, 4, { from: aliceAccount });

            const buyOrderId = (await this.dexert.lastOrderId()).toNumber();
            
            const bobBalance = await this.dexert.getBalance(bobAccount);           
            assert.equal(bobBalance, 25 * 3);

            const aliceBalance = await this.dexert.getBalance(aliceAccount);           
            assert.equal(aliceBalance, 200 - 25 * 3);

            const aliceReserved = await this.dexert.getReserved(aliceAccount);           
            assert.equal(aliceReserved, 0);

            const bobTokenBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);           
            assert.equal(bobTokenBalance, 200 - 50);

            const bobReservedTokens = await this.dexert.getReservedTokens(this.token.address, bobAccount);           
            assert.equal(bobReservedTokens, 25);
           
            const aliceTokenBalance = await this.dexert.getTokenBalance(this.token.address, aliceAccount);           
            assert.equal(aliceTokenBalance, 25);
            
            assert.ok(await orderExists(this.dexert, sellOrderId, bobAccount, this.token.address, 25, 2, false));
            assert.ok(await orderDoesNotExist(this.dexert, buyOrderId));
            
            assert.ok(await ordersByAccount(this.dexert, aliceAccount, []));
            assert.ok(await ordersByAccount(this.dexert, bobAccount, [ sellOrderId ]));

            assert.ok(await buyOrdersByToken(this.dexert, this.token.address, []));
            assert.ok(await sellOrdersByToken(this.dexert, this.token.address, [ sellOrderId ]));
        });

        it('sell and buy order, completing sell order', async function () {
            await this.token.transfer(bobAccount, 500);
            await this.dexert.depositTokens(this.token.address, 200, { from: bobAccount });
            await this.dexert.sellTokens(this.token.address, 50, 2, { from: bobAccount });

            const sellOrderId = (await this.dexert.lastOrderId()).toNumber();
            
            await this.dexert.deposit({ from: aliceAccount, value: 200 });
            await this.dexert.buyTokens(this.token.address, 100, 2, { from: aliceAccount });

            const buyOrderId = (await this.dexert.lastOrderId()).toNumber();

            const bobBalance = await this.dexert.getBalance(bobAccount);           
            assert.equal(bobBalance, 50 * 2);

            const aliceBalance = await this.dexert.getBalance(aliceAccount);           
            assert.equal(aliceBalance.toNumber(), 200 - 100 * 2);

            const aliceReserved = await this.dexert.getReserved(aliceAccount);           
            assert.equal(aliceReserved, 50 * 2);

            const bobTokenBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);           
            assert.equal(bobTokenBalance, 200 - 50);

            const bobReservedTokens = await this.dexert.getReservedTokens(this.token.address, bobAccount);           
            assert.equal(bobReservedTokens, 0);
           
            const aliceTokenBalance = await this.dexert.getTokenBalance(this.token.address, aliceAccount);           
            assert.equal(aliceTokenBalance, 50);

            assert.ok(await orderExists(this.dexert, buyOrderId, aliceAccount, this.token.address, 50, 2, true));
            assert.ok(await orderDoesNotExist(this.dexert, sellOrderId));

            assert.ok(await ordersByAccount(this.dexert, aliceAccount, [ buyOrderId ]));
            assert.ok(await ordersByAccount(this.dexert, bobAccount, []));
            
            assert.ok(await buyOrdersByToken(this.dexert, this.token.address, [ buyOrderId ]));
            assert.ok(await sellOrdersByToken(this.dexert, this.token.address, []));
        });

        it('sell and buy order, completing both orders', async function () {
            await this.token.transfer(bobAccount, 500);
            await this.dexert.depositTokens(this.token.address, 200, { from: bobAccount });
            await this.dexert.sellTokens(this.token.address, 50, 2, { from: bobAccount });

            const sellOrderId = (await this.dexert.lastOrderId()).toNumber();
            
            await this.dexert.deposit({ from: aliceAccount, value: 200 });
            await this.dexert.buyTokens(this.token.address, 50, 2, { from: aliceAccount });

            const buyOrderId = (await this.dexert.lastOrderId()).toNumber();

            const bobBalance = await this.dexert.getBalance(bobAccount);           
            assert.equal(bobBalance, 50 * 2);

            const aliceBalance = await this.dexert.getBalance(aliceAccount);           
            assert.equal(aliceBalance.toNumber(), 200 - 50 * 2);

            const aliceReserved = await this.dexert.getReserved(aliceAccount);           
            assert.equal(aliceReserved, 0);

            const bobTokenBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);           
            assert.equal(bobTokenBalance, 200 - 50);

            const bobReservedTokens = await this.dexert.getReservedTokens(this.token.address, bobAccount);           
            assert.equal(bobReservedTokens, 0);
           
            const aliceTokenBalance = await this.dexert.getTokenBalance(this.token.address, aliceAccount);           
            assert.equal(aliceTokenBalance, 50);

            assert.ok(await orderDoesNotExist(this.dexert, buyOrderId));
            assert.ok(await orderDoesNotExist(this.dexert, sellOrderId));

            assert.ok(await ordersByAccount(this.dexert, aliceAccount, []));
            assert.ok(await ordersByAccount(this.dexert, bobAccount, []));
            
            assert.ok(await buyOrdersByToken(this.dexert, this.token.address, []));
            assert.ok(await sellOrdersByToken(this.dexert, this.token.address, []));
        });

        it('buy and sell order, completing buy order', async function () {
            await this.dexert.deposit({ from: aliceAccount, value: 200 });
            await this.dexert.buyTokens(this.token.address, 25, 4, { from: aliceAccount });

            const buyOrderId = (await this.dexert.lastOrderId()).toNumber();
            
            await this.token.transfer(bobAccount, 500);
            await this.dexert.depositTokens(this.token.address, 200, { from: bobAccount });
            await this.dexert.sellTokens(this.token.address, 50, 2, { from: bobAccount });

            const sellOrderId = (await this.dexert.lastOrderId()).toNumber();
            
            const bobBalance = await this.dexert.getBalance(bobAccount);           
            assert.equal(bobBalance, 25 * 3);

            const aliceBalance = await this.dexert.getBalance(aliceAccount);           
            assert.equal(aliceBalance, 200 - 25 * 3);

            const aliceReserved = await this.dexert.getReserved(aliceAccount);           
            assert.equal(aliceReserved, 0);

            const bobTokenBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);           
            assert.equal(bobTokenBalance, 200 - 50);

            const bobReservedTokens = await this.dexert.getReservedTokens(this.token.address, bobAccount);           
            assert.equal(bobReservedTokens, 25);
           
            const aliceTokenBalance = await this.dexert.getTokenBalance(this.token.address, aliceAccount);           
            assert.equal(aliceTokenBalance, 25);
            
            assert.ok(await orderExists(this.dexert, sellOrderId, bobAccount, this.token.address, 25, 2, false));
            assert.ok(await orderDoesNotExist(this.dexert, buyOrderId));
            
            assert.ok(await ordersByAccount(this.dexert, aliceAccount, []));
            assert.ok(await ordersByAccount(this.dexert, bobAccount, [ sellOrderId ]));

            assert.ok(await buyOrdersByToken(this.dexert, this.token.address, []));
            assert.ok(await sellOrdersByToken(this.dexert, this.token.address, [ sellOrderId ]));
        });

        it('buy and sell order, completing sell order', async function () {
            await this.dexert.deposit({ from: aliceAccount, value: 200 });
            await this.dexert.buyTokens(this.token.address, 100, 2, { from: aliceAccount });

            const buyOrderId = (await this.dexert.lastOrderId()).toNumber();

            await this.token.transfer(bobAccount, 500);
            await this.dexert.depositTokens(this.token.address, 200, { from: bobAccount });
            await this.dexert.sellTokens(this.token.address, 50, 2, { from: bobAccount });

            const sellOrderId = (await this.dexert.lastOrderId()).toNumber();
            
            const bobBalance = await this.dexert.getBalance(bobAccount);           
            assert.equal(bobBalance, 50 * 2);

            const aliceBalance = await this.dexert.getBalance(aliceAccount);           
            assert.equal(aliceBalance.toNumber(), 200 - 100 * 2);

            const aliceReserved = await this.dexert.getReserved(aliceAccount);           
            assert.equal(aliceReserved, 50 * 2);

            const bobTokenBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);           
            assert.equal(bobTokenBalance, 200 - 50);

            const bobReservedTokens = await this.dexert.getReservedTokens(this.token.address, bobAccount);           
            assert.equal(bobReservedTokens, 0);
           
            const aliceTokenBalance = await this.dexert.getTokenBalance(this.token.address, aliceAccount);           
            assert.equal(aliceTokenBalance, 50);

            assert.ok(await orderExists(this.dexert, buyOrderId, aliceAccount, this.token.address, 50, 2, true));
            assert.ok(await orderDoesNotExist(this.dexert, sellOrderId));

            assert.ok(await ordersByAccount(this.dexert, aliceAccount, [ buyOrderId ]));
            assert.ok(await ordersByAccount(this.dexert, bobAccount, []));
            
            assert.ok(await buyOrdersByToken(this.dexert, this.token.address, [ buyOrderId ]));
            assert.ok(await sellOrdersByToken(this.dexert, this.token.address, []));
        });

        it('buy and sell order, completing both orders', async function () {
            await this.dexert.deposit({ from: aliceAccount, value: 200 });
            await this.dexert.buyTokens(this.token.address, 50, 2, { from: aliceAccount });

            const buyOrderId = (await this.dexert.lastOrderId()).toNumber();

            await this.token.transfer(bobAccount, 500);
            await this.dexert.depositTokens(this.token.address, 200, { from: bobAccount });
            await this.dexert.sellTokens(this.token.address, 50, 2, { from: bobAccount });

            const sellOrderId = (await this.dexert.lastOrderId()).toNumber();
            
            const bobBalance = await this.dexert.getBalance(bobAccount);           
            assert.equal(bobBalance, 50 * 2);

            const aliceBalance = await this.dexert.getBalance(aliceAccount);           
            assert.equal(aliceBalance.toNumber(), 200 - 50 * 2);

            const aliceReserved = await this.dexert.getReserved(aliceAccount);           
            assert.equal(aliceReserved, 0);

            const bobTokenBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);           
            assert.equal(bobTokenBalance, 200 - 50);

            const bobReservedTokens = await this.dexert.getReservedTokens(this.token.address, bobAccount);           
            assert.equal(bobReservedTokens, 0);
           
            const aliceTokenBalance = await this.dexert.getTokenBalance(this.token.address, aliceAccount);           
            assert.equal(aliceTokenBalance, 50);

            assert.ok(await orderDoesNotExist(this.dexert, buyOrderId));
            assert.ok(await orderDoesNotExist(this.dexert, sellOrderId));

            assert.ok(await ordersByAccount(this.dexert, aliceAccount, []));
            assert.ok(await ordersByAccount(this.dexert, bobAccount, []));
            
            assert.ok(await buyOrdersByToken(this.dexert, this.token.address, []));
            assert.ok(await sellOrdersByToken(this.dexert, this.token.address, []));
        });

        it('two sell orders and cancel first one', async function () {
            await this.token.transfer(bobAccount, 500);
            await this.dexert.depositTokens(this.token.address, 200, { from: bobAccount });
            
            await this.dexert.sellTokens(this.token.address, 50, 2, { from: bobAccount });
            const firstOrderId = (await this.dexert.lastOrderId()).toNumber();
            
            await this.dexert.sellTokens(this.token.address, 25, 2, { from: bobAccount });
            const secondOrderId = (await this.dexert.lastOrderId()).toNumber();
           
            await this.dexert.cancelOrder(firstOrderId, { from: bobAccount });

            assert.ok(await ordersByAccount(this.dexert, bobAccount, [ secondOrderId ]));
            
            const bobTokenBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);           
            assert.equal(bobTokenBalance, 175);

            const bobReservedTokens = await this.dexert.getReservedTokens(this.token.address, bobAccount);           
            assert.equal(bobReservedTokens, 25);

            const lastOrderId = await this.dexert.lastOrderId();
           
            assert.equal(lastOrderId, 2);

            assert.ok(await orderExists(this.dexert, secondOrderId, bobAccount, this.token.address, 25, 2, false));
            assert.ok(await orderDoesNotExist(this.dexert, firstOrderId));

            assert.ok(await ordersByAccount(this.dexert, aliceAccount, []));
            assert.ok(await ordersByAccount(this.dexert, bobAccount, [ secondOrderId ]));
            
            assert.ok(await buyOrdersByToken(this.dexert, this.token.address, []));
            assert.ok(await sellOrdersByToken(this.dexert, this.token.address, [ secondOrderId ]));
        });

        it('cannot put a sell order without enough tokens', async function () {
            await this.token.transfer(bobAccount, 500);
            await this.dexert.depositTokens(this.token.address, 20, { from: bobAccount });
            
            expectThrow(this.dexert.sellTokens(this.token.address, 50, 2, { from: bobAccount }));

            assert.ok(await ordersByAccount(this.dexert, bobAccount, []));
            
            const bobTokenBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);           
            assert.equal(bobTokenBalance, 20);

            const bobReservedTokens = await this.dexert.getReservedTokens(this.token.address, bobAccount);           
            assert.equal(bobReservedTokens, 0);

            const lastOrderId = await this.dexert.lastOrderId();
           
            assert.equal(lastOrderId, 0);
        });
    });
});

