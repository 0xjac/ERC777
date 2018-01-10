pragma solidity ^0.4.18; // solhint-disable-line compiler-fixed

import "../node_modules/eip820/contracts/EIP820.sol";
import "../node_modules/giveth-common-contracts/contracts/Owned.sol";
import "./Ierc20.sol";
import "./Ierc777.sol";
import "./ITokenRecipient.sol";
import "./TokenableContractsRegistry.sol";


contract ReferenceToken is Owned, Ierc20, Ierc777, EIP820 {

    string prvName;
    string prvSymbol;
    uint8  prvDecimals;
    uint256 prvTotalSupply;

    bool prvErc20compatible;

    TokenableContractsRegistry public tokenableContractsRegistry;

    mapping(address => uint) private balances;
    mapping(address => mapping(address => bool)) private authorized;
    mapping(address => mapping(address => uint256)) private allowed;

    modifier erc20 () {
        require(prvErc20compatible);
        _;
    }

    function ReferenceToken(string _name, string _symbol, uint8 _decimals, TokenableContractsRegistry _tokenableContractsRegistry) public {
        prvName = _name;
        prvSymbol = _symbol;
        prvDecimals = _decimals;
        prvTotalSupply = 0;
        prvErc20compatible = true;

        tokenableContractsRegistry = _tokenableContractsRegistry;
        setInterfaceImplementation("Ierc777", this);
        setInterfaceImplementation("Ierc20", this);
    }


    function name() public constant returns (string) { return prvName; }
    function symbol() public constant returns(string) { return prvSymbol; }
    function decimals() public constant returns(uint8) { return prvDecimals; }
    function totalSupply() public constant returns(uint256) { return prvTotalSupply; }
    function erc20compatible() public constant returns(bool) { return prvErc20compatible; }

    function balanceOf(address _tokenHolder) public constant returns (uint256) {
        return balances[_tokenHolder];
    }

    function turnOffErcCompatibility() public onlyOwner {
        prvErc20compatible = false;
        setInterfaceImplementation("Ierc20", 0x0);
    }

    function transfer(address _to, uint256 _value) erc20 public returns (bool success) {
        doSend(msg.sender, _to, _value, "", msg.sender, "", false);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) erc20 public returns (bool success) {
        require(_value <= allowed[_from][msg.sender]);

        // Cannot be after doSend because of tokensReceived re-entry, but before check?
        allowed[_from][msg.sender] -= _value;
        doSend(_from, _to, _value, "", msg.sender, "", false);
        return true;
    }

    function approve(address _spender, uint256 _value) erc20 public returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) erc20 public constant returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    function send(address _to, uint256 _value) public {
        doSend(msg.sender, _to, _value, "", msg.sender, "", true);
    }

    function send(address _to, uint256 _value, bytes _userData) public {
        doSend(msg.sender, _to, _value, _userData, msg.sender, "", true);
    }

    function authorizeOperator(address _operator) public {
        require(_operator != msg.sender);
        authorized[_operator][msg.sender] = true;
        AuthorizedOperator(_operator, msg.sender);
    }

    function revokeOperator(address _operator) public {
        require(_operator != msg.sender);
        authorized[_operator][msg.sender] = false;
        RevokedOperator(_operator, msg.sender);
    }

    function isOperatorFor(address _operator, address _tokenHolder) public constant returns (bool) {
        return _operator == _tokenHolder || authorized[_operator][_tokenHolder];
    }

    function operatorSend(address _from, address _to, uint256 _value, bytes _userData, bytes _operatorData) public {
        require(isOperatorFor(msg.sender, _from));
        doSend(_from, _to, _value, _userData, msg.sender, _operatorData, true);
    }

    function burn(address _tokenHolder, uint256 _value) public onlyOwner returns(bool) {
        require(balanceOf(_tokenHolder) >= _value);

        balances[_tokenHolder] -= _value;
        prvTotalSupply -= _value;

        Burn(_tokenHolder, _value);
        if (prvErc20compatible) { Transfer(_tokenHolder, 0x0, _value); }

        return true;
    }

    function ownerMint(address _tokenHolder, uint256 _value, bytes _operatorData) public onlyOwner returns(bool) {

        require(prvTotalSupply + _value >= prvTotalSupply); // Overflow check
        prvTotalSupply += _value;
        balances[_tokenHolder] += _value;

        callRecipent(0x0, _tokenHolder, _value, "", msg.sender, _operatorData, true);

        Mint(_tokenHolder, _value, msg.sender, _operatorData);
        if (prvErc20compatible) { Transfer(0x0, _tokenHolder, _value); }
        return true;
    }

    function doSend(
        address _from,
        address _to,
        uint256 _value,
        bytes _userData,
        address _operator,
        bytes _operatorData,
        bool _isSend
    )
        private
    {
        require(_to != address(0));         // forbid sending to 0x0 (=burning)
        require(_value >= 0);               // only send positive amounts
        require(balances[_from] >= _value); // ensure enough funds

        balances[_from] -= _value;
        balances[_to] += _value;

        callRecipent(_from, _to, _value, _userData, _operator, _operatorData, _isSend);

        Send(_from, _to, _value, _userData, _operator, _operatorData);
        if (prvErc20compatible) { Transfer(_from, _to, _value); }
    }

    function callRecipent(
        address _from,
        address _to,
        uint256 _value,
        bytes _userData,
        address _operator,
        bytes _operatorData,
        bool isSend
    ) private {
        address recipientImplementation = interfaceAddr(_to, "ITokenRecipient");
        if (recipientImplementation != 0) {
            ITokenRecipient(recipientImplementation).tokensReceived(
                _from, _to, _value, _userData, _operator, _operatorData);
        } else {
            if (isSend) {
                require(isAddress(_to) || isTokenable(_to));
            }
        }
    }


    function isTokenable(address _addr) internal constant returns(bool) {
        if (address(tokenableContractsRegistry) == 0x0) return false;
        return tokenableContractsRegistry.isTokenable(_addr);
    }

    function isAddress(address _addr) internal constant returns(bool) {
        if (_addr == 0) { return false; }
        uint size;
        assembly { size := extcodesize(_addr) } // solhint-disable-line no-inline-assembly
        return size == 0;
    }

    function getCodeHash(address addr) view public returns(bytes32) {
        bytes memory o_code;
        assembly {
            // retrieve the size of the code, this needs assembly
            let size := extcodesize(addr)
            // allocate output byte array - this could also be done without assembly
            // by using o_code = new bytes(size)
            o_code := mload(0x40)
            // new "memory end" including padding
            mstore(0x40, add(o_code, and(add(add(size, 0x20), 0x1f), not(0x1f))))
            // store length in memory
            mstore(o_code, size)
            // actually retrieve the code, this needs assembly
            extcodecopy(addr, add(o_code, 0x20), 0, size)
        }
        return keccak256(o_code);
    }


}
