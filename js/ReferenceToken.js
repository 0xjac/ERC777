const ReferenceTokenAbi = require('../build/ReferenceToken.sol').ReferenceTokenAbi;
const ReferenceTokenByteCode = require('../build/ReferenceToken.sol').ReferenceTokenByteCode;
const generateClass = require('eth-contract-class').default;

module.exports = generateClass(ReferenceTokenAbi, ReferenceTokenByteCode);
