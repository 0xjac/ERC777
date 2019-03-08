/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const utils = require('./index');

exports.test = function(web3, accounts, token) {
  describe('ERC20 Disabled', function() {
    beforeEach(async function() {
      await utils
        .mintForAllAccounts(web3, accounts, token, accounts[0], '10', 100000);
      await token.disableERC20();
    });

    it('should not return 18 for decimals', async function() {
      await token.contract.methods
        .decimals()
        .call()
        .should.be.rejectedWith('revert');
    });

    it(`should not let ${utils.formatAccount(accounts[2])} ` +
      `transfer 3 ${token.symbol} ` +
      `to ${utils.formatAccount(accounts[1])}`, async function() {
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      await token.contract.methods
        .transfer(accounts[1], web3.utils.toWei('3'))
        .send({ gas: 300000, from: accounts[2] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);
    });

    it(`should not approve ${utils.formatAccount(accounts[3])} to transfer ` +
      `from ${utils.formatAccount(accounts[1])}`, async function() {
      await token.contract.methods
        .approve(accounts[3], web3.utils.toWei('3.5'))
        .send({ gas: 300000, from: accounts[1] })
        .should.be.rejectedWith('revert');

      await token.contract.methods
        .allowance(accounts[1], accounts[3])
        .call()
        .should.be.rejectedWith('revert');
    });

    it(`should not let ${utils.formatAccount(accounts[3])} ` +
      `transfer 1 ${token.symbol} ` +
      `from ${utils.formatAccount(accounts[1])}`, async function() {
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      await token.contract.methods
        .approve(accounts[3], web3.utils.toWei('3.5'))
        .send({ gas: 300000, from: accounts[1] })
        .should.be.rejectedWith('revert');

      await token.contract.methods
        .transferFrom(accounts[1], accounts[2], web3.utils.toWei('0.5'))
        .send({ gas: 300000, from: accounts[3] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);
    });

    it('should enable ERC20 compatibility', async function() {
      let erc820Registry = utils.getERC1820Registry(web3);
      let erc20Hash = web3.utils.keccak256('ERC20Token');
      let erc20Addr = await erc820Registry.methods
        .getInterfaceImplementer(token.contract.options.address, erc20Hash)
        .call();

      assert.strictEqual(erc20Addr, utils.zeroAddress);

      await token.contract.methods
        .enableERC20()
        .send({ gas: 300000, from: accounts[0] });

      await utils.getBlock(web3);
      erc20Addr = await erc820Registry.methods
        .getInterfaceImplementer(token.contract.options.address, erc20Hash)
        .call();

      assert.strictEqual(erc20Addr, token.contract.options.address);
    });
  });
};
