## Preamble

    EIP: <to be assigned>
    Title: ERC-<TBA> Token Standard
    Author: Jacques Dafflon <jacques@bity.com>, Thomas Shababi <thomas@bity.com>
    Type: Standard
    Category: ERC
    Status: Draft
    Created: 2017-11-02
    Requires: 672 (draft)

## Simple Summary
Simple interface for tokens compatible with the ERC20 standard.

## Abstract
While the intended idea behind ERC20 to offer a standard way of interacting with tokens is great, it has many shortcomings. ERC223 is trying to correct some of the lacking functionality but falls shorts a well, especially when it comes to checking if a contract supports ERC223 before calling it first. ERC-\<TBA\> is a competing standard to ERC223 which aims to correct the aforementioned drawbacks notably by taking advantage of the [Ethereum Name Service (ENS)](https://ens.domains/) and Reverse ENS as specified in [EIP672](https://github.com/ethereum/EIPs/issues/672).

## Motivation
An new standard which improves on the ERC20 standard and ERC223 to correct some of their shortcomings while retaining backward compatibility with ERC20.

Interaction with ERC20 calling ``approve`` and ``transferFrom`` on contracts is complicated, expensive, error prone and can result in lost tokens. ERC20 also lacks the ability to notify the receiver of tokens deposits.

ERC223 corrects some of those shortcomings but `transfer` still fails if the beneficiary is a contract which doesn't implement the `tokenFallback`. ERC223 is available under the GPLv3 license which limits the use and commercial applicability of the standard.

ERC-\<TBA\> rectify those weaknesses and is available under the more permissive \<TO BE DECIDED\> license.

## Specification
> The notion *deprecated* in this document reference to methods and event needed solely to maintain ERC20 compatibility. In this context *deprecated* signifies that the methods or events are present and work as expected for ERC20 but new contracts SHOULD avoid using and relying on them and use the other new methods and events specified in this document.

### Token Contract
#### Methods
##### name
``` ts
 function name() constant returns (string name)
```

Returns the name of the token - e.g. `"MyToken"`.

*Optional*: This method can be used to improve usability, but interfaces and other contracts MUST NOT expect these values to be present.

> **returns** `name`: Name of the token

<br/>
##### symbol
``` ts
function symbol() constant returns (string symbol)
```
Returns the symbol of the token. E.g.  `"MYT"`.

*Optional*: This method can be used to improve usability, but interfaces and other contracts MUST NOT expect these values to be present.

> **returns** `symbol`: Symbol of the token

<br/>
##### decimals
``` ts
function decimals() constant returns (uint8 decimals)
```
Returns the number of decimals the token uses - e.g. `8`, means to divide the token amount by `100000000` to get its user representation.

*Optional*: This method can be used to improve usability, but interfaces and other contracts MUST NOT expect these values to be present.

> **returns** `decimals`: Number of decimals used by the token.

<br/>
##### totalSupply
``` ts
function totalSupply() constant returns (uint256 totalSupply)
```
Get the total token supply.

> **returns** `totalSupply`: Total supply of tokens currently in circulation.

<br/>
##### balanceOf
``` ts
function balanceOf(address _owner) constant returns (uint256 balance)
```
Get the account balance of another account with address `_owner`.
> **parameters**
> - `_owner`: Owner of the account for which the balance is returned
>
> **returns** `balance`: Amount of token held by `_owner` in the token-contract.

<br/>
##### transfer
``` ts
function transfer(address _to, uint256 _value) returns (bool success)
```
Send `_value` amount of tokens to address `_to`, and MUST fire the `Transfer` event as well as call the `tokenFallback` method on the `_to` address if it is a contract which registered the `tokenFallback` function through ENS.

The function SHOULD `throw` if the `_from` account balance does not have enough tokens to spend or if the ReverseENS lookup of `tokenFallback` method for the contract with address `_to` returns a valid address which does not implement the interface.

A token contract which creates new tokens SHOULD trigger a `Transfer` event with the `_from` address set to `0x0` when tokens are created.

*NOTE*: Transfers of 0 values MUST be treated as normal transfers and fire the `Transfer` event.
> **parameters**
> - `_to`: tokens beneficiary
> - `_value`: amount of tokens transferred

<br/>
##### transferTo
``` ts
function transferTo(address _to, uint256 _value, bytes _data) returns (bool success)
```
Transfers `_value` amount of tokens to address `_to`, and MUST fire the `Transfer` event as well as call the `tokenFallback` method on the `_to` address if it is a contract which registered the `tokenFallback` function through ENS.

Extra information MAY be attached to the transaction via `_data`. This information will be written in the blockchain and passed to the `Transfer` event and the `tokenFallback` call.

The function SHOULD `throw` if the `_from` account balance does not have enough tokens to spend

A token contract which creates new tokens SHOULD trigger a `TransferTo` event with the `_from` address set to `0x0` when tokens are created as well as calling `tokenFallback` if the `_from` address is a contract which supports it.

*NOTE*: Transfers of 0 values MUST be treated as normal transfers and fire the `TransferTo` event and call `tokenFallback` if supported.

> **parameters**
> - `_to`: tokens beneficiary
> - `_value`: amount of tokens transferred
> - `_data`: information attached to the transaction

<br/>
##### ~~approve~~ *(deprecated)*
``` ts
function approve(address _spender, uint256 _value) returns (bool success)
```
Allows `_spender` to withdraw from your account multiple times, up to the `_value` amount. If this function is called again it overwrites the current allowance with `_value`.

*DEPRECATED*: Only present for backward compatibility with existing contracts relying on ERC20. Use `transferTo` directly instead for new contracts.

*NOTE*: To prevent attack vectors like the one described here and discussed here, clients SHOULD make sure to create user interfaces in such a way that they set the allowance first to 0 before setting it to another value for the same spender. THOUGH The contract itself shouldn't enforce it, to allow backwards compatibility with contracts deployed before

> **parameters**
> - `_spender`: address which will be allowed to withdraw
> - `_value`: maximum amount which is allowed to be withdrawn

<br/>
##### ~~transferFrom~~ *(deprecated)*
``` ts
function transferFrom(address _from, address _to, uint256 _value) returns (bool success)
```
Transfers `_value` amount of tokens from address `_from` to address `_to`, and MUST fire the `Transfer` event.

The `transferFrom` method is used for a withdraw workflow, allowing contracts to transfer tokens on your behalf. This can be used for example to allow a contract to transfer tokens on your behalf and/or to charge fees in sub-currencies. The function SHOULD throw unless the `_from` account has deliberately authorized the sender of the message via some mechanism.

*DEPRECATED*: Only present for backward compatibility with existing contracts relying on ERC20. Use `transferTo` instead for new contracts.

*NOTE*: Transfers of 0 values MUST be treated as normal transfers and fire the `Transfer` event.

*NOTE*: This method will never call the `tokenFallback` method on the receiver.

> **parameters**
> - `_from`: address from which the tokens must be debited
> - `_to`: address to which the tokens must be credited
> - `_value`: amount of tokens to transfer

<br/>
#### Events
##### Transfer
``` ts
event Transfer(address indexed _from, address indexed _to, uint256 indexed _value)
```
Triggered when tokens are transferred using the `transfer` or `transferTo` methods.

*NOTE*: While the `tokenFallback` method is passed an extra `_data` field, the `Transfer` event does not. First to maintain compatibility with the ERC20 `Transfer` event. Secondly as this field is not necessary, this will reduce  gas cost when firing the event.

> **parameters**
> - `_from`: tokens sender
> - `_to`: tokens beneficiary
> - `_value`: amount of tokens transferred
> - `_data`: information attached to the transaction

<br/>
##### ~~Approval~~ *(deprecated)*
``` ts
event Approval(address indexed _owner, address indexed _spender, uint256 _value)
```
Triggered when `approve` is called successfully.

MUST trigger on any successful call to `approve(address _spender, uint256 _value)`.

*DEPRECATED*: This event only fires from a successful call to the deprecated `approve` method in order to maintain ERC20 compatibility. The event MUST NOT be fired from any other method.

> **parameters**
> - `_owner`: address which holds the tokens to be withdrawn
> - `_spender`: address which is allowed to withdraw the tokens and who will receive them
> - `_value`: maximum amount which is allowed to be withdrawn

<br/>
#### Contracts Interacting With ERC-\<TBA\> Tokens:
##### Methods
##### tokenFallback
``` ts
function tokenFallback(address _from, uint _value, bytes _data)
```
Function to handle token transfers which is called from the token contract when someone is sending tokens to this contract.
> **parameters**
> - `_from`: tokens sender
> - `_value`: the amount of tokens sent
> - `_data`: information attached to the transaction. MAY be empty.

This function allows the contract to take action when receiving tokens.

*NOTE*: In order for the function to be called. The contract MUST register the `tokenFallback` function with ReverseENS. (See [EIP672](https://github.com/ethereum/EIPs/issues/672))
If the contract fails to register the function, the transfer will still happen but the `tokenFallback` function will never be called. Thanks to EIP 672, a proxy contract which register the function can be used to solve this issue and to work with existing contracts.

*NOTE*: `msg.sender` inside the `tokenFallback` is the token-contract. Which tokens are sent SHOULD be filtered by using the the token-contract address.

*NOTE*: This function MUST be named `tokenFallback` with parameters of the following types `address`, `uint256`, `bytes` to match the function signature `0xc0ee0b8a`.

## Rationale
```python
raise NotImplementedError
```
