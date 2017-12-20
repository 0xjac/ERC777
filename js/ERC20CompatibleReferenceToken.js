const ERC20CompatibleReferenceTokenAbi = require('../build/ERC20CompatibleReferenceToken.sol').ERC20CompatibleReferenceTokenAbi;
const ERC20CompatibleReferenceTokenByteCode = require('../build/ERC20CompatibleReferenceToken.sol').ERC20CompatibleReferenceTokenByteCode;
const generateClass = require('eth-contract-class').default;

module.exports = generateClass(ERC20CompatibleReferenceTokenAbi, ERC20CompatibleReferenceTokenByteCode);
