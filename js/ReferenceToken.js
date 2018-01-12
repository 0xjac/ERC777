/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const ReferenceTokenAbi = require('../build/ReferenceToken.sol').ReferenceTokenAbi;
const ReferenceTokenByteCode = require('../build/ReferenceToken.sol').ReferenceTokenByteCode;
const generateClass = require('eth-contract-class').default;

module.exports = generateClass(ReferenceTokenAbi, ReferenceTokenByteCode);
