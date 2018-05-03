/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
chai.use(require('chai-as-promised')).should();
const utils = require('./index');

exports.test = function(web3, accounts, token) {
  describe('burn', function() {
    beforeEach(async function() {
      await utils
        .mintForAllAccounts(web3, accounts, token, accounts[0], '10', 100000);
    });

    it(`should burn 3 ${token.symbol} for ${accounts[1].slice(0, 8)}`,
      async function() {
        await utils.assertBalance(web3, token, accounts[1], 10);

        await token.contract.methods
          .burn(accounts[1], web3.utils.toWei('3'), '0x', '0x')
          .send({ gas: 300000, from: accounts[0] });

        await utils.getBlock(web3);
        await utils.assertBalance(web3, token, accounts[1], 7);
        await utils.assertTotalSupply(web3, token, 97);
      });

    it(`should not burn 11 ${token.symbol} for ${accounts[1].slice(0, 8)} ` +
      '(not enough funds)', async function() {
      await utils.assertBalance(web3, token, accounts[1], 10);

      await token.contract.methods
        .burn(accounts[1], web3.utils.toWei('11'), '0x', '0x')
        .send({ gas: 300000, from: accounts[0] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertTotalSupply(web3, token, 100);
    });

    it(`should not let ${accounts[1].slice(0, 8)} burn -3 ${token.symbol} ` +
      '(negative amount)', async function() {
      await utils.assertBalance(web3, token, accounts[1], 10);

      await token.contract.methods
        .burn(accounts[1], web3.utils.toWei('-3'), '0x', '0x')
        .send({ gas: 300000, from: accounts[0] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertTotalSupply(web3, token, 100);
    });

    it(`should not let ${accounts[1].slice(0, 8)} burn 0.007 ${token.symbol} ` +
      '(< granulairty)', async function() {
      await utils.assertBalance(web3, token, accounts[1], 10);

      await token.contract.methods
        .burn(accounts[1], web3.utils.toWei('0.007'), '0x', '0x')
        .send({ gas: 300000, from: accounts[0] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertTotalSupply(web3, token, 100);
    });
  });
};
