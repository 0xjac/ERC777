/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const utils = require('./index');

exports.test = function(web3, accounts, token) {
  describe('operator', function() {
    beforeEach(async function() {
      await utils
        .mintForAllAccounts(web3, accounts, token, accounts[0], '10', 100000);
    });

    it(`should detect ${accounts[3].slice(0, 8)} is not an operator for ` +
    `${accounts[1].slice(0, 8)}`, async function() {
      assert.isFalse(
        await token.contract.methods
          .isOperatorFor(accounts[3], accounts[1])
          .call()
      );
    });

    it(`should authorize ${accounts[3].slice(0, 8)} as an operator for ` +
    `${accounts[1].slice(0, 8)}`, async function() {
      await token.contract.methods
        .authorizeOperator(accounts[3])
        .send({ from: accounts[1], gas: 300000 });

      assert.isTrue(
        await token.contract.methods
          .isOperatorFor(accounts[3], accounts[1])
          .call()
      );
    });

    it(`should let ${accounts[3].slice(0, 8)} send 1.12 ${token.symbol} ` +
      `from ${accounts[1].slice(0, 8)} to ` +
      `${accounts[2].slice(0, 8)}`, async function() {
      await token.contract.methods
        .authorizeOperator(accounts[3])
        .send({ from: accounts[1], gas: 300000 });

      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      await token.contract.methods
        .operatorSend(
          accounts[1], accounts[2], web3.utils.toWei('1.12'), '0x', '0x')
        .send({ gas: 300000, from: accounts[3] });

      await utils.getBlock(web3);
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[1], 8.88);
      await utils.assertBalance(web3, token, accounts[2], 11.12);
    });

    it(`should revoke ${accounts[3].slice(0, 8)} as an operator for ` +
      `${accounts[1].slice(0, 8)}`, async function() {
      await token.contract.methods
        .authorizeOperator(accounts[3])
        .send({ from: accounts[1], gas: 300000 });

      assert.isTrue(
        await token.contract.methods
          .isOperatorFor(accounts[3], accounts[1])
          .call()
      );

      await token.contract.methods
        .revokeOperator(accounts[3])
        .send({ from: accounts[1], gas: 300000 });

      await utils.getBlock(web3);
      assert.isFalse(
        await token.contract.methods
          .isOperatorFor(accounts[3], accounts[1])
          .call()
      );
    });

    it(`should not let ${accounts[3].slice(0, 8)} send from ` +
      `${accounts[1].slice(0, 8)} (not operator)`, async function() {
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      await token.contract.methods
        .operatorSend(
          accounts[1], accounts[2], web3.utils.toWei('3.72'), '0x', '0x')
        .send({ gas: 300000, from: accounts[3] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);
    });
  });
};
