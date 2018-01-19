/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TestRPC = require('ethereumjs-testrpc');
const Web3 = require('web3');
const chai = require('chai');
const EIP820 = require('eip820');
const TokenableContractsRegistry = require('../js/TokenableContractsRegistry');
const ReferenceToken = require('../js/ReferenceToken');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();

describe('EIP777 Reference Token Test', () => {
  let testrpc;
  let web3;
  let accounts;
  let referenceToken;
  let tokenableContractsRegistry;
  let interfaceImplementationRegistry;
  let util;

  before(async () => {
    testrpc = TestRPC.server({
      ws: true,
      gasLimit: 5800000,
      total_accounts: 10, // eslint-disable-line camelcase
    });
    testrpc.listen(8546, '127.0.0.1');

    web3 = new Web3('ws://localhost:8546');
    accounts = await web3.eth.getAccounts();

    interfaceImplementationRegistry = await EIP820.deploy(web3, accounts[0]);
    assert.ok(interfaceImplementationRegistry.$address);
  });

  after(async () => testrpc.close());

  it('should deploy the reference token contract', async () => {
    tokenableContractsRegistry = await TokenableContractsRegistry.new(web3);
    assert.ok(tokenableContractsRegistry.$address);

    referenceToken = await ReferenceToken.new(
      web3,
      'Reference Token',
      'XRT',
      web3.utils.toWei('0.01'),
      tokenableContractsRegistry.$address
    );
    assert.ok(referenceToken.$address);

    util = require('./util')(web3, referenceToken);
    await util.getBlock();

    const name = await referenceToken.name();
    assert.strictEqual(name, 'Reference Token');
    await util.log(`name: ${name}`);

    const symbol = await referenceToken.symbol();
    assert.strictEqual(symbol, 'XRT');
    await util.log(`symbol: ${symbol}`);

    const granularity = await referenceToken.granularity();
    assert.strictEqual(web3.utils.fromWei(granularity), '0.01');
    await util.log(`granularity: ${granularity}`);

    await util.assertTotalSupply(0);
  }).timeout(20000);

  it('should mint 10 XRT for addr 1', async () => {
    await referenceToken.ownerMint(accounts[1], web3.utils.toWei('10'), '0x', {
      gas: 300000,
      from: accounts[0],
    });
    await util.getBlock();

    await util.assertTotalSupply(10);
    await util.assertBalance(accounts[1], 10);
  }).timeout(6000);

  it('should not mint -10 XRT (negative value)', async () => {
    await referenceToken.ownerMint(accounts[1], web3.utils.toWei('-10'), '0x', {
      gas: 300000,
      from: accounts[0],
    }).should.be.rejectedWith('invalid opcode');
    await util.getBlock();

    await util.assertTotalSupply(10);
    await util.assertBalance(accounts[1], 10);
  }).timeout(6000);

  it('should let addr 1 send 3 XRT to addr 2', async () => {
    await referenceToken.send(accounts[2], web3.utils.toWei('3'), {
      gas: 300000,
      from: accounts[1],
    });
    await util.getBlock();

    await util.assertTotalSupply(10);
    await util.assertBalance(accounts[1], 7);
    await util.assertBalance(accounts[2], 3);
  }).timeout(6000);

  it('should not let addr 1 send 9 XRT (not enough funds)', async () => {
    await referenceToken.send(accounts[2], web3.utils.toWei('9'), {
      gas: 300000,
      from: accounts[1],
    }).should.be.rejectedWith('invalid opcode');

    await util.getBlock();

    await util.assertTotalSupply(10);
    await util.assertBalance(accounts[1], 7);
    await util.assertBalance(accounts[2], 3);
  });

  it('should not let addr 1 send -3 XRT (negative value)', async () => {
    await referenceToken.send(accounts[2], web3.utils.toWei('-3'), {
      gas: 300000,
      from: accounts[1],
    }).should.be.rejectedWith('invalid opcode');

    await util.getBlock();

    await util.assertTotalSupply(10);
    await util.assertBalance(accounts[1], 7);
    await util.assertBalance(accounts[2], 3);
  }).timeout(6000);

  it('should not let addr 1 send 0.007 XRT (< granulairty)', async () => {
    await referenceToken.send(accounts[2], web3.utils.toWei('0.007'), {
      gas: 300000,
      from: accounts[1],
    }).should.be.rejectedWith('invalid opcode');

    await util.getBlock();

    await util.assertTotalSupply(10);
    await util.assertBalance(accounts[1], 7);
    await util.assertBalance(accounts[2], 3);
  }).timeout(6000);

  it('should authorize addr 3 as an operator for addr 1', async () => {
    assert.isFalse(
      await referenceToken.isOperatorFor(accounts[3], accounts[1])
    );
    await referenceToken.authorizeOperator(accounts[3], {
      from: accounts[1],
      gas: 300000,
    });
    await util.getBlock();
    assert.isTrue(await referenceToken.isOperatorFor(accounts[3], accounts[1]));
  }).timeout(6000);

  it('should let addr 3 send from addr 1', async () => {
    await referenceToken.operatorSend(
      accounts[1],
      accounts[2],
      web3.utils.toWei('1.12'),
      '0x',
      '0x',
      { gas: 300000, from: accounts[3] }
    );
    await util.getBlock();

    await util.assertTotalSupply(10);
    await util.assertBalance(accounts[1], 5.88);
    await util.assertBalance(accounts[2], 4.12);
  }).timeout(6000);

  it('should revoke addr 3 as an operator for addr 1', async () => {
    assert.isTrue(await referenceToken.isOperatorFor(accounts[3], accounts[1]));
    await referenceToken.revokeOperator(accounts[3], {
      from: accounts[1],
      gas: 300000,
    });
    await util.getBlock();

    assert.isFalse(
      await referenceToken.isOperatorFor(accounts[3], accounts[1])
    );
  }).timeout(6000);

  it('should not let addr 3 send from addr 1 (not operator)', async () => {
    await referenceToken.operatorSend(
      accounts[1],
      accounts[2],
      web3.utils.toWei('3.72'),
      '0x',
      '0x',
      { gas: 300000, from: accounts[3] }
    ).should.be.rejectedWith('invalid opcode');
    await util.getBlock();

    await util.assertTotalSupply(10);
    await util.assertBalance(accounts[1], 5.88);
    await util.assertBalance(accounts[2], 4.12);
  }).timeout(6000);

  it('should burn 1.35 XRT from addr 1', async () => {
    await referenceToken.burn(accounts[1], web3.utils.toWei('1.35'), {
      from: accounts[0],
      gas: 300000,
    });
    await util.getBlock();

    await util.assertTotalSupply(8.65);
    await util.assertBalance(accounts[1], 4.53);
    await util.assertBalance(accounts[2], 4.12);
  }).timeout(6000);

  it('should not burn -3.84 XRT (negative value)', async () => {
    await referenceToken.burn(accounts[1], web3.utils.toWei('-3.84'), {
      from: accounts[0],
      gas: 300000,
    }).should.be.rejectedWith('invalid opcode');
    await util.getBlock();

    await util.assertTotalSupply(8.65);
    await util.assertBalance(accounts[1], 4.53);
    await util.assertBalance(accounts[2], 4.12);
  }).timeout(6000);
});
