pragma solidity ^0.4.18;

interface ITokenRecipient {
  function tokensReceived(address from, address to, uint amount, bytes userData, address operator, bytes operatorData) public;
}
