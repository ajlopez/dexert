
const Dexert = artifacts.require('./Dexert.sol');

contract('Dexert', function (accounts) {
    const ownerAccount = accounts[0];
    const aliceAccount = accounts[1];
    const bobAccount = accounts[2];

    beforeEach(async function() {
        this.dexert = await Dexert.new();
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
});

