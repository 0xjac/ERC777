/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
chai.use(require('chai-as-promised')).should();
const utils = require('./index');

exports.test = function(web3, accounts, token) {
  describe('send', function() {
    beforeEach(async function() {
      await utils
        .mintForAllAccounts(web3, accounts, token, accounts[0], '10', 100000);
    });

    it(`should let ${accounts[1].slice(0, 8)} send 3 ${token.symbol} to ` +
      `${accounts[2].slice(0, 8)}`, async function() {
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      await token.contract.methods
        .send(accounts[2], web3.utils.toWei('3'))
        .send({ gas: 300000, from: accounts[1] });

      await utils.getBlock(web3);
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[1], 7);
      await utils.assertBalance(web3, token, accounts[2], 13);
    });

    it(`should not let ${accounts[1].slice(0, 8)} send 11 ${token.symbol} ` +
      '(not enough funds)', async function() {
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      await token.contract.methods
        .send(accounts[2], web3.utils.toWei('11'))
        .send({ gas: 300000, from: accounts[1] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);
    });

    it(`should not let ${accounts[1].slice(0, 8)} send -3 ${token.symbol} ` +
      '(negative amount)', async function() {
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      await token.contract.methods
        .send(accounts[2], web3.utils.toWei('-3'))
        .send({ gas: 300000, from: accounts[1] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);
    });

    it(`should not let ${accounts[1].slice(0, 8)} send 0.007 ${token.symbol} ` +
      '(< granulairty)', async function() {
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      await token.contract.methods
        .send(accounts[2], web3.utils.toWei('0.007'))
        .send({ gas: 300000, from: accounts[1] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);
    });
  });
};
