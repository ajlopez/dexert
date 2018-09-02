
const Dexert = artifacts.require('./Dexert.sol');

contract('Dexert', function (accounts) {
    const ownerAccount = accounts[0];
    const aliceAccount = accounts[1];
    const bobAccount = accounts[2];

    beforeEach(async function() {
        this.dexert = await Dexert.new();
    });
    
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
});

