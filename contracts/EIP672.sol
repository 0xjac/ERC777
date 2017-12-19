pragma solidity ^0.4.18;

interface IENS {
    function owner(bytes32 _node) public constant returns(address);
    function resolver(bytes32 _node) public constant returns(address);
    function ttl(bytes32 _node) public constant returns(uint64);
    function setOwner(bytes32 _node, address _owner) public;
    function setSubnodeOwner(bytes32 _node, bytes32 _label, address _owner) public;
    function setResolver(bytes32 _node, address _resolver) public;
    function setTTL(bytes32 _node, uint64 _ttl) public;
}

interface IReverseRegistrar {
    function defaultResolver() public constant returns (address);
    function claimWithResolver(address _owner, address _resolver) public returns (bytes32 node);
}

interface IPublicResolver {
    function addr(bytes32 _node) public constant returns (address ret);
    function setAddr(bytes32 _node, address _addr) public;
}

interface IReverseResolver {
    function name(bytes32 _node) public constant returns (address ret);
    function setName(bytes32 node, string _name) public;
}

// [functionSig or interfaceId].[address].addr.reverse

// Base contract for any contract that uses EnsPseudoIntrospection
contract EIP672 {
    address constant ENS_MAIN = 0x314159265dD8dbb310642f98f50C066173C1259b;
    address constant ENS_ROPSTEM = 0x112234455C3a32FD11230C42E7Bccd4A84e02010;
    address constant ENS_RINKEBY = 0xe7410170f87102DF0055eB195163A03B7F2Bff4A;
    address constant ENS_SIMULATOR = 0x8cDE56336E289c028C8f7CF5c20283fF02272182;
    bytes32 constant public REVERSE_ROOT_NODE = keccak256(keccak256(bytes32(0), keccak256('reverse')), keccak256('addr'));
    bytes32 constant public PUBLICRESOLVE_ROOT_NODE = keccak256(keccak256(bytes32(0), keccak256('eth')), keccak256('resolver'));
    IENS public ens;

    function EIP672() public {
      if (isContract(ENS_MAIN)) {
        ens = IENS(ENS_MAIN);
      } else if (isContract(ENS_ROPSTEM)) {
        ens = IENS(ENS_ROPSTEM);
      } else if (isContract(ENS_RINKEBY)) {
        ens = IENS(ENS_RINKEBY);
      } else if (isContract(ENS_SIMULATOR)) {
        ens = IENS(ENS_SIMULATOR);
      } else {
        assert(false);
      }

      IReverseRegistrar reverseRegistrar = IReverseRegistrar(ens.owner(REVERSE_ROOT_NODE));

      // Claim root node with reverse resolver, subnodes with public resolver, to preserve
      // the ability to use ENS reverse resolution.
      reverseRegistrar.claimWithResolver(
        address(this),
        reverseRegistrar.defaultResolver());
    }

    function setInterfaceImplementation(string ifaceLabel, address impl) internal {

        bytes32 node = rootNodeForAddress(address(this));
        bytes32 ifaceLabelHash = keccak256(ifaceLabel);
        bytes32 ifaceNode = keccak256(node, ifaceLabelHash);

        ens.setSubnodeOwner(node, ifaceLabelHash, address(this));

        IPublicResolver resolver = IPublicResolver(ens.resolver(PUBLICRESOLVE_ROOT_NODE));
        IPublicResolver publicResolver = IPublicResolver(resolver.addr(PUBLICRESOLVE_ROOT_NODE));

        ens.setResolver(ifaceNode, publicResolver);
        publicResolver.setAddr(ifaceNode, impl);
    }

    function interfaceAddr(address addr, string ifaceLabel) internal constant returns(address) {
        bytes32 node = rootNodeForAddress(address(addr));
        bytes32 ifaceNode = keccak256(node, keccak256(ifaceLabel));
        IPublicResolver resolver = IPublicResolver(ens.resolver(ifaceNode));
        if (address(resolver) == 0) return 0;
        return resolver.addr(ifaceNode);
    }

    // @dev Set this contract's ENS domain name in the reverse resolver. This only
    // works if this contract retains ownership of the ENS reverse root node. It is
    // up to the derived contract to either call this method, provide a method for
    // an external address to call this method, or release ownership of the ENS
    // reverse root node to an external address in order for ENS reverse resolution to work.
    // @param _name The ENS domain name that this contract's address should resolve to.
    function setReverseName(string _name) internal {
        bytes32 node = rootNodeForAddress(address(this));
        require(ens.owner(node) == address(this));
        IReverseResolver resolver = IReverseResolver(ens.resolver(node));
        resolver.setName(node, _name);
    }

    // @dev Release ownership of this contract's ENS reverse root node to another
    // address to allow setting reverse ENS name and updating interface subnodes
    // externally. It is up to the derived contract to determine if, when and how
    // to call this method based on its own authentication and authorization logic.
    // @param addr The address that will take ownership of the root node.
    function releaseRootNodeOwnership(address addr) internal {
        bytes32 node = rootNodeForAddress(address(this));
        require(ens.owner(node) == address(this));
        require(addr != address(0));
        ens.setOwner(node, addr);
    }

    function rootNodeForAddress(address addr) internal constant returns (bytes32) {
        return keccak256(REVERSE_ROOT_NODE, keccak256HexAddress(addr));
    }

    function keccak256HexAddress(address addr) private constant returns (bytes32 ret) {
        addr; ret; // Stop warning us about unused variables
        assembly {
            let lookup := 0x3031323334353637383961626364656600000000000000000000000000000000
            let i := 40
        loop:
            i := sub(i, 1)
            mstore8(i, byte(and(addr, 0xf), lookup))
            addr := div(addr, 0x10)
            i := sub(i, 1)
            mstore8(i, byte(and(addr, 0xf), lookup))
            addr := div(addr, 0x10)
            jumpi(loop, i)
            ret := keccak256(0, 40)
        }
    }

    /// @dev Internal function to determine if an address is a contract
    /// @param _addr The address being queried
    /// @return True if `_addr` is a contract
    function isContract(address _addr) constant internal returns(bool) {
        uint size;
        if (_addr == 0) return false;
        assembly {
            size := extcodesize(_addr)
        }
        return size>0;
    }
}
