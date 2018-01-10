pragma solidity ^0.4.18; // solhint-disable-line compiler-fixed

import "../node_modules/giveth-common-contracts/contracts/Owned.sol";


contract TokenableContractsRegistry is Owned {

    mapping (address => bool) public tokenableInstances;
    mapping (bytes32 => bool) public tokenableSources;

    function setInstanceTokenable(address instance) onlyOwner public {
        tokenableInstances[instance]=true;
    }

    function setInstanceUntokenable(address instance) onlyOwner public {
        tokenableInstances[instance]=false;
    }

    function setCodeTokenable(bytes32 codeHash) onlyOwner public {
        tokenableSources[codeHash] = true;
    }

    function setCodeUntokenable(bytes32 codeHash) onlyOwner public {
        tokenableSources[codeHash] = false;
    }

    function isTokenable(address addr) public constant returns (bool) {
        if (tokenableInstances[addr]) return true;
        if (tokenableSources[getCodeHash(addr)]) return true;
        return false;
    }

    function getCodeHash(address addr) public constant returns(bytes32) {
        bytes memory o_code;
        assembly {
            // retrieve the size of the code, this needs assembly
            let size := extcodesize(addr)
            // allocate output byte array - this could also be done without assembly
            // by using o_code = new bytes(size)
            o_code := mload(0x40)
            // new "memory end" including padding
            mstore(0x40, add(o_code, and(add(add(size, 0x20), 0x1f), not(0x1f))))
            // store length in memory
            mstore(o_code, size)
            // actually retrieve the code, this needs assembly
            extcodecopy(addr, add(o_code, 0x20), 0, size)
        }
        return keccak256(o_code);
    }
}
