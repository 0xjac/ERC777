/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * This code has not been reviewed.
 * Do not use or deploy this code before reviewing it personally first.
 */
pragma solidity 0.4.24;

import { ERC820Implementer } from "eip820/contracts/ERC820Implementer.sol";
import { ERC820ImplementerInterface } from "eip820/contracts/ERC820ImplementerInterface.sol";
import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { ERC777TokensSender } from "../ERC777TokensSender.sol";
import { ERC777Token } from "../ERC777Token.sol";


contract ExampleTokensSender is ERC820Implementer, ERC820ImplementerInterface, ERC777TokensSender, Ownable {

    bool private allowTokensToSend;

    mapping(address => address) public token;
    mapping(address => address) public operator;
    mapping(address => address) public from;
    mapping(address => address) public to;
    mapping(address => uint256) public amount;
    mapping(address => bytes) public data;
    mapping(address => bytes) public operatorData;
    mapping(address => uint256) public balanceOf;

    constructor(bool _setInterface) public {
        if (_setInterface) { setInterfaceImplementation("ERC777TokensSender", this); }
        allowTokensToSend = true;
    }

    function tokensToSend(
        address _operator,
        address _from,
        address _to,
        uint _amount,
        bytes _data,
        bytes _operatorData
    )
        public
    {
        require(allowTokensToSend, "Send not allowed");
        token[_to] = msg.sender;
        operator[_to] = _operator;
        from[_to] = _from;
        to[_to] = _to;
        amount[_to] = _amount;
        data[_to] = _data;
        operatorData[_to] = _operatorData;
        balanceOf[_from] = ERC777Token(msg.sender).balanceOf(_from);
        balanceOf[_to] = ERC777Token(msg.sender).balanceOf(_to);
    }

    function acceptTokensToSend() public onlyOwner { allowTokensToSend = true; }

    function rejectTokensToSend() public onlyOwner { allowTokensToSend = false; }

    // solhint-disable-next-line no-unused-vars
    function canImplementInterfaceForAddress(address addr, bytes32 interfaceHash) public view returns(bytes32) {
        return ERC820_ACCEPT_MAGIC;
    }

}
