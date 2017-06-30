var FIXED = artifacts.require("./FIXED.sol");
var Exchange = artifacts.require("./Exchange.sol");

module.exports = function(deployer) {
  deployer.deploy(FIXED);
  deployer.deploy(Exchange);
};
