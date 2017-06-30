pragma solidity ^0.4.11;

import "./ERC20.sol";

contract Exchange {

  enum Status { Open, Cancel, Close }

  struct Offer {
    address offeror;
    uint256 amount;
    uint256 value;
    Status status;
  }

  /*Offer[] public bids;
  Offer[] public asks;*/
  mapping(address => Offer[]) public bids;
  mapping(address => Offer[]) public asks;

  event BidOpen(uint256 id, address tokenAddress, address offeror, uint256 amount, uint256 value);
  event AskOpen(uint256 id, address tokenAddress, address offeror, uint256 amount, uint256 value);

  // wants to buy token, deposits eth & opens bid
  function bid(address _tokenAddress, uint256 _amount) payable {
    // contract takes custody of msg.value
    Offer memory o;
    o.offeror = msg.sender;
    o.amount = _amount;
    o.value = msg.value;
    o.status = Status.Open;
    uint256 id = bids[_tokenAddress].push(o) - 1;

    BidOpen(id, _tokenAddress, msg.sender, _amount, msg.value);
  }

  // wants to sell token, deposits token & opens bid
  function ask(address _tokenAddress, uint256 _amount, uint256 _value){
    ERC20 token = ERC20(_tokenAddress);
    // verify seller has permitted contract to transfer tokens
    require( token.allowance(msg.sender, this) >= _amount );
    // take custody of tokens
    assert( token.transferFrom(msg.sender, this, _amount) );
    // push returns length, so id is last item index or length - 1
    Offer memory o;
    o.offeror = msg.sender;
    o.amount = _amount;
    o.value = _value;
    o.status = Status.Open;
    uint256 id = asks[_tokenAddress].push(o) - 1;

    AskOpen(id, _tokenAddress, msg.sender, _amount, _value);
  }

  // seller calls this on a bid
  function sell(address _tokenAddress, uint256 _id) returns (bool){
    Offer o = bids[_tokenAddress][_id];
    ERC20 token = ERC20(_tokenAddress);
    // verify seller has permitted contract to transfer tokens
    require( token.allowance(msg.sender, this) >= o.amount );
    // transfer seller tokens to buyer (offeror)
    assert( token.transferFrom(msg.sender, o.offeror, o.amount) );
    // send custody eth to seller
    o.offeror.transfer(o.value);

    return true;
  }

  // buyer calls this on an ask
  function buy(address _tokenAddress, uint256 _id) payable returns (bool){
    Offer o = asks[_tokenAddress][_id];
    // is buyer paying the right amount?
    require( msg.value == o.value );
    // send tokens to buyer
    assert( ERC20(_tokenAddress).transfer(msg.sender, o.amount) );
    // send eth to seller
    o.offeror.transfer(msg.value);

    return true;
  }

}
