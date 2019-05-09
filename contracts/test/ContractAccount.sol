/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * This code has not been reviewed.
 * Do not use or deploy this code before reviewing it personally first.
 */
pragma solidity 0.5.3;

import { ERC1820Client } from "erc1820/contracts/ERC1820Client.sol";
import { ERC777TokensSender } from "../ERC777TokensSender.sol";
import { ERC777TokensRecipient } from "../ERC777TokensRecipient.sol";
import { ERC777Token } from "../ERC777Token.sol";


contract ContractAccount is ERC1820Client, ERC777TokensSender, ERC777TokensRecipient {
    bool private allowTokensToSend;
    bool private allowTokensReceived;

    event NotifiedTokensToSend(
        address token,
        address operator,
        address from,
        address to,
        uint256 amount,
        uint256 balanceFrom,
        uint256 balanceTo,
        bytes data,
        bytes operatorData
    );

    event NotifiedTokensReceived(
        address token,
        address operator,
        address from,
        address to,
        uint256 amount,
        uint256 balanceFrom,
        uint256 balanceTo,
        bytes data,
        bytes operatorData
    );

    constructor(bool _allowTokensToSend, bool _allowTokensReceived) public {
        setInterfaceImplementation("ERC777TokensSender", address(this));
        setInterfaceImplementation("ERC777TokensRecipient", address(this));
        allowTokensToSend = _allowTokensToSend;
        allowTokensReceived = _allowTokensReceived;
    }

    function tokensToSend(
        address _operator,
        address _from,
        address _to,
        uint256 _amount,
        bytes calldata _data,
        bytes calldata _operatorData
    )
        external
    {
        require(allowTokensToSend, "Send not allowed");
        emit NotifiedTokensToSend(
            msg.sender,
            _operator,
            _from,
            _to,
            _amount,
            ERC777Token(msg.sender).balanceOf(_from),
            ERC777Token(msg.sender).balanceOf(_to),
            _data,
            _operatorData
        );
    }

    function tokensReceived(
        address _operator,
        address _from,
        address _to,
        uint256 _amount,
        bytes calldata _data,
        bytes calldata _operatorData
    )
        external
    {
        require(allowTokensReceived, "Send not allowed");
        emit NotifiedTokensReceived(
            msg.sender,
            _operator,
            _from,
            _to,
            _amount,
            ERC777Token(msg.sender).balanceOf(_from),
            ERC777Token(msg.sender).balanceOf(_to),
            _data,
            _operatorData
        );
    }

    function send(address token, address to, uint256 amount, bytes calldata data) external {
        ERC777Token(token).send(to, amount, data);
    }

    function burn(address token, uint256 amount, bytes calldata data) external {
        ERC777Token(token).operatorBurn(address(this), amount, data, "");
    }
}
