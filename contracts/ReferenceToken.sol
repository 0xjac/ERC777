/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

pragma solidity ^0.4.19; // solhint-disable-line compiler-fixed

import "../node_modules/eip820/contracts/EIP820.sol";
import "../node_modules/giveth-common-contracts/contracts/Owned.sol";
import "../node_modules/giveth-common-contracts/contracts/SafeMath.sol";
import "./Ierc20.sol";
import "./Ierc777.sol";
import "./ITokenRecipient.sol";
import "./TokenableContractsRegistry.sol";


contract ReferenceToken is Owned, Ierc20, Ierc777, EIP820 {
    using SafeMath for uint256;

    string private mName;
    string private mSymbol;
    uint256 private mGranularity;
    uint256 private mTotalSupply;

    bool private mErc20compatible;

    TokenableContractsRegistry public tokenableContractsRegistry;

    mapping(address => uint) private mBalances;
    mapping(address => mapping(address => bool)) private mAuthorized;
    mapping(address => mapping(address => uint256)) private mAllowed;

    modifier erc20 () {
        require(mErc20compatible);
        _;
    }

    function ReferenceToken(
        string _name,
        string _symbol,
        uint256 _granularity,
        TokenableContractsRegistry _tokenableContractsRegistry
    )
        public
    {
        mName = _name;
        mSymbol = _symbol;
        mTotalSupply = 0;
        mErc20compatible = true;
        require(_granularity >= 1);
        mGranularity = _granularity;

        tokenableContractsRegistry = _tokenableContractsRegistry;
        setInterfaceImplementation("Ierc777", this);
        setInterfaceImplementation("Ierc20", this);
    }

    /** @notice Return the name of the token */
    function name() public constant returns (string) { return mName; }
    /** @notice Return the symbol of the token */
    function symbol() public constant returns(string) { return mSymbol; }
    /** @notice Return the non divisible minimal partition of the token */
    function granularity() public constant returns(uint256) { return mGranularity; }
    /** @notice Return the Total token supply */
    function totalSupply() public constant returns(uint256) { return mTotalSupply; }

    /** For Backwards compatibility */
    function decimals() public erc20 constant returns (uint8) { return uint8(18); }

    /**
     * @notice Return the account balance of some account
     *
     * @param _tokenHolder Address for whith to return the balance
     */
    function balanceOf(address _tokenHolder) public constant returns (uint256) {
        return mBalances[_tokenHolder];
    }

    /** @notice Disable the ERC-20 interface */
    function disableERC20() public onlyOwner {
        mErc20compatible = false;
        setInterfaceImplementation("Ierc20", 0x0);
    }

    /** @notice Enable the ERC-20 interface */
    function enableERC20() public onlyOwner {
        mErc20compatible = true;
        setInterfaceImplementation("Ierc20", this);
    }

    /** @notice ERC-20 transfer */
    function transfer(address _to, uint256 _value) public erc20 returns (bool success) {
        doSend(msg.sender, _to, _value, "", msg.sender, "", false);
        return true;
    }

    /** @notice ERC-20 transferFrom */
    function transferFrom(address _from, address _to, uint256 _value) public erc20 returns (bool success) {
        require(_value <= mAllowed[_from][msg.sender]);

        // Cannot be after doSend because of tokensReceived re-entry
        mAllowed[_from][msg.sender] = mAllowed[_from][msg.sender].sub(_value);
        doSend(_from, _to, _value, "", msg.sender, "", false);
        return true;
    }

    /** @notice ERC-20 approve */
    function approve(address _spender, uint256 _value) public erc20 returns (bool success) {
        mAllowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    /** @notice ERC-20 allowance */
    function allowance(address _owner, address _spender) public erc20 constant returns (uint256 remaining) {
        return mAllowed[_owner][_spender];
    }

    /** @notice Send '_value' amount of tokens to address '_to'. */
    function send(address _to, uint256 _value) public {
        doSend(msg.sender, _to, _value, "", msg.sender, "", true);
    }

    /** @notice Send '_value' amount of tokens to address '_to'. */
    function send(address _to, uint256 _value, bytes _userData) public {
        doSend(msg.sender, _to, _value, _userData, msg.sender, "", true);
    }

    /** @notice Authorize a third party '_operator' to manage (send) 'msg.sender''s tokens. */
    function authorizeOperator(address _operator) public {
        require(_operator != msg.sender);
        mAuthorized[_operator][msg.sender] = true;
        AuthorizedOperator(_operator, msg.sender);
    }

    /** @notice Revoke a third party '_operator''s rights to manage (send) 'msg.sender''s tokens. */
    function revokeOperator(address _operator) public {
        require(_operator != msg.sender);
        mAuthorized[_operator][msg.sender] = false;
        RevokedOperator(_operator, msg.sender);
    }

    /** @notice Check whether '_operator' is allowed to manage the tokens held by '_tokenHolder'. */
    function isOperatorFor(address _operator, address _tokenHolder) public constant returns (bool) {
        return _operator == _tokenHolder || mAuthorized[_operator][_tokenHolder];
    }

    /** @notice Send '_value' amount of tokens from the address '_from' to the address '_to'. */
    function operatorSend(address _from, address _to, uint256 _value, bytes _userData, bytes _operatorData) public {
        require(isOperatorFor(msg.sender, _from));
        doSend(_from, _to, _value, _userData, msg.sender, _operatorData, true);
    }

    /** @notice Sample burn function to showcase the use of the 'Burn' event. */
    function burn(address _tokenHolder, uint256 _value) public onlyOwner returns(bool) {
        requireMultiple(_value);
        require(balanceOf(_tokenHolder) >= _value);

        mBalances[_tokenHolder] = mBalances[_tokenHolder].sub(_value);
        mTotalSupply = mTotalSupply.sub(_value);

        Burn(_tokenHolder, _value);
        if (mErc20compatible) { Transfer(_tokenHolder, 0x0, _value); }

        return true;
    }

    /** @notice Sample mint function to showcase the use of the 'Mint' event and the logic to notify the recipient. */
    function ownerMint(address _tokenHolder, uint256 _value, bytes _operatorData) public onlyOwner returns(bool) {
        requireMultiple(_value);
        mTotalSupply = mTotalSupply.add(_value);
        mBalances[_tokenHolder] = mBalances[_tokenHolder].add(_value);

        callRecipent(0x0, _tokenHolder, _value, "", msg.sender, _operatorData, true);

        Mint(_tokenHolder, _value, msg.sender, _operatorData);
        if (mErc20compatible) { Transfer(0x0, _tokenHolder, _value); }

        return true;
    }

    function requireMultiple(uint256 _value) internal { require(_value.div(mGranularity).mul(mGranularity) == _value); }

    /** @notice Check whether a contrat address registered with the Tokenable Contract Registry to receive tokens*/
    function isTokenable(address _addr) internal constant returns(bool) {
        if (address(tokenableContractsRegistry) == 0x0) return false;
        return tokenableContractsRegistry.isTokenable(_addr);
    }

    /** @notice Check whether an address is a regular address or not. */
    function isRegularAddress(address _addr) internal constant returns(bool) {
        if (_addr == 0) { return false; }
        uint size;
        assembly { size := extcodesize(_addr) } // solhint-disable-line no-inline-assembly
        return size == 0;
    }

    /** @dev Perform an actual send of tokens. */
    function doSend(
        address _from,
        address _to,
        uint256 _value,
        bytes _userData,
        address _operator,
        bytes _operatorData,
        bool _preventLocking
    )
        private
    {
        requireMultiple(_value);
        require(_to != address(0));          // forbid sending to 0x0 (=burning)
        require(mBalances[_from] >= _value); // ensure enough funds

        mBalances[_from] = mBalances[_from].sub(_value);
        mBalances[_to] = mBalances[_to].add(_value);

        callRecipent(_from, _to, _value, _userData, _operator, _operatorData, _preventLocking);

        Send(_from, _to, _value, _userData, _operator, _operatorData);
        if (mErc20compatible) { Transfer(_from, _to, _value); }
    }

    /** @dev Notify a recipient of received tokens. */
    function callRecipent(
        address _from,
        address _to,
        uint256 _value,
        bytes _userData,
        address _operator,
        bytes _operatorData,
        bool _preventLocking
    ) private {
        address recipientImplementation = interfaceAddr(_to, "ITokenRecipient");
        if (recipientImplementation != 0) {
            ITokenRecipient(recipientImplementation).tokensReceived(
                _from, _to, _value, _userData, _operator, _operatorData);
        } else if (_preventLocking) {
            require(isRegularAddress(_to) || isTokenable(_to));
        }
    }
}
