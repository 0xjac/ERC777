pragma solidity ^0.4.18; // solhint-disable-line compiler-fixed

import "./node_modules/eip672/contracts/EIP672.sol";
import "./ERC20.sol";
import "./EIP777.sol";
import "./ITokenRecipient.sol";


contract ERC20CompatibleReferenceToken is ERC20, EIP777, EIP672 {
    address public owner;
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    mapping(address => uint) private balances;
    mapping(address => mapping(address => bool)) private authorized;
    mapping(address => mapping(address => uint256)) private allowed;

    modifier onlyOwner () {
        require(msg.sender == owner);
        _;
    }

    function ERC20CompatibleReferenceToken(string _name, string _symbol, uint8 _decimals) public {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        owner = msg.sender;
    }

    function balanceOf(address _tokenHolder) public constant returns (uint256) {
        return balances[_tokenHolder];
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        bytes memory empty;
        doTransfer(msg.sender, _to, _value, msg.sender, empty);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_value <= allowed[_from][msg.sender]);
        bytes memory empty;
        doTransfer(_from, _to, _value, msg.sender, empty);
        allowed[_from][msg.sender] -= _value;
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) public constant returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    function send(address _to, uint256 _value) public {
        bytes memory empty;
        doSend(msg.sender, _to, _value, empty, msg.sender, empty);
    }

    function send(address _to, uint256 _value, bytes _userData) public {
        bytes memory empty;
        doSend(msg.sender, _to, _value, _userData, msg.sender, empty);
    }

    function send(address _to, uint256 _value, bytes _userData, bytes _operatorData) public {
        doSend(msg.sender, _to, _value, _userData, msg.sender, _operatorData);
    }

    function authorizeOperator(address _operator, bool _authorized) public {
        authorized[_operator][msg.sender] = _authorized;
        AuthorizeOperator(_operator, msg.sender, _authorized);
    }

    function isOperatorAuthorizedFor(address _operator, address _tokenHoler) public constant returns (bool) {
        return authorized[_operator][_tokenHoler];
    }

    function operatorSend(address _from, address _to, uint256 _value, bytes _userData, bytes _operatorData) public {
        require(isOperatorAuthorizedFor(msg.sender, _from));
        doSend(_from, _to, _value, _userData, msg.sender, _operatorData);
    }

    function burn(address _tokenHolder, uint256 _value) public onlyOwner returns(bool) {
        require(balanceOf(_tokenHolder) >= _value);

        balances[_tokenHolder] -= _value;
        totalSupply -= _value;

        Burn(_tokenHolder, _value); // TODO should we call tokenFallback on _tokenholder?

        return true;
    }

    function mint(address _tokenHolder, uint256 _value, bytes _operatorData) public onlyOwner returns(bool) {
        balances[_tokenHolder] += _value;
        totalSupply += _value;

        bytes memory empty;

        address recipientImplementation = interfaceAddr(_tokenHolder, "ITokenRecipient");
        if (recipientImplementation != 0) {
            ITokenRecipient(recipientImplementation).tokensReceived(
                0x0, _tokenHolder, _value, empty, msg.sender, _operatorData);
        } else {
            require(isEOA(_tokenHolder));
        }
        Mint(_tokenHolder, _value); // TODO Add _operatorData or not?
    }

    function doTransfer(address _from, address _to, uint256 _value, address _operator, bytes _operatorData) private {
        if (_value == 0) { return; }

        require(_to != address(0));         // forbid sending to 0x0 (=burning)
        require(_value > 0);                // only send positive amounts
        require(balances[_from] >= _value); // ensure enough funds

        balances[_from] -= _value;
        balances[_to] += _value;

        bytes memory empty;
        address recipientImplementation = interfaceAddr(_to, "ITokenRecipient");
        if (recipientImplementation != 0) {
            ITokenRecipient(recipientImplementation).tokensReceived(
                _from, _to, _value, empty, _operator, _operatorData);
        }

        Transfer(_from, _to, _value);
    }

    function doSend(
        address _from,
        address _to,
        uint256 _value,
        bytes _userData,
        address _operator,
        bytes _operatorData
    )
        private
    {
        if (_value == 0) { return; }

        require(_to != address(0));         // forbid sending to 0x0 (=burning)
        require(_value > 0);                // only send positive amounts
        require(balances[_from] >= _value); // ensure enough funds

        balances[_from] -= _value;
        balances[_to] += _value;

        address recipientImplementation = interfaceAddr(_to, "ITokenRecipient");
        if (recipientImplementation != 0) {
            ITokenRecipient(recipientImplementation).tokensReceived(
                _from, _to, _value, _userData, _operator, _operatorData);
        } else {
            require(isEOA(_to));
        }
        Send(_from, _to, _value, _userData, _operator, _operatorData);
    }

    function isEOA(address _addr) private returns(bool) {
        uint size;
        assembly { size := extcodesize(_addr) } // solhint-disable-line no-inline-assembly
        return size == 0;
    }
}
