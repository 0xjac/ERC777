pragma solidity ^0.4.18; // solhint-disable-line compiler-fixed


interface EIP777 {
    function name() public constant returns (string);
    function symbol() public constant returns (string);
    function totalSupply() public constant returns (uint256);
    function decimals() public constant returns (uint8);
    function balanceOf(address owner) public constant returns (uint256);
    function erc20compatible() public constant returns (bool);

    function send(address to, uint256 amount) public;
    function send(address to, uint256 amount, bytes userData) public;

    function authorizeOperator(address operator) public;
    function revokeOperator(address operator) public;
    function isOperatorAuthorizedFor(address operator, address tokenHolder) public constant returns (bool);
    function operatorSend(address from, address to, uint256 amount, bytes userData, bytes operatorData) public;

    event Send( // solhint-disable-line no-simple-event-func-name
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes userData,
        address indexed operator,
        bytes operatorData
    ); // solhint-disable-next-line separate-by-one-line-in-contract
    event Mint(address indexed to, uint256 amount, address indexed operator, bytes operatorData);
    event Burn(address indexed from, uint256 amount);
    // solhint-disable-next-line no-simple-event-func-name
    event AuthorizedOperator(address indexed operator, address indexed tokenHolder);
    event RevokedOperator(address indexed operator, address indexed tokenHolder);
}
