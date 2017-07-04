let Exchange = artifacts.require("./Exchange.sol");
let FIXED = artifacts.require("./FIXED.sol");
let BigNumber = require("bignumber.js");
let Promise = require("bluebird");
// let Web3 = require("web3");
// let TestRPC = require("ethereumjs-testrpc");
// let web3 = new Web3(TestRPC.provider());
let ethBalance = Promise.promisify(web3.eth.getBalance);

contract('FIXED', function(accounts, another){
  it("1000000 FIXED in accounts[0]", () =>
    FIXED.deployed()
      .then( instance => instance.balanceOf.call(accounts[0]) )
      .then( balance => assert.equal(balance.valueOf(), 1000000, "1000000 wasn't in accounts[0]") )
  );
  it("allow exchange to transfer 50000 FIXED", () =>
    FIXED.deployed()
      .then( instance => instance.approve(Exchange.address, 50000).then(()=>instance) )
      .then( instance => instance.allowance.call(accounts[0], Exchange.address) )
      .then( allowance => assert.equal(allowance.valueOf(), 50000, "exchange not approved for 50000") )
  );
});

contract('Exchange', function(accounts){
  it("accounts[1] BID to buy 50000 FIXED for 1 ETH", () =>
    Exchange.deployed()
      .then( instance => instance.open(1 /* Type.BID */, FIXED.address, 50000, null, {from: accounts[1], value: web3.toWei('1', 'ether')}) )
      .then( () => ethBalance(Exchange.address) )
      .then( balance => assert.equal(balance.valueOf(), web3.toWei('1', 'ether'), "1 ETH wasn't in Exchange contract") )
  );
  it("accounts[0] ASK to sell 50000 FIXED for 1 ETH", () =>
    FIXED.deployed()
      .then( instance => instance.approve(Exchange.address, 50000) )
      .then( () => Exchange.deployed()
        .then( instance => instance.open(0 /* Type.ASK */, FIXED.address, 50000, web3.toWei('1', 'ether')) )
        .then( () => FIXED.deployed().then( instance => instance.balanceOf.call(Exchange.address)) )
        .then( balance => assert.equal(balance.valueOf(), 50000, "50000 wasn't in FIXED accounts[1]") )
      )
  );
  it("accounts[0] Sell FIXED bid id=0", () =>
    FIXED.deployed()
      .then( instance => instance.approve(Exchange.address, 50000) )
      .then( () => Exchange.deployed()
        .then( instance => instance.close(0) )
        .then( () => FIXED.deployed().then( instance => instance.balanceOf.call(accounts[1])) )
        .then( balance => assert.equal(balance.valueOf(), 50000, "50000 wasn't in accounts[1]") )
      )
  );
  it("accounts[1] Buy FIXED ask id=1", () =>
    Exchange.deployed()
      .then( instance => instance.close(1, {from: accounts[1], value: web3.toWei('1', 'ether')}) )
      .then( () => FIXED.deployed().then( instance => instance.balanceOf.call(accounts[1])) )
      .then( balance => assert.equal(balance.valueOf(), 100000, "100000 wasn't in accounts[1]") )
  );
});
