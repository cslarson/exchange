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
  it("accounts[1] BidOpen to buy 50000 FIXED for 1 ETH", () =>
    Exchange.deployed()
      .then( instance => instance.bid(FIXED.address, 50000, {from: accounts[1], value: new BigNumber('1000000000000000000')}) )
      .then( () => ethBalance(Exchange.address) )
      .then( balance => assert.equal(balance.valueOf(), 1000000000000000000, "1 ETH wasn't in Exchange contract") )
  );
  it("accounts[0] AskOpen to sell 50000 FIXED for 1 ETH", () =>
    FIXED.deployed()
      .then( instance => instance.approve(Exchange.address, 50000) )
      .then( () => Exchange.deployed()
        .then( instance => instance.ask(FIXED.address, 50000, new BigNumber('1000000000000000000')) )
        .then( () => FIXED.deployed().then( instance => instance.balanceOf.call(Exchange.address)) )
        .then( balance => assert.equal(balance.valueOf(), 50000, "50000 wasn't in FIXED accounts[1]") )
      )
  );
  it("accounts[0] Sell FIXED bid id=0", () =>
    FIXED.deployed()
      .then( instance => instance.approve(Exchange.address, 50000) )
      .then( () => Exchange.deployed()
        .then( instance => instance.sell(FIXED.address, 0) )
        .then( () => FIXED.deployed().then( instance => instance.balanceOf.call(accounts[1])) )
        .then( balance => assert.equal(balance.valueOf(), 50000, "50000 wasn't in accounts[1]") )
      )
  );
  it("accounts[1] Buy FIXED ask id=0", () =>
    Exchange.deployed()
      .then( instance => instance.buy(FIXED.address, 0, {from: accounts[1], value: new BigNumber('1000000000000000000')}) )
      .then( () => FIXED.deployed().then( instance => instance.balanceOf.call(accounts[1])) )
      .then( balance => assert.equal(balance.valueOf(), 100000, "100000 wasn't in accounts[1]") )
  );
});
