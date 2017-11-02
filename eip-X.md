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
Simple interface for tokens compatible with the ERC20 standard and ERC223.

## Abstract
While the intended idea behind ERC20 to offer a standard way of interacting with tokens is great, it has many shortcomings. ERC223 aimed at correcting some of the lacking functionality but falls shorts a well, especially when it comes to checking if a contract supports ERC223 before calling it first. ERC\<TBA\> aims to correct this by taking advantage of the [Ethereum Name Service (ENS)](https://ens.domains/) and Reverse ENS as specified in [EIP672](https://github.com/ethereum/EIPs/issues/672).

## Motivation
An new standard which improves on the ERC20 standard and ERC223 to correct some of their shortcomings but remains backward compatible.

Interaction with ERC20 calling ``approve`` and ``transferFrom`` on contracts is complicated, expensive, error prone and can result in lost tokens. ERC20 also lacks the ability to notify the receiver of tokens deposits.

ERC223 corrects some of those shortcomings but `transfer` still fails if the beneficiary is a contract which doesn't implement the `tokenFallback`. ERC223 is available under the GPLv3 license which limits the use and commercial applicability of the standard.

ERC\<TBA\> rectify those weaknesses and is available under the more permissive \<TO BE DECIDED\> license.

## Specification
### Token
#### Methods
##### name

Returns the name of the token - e.g. `"MyToken"`.

OPTIONAL - This method can be used to improve usability,
but interfaces and other contracts MUST NOT expect these values to be present.

``` js
function name() constant returns (string name)
```

###### returns
  `name`: Name of the token

##### symbol

Returns the symbol of the token. E.g. "HIX".

OPTIONAL - This method can be used to improve usability,
but interfaces and other contracts MUST NOT expect these values to be present.

``` js
function symbol() constant returns (string symbol)
```

###### returns
  `symbol`: Symbol of the token

##### decimals

Returns the number of decimals the token uses - e.g. `8`, means to divide the token amount by `100000000` to get its user representation.

OPTIONAL - This method can be used to improve usability,
but interfaces and other contracts MUST NOT expect these values to be present.

``` js
function decimals() constant returns (uint8 decimals)
```

###### returns
  `decimals`: Number of decimals used by the token.

##### totalSupply

Returns the total token supply.

``` js
function totalSupply() constant returns (uint256 totalSupply)
```

###### returns
  `totalSupply`: Total supply of tokens currently in circulation.

##### balanceOf

Returns the account balance of another account with address `_owner`.

``` js
function balanceOf(address _owner) constant returns (uint256 balance)
```

###### parameters
  - `_owner`: Owner of the account for which the balance is returned

###### returns
  `balance`: Amount of token held by `_owner` in the token-contract.

##### transfer

Transfers `_value` amount of tokens to address `_to`, and MUST fire the `Transfer` event.
The function SHOULD `throw` if the `_from` account balance does not have enough tokens to spend.

A token contract which creates new tokens SHOULD trigger a `Transfer` event with the `_from` address set to `0x0` when tokens are created.

*Note* Transfers of 0 values MUST be treated as normal transfers and fire the `Transfer` event.

``` js
function transfer(address _to, uint256 _value) returns (bool success)
```

###### parameters
  - `_to`: tokens beneficiary
  - `_value`: amount of tokens transferred

##### transferTo

Transfers `_value` amount of tokens to address `_to`, and MUST fire the `TransferTo` event. Extra information MAY be attached to the transaction via `_data`. This information will be written in the blockchain.

The function SHOULD `throw` if the `_from` account balance does not have enough tokens to spend.

A token contract which creates new tokens SHOULD trigger a `TransferTo` event with the `_from` address set to `0x0` when tokens are created.

*Note* Transfers of 0 values MUST be treated as normal transfers and fire the `TransferTo` event.

``` js
function transferTo(address _to, uint256 _value, bytes _data) returns (bool success)
```

###### parameters
  - `_to`: tokens beneficiary
  - `_value`: amount of tokens transferred
  - `_data`: information attached to the transaction

#### Events

##### Transfer

``` js
event Transfer(address indexed _from, address indexed _to, uint256 indexed _value)
```

Triggered when tokens are transferred using the `transfer` function.

###### parameters
  - `_from`: tokens sender
  - `_to`: tokens beneficiary
  - `_value`: amount of tokens transferred

##### TransferTo

``` js
event TransferTo(address indexed _from, address indexed _to, uint256 indexed _value, bytes _data)
```

Triggered when tokens are transferred using the `transferTo` function.

###### parameters
  - `_from`: tokens sender
  - `_to`: tokens beneficiary
  - `_value`: amount of tokens transferred
  - `_data`: information attached to the transaction

#### Contracts Interacting With ERC\<TBA\> Tokens:

##### Methods

###### tokenFallback

``` js
function tokenFallback(address _from, uint _value, bytes _data)
```
Function to handle token transfers which is called from the token contract when someone is sending tokens to this contract.

###### parameters
  - `_from`: tokens sender
  - `_value`: the amount of tokens sent
  - `_data`: information attached to the transaction. MAY be empty.

This function allows the contract to take action when receiving tokens.

*Note* In order for the function to be called. The contract MUST register the `tokenFallback` function with ReverseENS. (See [EIP672](https://github.com/ethereum/EIPs/issues/672))
If the contract fails to register the function, the transfer will still happen but the `tokenFallback` function will never be called. A proxy contract which register the function can be used to solve this issue and to work with existing contracts. (See [EIP672](https://github.com/ethereum/EIPs/issues/672) for proxy contracts)

*Note* `msg.sender` inside the `tokenFallback` is the token-contract. Which tokens are sent SHOULD be filtered by using the the token-contract address.

*Note* This function MUST be named `tokenFallback` with parameters of the following types `address`, `uint256`, `bytes` to match the function signature `0xc0ee0b8a`.

## Rationale
```python
raise NotImplementedError
```
