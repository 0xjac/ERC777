pragma solidity ^0.4.18;

import "./EIP672.sol";
import "./EIP777.sol";
import "./ITokenFallback.sol";

contract ReferenceToken is EIP777, EIP672 {
  string public name;
  string public symbol;
  uint8 public decimals;
  uint256 public totalSupply;

  mapping(address => uint) balances;
  mapping(address => mapping(address => bool)) authorized;

  function ReferenceToken() public {

  }

  function balanceOf(address _tokenHolder) public constant returns (uint256) {
    return balances[_tokenHolder];
  }

  function send(address _to, uint256 _amount) public {
    doSend(msg.sender, _to, _amount);
  }
  function send(address _to, uint256 _amount, bytes _data) public {
    doSend(msg.sender, _to, _amount);
  }
  function send(address _to, uint256 _amount, bytes _data, bytes32 ref) public {
    doSend(msg.sender, _to, _amount);
  }

  function authorizeOperator(address _operator, bool _authorized) public {
    authorized[_operator][msg.sender] = _authorized;
    AuthorizeOperator(_operator, msg.sender, _authorized);
  }
  function isOperatorAuthorizedFor(address _operator, address _tokenHoler) public constant returns (bool) {
    return authorized[_operator][_tokenHoler];
  }
  function operatorSend(address _from, address _to, uint256 _amount, bytes _data, bytes32 _ref) public {
    require(isOperatorAuthorizedFor(msg.sender, _from));
    doSend(_from, _to, _amount);
  }

  function doSend(address _from, address _to, uint256 _amount) private returns(bool) {
    if (_amount == 0) { return true; }

    require(_to != 0);                   // forbid sending to 0x0 (=burning)
    require(_amount > 0);                // only send positive amounts
    require(balances[_from] >= _amount); // ensure enough funds

    balances[_from] -= _amount;
    balances[_to] += _amount;

    Send(_from, _to, _amount, "", "", 0x0);
    address fallbackImpl = interfaceAddr(_to, "ITokenFallback");
    if (fallbackImpl != 0) { ITokenFallback(fallbackImpl).tokenFallback(_from, _to, _amount, "", ""); }

    return true;
  }

  function burn(address _tokenHolder, uint256 _amount) private returns(bool) {
    require(balanceOf(_tokenHolder) >= _amount);

    balances[_tokenHolder] -= _amount;
    totalSupply -= _amount;

    Burn(_tokenHolder, _amount); // TODO should we call tokenFallback on _tokenholder?

    return true;
  }

  function mint(address _tokenHolder, uint256 _amount) private returns(bool) {
    balances[_tokenHolder] += _amount;
    totalSupply += _amount;

    Mint(_tokenHolder, _amount); // TODO should we call tokenFallback on _tokenholder?
  }
}
