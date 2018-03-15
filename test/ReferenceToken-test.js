/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const util = require('./util');
const ReferenceToken = require('../build/contracts').ReferenceToken;

describe('ERC777 ReferenceToken', function() {
  let referenceToken;
  let server;
  let web3;
  let accounts;
  let erc820Registry;

  before(async function() {
    ({ server, web3, accounts, erc820Registry } =
      await util.setupGanache('127.0.0.1', 8546));
  });

  after(async function() { server.close(); });

  describe('Deploy', function() {
    it('should deploy the ReferenceToken', async function() {
      referenceToken = await ReferenceToken.new(
        web3, 'Reference Token', 'XRT', web3.utils.toWei('0.01')
      );
      assert.ok(referenceToken.$address);
    });

    after(function() { util.setTokenContract(referenceToken); });
  });

  describe('Attributes', async function() {
    beforeEach(function() {
      Object.assign(this, { accounts, referenceToken, web3, erc820Registry });
    });
    require('./attributes').test();
  });

  describe('Mint', async function() {
    beforeEach(function() {
      Object.assign(this, { accounts, referenceToken, web3, erc820Registry });
    });
    require('./mint').test();
  });

  describe('Burn', async function() {
    beforeEach(function() {
      Object.assign(this, { accounts, referenceToken, web3, erc820Registry });
    });
    require('./burn').test();
  });

  describe('Send', async function() {
    beforeEach(function() {
      Object.assign(this, { accounts, referenceToken, web3, erc820Registry });
    });
    require('./send').test();
  });

  describe('Operator', async function() {
    beforeEach(function() {
      Object.assign(this, { accounts, referenceToken, web3, erc820Registry });
    });
    require('./operator').test();
  });

  describe('TokensSender', async function() {
    it.skip('should implement tests for "TokensSender"');
  });

  describe('TokensReceiver', async function() {
    it.skip('should implement tests for "TokensReceiver"');
  });

  describe('ERC20 Compatibility', async function() {
    beforeEach(function() {
      Object.assign(this, { accounts, referenceToken, web3, erc820Registry });
    });
    require('./erc20').test();
  });

  describe('ERC20 Disabled', async function() {
    beforeEach(function() {
      Object.assign(this, { accounts, referenceToken, web3, erc820Registry });
    });
    require('./erc20-disabled').test();
  });
});
