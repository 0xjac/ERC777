/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const utils = require('./index');
const OldExampleTokensSender = artifacts.require('ExampleTokensSender');

let deployTokensSender;
let erc1820Registry;

exports.test = function(web3, accounts, token) {
  describe('TokensSender', async function() {
    before(async function() {
      const ExampleTokensSender = new web3.eth.Contract(
        OldExampleTokensSender.abi,
        { data: OldExampleTokensSender.bytecode }
      );

      erc1820Registry = utils.getERC1820Registry(web3);

      deployTokensSender = async function(setInterface, from) {
        const deploySender = ExampleTokensSender
          .deploy({ arguments: [setInterface] });
        const deployGas = await deploySender.estimateGas();
        const sender = await deploySender
          .send({ from: from, gas: deployGas });
        assert.ok(sender.options.address);

        await erc1820Registry.methods
          .setInterfaceImplementer(
            from,
            web3.utils.keccak256('ERC777TokensSender'),
            sender.options.address
          ).send({ from: from });

        return sender;
      };
    });

    beforeEach(async function() {
      await utils
        .mintForAllAccounts(web3, accounts, token, accounts[0], '10', 100000);
    });

    // truffle clean-room is not able to revert the ERC1820Registry
    // manually unset any TokensSenders that may have been set during testing.
    afterEach(async function() {
      for (let account of accounts) {
        await erc1820Registry.methods
          .setInterfaceImplementer(
            account,
            web3.utils.keccak256('ERC777TokensSender'),
            utils.zeroAddress
          ).send({ from: account });
      }
    });

    it('should notify the token holder before sending ' +
      'tokens', async function() {
      const sender = await deployTokensSender(true, accounts[4]);

      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[4], 10);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, sender.options.address, 0);
      utils.assertHookNotCalled(sender, sender.options.address);

      await sender.methods
        .acceptTokensToSend()
        .send({ gas: 300000, from: accounts[4] });

      let eventsCalled = utils.assertEventsWillBeCalled(
        token.contract, [{
          name: 'Sent',
          data: {
            operator: accounts[4],
            from: accounts[4],
            to: accounts[5],
            amount: web3.utils.toWei('1.22'),
            data: null,
            operatorData: null,
          },
        }, {
          name: 'Transfer',
          data: {
            from: accounts[4],
            to: accounts[5],
            amount: web3.utils.toWei('1.22'),
          },
        }]
      );

      await token.contract.methods
        .send(accounts[5], web3.utils.toWei('1.22'), '0x')
        .send({ gas: 300000, from: accounts[4] });

      await utils.getBlock(web3);

      await utils.assertHookCalled(
        web3,
        sender,
        token.contract.options.address,
        accounts[4],
        accounts[4],
        accounts[5],
        null,
        null,
        10,
        10
      );
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[4], 8.78);
      await utils.assertBalance(web3, token, accounts[5], 11.22);
      await utils.assertBalance(web3, token, sender.options.address, 0);
      await eventsCalled;
    });

    it('should notify the token holder before sending tokens ' +
      '(ERC20 Disabled)', async function() {
      const sender = await deployTokensSender(true, accounts[4]);

      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[4], 10);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, sender.options.address, 0);
      utils.assertHookNotCalled(sender, sender.options.address);

      await sender.methods
        .acceptTokensToSend()
        .send({ gas: 300000, from: accounts[4] });

      await token.disableERC20();

      let eventCalled = utils.assertEventWillBeCalled(
        token.contract,
        'Sent', {
          operator: accounts[4],
          from: accounts[4],
          to: accounts[5],
          amount: web3.utils.toWei('1.22'),
          data: null,
          operatorData: null,
        }
      );

      await token.contract.methods
        .send(accounts[5], web3.utils.toWei('1.22'), '0x')
        .send({ gas: 300000, from: accounts[4] });

      await utils.getBlock(web3);

      await utils.assertHookCalled(
        web3,
        sender,
        token.contract.options.address,
        accounts[4],
        accounts[4],
        accounts[5],
        null,
        null,
        10,
        10
      );
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[4], 8.78);
      await utils.assertBalance(web3, token, accounts[5], 11.22);
      await utils.assertBalance(web3, token, sender.options.address, 0);
      await eventCalled;
    });

    it('should block the sending of tokens for the token ' +
      'holder', async function() {
      const sender = await deployTokensSender(true, accounts[4]);

      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[4], 10);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, sender.options.address, 0);

      await sender.methods
        .rejectTokensToSend()
        .send({ gas: 300000, from: accounts[4] });

      await token.contract.methods
        .send(accounts[5], web3.utils.toWei('1.22'), '0x')
        .send({ gas: 300000, from: accounts[4] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);

      // revert will revert setting data in the hook
      utils.assertHookNotCalled(sender, sender.options.address);
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[4], 10);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, sender.options.address, 0);
    });

    it('should notify the token holder before burning ' +
      'tokens', async function() {
      const sender = await deployTokensSender(true, accounts[0]);

      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(
        web3, token, accounts[0], token.initialSupply + 10);
      await utils.assertBalance(web3, token, sender.options.address, 0);
      utils.assertHookNotCalled(sender, sender.options.address);

      await sender.methods
        .acceptTokensToSend()
        .send({ gas: 300000, from: accounts[0] });

      let eventsCalled = utils.assertEventsWillBeCalled(
        token.contract, [{
          name: 'Burned',
          data: {
            operator: accounts[0],
            from: accounts[0],
            amount: web3.utils.toWei('1.22'),
            data: null,
            operatorData: null,
          },
        }, {
          name: 'Transfer',
          data: {
            from: accounts[0],
            to: utils.zeroAddress,
            amount: web3.utils.toWei('1.22'),
          },
        }]
      );

      await token.contract.methods
        .burn(web3.utils.toWei('1.22'), '0x')
        .send({ gas: 300000, from: accounts[0] });

      await utils.getBlock(web3);

      await utils.assertHookCalled(
        web3,
        sender,
        token.contract.options.address,
        accounts[0],
        accounts[0],
        utils.zeroAddress,
        null,
        null,
        token.initialSupply + 10,
        0
      );
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply - 1.22);
      await utils.assertBalance(
        web3, token, accounts[0], token.initialSupply + 8.78);
      await utils.assertBalance(web3, token, sender.options.address, 0);
      await eventsCalled;
    });
  });
};
