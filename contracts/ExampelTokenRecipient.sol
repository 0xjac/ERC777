pragma solidity ^0.4.19;

import "./ITokenRecipient.sol";
import "../node_modules/eip820/contracts/EIP820Implementer.sol";


contract ExampleTokenRecipient is EIP820Implementer, EIP820ImplementerInterface, ITokenRecipient {
    bool private preventTokenReceived;

    function ExampleTokenRecipient(bool _setInterface, bool _preventTokenReceived) public {
        if (_setInterface) {
            setInterfaceImplementation("ITokenRecipient", this);
        }
        preventTokenReceived = _preventTokenReceived;
    }

    function tokensReceived(
        address from,
        address to,
        uint amount,
        bytes userData,
        address operator,
        bytes operatorData
    )
        public
    {
        if (preventTokenReceived) {
            require(false);
        }
    }

    function canImplementInterfaceForAddress(address addr, bytes32 interfaceHash) public view returns(bool) {
        return true;
    }

}
