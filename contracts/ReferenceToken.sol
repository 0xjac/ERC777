/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/// @title ERC777 ReferenceToken Contract
/// @author Jordi Baylina, Jacques Dafflon
/// @dev This token contract's goal is to give an example implementation
///  of ERC777 with ERC20 compatible.
///  This contract does not define any standard, but can be taken as a reference
///  implementation in case of any ambiguity into the standard

pragma solidity ^0.4.19; // solhint-disable-line compiler-fixed

import "eip820/contracts/EIP820Implementer.sol";
import "giveth-common-contracts/contracts/Owned.sol";
import "giveth-common-contracts/contracts/SafeMath.sol";
import "./Ierc20.sol";
import "./Ierc777.sol";
import "./IAuthorizer.sol";
import "./ITokenRecipient.sol";


contract ReferenceToken is Owned, Ierc20, Ierc777, EIP820Implementer {
    using SafeMath for uint256;

    string private mName;
    string private mSymbol;
    uint256 private mGranularity;
    uint256 private mTotalSupply;

    bool private mErc20compatible;

    mapping(address => uint) private mBalances;

    mapping(address => address) private mDelegates;
    mapping(address => address) private mAuthorizerForDelegates;
    mapping(address => address) private mDelegateForAuthorizers;

    mapping(address => mapping(address => bool)) private mOperators;
    mapping(address => uint256) private mOperatorCount;

    mapping(address => mapping(address => uint256)) private mAllowed;

    /* -- Constructor -- */
    //
    /// @notice Constructor to create a ReferenceToken
    /// @param _name Name of the new token
    /// @param _symbol Symbol of the new token.
    /// @param _granularity Minimum transferable chunk.
    function ReferenceToken(
        string _name,
        string _symbol,
        uint256 _granularity
    )
        public
    {
        mName = _name;
        mSymbol = _symbol;
        mTotalSupply = 0;
        mErc20compatible = true;
        require(_granularity >= 1);
        mGranularity = _granularity;

        setInterfaceImplementation("Ierc777", this);
        setInterfaceImplementation("Ierc20", this);
    }

    /* -- ERC777 Interface Implementation -- */
    //
    /// @return the name of the token
    function name() public constant returns (string) { return mName; }

    /// @return the symbol of the token
    function symbol() public constant returns(string) { return mSymbol; }

    /// @return the granularity of the token
    function granularity() public constant returns(uint256) { return mGranularity; }

    /// @return the total supply of the token
    function totalSupply() public constant returns(uint256) { return mTotalSupply; }

    /// @notice Return the account balance of some account
    /// @param _tokenHolder Address for which the balance is returned
    /// @return the balance of `_tokenAddress`.
    function balanceOf(address _tokenHolder) public constant returns (uint256) { return mBalances[_tokenHolder]; }

    /// @notice Send `_amount` of tokens to address `_to`
    /// @param _to The address of the recipient
    /// @param _amount The number of tokens to be sent
    function send(address _to, uint256 _amount) public {
        doSend(msg.sender, _to, _amount, "", msg.sender, "", true);
    }

    /// @notice Send `_amount` of tokens to address `_to` passing `_userData` to the recipient
    /// @param _to The address of the recipient
    /// @param _amount The number of tokens to be sent
    function send(address _to, uint256 _amount, bytes _userData) public {
        doSend(msg.sender, _to, _amount, _userData, msg.sender, "", true);
    }

    /// @notice Authorize a third party `_delegate` to send `msg.sender`'s tokens upon authorization of `_authorizer`.
    /// @param _delegate Address that will to be authorized to send `msg.sender`'s tokens.
    /// @param _authorizer Contract which will authorize `_delegate` to send tokens.
    function authorizeDelegate(address _delegate, address _authorizer) public {
        // delegate MUST NOT be the principal
        require(_delegate != msg.sender);
        address principal = delegateFor(_delegate);
        // delegate either MUST NOT be a delegate or MUST BE a delegate for the same principal
        require(principal == address(0) || principal == msg.sender);
        // delegate MUST NOT have funds (prevents locking)
        require(mBalances[_delegate] == 0);

        // authorizer MUST NOT be an operator
        require(mOperatorCount[_authorizer] == 0);
        // authorizer MUST NOT already be an authorizer
        require(mDelegateForAuthorizers[_authorizer] == address(0));

        // require(!isOperatorFor(_delegate, msg.sender));
        // TODO Figre out if there is a problem with the delegate of A being an operator of B?

        mDelegates[_delegate] = msg.sender;
        mAuthorizerForDelegates[_delegate] = _authorizer;
        mDelegateForAuthorizers[_authorizer] = _delegate;

        AuthorizedDelegate(_delegate, _authorizer, msg.sender);
    }

    /// @notice Revoke a third party `_delegate`'s rights to send `msg.sender`'s tokens.
    /// @param _delegate Delegate that will be Revoked
    function revokeDelegate(address _delegate) public {
        require(delegateFor(_delegate) == msg.sender);

        address oldAuthorizer = mAuthorizerForDelegates[_delegate];
        mDelegates[_delegate] = address(0);
        mAuthorizerForDelegates[_delegate] = address(0);
        mDelegateForAuthorizers[oldAuthorizer] = address(0);

        RevokedDelegate(_delegate, oldAuthorizer, msg.sender);
    }

    /// @notice Get the address for which `_delegate` is authorized to send tokens
    ///  or `0x0` if `_delegate` is not a delegate.
    /// @param _delegate address for which to return the principal address.
    /// @return Address for which `_delegate` is authorized to send tokens or `0x0` if `_delegate` is not a delegate.
    function delegateFor(address _delegate) public constant returns (address) { return mDelegates[_delegate]; }

    /// @notice Get the authorizer contract address of `_delegate` or `0x0` if `_delegate` is not a delegate.
    /// @param _delegate Delegate address for which to return the authorizer contract address.
    /// @return Authorizer contract address of `_delegate` or `0x0` if `_delegate` is not a delegate.
    function authorizerOf(address _delegate) public constant returns (address) {
        return mAuthorizerForDelegates[_delegate];
    }

    /// @notice Authorize a third party `_operator` to manage (send) `msg.sender`'s tokens.
    /// @param _operator The operator that wants to be Authorized
    function authorizeOperator(address _operator) public {
        require(_operator != msg.sender);
        require(delegateFor(_operator) == address(0));
        // require(delegateFor(_operator) == msg.sender);
        if (!mOperators[_operator][msg.sender]) { mOperatorCount[_operator] += 1; }
        mOperators[_operator][msg.sender] = true;
        AuthorizedOperator(_operator, msg.sender);
    }

    /// @notice Revoke a third party `_operator`'s rights to manage (send) `msg.sender`'s tokens.
    /// @param _operator The operator that wants to be Revoked
    function revokeOperator(address _operator) public {
        require(_operator != msg.sender);
        if (mOperators[_operator][msg.sender]) { mOperatorCount[_operator] -= 1; }
        mOperators[_operator][msg.sender] = false;
        RevokedOperator(_operator, msg.sender);
    }

    /// @notice Check whether the `_operator` address is allowed to manage the tokens held by `_tokenHolder` address.
    /// @param _operator address to check if it has the right to manage the tokens
    /// @param _tokenHolder address which holds the tokens to be managed
    /// @return `true` if `_operator` is authorized for `_tokenHolder`
    function isOperatorFor(address _operator, address _tokenHolder) public constant returns (bool) {
        return _operator == _tokenHolder || mOperators[_operator][_tokenHolder];
    }

    /// @notice Send `_amount` of tokens on behalf of the address `from` to the address `to`.
    /// @param _from The address holding the tokens being sent
    /// @param _to The address of the recipient
    /// @param _amount The number of tokens to be sent
    /// @param _userData Data generated by the user to be sent to the recipient
    /// @param _operatorData Data generated by the operator to be sent to the recipient
    function operatorSend(address _from, address _to, uint256 _amount, bytes _userData, bytes _operatorData) public {
        require(isOperatorFor(msg.sender, _from));
        doSend(_from, _to, _amount, _userData, msg.sender, _operatorData, true);
    }

    /* -- Mint And Burn Functions (not part of the ERC777 standard, only the Events/tokensReceived are) -- */
    //
    /// @notice Generates `_amount` tokens to be assigned to `_tokenHolder`
    ///  Sample mint function to showcase the use of the `Minted` event and the logic to notify the recipient.
    /// @param _tokenHolder The address that will be assigned the new tokens
    /// @param _amount The quantity of tokens generated
    /// @param _operatorData Data that will be passed to the recipient as a first transfer
    function mint(address _tokenHolder, uint256 _amount, bytes _operatorData) public onlyOwner {
        requireMultiple(_amount);
        mTotalSupply = mTotalSupply.add(_amount);
        mBalances[_tokenHolder] = mBalances[_tokenHolder].add(_amount);

        callRecipient(msg.sender, 0x0, _tokenHolder, _amount, "", _operatorData, true);

        Minted(msg.sender, _tokenHolder, _amount, _operatorData);
        if (mErc20compatible) { Transfer(0x0, _tokenHolder, _amount); }
    }

    /// @notice Burns `_amount` tokens from `_tokenHolder`
    ///  Sample burn function to showcase the use of the `Burned` event.
    /// @param _tokenHolder The address that will lose the tokens
    /// @param _amount The quantity of tokens to burn
    function burn(address _tokenHolder, uint256 _amount, bytes _userData, bytes _operatorData) public onlyOwner {
        requireMultiple(_amount);
        require(balanceOf(_tokenHolder) >= _amount);

        mBalances[_tokenHolder] = mBalances[_tokenHolder].sub(_amount);
        mTotalSupply = mTotalSupply.sub(_amount);

        Burned(msg.sender, _tokenHolder, _amount, _userData, _operatorData);
        if (mErc20compatible) { Transfer(_tokenHolder, 0x0, _amount); }
    }

    /* -- ERC20 Compatible Methods -- */
    //
    /// @notice This modifier is applied to erc20 obsolete methods that are
    ///  implemented only to maintain backwards compatibility. When the erc20
    ///  compatibility is disabled, this methods will fail.
    modifier erc20 () {
        require(mErc20compatible);
        _;
    }

    /// @notice Disables the ERC-20 interface. This function can only be called
    ///  by the owner.
    function disableERC20() public onlyOwner {
        mErc20compatible = false;
        setInterfaceImplementation("Ierc20", 0x0);
    }

    /// @notice Re enables the ERC-20 interface. This function can only be called
    ///  by the owner.
    function enableERC20() public onlyOwner {
        mErc20compatible = true;
        setInterfaceImplementation("Ierc20", this);
    }

    /// @notice For Backwards compatibility
    /// @return The decimls of the token. Forced to 18 in ERC777.
    function decimals() public erc20 constant returns (uint8) { return uint8(18); }

    /// @notice ERC20 backwards compatible transfer.
    /// @param _to The address of the recipient
    /// @param _amount The number of tokens to be transferred
    /// @return `true`, if the transfer can't be done, it should fail.
    function transfer(address _to, uint256 _amount) public erc20 returns (bool success) {
        doSend(msg.sender, _to, _amount, "", msg.sender, "", false);
        return true;
    }

    /// @notice ERC20 backwards compatible transferFrom.
    /// @param _from The address holding the tokens being transferred
    /// @param _to The address of the recipient
    /// @param _amount The number of tokens to be transferred
    /// @return `true`, if the transfer can't be done, it should fail.
    function transferFrom(address _from, address _to, uint256 _amount) public erc20 returns (bool success) {
        require(_amount <= mAllowed[_from][msg.sender]);

        // Cannot be after doSend because of tokensReceived re-entry
        mAllowed[_from][msg.sender] = mAllowed[_from][msg.sender].sub(_amount);
        doSend(_from, _to, _amount, "", msg.sender, "", false);
        return true;
    }

    /// @notice ERC20 backwards compatible approve.
    ///  `msg.sender` approves `_spender` to spend `_amount` tokens on its behalf.
    /// @param _spender The address of the account able to transfer the tokens
    /// @param _amount The number of tokens to be approved for transfer
    /// @return `true`, if the approve can't be done, it should fail.
    function approve(address _spender, uint256 _amount) public erc20 returns (bool success) {
        mAllowed[msg.sender][_spender] = _amount;
        Approval(msg.sender, _spender, _amount);
        return true;
    }

    /// @notice ERC20 backwards compatible allowance.
    ///  This function makes it easy to read the `allowed[]` map
    /// @param _owner The address of the account that owns the token
    /// @param _spender The address of the account able to transfer the tokens
    /// @return Amount of remaining tokens of _owner that _spender is allowed
    ///  to spend
    function allowance(address _owner, address _spender) public erc20 constant returns (uint256 remaining) {
        return mAllowed[_owner][_spender];
    }

    /* -- Helper Functions -- */
    //
    /// @notice Internal function that ensures `_amount` is multiple of the granularity
    /// @param _amount The quantity that want's to be checked
    function requireMultiple(uint256 _amount) internal {
        require(_amount.div(mGranularity).mul(mGranularity) == _amount);
    }

    /// @notice Check whether an address is a regular address or not.
    /// @param _addr Address of the contract that has to be checked
    /// @return `true` if `_addr` is a regular address (not a contract)
    function isRegularAddress(address _addr) internal constant returns(bool) {
        if (_addr == 0) { return false; }
        uint size;
        assembly { size := extcodesize(_addr) } // solhint-disable-line no-inline-assembly
        return size == 0;
    }

    /// @notice Helper function actually performing the sending of tokens.
    /// @param _from The address holding the tokens being sent
    /// @param _to The address of the recipient
    /// @param _amount The number of tokens to be sent
    /// @param _userData Data generated by the user to be passed to the recipient
    /// @param _operatorData Data generated by the operator to be passed to the recipient
    /// @param _preventLocking `true` if you want this function to throw when tokens are sent to a contract not
    ///  implementing `ITokenRecipient`.
    ///  ERC777 native Send functions MUST set this parameter to `true`, and backwards compatible ERC20 transfer
    ///  functions SHOULD set this parameter to `false`.
    function doSend(
        address _from,
        address _to,
        uint256 _amount,
        bytes _userData,
        address _operator,
        bytes _operatorData,
        bool _preventLocking
    )
        private
    {
        requireMultiple(_amount);
        require(_to != address(0)); // forbid sending to 0x0 (=burning)
        require(delegateFor(_to) == address(0)); // cannot send to a delegate

        address from = delegateFor(_from);
        if (from == address(0)) { from = _from; }

        require(mBalances[from] >= _amount); // ensure enough funds

        mBalances[from] = mBalances[from].sub(_amount);
        mBalances[_to] = mBalances[_to].add(_amount);

        callDelegate(_from, from, _to, _amount, _userData);
        callRecipient(_operator, from, _to, _amount, _userData, _operatorData, _preventLocking);

        Sent(_operator, from, _to, _amount, _userData, _operatorData);
        if (mErc20compatible) { Transfer(from, _to, _amount); }
    }

    function callDelegate(address _delegate, address _from, address _to, uint256 _amount, bytes _userData) private {
        if (_delegate != _from) { // if they differ then `_delegate` is truly a delegate
            IAuthorizer(mAuthorizerForDelegates[_delegate]).authorizeSend(_to, _amount, _userData);
        }
    }

    /// @notice Helper function that checks for ITokenRecipient on the recipient and calls it.
    ///  May throw according to `_preventLocking`
    /// @param _from The address holding the tokens being sent
    /// @param _to The address of the recipient
    /// @param _amount The number of tokens to be sent
    /// @param _userData Data generated by the user to be passed to the recipient
    /// @param _operatorData Data generated by the operator to be passed to the recipient
    /// @param _preventLocking `true` if you want this function to throw when tokens are sent to a contract not
    ///  implementing `ITokenRecipient`.
    ///  ERC777 native Send functions MUST set this parameter to `true`, and backwards compatible ERC20 transfer
    ///  functions SHOULD set this parameter to `false`.
    function callRecipient(
        address _operator,
        address _from,
        address _to,
        uint256 _amount,
        bytes _userData,
        bytes _operatorData,
        bool _preventLocking
    ) private {
        address recipientImplementation = interfaceAddr(_to, "ITokenRecipient");
        if (recipientImplementation != 0) {
            ITokenRecipient(recipientImplementation).tokensReceived(
                _operator, _from, _to, _amount, _userData, _operatorData);
        } else if (_preventLocking) {
            require(isRegularAddress(_to));
        }
    }
}
