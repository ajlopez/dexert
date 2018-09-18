
const Dexert = artifacts.require('./Dexert.sol');
const Token = artifacts.require('./Token.sol');

async function expectThrow (promise) {
  try {
    await promise;
  } catch (error) {
      return;
  }
  
  assert.fail('Expected throw not received');
}

contract('Dexert', function (accounts) {
    const ownerAccount = accounts[0];
    const aliceAccount = accounts[1];
    const bobAccount = accounts[2];
    
    const TOTAL_SUPPLY = 1000000;

    beforeEach(async function() {
        this.dexert = await Dexert.new();
        this.token = await Token.new();
    });

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
            assert.ok(initialAliceEtherBalance.add(50).equals(finalAliceEtherBalance));
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
        it('orders by account', async function() {
            const orders = await this.dexert.getOrdersByAccount(aliceAccount, { from: bobAccount });
           
            assert.ok(orders);
            assert.equal(orders.length, 4);
            assert.equal(orders[0].length, 0);
            assert.equal(orders[1].length, 0);
            assert.equal(orders[2].length, 0);
            assert.equal(orders[3].length, 0);
        });

        it('buy orders by token', async function() {
            const orders = await this.dexert.getBuyOrdersByToken(this.token.address, { from: aliceAccount });
           
            assert.ok(orders);
            assert.equal(orders.length, 4);
            assert.equal(orders[0].length, 0);
            assert.equal(orders[1].length, 0);
            assert.equal(orders[2].length, 0);
            assert.equal(orders[3].length, 0);
        });

        it('sell orders by token', async function() {
            const orders = await this.dexert.getSellOrdersByToken(this.token.address, { from: aliceAccount });
           
            assert.ok(orders);
            assert.equal(orders.length, 4);
            assert.equal(orders[0].length, 0);
            assert.equal(orders[1].length, 0);
            assert.equal(orders[2].length, 0);
            assert.equal(orders[3].length, 0);
        });
        
        it('last order id is zero', async function() {
            const lastOrderId = await this.dexert.lastOrderId({ from: aliceAccount });
           
            assert.equal(lastOrderId, 0  );
        });

        it('get no order', async function() {
            const order = await this.dexert.getOrderById(1, { from: aliceAccount });
           
            assert.ok(order);
            assert.ok(order.length);
            assert.equal(order[0], 0);
            assert.equal(order[1], 0);
            assert.equal(order[2], 0);
            assert.equal(order[3], 0);
            assert.equal(order[4], 0);
        });
       
        it('buy order', async function () {
            await this.dexert.deposit({ from: aliceAccount, value: 200 });
            await this.dexert.buyTokens(this.token.address, 50, 2, { from: aliceAccount });
           
            const aliceBalance = await this.dexert.getBalance(aliceAccount);           
            assert.equal(aliceBalance, 100);

            const aliceReserved = await this.dexert.getReserved(aliceAccount);           
            assert.equal(aliceReserved, 100);

            const lastOrderId = await this.dexert.lastOrderId();
           
            assert.equal(lastOrderId, 1);
           
            const order = await this.dexert.getOrderById(1);
           
            assert.ok(order);
            assert.ok(order.length);
            assert.equal(order[0], this.token.address);
            assert.equal(order[1], aliceAccount);
            assert.equal(order[2], 50);
            assert.equal(order[3], 2);
            assert.ok(order[4]);
            
            const ordersByToken = await this.dexert.getBuyOrdersByToken(this.token.address);
            
            assert.ok(ordersByToken);
            assert.equal(ordersByToken.length, 4);
            
            assert.equal(ordersByToken[0].length, 1);
            assert.equal(ordersByToken[0][0], 1);
            
            assert.equal(ordersByToken[1].length, 1);
            assert.equal(ordersByToken[1][0], aliceAccount);
            
            assert.equal(ordersByToken[2].length, 1);
            assert.equal(ordersByToken[2][0], 50);
            
            assert.equal(ordersByToken[3].length, 1);
            assert.equal(ordersByToken[3][0], 2);
            
            const ordersByAccount = await this.dexert.getOrdersByAccount(aliceAccount);
            
            assert.ok(ordersByAccount);
            assert.equal(ordersByAccount.length, 4);
            
            assert.equal(ordersByAccount[0].length, 1);
            assert.equal(ordersByAccount[0][0], this.token.address);
            
            assert.equal(ordersByAccount[1].length, 1);
            assert.equal(ordersByAccount[1][0], 50);
            
            assert.equal(ordersByAccount[2].length, 1);
            assert.equal(ordersByAccount[2][0], 2);
            
            assert.equal(ordersByAccount[3].length, 1);
            assert.equal(ordersByAccount[3][0], true);
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
           
            assert.equal(newLastOrderId, 1);
           
            const order = await this.dexert.getOrderById(1);
           
            assert.ok(order);
            assert.ok(order.length);
            assert.equal(order[0], 0);
            assert.equal(order[1], 0);
            assert.equal(order[2], 0);
            assert.equal(order[3], 0);
            assert.equal(order[4], 0);
            
            const orders = await this.dexert.getBuyOrdersByToken(this.token.address);
            
            assert.ok(orders);
            assert.equal(orders.length, 4);
            
            assert.equal(orders[0].length, 0);
            
            const ordersByAccount = await this.dexert.getOrdersByAccount(aliceAccount);
            
            assert.ok(ordersByAccount);
            assert.equal(ordersByAccount.length, 4);
            
            assert.equal(ordersByAccount[0].length, 0);
        });

        it('two buy orders and cancel first one', async function () {
            await this.dexert.deposit({ from: aliceAccount, value: 200 });
            await this.dexert.buyTokens(this.token.address, 50, 2, { from: aliceAccount });
            const firstOrderId = (await this.dexert.lastOrderId()).toNumber();
            await this.dexert.buyTokens(this.token.address, 25, 3, { from: aliceAccount });
            const secondOrderId = (await this.dexert.lastOrderId()).toNumber();

            await this.dexert.cancelOrder(firstOrderId, { from: aliceAccount });
            
            const aliceBalance = await this.dexert.getBalance(aliceAccount);           
            assert.equal(aliceBalance, 125);

            const aliceReserved = await this.dexert.getReserved(aliceAccount);           
            assert.equal(aliceReserved, 75);

            const newLastOrderId = (await this.dexert.lastOrderId()).toNumber();
           
            assert.equal(newLastOrderId, 2);
           
            const firstOrder = await this.dexert.getOrderById(firstOrderId);
           
            assert.ok(firstOrder);
            assert.ok(firstOrder.length);
            assert.equal(firstOrder[0], 0);
            assert.equal(firstOrder[1], 0);
            assert.equal(firstOrder[2], 0);
            assert.equal(firstOrder[3], 0);
            assert.equal(firstOrder[4], 0);
           
            const secondOrder = await this.dexert.getOrderById(secondOrderId);
           
            assert.ok(secondOrder);
            assert.ok(secondOrder.length);
            assert.equal(secondOrder[0], this.token.address);
            assert.equal(secondOrder[1], aliceAccount);
            assert.equal(secondOrder[2], 25);
            assert.equal(secondOrder[3], 3);
            assert.equal(secondOrder[4], true);
            
            const ordersByToken = await this.dexert.getBuyOrdersByToken(this.token.address);
            
            assert.ok(ordersByToken);
            assert.equal(ordersByToken.length, 4);
            
            assert.equal(ordersByToken[0].length, 1);
            
            assert.equal(ordersByToken[0][0], secondOrderId);  
            assert.equal(ordersByToken[1][0], aliceAccount);  
            assert.equal(ordersByToken[2][0], 25);  
            assert.equal(ordersByToken[3][0], 3);  
            
            const ordersByAccount = await this.dexert.getOrdersByAccount(aliceAccount);
            
            assert.ok(ordersByAccount);
            assert.equal(ordersByAccount.length, 4);
            
            assert.equal(ordersByAccount[0].length, 1);

            assert.equal(ordersByAccount[0][0], this.token.address);  
            assert.equal(ordersByAccount[1][0], 25);  
            assert.equal(ordersByAccount[2][0], 3);  
            assert.equal(ordersByAccount[3][0], true);  
        });

        it('sell and cancel order', async function () {
            await this.token.transfer(bobAccount, 500);
            await this.dexert.depositTokens(this.token.address, 200, { from: bobAccount });
            await this.dexert.sellTokens(this.token.address, 50, 2, { from: bobAccount });

            const lastOrderId = await this.dexert.lastOrderId();

            await this.dexert.cancelOrder(lastOrderId, { from: bobAccount });
            
            const bobTokenBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);           
            assert.equal(bobTokenBalance, 200);

            const bobReservedTokens = await this.dexert.getReservedTokens(this.token.address, bobAccount);           
            assert.equal(bobReservedTokens, 0);

            const newLastOrderId = await this.dexert.lastOrderId();
           
            assert.equal(newLastOrderId, 1);
           
            const order = await this.dexert.getOrderById(1);
           
            assert.ok(order);
            assert.ok(order.length);
            assert.equal(order[0], 0);
            assert.equal(order[1], 0);
            assert.equal(order[2], 0);
            assert.equal(order[3], 0);
            assert.equal(order[4], 0);
            
            const orders = await this.dexert.getSellOrdersByToken(this.token.address);
            
            assert.ok(orders);
            assert.equal(orders.length, 4);
            
            assert.equal(orders[0].length, 0);
            
            const ordersByAccount = await this.dexert.getOrdersByAccount(bobAccount);
            
            assert.ok(ordersByAccount);
            assert.equal(ordersByAccount.length, 4);
            
            assert.equal(ordersByAccount[0].length, 0);
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
           
            const bobTokenBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);           
            assert.equal(bobTokenBalance, 150);

            const bobReservedTokens = await this.dexert.getReservedTokens(this.token.address, bobAccount);           
            assert.equal(bobReservedTokens, 50);

            const lastOrderId = await this.dexert.lastOrderId();
           
            assert.equal(lastOrderId, 1);
           
            const order = await this.dexert.getOrderById(1);
           
            assert.ok(order);
            assert.ok(order.length);
            assert.equal(order[0], this.token.address);
            assert.equal(order[1], bobAccount);
            assert.equal(order[2], 50);
            assert.equal(order[3], 2);
            assert.equal(order[4], false);
            
            const ordersByToken = await this.dexert.getSellOrdersByToken(this.token.address);
            
            assert.ok(ordersByToken);
            assert.equal(ordersByToken.length, 4);
            
            assert.equal(ordersByToken[0].length, 1);
            assert.equal(ordersByToken[0][0], 1);
            
            assert.equal(ordersByToken[1].length, 1);
            assert.equal(ordersByToken[1][0], bobAccount);
            
            assert.equal(ordersByToken[2].length, 1);
            assert.equal(ordersByToken[2][0], 50);
            
            assert.equal(ordersByToken[3].length, 1);
            assert.equal(ordersByToken[3][0], 2);
            
            const ordersByAccount = await this.dexert.getOrdersByAccount(bobAccount);
            
            assert.ok(ordersByAccount);
            assert.equal(ordersByAccount.length, 4);
            
            assert.equal(ordersByAccount[0].length, 1);
            assert.equal(ordersByAccount[0][0], this.token.address);
            
            assert.equal(ordersByAccount[1].length, 1);
            assert.equal(ordersByAccount[1][0], 50);
            
            assert.equal(ordersByAccount[2].length, 1);
            assert.equal(ordersByAccount[2][0], 2);
            
            assert.equal(ordersByAccount[3].length, 1);
            assert.equal(ordersByAccount[3][0], false);
        });

        it('sell and buy order', async function () {
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
            assert.equal(bobTokenBalance, 200 - 25);

            const bobReservedTokens = await this.dexert.getReservedTokens(this.token.address, bobAccount);           
            assert.equal(bobReservedTokens, 25);
           
            const aliceTokenBalance = await this.dexert.getTokenBalance(this.token.address, aliceAccount);           
            assert.equal(aliceTokenBalance, 25);

            const sellOrder = await this.dexert.getOrderById(sellOrderId);
           
            assert.ok(sellOrder);
            assert.ok(sellOrder.length);
            assert.equal(sellOrder[0], this.token.address);
            assert.equal(sellOrder[1], bobAccount);
            assert.equal(sellOrder[2], 25);
            assert.equal(sellOrder[3], 2);
            assert.equal(sellOrder[4], false);

            const buyOrder = await this.dexert.getOrderById(buyOrderId);
           
            assert.ok(buyOrder);
            assert.ok(buyOrder.length);
            assert.equal(buyOrder[0], 0);
            assert.equal(buyOrder[1], 0);
            assert.equal(buyOrder[2], 0);
            assert.equal(buyOrder[3], 0);
            assert.equal(buyOrder[4], false);
            
            const ordersByToken = await this.dexert.getSellOrdersByToken(this.token.address);
            
            assert.ok(ordersByToken);
            assert.equal(ordersByToken.length, 4);
            
            assert.equal(ordersByToken[0].length, 1);
            assert.equal(ordersByToken[0][0], 1);
            
            assert.equal(ordersByToken[1].length, 1);
            assert.equal(ordersByToken[1][0], bobAccount);
            
            assert.equal(ordersByToken[2].length, 1);
            assert.equal(ordersByToken[2][0], 25);
            
            assert.equal(ordersByToken[3].length, 1);
            assert.equal(ordersByToken[3][0], 2);
            
            const ordersByAccount = await this.dexert.getOrdersByAccount(bobAccount);
            
            assert.ok(ordersByAccount);
            assert.equal(ordersByAccount.length, 4);
            
            assert.equal(ordersByAccount[0].length, 1);
            assert.equal(ordersByAccount[0][0], this.token.address);
            
            assert.equal(ordersByAccount[1].length, 1);
            assert.equal(ordersByAccount[1][0], 25);
            
            assert.equal(ordersByAccount[2].length, 1);
            assert.equal(ordersByAccount[2][0], 2);
            
            assert.equal(ordersByAccount[3].length, 1);
            assert.equal(ordersByAccount[3][0], false);
        });

        it('two sell orders and cancel first one', async function () {
            await this.token.transfer(bobAccount, 500);
            await this.dexert.depositTokens(this.token.address, 200, { from: bobAccount });
            
            await this.dexert.sellTokens(this.token.address, 50, 2, { from: bobAccount });
            const firstOrderId = (await this.dexert.lastOrderId()).toNumber();
            
            await this.dexert.sellTokens(this.token.address, 25, 2, { from: bobAccount });
            const secondOrderId = (await this.dexert.lastOrderId()).toNumber();
           
            await this.dexert.cancelOrder(firstOrderId, { from: bobAccount });
           
            const bobTokenBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);           
            assert.equal(bobTokenBalance, 175);

            const bobReservedTokens = await this.dexert.getReservedTokens(this.token.address, bobAccount);           
            assert.equal(bobReservedTokens, 25);

            const lastOrderId = await this.dexert.lastOrderId();
           
            assert.equal(lastOrderId, 2);
           
            const firstOrder = await this.dexert.getOrderById(firstOrderId);
           
            assert.ok(firstOrder);
            assert.ok(firstOrder.length);
            assert.equal(firstOrder[0], 0);
            assert.equal(firstOrder[1], 0);
            assert.equal(firstOrder[2], 0);
            assert.equal(firstOrder[3], 0);
            assert.equal(firstOrder[4], false);

            const secondOrder = await this.dexert.getOrderById(secondOrderId);
           
            assert.ok(secondOrder);
            assert.ok(secondOrder.length);
            assert.equal(secondOrder[0], this.token.address);
            assert.equal(secondOrder[1], bobAccount);
            assert.equal(secondOrder[2], 25);
            assert.equal(secondOrder[3], 2);
            assert.equal(secondOrder[4], false);
            
            const ordersByToken = await this.dexert.getSellOrdersByToken(this.token.address);
            
            assert.ok(ordersByToken);
            assert.equal(ordersByToken.length, 4);
            
            assert.equal(ordersByToken[0].length, 1);
            assert.equal(ordersByToken[0][0], secondOrderId);
            
            assert.equal(ordersByToken[1].length, 1);
            assert.equal(ordersByToken[1][0], bobAccount);
            
            assert.equal(ordersByToken[2].length, 1);
            assert.equal(ordersByToken[2][0], 25);
            
            assert.equal(ordersByToken[3].length, 1);
            assert.equal(ordersByToken[3][0], 2);
            
            const ordersByAccount = await this.dexert.getOrdersByAccount(bobAccount);
            
            assert.ok(ordersByAccount);
            assert.equal(ordersByAccount.length, 4);
            
            assert.equal(ordersByAccount[0].length, 1);
            assert.equal(ordersByAccount[0][0], this.token.address);
            
            assert.equal(ordersByAccount[1].length, 1);
            assert.equal(ordersByAccount[1][0], 25);
            
            assert.equal(ordersByAccount[2].length, 1);
            assert.equal(ordersByAccount[2][0], 2);
            
            assert.equal(ordersByAccount[3].length, 1);
            assert.equal(ordersByAccount[3][0], false);
        });

        it('cannot put a sell order without enough tokens', async function () {
            await this.token.transfer(bobAccount, 500);
            await this.dexert.depositTokens(this.token.address, 20, { from: bobAccount });
            
            expectThrow(this.dexert.sellTokens(this.token.address, 50, 2, { from: bobAccount }));
           
            const bobTokenBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);           
            assert.equal(bobTokenBalance, 20);

            const bobReservedTokens = await this.dexert.getReservedTokens(this.token.address, bobAccount);           
            assert.equal(bobReservedTokens, 0);

            const lastOrderId = await this.dexert.lastOrderId();
           
            assert.equal(lastOrderId, 0);
        });
    });
});

