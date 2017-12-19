pragma solidity ^0.4.18;

interface ITokenFallback {
  function tokenFallback(address from, address to, uint value, bytes data, bytes32 ref) public;
}
