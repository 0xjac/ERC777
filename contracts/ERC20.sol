pragma solidity ^0.4.18; // solhint-disable-line compiler-fixed


interface ERC20 {
    function name() public constant returns (string name);
    function symbol() public constant returns (string symbol);
    function decimals() public constant returns (uint8 decimals);
    function totalSupply() public constant returns (uint256 totalSupply);
    function balanceOf(address owner) public constant returns (uint256 balance);
    function transfer(address to, uint256 value) public returns (bool success);
    function transferFrom(address from, address to, uint256 value) public returns (bool success);
    function approve(address spender, uint256 value) public returns (bool success);
    function allowance(address owner, address spender) public constant returns (uint256 remaining);

    // solhint-disable-next-line no-simple-event-func-name
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
