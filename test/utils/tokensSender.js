/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const utils = require('./index');
const OldExampleTokensSender = artifacts.require('ExampleTokensSender');

exports.test = function(web3, accounts, token) {
  const ExampleTokensSender = new web3.eth.Contract(
    OldExampleTokensSender.abi,
    { data: OldExampleTokensSender.bytecode }
  );
  let sender;
  describe('TokensSender', async function() {
    beforeEach(async function() {
      await utils
        .mintForAllAccounts(web3, accounts, token, accounts[0], '10', 100000);

      sender = await ExampleTokensSender
        .deploy({ arguments: [false] })
        .send({ from: accounts[4], gasLimit: 4712388 });

      let erc820Registry = utils.getERC820Registry(web3);
      await erc820Registry.methods
        .setInterfaceImplementer(
          accounts[4],
          web3.utils.keccak256('ERC777TokensSender'),
          sender.options.address
        ).send({ from: accounts[4] });
      assert.ok(sender.options.address);
    });

    it('should notify the sender before sending tokens', async function() {
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[4], 10);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, sender.options.address, 0);
      assert.isFalse(await sender.methods.notified().call());

      await sender.methods
        .acceptTokensToSend()
        .send({ gas: 300000, from: accounts[4] });

      await token.contract.methods
        .send(accounts[5], web3.utils.toWei('1.22'), '0x')
        .send({ gas: 300000, from: accounts[4] });

      await utils.getBlock(web3);

      assert.isTrue(await sender.methods.notified().call());
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[4], 8.78);
      await utils.assertBalance(web3, token, accounts[5], 11.22);
      await utils.assertBalance(web3, token, sender.options.address, 0);
    });

    it('should block the sending tokens for the sender', async function() {
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[4], 10);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, sender.options.address, 0);
      assert.isFalse(await sender.methods.notified().call());

      await sender.methods
        .rejectTokensToSend()
        .send({ gas: 300000, from: accounts[4] });

      await token.contract.methods
        .send(accounts[5], web3.utils.toWei('1.22'), '0x')
        .send({ gas: 300000, from: accounts[4] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);

      // revert will prevent setting notified to true
      assert.isFalse(await sender.methods.notified().call());
      await utils.assertTotalSupply(web3, token, 10 * accounts.length);
      await utils.assertBalance(web3, token, accounts[4], 10);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, sender.options.address, 0);
    });

    it.skip('should implement more tests for "TokensSender"');
  });
};
