# new-ethereum-token-standard
New Standard for Ethereum Token to implement callback for contracts (like ERC223) but only if registered with ReverseENS (to prevent failure sending to contracts not implementing tokenFallback method such as existing multisig contract etc)

### Research Stuff
- https://github.com/ethereum/EIPs/issues/165
- https://github.com/ethereum/solidity/issues/2753
- https://github.com/ethereum/EIPs/issues/672

### Things in the wild
- https://github.com/Giveth/minime/ (clonable ERC20)
- https://github.com/ConsenSys/Tokens
- https://github.com/OpenZeppelin/zeppelin-solidity/tree/master/contracts/token
- https://github.com/Dexaran/ERC223-token-standard/tree/Recommended (meh erc223 contract)
- https://github.com/Dexaran/ERC223-token-standard/tree/master
