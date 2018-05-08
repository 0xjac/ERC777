/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const utils = require('./index');
const OldExampleTokensRecipient = artifacts.require('ExampleTokensRecipient');

exports.test = function(web3, accounts, token) {
  const ExampleTokensRecipient = new web3.eth.Contract(
    OldExampleTokensRecipient.abi,
    { data: OldExampleTokensRecipient.bytecode }
  );
  let recipient;
  describe('TokensRecipient', async function() {
    beforeEach(async function() {
      await utils
        .mintForAllAccounts(web3, accounts, token, accounts[0], '10', 100000);

      recipient = await ExampleTokensRecipient
        .deploy({ arguments: [true] })
        .send({ from: accounts[4], gasLimit: 4712388 });
      assert.ok(recipient.options.address);
    });

    it('should notify the recipient upon receiving tokens', async function() {
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, recipient.options.address, 0);
      assert.isFalse(await recipient.methods.notified().call());

      await token.contract.methods
        .send(recipient.options.address, web3.utils.toWei('1.22'))
        .send({ gas: 300000, from: accounts[5] });

      await utils.getBlock(web3);

      assert.isTrue(await recipient.methods.notified().call());
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[5], 8.78);
      await utils.assertBalance(web3, token, recipient.options.address, 1.22);
    });

    it('should let the recipient reject the tokens', async function() {
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, recipient.options.address, 0);
      assert.isFalse(await recipient.methods.notified().call());

      await recipient.methods
        .rejectTokens()
        .send({ gas: 300000, from: accounts[4] });

      await token.contract.methods
        .send(recipient.options.address, web3.utils.toWei('1.22'))
        .send({ gas: 300000, from: accounts[5] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);

      // revert will prevent setting notified to true
      assert.isFalse(await recipient.methods.notified().call());
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, recipient.options.address, 0);
    });
    
    it.skip('should call "TokensRecipient" for ' +
      `${utils.formatAccount(accounts[4])}`);
  });
};
