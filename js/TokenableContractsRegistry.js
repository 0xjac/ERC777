const TokenableContractsRegistryAbi = require('../build/TokenableContractsRegistry.sol').TokenableContractsRegistryAbi;
const TokenableContractsRegistryByteCode = require('../build/TokenableContractsRegistry.sol').TokenableContractsRegistryByteCode;
const generateClass = require('eth-contract-class').default;

module.exports = generateClass(TokenableContractsRegistryAbi, TokenableContractsRegistryByteCode);
