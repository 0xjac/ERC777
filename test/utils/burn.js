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

    it(`should let ${utils.formatAccount(accounts[0])} burn 3 ${token.symbol}`,
      async function() {
        await utils.assertBalance(web3, token, accounts[0], 10);

        await token.contract.methods
          .burn(web3.utils.toWei('3'), '0x')
          .send({ gas: 300000, from: accounts[0] });

        await utils.getBlock(web3);
        await utils.assertBalance(web3, token, accounts[0], 7);
        await utils.assertTotalSupply(web3, token, 10 * accounts.length - 3);
      }
    );

    it(`should let ${utils.formatAccount(accounts[0])} burn 3 ${token.symbol}` +
      ' (ERC20 Disabled)', async function() {
      await utils.assertBalance(web3, token, accounts[0], 10);

      await token.disableERC20();

      await token.contract.methods
        .burn(web3.utils.toWei('3'), '0x')
        .send({ gas: 300000, from: accounts[0] });

      await utils.getBlock(web3);

      // TODO check events
      await utils.assertBalance(web3, token, accounts[0], 7);
      await utils.assertTotalSupply(web3, token, 10 * accounts.length - 3);
    });

    it(`should not let ${utils.formatAccount(accounts[0])} burn 11 ` +
      `${token.symbol} (not enough funds)`, async function() {
      await utils.assertBalance(web3, token, accounts[0], 10);

      await token.contract.methods
        .burn(web3.utils.toWei('11'), '0x')
        .send({ gas: 300000, from: accounts[0] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertBalance(web3, token, accounts[0], 10);
      await utils.assertTotalSupply(web3, token, 100);
    });

    it(`should not let ${utils.formatAccount(accounts[0])} burn -3 ` +
      `${token.symbol} (negative amount)`, async function() {
      await utils.assertBalance(web3, token, accounts[0], 10);

      await token.contract.methods
        .burn(web3.utils.toWei('-3'), '0x')
        .send({ gas: 300000, from: accounts[0] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertBalance(web3, token, accounts[0], 10);
      await utils.assertTotalSupply(web3, token, 100);
    });

    it(`should not let ${utils.formatAccount(accounts[0])} burn 0.007 ` +
      `${token.symbol} (< granulairty)`, async function() {
      await utils.assertBalance(web3, token, accounts[0], 10);

      await token.contract.methods
        .burn(web3.utils.toWei('0.007'), '0x')
        .send({ gas: 300000, from: accounts[0] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertBalance(web3, token, accounts[0], 10);
      await utils.assertTotalSupply(web3, token, 100);
    });

    it(`should not let ${utils.formatAccount(accounts[1])} burn 3 ` +
      `${token.symbol} (not owner)`, async function() {
      await utils.assertBalance(web3, token, accounts[1], 10);

      await token.contract.methods
        .burn(web3.utils.toWei('11'), '0x')
        .send({ gas: 300000, from: accounts[1] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertTotalSupply(web3, token, 100);
    });
  });
};
