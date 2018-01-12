pragma solidity ^0.4.19; // solhint-disable-line compiler-fixed

import "../node_modules/giveth-common-contracts/contracts/Owned.sol";


contract TokenableContractsRegistry is Owned {

    mapping (address => bool) public tokenableInstances;
    mapping (bytes32 => bool) public tokenableSources;

    function setInstanceTokenable(address instance) public onlyOwner { tokenableInstances[instance] = true; }

    function unsetInstancetokenable(address instance) public onlyOwner { tokenableInstances[instance] = false; }

    function setCodeTokenable(bytes32 codeHash) public onlyOwner { tokenableSources[codeHash] = true; }

    function unsetCodetokenable(bytes32 codeHash) public onlyOwner { tokenableSources[codeHash] = false; }

    function isTokenable(address addr) public constant returns (bool) {
        if (tokenableInstances[addr]) return true;
        if (tokenableSources[getCodeHash(addr)]) return true;
        return false;
    }

    function getCodeHash(address addr) public constant returns(bytes32) {
        bytes memory oCode;
        assembly { // solhint-disable-line no-inline-assembly
            // retrieve the size of the code, this needs assembly
            let size := extcodesize(addr)
            // allocate output byte array - this could also be done without assembly by using oCode = new bytes(size)
            oCode := mload(0x40)
            // new "memory end" including padding
            mstore(0x40, add(oCode, and(add(add(size, 0x20), 0x1f), not(0x1f))))
            // store length in memory
            mstore(oCode, size)
            // actually retrieve the code, this needs assembly
            extcodecopy(addr, add(oCode, 0x20), 0, size)
        }
        return keccak256(oCode);
    }
}
