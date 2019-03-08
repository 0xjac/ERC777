/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const utils = require('./index');
const OldExampleTokensRecipient = artifacts.require('ExampleTokensRecipient');
const empty = '0x';

let deployTokensRecipient;
let erc1820Registry;

exports.test = function(web3, accounts, token) {
  describe('TokensRecipient', async function() {
    before(function() {
      let ExampleTokensRecipient = new web3.eth.Contract(
        OldExampleTokensRecipient.abi,
        { data: OldExampleTokensRecipient.bytecode }
      );

      erc1820Registry = utils.getERC1820Registry(web3);

      deployTokensRecipient = async function(setInterface, from) {
        const deployRecipient = ExampleTokensRecipient
          .deploy({ arguments: [setInterface] });
        const gas = await deployRecipient.estimateGas();
        const recipient = await deployRecipient
          .send({ from: from, gas: gas });
        assert.ok(recipient.options.address);
        return recipient;
      };
    });

    beforeEach(async function() {
      await utils
        .mintForAllAccounts(web3, accounts, token, accounts[0], '10', 100000);
    });

    // truffle clean-room is not able to revert the ERC1820Registry
    // manually unset any TokensRecipient that may have been set during testing.
    afterEach(async function() {
      for (let account of accounts) {
        await erc1820Registry.methods
          .setInterfaceImplementer(
            account,
            web3.utils.keccak256('ERC777TokensRecipient'),
            utils.zeroAddress
          ).send({ from: account });
      }
    });

    it('should notify the recipient upon receiving tokens', async function() {
      const recipient = await deployTokensRecipient(true, accounts[4]);

      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, recipient.options.address, 0);

      await recipient.methods
        .acceptTokens()
        .send({ gas: 300000, from: accounts[4] });

      let eventsCalled = utils.assertEventsWillBeCalled(
        token.contract, [{
          name: 'Sent',
          data: {
            operator: accounts[5],
            from: accounts[5],
            to: recipient.options.address,
            amount: web3.utils.toWei('1.22'),
            data: '0xcafe',
            operatorData: null,
          },
        }, {
          name: 'Transfer',
          data: {
            from: accounts[5],
            to: recipient.options.address,
            amount: web3.utils.toWei('1.22'),
          },
        }]
      );

      const send = token.contract.methods
        .send(recipient.options.address, web3.utils.toWei('1.22'), '0xcafe');

      const sendGas = await send.estimateGas();
      await send.send({ gas: sendGas, from: accounts[5] });

      await utils.getBlock(web3);

      await utils.assertHookCalled(
        web3,
        recipient,
        token.contract.options.address,
        accounts[5],
        accounts[5],
        recipient.options.address,
        '0xcafe',
        null,
        8.78,
        1.22
      );
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[5], 8.78);
      await utils.assertBalance(web3, token, recipient.options.address, 1.22);
      await eventsCalled;
    });

    it('should notify the recipient upon receiving tokens ' +
      '(ERC20 Disabled)', async function() {
      const recipient = await deployTokensRecipient(true, accounts[4]);

      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, recipient.options.address, 0);

      await recipient.methods
        .acceptTokens()
        .send({ gas: 300000, from: accounts[4] });

      let eventCalled = utils.assertEventWillBeCalled(
        token.contract,
        'Sent', {
          operator: accounts[5],
          from: accounts[5],
          to: recipient.options.address,
          amount: web3.utils.toWei('1.22'),
          data: '0xcafe',
          operatorData: null,
        }
      );

      const send = token.contract.methods
        .send(recipient.options.address, web3.utils.toWei('1.22'), '0xcafe');

      const sendGas = await send.estimateGas();
      await send.send({ gas: sendGas, from: accounts[5] });

      await utils.getBlock(web3);

      await utils.assertHookCalled(
        web3,
        recipient,
        token.contract.options.address,
        accounts[5],
        accounts[5],
        recipient.options.address,
        '0xcafe',
        null,
        8.78,
        1.22
      );
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[5], 8.78);
      await utils.assertBalance(web3, token, recipient.options.address, 1.22);
      await eventCalled;
    });

    it('should let the recipient reject the tokens', async function() {
      const recipient = await deployTokensRecipient(true, accounts[4]);

      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, recipient.options.address, 0);

      await recipient.methods
        .rejectTokens()
        .send({ gas: 300000, from: accounts[4] });

      await token.contract.methods
        .send(recipient.options.address, web3.utils.toWei('1.22'), empty)
        .send({ gas: 300000, from: accounts[5] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);

      // revert will revert setting data in the hook
      utils.assertHookNotCalled(recipient, recipient.options.address);
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, recipient.options.address, 0);
    });

    it('should call "TokensRecipient" for ' +
      `${utils.formatAccount(accounts[4])} on send`, async function() {
      const recipient = await deployTokensRecipient(false, accounts[4]);

      await erc1820Registry.methods
        .setInterfaceImplementer(
          accounts[4],
          web3.utils.keccak256('ERC777TokensRecipient'),
          recipient.options.address
        ).send({ from: accounts[4] });

      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[4], 10);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, recipient.options.address, 0);

      await recipient.methods
        .acceptTokens()
        .send({ gas: 300000, from: accounts[4] });

      let eventsCalled = utils.assertEventsWillBeCalled(
        token.contract, [{
          name: 'Sent',
          data: {
            operator: accounts[5],
            from: accounts[5],
            to: accounts[4],
            amount: web3.utils.toWei('4.24'),
            data: '0xbeef',
            operatorData: null,
          },
        }, {
          name: 'Transfer',
          data: {
            from: accounts[5],
            to: accounts[4],
            amount: web3.utils.toWei('4.24'),
          },
        }]
      );

      await token.contract.methods
        .send(accounts[4], web3.utils.toWei('4.24'), '0xbeef')
        .send({ gas: 300000, from: accounts[5] });

      await utils.getBlock(web3);

      await utils.assertHookCalled(
        web3,
        recipient,
        token.contract.options.address,
        accounts[5],
        accounts[5],
        accounts[4],
        '0xbeef',
        null,
        5.76,
        14.24,
      );
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[4], 14.24);
      await utils.assertBalance(web3, token, accounts[5], 5.76);
      await utils.assertBalance(web3, token, recipient.options.address, 0);
      await eventsCalled;
    });

    it('should call "TokensRecipient" for ' +
      `${utils.formatAccount(accounts[4])} on send` +
      '(ERC20 Disabled)', async function() {
      const recipient = await deployTokensRecipient(false, accounts[4]);

      await erc1820Registry.methods
        .setInterfaceImplementer(
          accounts[4],
          web3.utils.keccak256('ERC777TokensRecipient'),
          recipient.options.address
        ).send({ from: accounts[4] });

      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[4], 10);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, recipient.options.address, 0);

      await recipient.methods
        .acceptTokens()
        .send({ gas: 300000, from: accounts[4] });

      await token.disableERC20();

      let eventCalled = utils.assertEventWillBeCalled(
        token.contract,
        'Sent', {
          operator: accounts[5],
          from: accounts[5],
          to: accounts[4],
          amount: web3.utils.toWei('1.22'),
          data: '0xbeef',
          operatorData: null,
        }
      );

      await token.contract.methods
        .send(accounts[4], web3.utils.toWei('1.22'), '0xbeef')
        .send({ gas: 300000, from: accounts[5] });

      await utils.getBlock(web3);

      await utils.assertHookCalled(
        web3,
        recipient,
        token.contract.options.address,
        accounts[5],
        accounts[5],
        accounts[4],
        '0xbeef',
        null,
        8.78,
        11.22,
      );
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[4], 11.22);
      await utils.assertBalance(web3, token, accounts[5], 8.78);
      await utils.assertBalance(web3, token, recipient.options.address, 0);
      await eventCalled;
    });

    it('should not send tokens to a contract ' +
      'without TokensRecipient', async function() {
      const recipient = await deployTokensRecipient(false, accounts[4]);

      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, recipient.options.address, 0);

      await token.contract.methods
        .send(recipient.options.address, web3.utils.toWei('1.22'), empty)
        .send({ gas: 300000, from: accounts[5] })
        .should.be.rejectedWith('revert');

      await utils.getBlock(web3);

      // revert will revert setting data in the hook
      utils.assertHookNotCalled(recipient, recipient.options.address);
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[5], 10);
      await utils.assertBalance(web3, token, recipient.options.address, 0);
    });

    it('should call "TokensRecipient" for ' +
      `${utils.formatAccount(accounts[4])} on mint`, async function() {
      const recipient = await deployTokensRecipient(false, accounts[4]);

      await erc1820Registry.methods
        .setInterfaceImplementer(
          accounts[4],
          web3.utils.keccak256('ERC777TokensRecipient'),
          recipient.options.address
        ).send({ from: accounts[4] });

      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply);
      await utils.assertBalance(web3, token, accounts[4], 10);
      await utils.assertBalance(web3, token, recipient.options.address, 0);

      await recipient.methods
        .acceptTokens()
        .send({ gas: 300000, from: accounts[4] });

      let eventsCalled = utils.assertEventsWillBeCalled(
        token.contract, [{
          name: 'Minted',
          data: {
            operator: accounts[0],
            to: accounts[4],
            amount: web3.utils.toWei('1.22'),
            data: '0xcafe',
            operatorData: '0xbeef',
          },
        }, {
          name: 'Transfer',
          data: {
            from: utils.zeroAddress,
            to: accounts[4],
            amount: web3.utils.toWei('1.22'),
          },
        }]
      );

      await token.contract.methods
        .mint(accounts[4], web3.utils.toWei('1.22'), '0xcafe', '0xbeef')
        .send({ gas: 300000, from: accounts[0] });

      await utils.getBlock(web3);

      await utils.assertHookCalled(
        web3,
        recipient,
        token.contract.options.address,
        accounts[0],
        utils.zeroAddress,
        accounts[4],
        '0xcafe',
        '0xbeef',
        0,
        11.22,
      );
      await utils.assertTotalSupply(
        web3, token, 10 * accounts.length + token.initialSupply + 1.22);
      await utils.assertBalance(web3, token, accounts[4], 11.22);
      await utils.assertBalance(web3, token, recipient.options.address, 0);
      await eventsCalled;
    });
  });
};
