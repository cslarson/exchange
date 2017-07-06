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
      .then( fixed => fixed.balanceOf.call(accounts[0]) )
      .then( balance => assert.equal(balance.valueOf(), 1000000, "1000000 wasn't in accounts[0]") )
  );
  it("allow exchange to transfer 50000 FIXED", () =>
    FIXED.deployed()
      .then( fixed => fixed.approve(Exchange.address, 50000).then(()=>fixed) )
      .then( fixed => fixed.allowance.call(accounts[0], Exchange.address) )
      .then( allowance => assert.equal(allowance.valueOf(), 50000, "exchange not approved for 50000") )
  );
});

contract('Exchange', function(accounts){
  it("accounts[1] BID to buy 50000 FIXED for 1 ETH", () =>
    Exchange.deployed()
      .then( exchange => exchange.open(1 /* Type.BID */, FIXED.address, 50000, null, {from: accounts[1], value: web3.toWei('1', 'ether')}) )
      .then( () => ethBalance(Exchange.address) )
      .then( balance => assert.equal(balance.valueOf(), web3.toWei('1', 'ether'), "1 ETH wasn't in Exchange contract") )
  );
  it("accounts[0] ASK to sell 50000 FIXED for 1 ETH", () =>
    FIXED.deployed()
      .then( fixed => fixed.approve(Exchange.address, 50000) )
      .then( () => Exchange.deployed()
        .then( exchange => exchange.open(0 /* Type.ASK */, FIXED.address, 50000, web3.toWei('1', 'ether')) )
        .then( () => FIXED.deployed().then(fixed => fixed.balanceOf.call(Exchange.address)) )
        .then( balance => assert.equal(balance.valueOf(), 50000, "50000 wasn't in FIXED Exchange.address") )
      )
  );
  it("accounts[0] Sell FIXED bid id=0", () =>
    FIXED.deployed()
      .then( fixed => fixed.approve(Exchange.address, 50000) )
      .then( () => Exchange.deployed()
        .then( exchange => exchange.fill([0]) )
        .then( () => FIXED.deployed().then(fixed => fixed.balanceOf.call(accounts[1])) )
        .then( balance => assert.equal(balance.valueOf(), 50000, "50000 wasn't in accounts[1]") )
      )
  );
  it("accounts[1] ASK to sell 50000 FIXED for 2 ETH", () =>
    FIXED.deployed()
      .then( fixed => fixed.approve(Exchange.address, 50000, {from: accounts[1]}) )
      .then( () => Exchange.deployed()
        .then( exchange => exchange.open(0 /* Type.ASK */, FIXED.address, 50000, web3.toWei('2', 'ether'), {from: accounts[1]}) )
        .then( () => FIXED.deployed().then(fixed => fixed.balanceOf.call(Exchange.address)) )
        .then( balance => assert.equal(balance.valueOf(), 100000, "100000 wasn't in FIXED Exchange.address") )
      )
  );
  it("multi ASK fill: accounts[2] Buy FIXED ask id=1,2", () =>
    Exchange.deployed()
      .then( exchange => exchange.fill([1,2], {from: accounts[2], value: web3.toWei('3', 'ether')}) )
      .then( () => FIXED.deployed().then(fixed => fixed.balanceOf.call(accounts[2])) )
      .then( balance => assert.equal(balance.valueOf(), 100000, "100000 wasn't in accounts[2]") )
  );
  it("multi BID fill with partial: accounts[2] Sell FIXED bid id=3,4,5,6", () =>
    FIXED.deployed()
      .then( fixed => fixed.approve(Exchange.address, 95000, {from: accounts[2]}) )
      .then( () => Exchange.deployed()
        .then( exchange => exchange.open(1 /* Type.BID */, FIXED.address, 30000, null, {value: web3.toWei('1', 'ether')}).then(()=>exchange) )
        .then( exchange => exchange.open(1 /* Type.BID */, FIXED.address, 30000, null, {value: web3.toWei('1.25', 'ether')}).then(()=>exchange) )
        .then( exchange => exchange.open(1 /* Type.BID */, FIXED.address, 30000, null, {value: web3.toWei('1.5', 'ether')}).then(()=>exchange) )
        .then( exchange => exchange.open(1 /* Type.BID */, FIXED.address, 30000, null, {value: web3.toWei('1.75', 'ether')}).then(()=>exchange) )
        .then( exchange => exchange.fill([3,4,5,6], {from: accounts[2]}) )
        .then( () => FIXED.deployed().then(fixed => fixed.balanceOf.call(accounts[0])) )
        .then( balance => assert.equal(balance.valueOf(), 995000, "995000 wasn't in accounts[0]") )
        .then( () => FIXED.deployed().then(fixed => fixed.balanceOf.call(accounts[2])) )
        .then( balance => assert.equal(balance.valueOf(), 5000, "5000 wasn't in accounts[2]") )
        .then( () => ethBalance(Exchange.address) )
        .then( balance => assert.equal(balance.valueOf(), 1458333333333333334, "1458333333333333334 Wei wasn't in Exchange contract") )
      )
  );
  it("multi ASK fill with partial: accounts[2] Buy FIXED ask id=7,8,9", () =>
    FIXED.deployed()
      .then( fixed => fixed.approve(Exchange.address, 80000) )
      .then( () => Exchange.deployed()
        .then( exchange => exchange.open(0 /* Type.ASK */, FIXED.address, 20000, web3.toWei('2', 'ether')).then(()=>exchange) )
        .then( exchange => exchange.open(0 /* Type.ASK */, FIXED.address, 25000, web3.toWei('2.5', 'ether')).then(()=>exchange) )
        .then( exchange => exchange.open(0 /* Type.ASK */, FIXED.address, 35000, web3.toWei('3.5', 'ether')).then(()=>exchange) )
        .then( exchange => exchange.fill([7,8,9], {from: accounts[2], value: web3.toWei('6', 'ether')}) )
        .then( () => FIXED.deployed().then(fixed => fixed.balanceOf.call(accounts[2])) )
        .then( balance => assert.equal(balance.valueOf(), 65000, "65000 wasn't in accounts[2]") )
        .then( () => FIXED.deployed().then(fixed => fixed.balanceOf.call(Exchange.address)) )
        .then( balance => assert.equal(balance.valueOf(), 20000, "20000 wasn't in FIXED Exchange.address") )
      )
  );
  it("multi ASK fill with cancellation and refund: accounts[2] Buy FIXED ask id=10,11 (canceled),12", () =>
    FIXED.deployed()
      .then( fixed => fixed.approve(Exchange.address, 80000) )
      .then( () => Exchange.deployed()
        .then( exchange => exchange.open(0 /* Type.ASK */, FIXED.address, 20000, web3.toWei('2', 'ether')).then(()=>exchange) )
        .then( exchange => exchange.open(0 /* Type.ASK */, FIXED.address, 25000, web3.toWei('2.5', 'ether')).then(()=>exchange) )
        .then( exchange => exchange.open(0 /* Type.ASK */, FIXED.address, 35000, web3.toWei('3.5', 'ether')).then(()=>exchange) )
        .then( exchange => exchange.cancel([11]).then(()=>exchange) )
        .then( exchange => exchange.fill([10,11,12], {from: accounts[2], value: web3.toWei('8', 'ether')}) )
        .then( () => FIXED.deployed().then(fixed => fixed.balanceOf.call(accounts[2])) )
        .then( balance => assert.equal(balance.valueOf(), 65000+55000, "120000 wasn't in accounts[2]") )
      )
  );
});
