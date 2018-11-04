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

    it(`should let ${utils.formatAccount(accounts[1])} ` +
      `send 3 ${token.symbol} with empty data ` +
      `to ${utils.formatAccount(accounts[2])}`, async function() {
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      let eventsCalled = utils.assertEventsWillBeCalled(
        token.contract, [{
          name: 'Sent',
          data: {
            operator: accounts[1],
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
        .send(accounts[2], web3.utils.toWei('3'), '0x')
        .send({ gas: 300000, from: accounts[1] });

      await utils.getBlock(web3);
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 7);
      await utils.assertBalance(web3, token, accounts[2], 13);
      await eventsCalled;
    });

    it(`should let ${utils.formatAccount(accounts[1])} ` +
      `send 3 ${token.symbol} with data ` +
      `to ${utils.formatAccount(accounts[2])}`, async function() {
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      let eventsCalled = utils.assertEventsWillBeCalled(
        token.contract, [{
          name: 'Sent',
          data: {
            operator: accounts[1],
            from: accounts[1],
            to: accounts[2],
            amount: web3.utils.toWei('3'),
            data: '0xcafe',
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
        .send(accounts[2], web3.utils.toWei('3'), '0xcafe')
        .send({ gas: 300000, from: accounts[1] });

      await utils.getBlock(web3);
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 7);
      await utils.assertBalance(web3, token, accounts[2], 13);
      await eventsCalled;
    });

    it(`should let ${utils.formatAccount(accounts[1])} ` +
      `send 3 ${token.symbol} to ${utils.formatAccount(accounts[2])} ` +
      '(ERC20 Disabled)', async function() {
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      await token.disableERC20();

      let eventCalled = utils.assertEventWillBeCalled(
        token.contract,
        'Sent', {
          operator: accounts[1],
          from: accounts[1],
          to: accounts[2],
          amount: web3.utils.toWei('3'),
          data: null,
          operatorData: null,
        }
      );

      await token.contract.methods
        .send(accounts[2], web3.utils.toWei('3'), '0x')
        .send({ gas: 300000, from: accounts[1] });

      await utils.getBlock(web3);

      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 7);
      await utils.assertBalance(web3, token, accounts[2], 13);
      await eventCalled;
    });

    it(`should not let ${utils.formatAccount(accounts[1])} ` +
      `send 11 ${token.symbol} (not enough funds)`, async function() {
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      await token.contract.methods
        .send(accounts[2], web3.utils.toWei('11'), '0x')
        .send({ gas: 300000, from: accounts[1] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);
    });

    it(`should not let ${utils.formatAccount(accounts[1])} ` +
      `send -3 ${token.symbol} (negative amount)`, async function() {
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      await token.contract.methods
        .send(accounts[2], web3.utils.toWei('-3'), '0x')
        .send({ gas: 300000, from: accounts[1] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);
    });

    it(`should not let ${utils.formatAccount(accounts[1])} ` +
      `send 0.007 ${token.symbol} (< granulairty)`, async function() {
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      await token.contract.methods
        .send(accounts[2], web3.utils.toWei('0.007'), '0x')
        .send({ gas: 300000, from: accounts[1] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);
    });

    it(`should not let ${utils.formatAccount(accounts[1])} ` +
      `send ${token.symbol} to 0x0 (zero-account)`, async function() {
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);

      await token.contract.methods
        .send(utils.zeroAddress,
          web3.utils.toWei('1'), '0x')
        .send({ gas: 300000, from: accounts[1] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[1], 10);
      await utils.assertBalance(web3, token, accounts[2], 10);
    });
  });
};
