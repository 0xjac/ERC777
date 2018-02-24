/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

pragma solidity ^0.4.19; // solhint-disable-line compiler-fixed

import "./ERC777TokensRecipient.sol";
import "eip820/contracts/ERC820Implementer.sol";
import "eip820/contracts/ERC820ImplementerInterface.sol";


contract ExampleTokensRecipient is ERC820Implementer, ERC820ImplementerInterface, ERC777TokensRecipient {

    bool private preventTokenReceived;

    function ExampleTokensRecipient(bool _setInterface, bool _preventTokenReceived) public {
        if (_setInterface) { setInterfaceImplementation("ERC777TokensRecipient", this); }
        preventTokenReceived = _preventTokenReceived;
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
        if (preventTokenReceived) { require(false); }
    }

    // solhint-disable-next-line no-unused-vars
    function canImplementInterfaceForAddress(address addr, bytes32 interfaceHash) public view returns(bytes32) {
        return ERC820_ACCEPT_MAGIC;
    }

}
