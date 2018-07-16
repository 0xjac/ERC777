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

    it('should list the default operators', async function() {
      const defaultOperators = await token.contract.methods
        .defaultOperators()
        .call();

      assert.deepEqual(
        defaultOperators.map(web3.utils.toChecksumAddress),
        token.defaultOperators.map(web3.utils.toChecksumAddress),
      );
    });

    for (let defaultOperator of token.defaultOperators) {
      it(`should detect ${utils.formatAccount(defaultOperator)} is a default ` +
        'operator for all accounts', async function() {
        for (let account of accounts) {
          assert.isTrue(
            await token.contract.methods
              .isOperatorFor(defaultOperator, account)
              .call()
          );
        }
      });
    }

    it(`should let ${utils.formatAccount(accounts[3])} revoke the default ` +
      `operator ${utils.formatAccount(token.defaultOperators[1])}`,
    async function() {
      assert.isTrue(
        await token.contract.methods
          .isOperatorFor(token.defaultOperators[1], accounts[3])
          .call()
      );

      await token.contract.methods
        .revokeOperator(token.defaultOperators[1])
        .send({ from: accounts[3], gas: 300000 });

      await utils.getBlock(web3);
      assert.isFalse(
        await token.contract.methods
          .isOperatorFor(token.defaultOperators[1], accounts[3])
          .call()
      );
    });

    it(`should let ${utils.formatAccount(accounts[4])} reauthorize the ` +
      'previously revoked default operator ' +
      `${utils.formatAccount(token.defaultOperators[0])}`,
    async function() {
      assert.isTrue(
        await token.contract.methods
          .isOperatorFor(token.defaultOperators[0], accounts[4])
          .call()
      );

      await token.contract.methods
        .revokeOperator(token.defaultOperators[0])
        .send({ from: accounts[4], gas: 300000 });

      await utils.getBlock(web3);
      assert.isFalse(
        await token.contract.methods
          .isOperatorFor(token.defaultOperators[0], accounts[4])
          .call()
      );

      await token.contract.methods
        .authorizeOperator(token.defaultOperators[0])
        .send({ from: accounts[4], gas: 300000 });

      await utils.getBlock(web3);
      assert.isTrue(
        await token.contract.methods
          .isOperatorFor(token.defaultOperators[0], accounts[4])
          .call()
      );
    });

    it(`should detect ${utils.formatAccount(accounts[3])} is not an operator ` +
      `for ${utils.formatAccount(accounts[1])}`, async function() {
      assert.isFalse(
        await token.contract.methods
          .isOperatorFor(accounts[3], accounts[1])
          .call()
      );
    });

    it(`should authorize ${utils.formatAccount(accounts[3])} as an operator ` +
      `for ${utils.formatAccount(accounts[1])}`, async function() {
      await token.contract.methods
        .authorizeOperator(accounts[3])
        .send({ from: accounts[1], gas: 300000 });

      assert.isTrue(
        await token.contract.methods
          .isOperatorFor(accounts[3], accounts[1])
          .call()
      );
    });

    it(`should revoke ${utils.formatAccount(accounts[3])} as an operator for ` +
      `${utils.formatAccount(accounts[1])}`, async function() {
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

    it(`should not let ${utils.formatAccount(accounts[3])} authorize itself ` +
      'as one of his own operators', async function() {
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[3], 10);

      await token.contract.methods
        .authorizeOperator(accounts[3])
        .send({ gas: 300000, from: accounts[3] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[3], 10);
    });

    it(`should make ${utils.formatAccount(accounts[3])} ` +
      'an operator for itself by default', async function() {
      assert.isTrue(
        await token.contract.methods
          .isOperatorFor(accounts[3], accounts[3])
          .call()
      );
    });

    it(`should not let ${utils.formatAccount(accounts[3])} revoke itself ` +
      'as one of his own operators', async function() {
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[3], 10);

      await token.contract.methods
        .revokeOperator(accounts[3])
        .send({ gas: 300000, from: accounts[3] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[3], 10);
    });
  });
};
