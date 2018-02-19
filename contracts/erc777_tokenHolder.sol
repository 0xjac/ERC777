/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

pragma solidity ^0.4.19; // solhint-disable-line compiler-fixed


// solhint-disable-next-line contract-name-camelcase
interface erc777_tokenHolder {
    function tokensToSend(
        address operator,
        address from,
        address to,
        uint value,
        bytes userData,
        bytes operatorData) public;

    function tokensReceived(
        address operator,
        address from,
        address to,
        uint amount,
        bytes userData,
        bytes operatorData
    ) public;
}
