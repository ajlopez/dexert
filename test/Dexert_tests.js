
const Dexert = artifacts.require('./Dexert.sol');
const Token = artifacts.require('./Token.sol');

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

            try {
                await this.dexert.withdraw(150, { from: aliceAccount, gasPrice: 0 });
                assert.fail();
            }
            catch (ex) {
            };
            
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
            try {
                await this.dexert.depositTokens(this.token.address, 100, { from: aliceAccount });
                assert.fail();
            }
            catch (ex) {
            }
            
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
            try {
                await this.dexert.withdrawTokens(this.token.address, 100, { from: aliceAccount });
                assert.fail();
            }
            catch (ex) {
            }
            
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
            assert.equal(orders.length, 2);
            assert.equal(orders[0].length, 0);
            assert.equal(orders[1].length, 0);
        });

        it('orders by token', async function() {
            const orders = await this.dexert.getOrdersByToken(this.token.address, { from: aliceAccount });
           
            assert.ok(orders);
            assert.equal(orders.length, 2);
            assert.equal(orders[0].length, 0);
            assert.equal(orders[1].length, 0);
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
        });

       it('cannot put a buy order without enough balance', async function () {
            await this.dexert.deposit({ from: aliceAccount, value: 50 });
           
            try {
                await this.dexert.buyTokens(this.token.address, 50, 2, { from: aliceAccount });
                assert.fail();
            }
            catch (ex) {
            }

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
        });

        it('cannot put a sell order without enough tokens', async function () {
            await this.token.transfer(bobAccount, 500);
            await this.dexert.depositTokens(this.token.address, 20, { from: bobAccount });
            
            try {
                await this.dexert.sellTokens(this.token.address, 50, 2, { from: bobAccount });
                assert.fail();
            }
            catch (ex) {
            }
           
            const bobTokenBalance = await this.dexert.getTokenBalance(this.token.address, bobAccount);           
            assert.equal(bobTokenBalance, 20);

            const bobReservedTokens = await this.dexert.getReservedTokens(this.token.address, bobAccount);           
            assert.equal(bobReservedTokens, 0);

            const lastOrderId = await this.dexert.lastOrderId();
           
            assert.equal(lastOrderId, 0);
        });
    });
});

