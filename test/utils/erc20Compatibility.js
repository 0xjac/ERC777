/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const utils = require('./index');

exports.test = function(web3, accounts, token) {
  describe('ERC20 Compatibility', function() {
    beforeEach(async function() {
      await utils
        .mintForAllAccounts(web3, accounts, token, accounts[0], '10', 100000);
    });

    it('should register the "ERC20Token" interface with ERC1820',
      async function() {
        let erc1820Registry = utils.getERC1820Registry(web3);
        let erc20Hash = web3.utils.keccak256('ERC20Token');
        let erc20Addr = await erc1820Registry.methods
          .getInterfaceImplementer(token.contract.options.address, erc20Hash)
          .call();

        assert.strictEqual(erc20Addr, token.contract.options.address);
      }
    );

    it('should return 18 for decimals', async function() {
      const decimals = await token.contract.methods.decimals().call();
      assert.strictEqual(decimals, '18');
      await utils.log(`decimals: ${decimals}`);
    });

    it(`should let ${utils.formatAccount(accounts[2])} ` +
      `transfer 1.5 ${token.symbol} ` +
      `to ${utils.formatAccount(accounts[1])}`, async function() {
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      let eventsCalled = utils.assertEventsWillBeCalled(
        token.contract, [{
          name: 'Sent',
          data: {
            operator: accounts[2],
            from: accounts[2],
            to: accounts[1],
            amount: web3.utils.toWei('1.5'),
            data: null,
            operatorData: null,
          },
        }, {
          name: 'Transfer',
          data: {
            from: accounts[2],
            to: accounts[1],
            amount: web3.utils.toWei('1.5'),
          },
        }]
      );

      await token.contract.methods
        .transfer(accounts[1], web3.utils.toWei('1.5'))
        .send({ gas: 300000, from: accounts[2] });

      await utils.getBlock(web3);
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 11.5);
      await utils.assertBalance(web3, token, accounts[2], 8.5);
      await eventsCalled;
    });

    it(`should approve ${utils.formatAccount(accounts[3])} ` +
      `to transfer 3.5 ${token.symbol}` +
      ` from ${utils.formatAccount(accounts[1])}`, async function() {
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      let eventCalled = utils.assertEventWillBeCalled(
        token.contract,
        'Approval', {
          owner: accounts[1],
          spender: accounts[3],
          amount: web3.utils.toWei('3.5'),
        }
      );

      await token.contract.methods
        .approve(accounts[3], web3.utils.toWei('3.5'))
        .send({ gas: 300000, from: accounts[1] });

      await utils.getBlock(web3);

      const allowance = await token.contract.methods
        .allowance(accounts[1], accounts[3])
        .call();

      assert.strictEqual(allowance, web3.utils.toWei('3.5'));
      await utils.log(`allowance: ${allowance}`);

      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);
      await eventCalled;
    });

    it(`should let ${utils.formatAccount(accounts[3])} ` +
      `transfer 3 ${token.symbol} ` +
      `from ${utils.formatAccount(accounts[1])}`, async function() {
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      let eventsCalled = utils.assertEventsWillBeCalled(
        token.contract, [{
          name: 'Approval',
          data: {
            owner: accounts[1],
            spender: accounts[3],
            amount: web3.utils.toWei('3.5'),
          },
        }, {
          name: 'Sent',
          data: {
            operator: accounts[3],
            from: accounts[1],
            to: accounts[2],
            amount: web3.utils.toWei('3'),
            data: null,
            operatorData: null,
          },
        }, {
          name: 'Transfer',
          data: {
            from: accounts[1],
            to: accounts[2],
            amount: web3.utils.toWei('3'),
          },
        }]
      );

      await token.contract.methods
        .approve(accounts[3], web3.utils.toWei('3.5'))
        .send({ gas: 300000, from: accounts[1] });

      await token.contract.methods
        .transferFrom(accounts[1], accounts[2], web3.utils.toWei('3'))
        .send({ gas: 300000, from: accounts[3] });

      await utils.getBlock(web3);

      const allowance = await token.contract.methods
        .allowance(accounts[1], accounts[3])
        .call();

      assert.strictEqual(web3.utils.fromWei(allowance), '0.5');
      await utils.log(`allowance: ${allowance}`);

      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 7);
      await utils.assertBalance(web3, token, accounts[2], 13);
      await eventsCalled;
    });

    it(`should not let ${utils.formatAccount(accounts[3])} transfer from ` +
      `${utils.formatAccount(accounts[1])} (not approved)`, async function() {
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      await token.contract.methods
        .transferFrom(accounts[1], accounts[2], web3.utils.toWei('1'))
        .send({ gas: 300000, from: accounts[3] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);
    });
  });
};
