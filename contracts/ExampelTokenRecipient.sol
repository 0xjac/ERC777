/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

pragma solidity ^0.4.19; // solhint-disable-line compiler-fixed

import "./erc777_tokenHolder.sol";
import "eip820/contracts/EIP820Implementer.sol";
import "eip820/contracts/EIP820ImplementerInterface.sol";


contract ExampleTokenRecipient is EIP820Implementer, EIP820ImplementerInterface, erc777_tokenHolder {
    bool private preventTokenReceived;

    function ExampleTokenRecipient(bool _setInterface, bool _preventTokenReceived) public {
        if (_setInterface) {
            setInterfaceImplementation("erc777_tokenHolder", this);
        }
        preventTokenReceived = _preventTokenReceived;
    }

    function tokensToSend(
        address operator,   // solhint-disable no-unused-vars
        address from,
        address to,
        uint amount,
        bytes userData,
        bytes operatorData) public {
        return; // Accepts any thing
    }

    function tokensReceived(
        address operator,  // solhint-disable no-unused-vars
        address from,
        address to,
        uint amount,
        bytes userData,
        bytes operatorData
    )  // solhint-enable no-unused-vars
        public
    {
        if (preventTokenReceived) {
            require(false);
        }
    }

    // solhint-disable-next-line no-unused-vars
    function canImplementInterfaceForAddress(address addr, bytes32 interfaceHash) public view returns(bool) {
        return true;
    }

}
