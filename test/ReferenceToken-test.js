/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TestRPC = require('ethereumjs-testrpc');
const Web3 = require('web3');
const chai = require('chai');
const EIP820Registry = require('eip820');
const ReferenceToken = require('../build/contracts').ReferenceToken;
const ExampleTokenRecipient = require('../build/contracts').ExampleTokenRecipient;
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();

describe('EIP777 Reference Token Test', () => {
  let testrpc;
  let web3;
  let accounts;
  let referenceToken;
  let exampleTokenRecipient;
  let eip820Registry;
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

    eip820Registry = await EIP820Registry.deploy(web3, accounts[0]);
    assert.ok(eip820Registry.$address);
  });

  after(async () => testrpc.close());

  it('should deploy the reference token contract', async () => {
    referenceToken = await ReferenceToken.new(
      web3,
      'Reference Token',
      'XRT',
      web3.utils.toWei('0.01'),
    );
    assert.ok(referenceToken.$address);

    util = require('./util')(web3, referenceToken);
    await util.getBlock();

    const name = await referenceToken.name();
    console.log(name);
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
    await referenceToken.mint(accounts[1], web3.utils.toWei('10'), '0x', {
      gas: 300000,
      from: accounts[0],
    });
    await util.getBlock();

    await util.assertTotalSupply(10);
    await util.assertBalance(accounts[1], 10);
  }).timeout(6000);

  it('should not mint -10 XRT (negative amount)', async () => {
    await referenceToken.mint(accounts[1], web3.utils.toWei('-10'), '0x', {
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

  it('should not let addr 1 send -3 XRT (negative amount)', async () => {
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
    await referenceToken.burn(
      accounts[1], web3.utils.toWei('1.35'), '0x', '0x',
      { from: accounts[0], gas: 300000 }
    );
    await util.getBlock();

    await util.assertTotalSupply(8.65);
    await util.assertBalance(accounts[1], 4.53);
    await util.assertBalance(accounts[2], 4.12);
  }).timeout(6000);

  it('should not burn -3.84 XRT (negative amount)', async () => {
    await referenceToken.burn(
      accounts[1], web3.utils.toWei('-3.84'), '0x', '0x',
      { from: accounts[0], gas: 300000 }
    ).should.be.rejectedWith('invalid opcode');
    await util.getBlock();

    await util.assertTotalSupply(8.65);
    await util.assertBalance(accounts[1], 4.53);
    await util.assertBalance(accounts[2], 4.12);
  }).timeout(6000);

  it('should send tokens to contract which is registerd as ITokenRecipient', async () => {
    exampleTokenRecipient = await ExampleTokenRecipient.new(web3, true, false);
    assert.ok(exampleTokenRecipient.$address);

    await referenceToken.send(exampleTokenRecipient.$address, web3.utils.toWei('3'), {
      gas: 300000,
      from: accounts[1],
    });

    await util.getBlock();

    await util.assertTotalSupply(8.65);
    await util.assertBalance(accounts[1], 1.53);
    await util.assertBalance(exampleTokenRecipient.$address, 3);
  }).timeout(6000);

  it('should not send tokens to contract which is not registerd as ITokenRecipient', async () => {
    exampleTokenRecipient = await ExampleTokenRecipient.new(web3, false, false);
    assert.ok(exampleTokenRecipient.$address);

    await referenceToken.send(exampleTokenRecipient.$address, web3.utils.toWei('3'), {
      gas: 300000,
      from: accounts[1],
    }).should.be.rejectedWith('invalid opcode');

    await util.getBlock();

    await util.assertTotalSupply(8.65);
    await util.assertBalance(accounts[1], 1.53);
    await util.assertBalance(exampleTokenRecipient.$address, 0);
  }).timeout(6000);

  it('should not send tokens to address which prevent token received via erc777_tokenHolder', async () => {
    exampleTokenRecipient = await ExampleTokenRecipient.new(web3, true, true);
    assert.ok(exampleTokenRecipient.$address);

    const iHash = await eip820Registry.interfaceHash('erc777_tokenHolder');
    await eip820Registry.setInterfaceImplementer(accounts[3], iHash, exampleTokenRecipient.$address, {
      gas: 300000,
      from: accounts[3],
    });

    await referenceToken.send(accounts[3], web3.utils.toWei('3'), {
      gas: 300000,
      from: accounts[1],
    }).should.be.rejectedWith('invalid opcode');

    await util.getBlock();

    await util.assertTotalSupply(8.65);
    await util.assertBalance(accounts[1], 1.53);
    await util.assertBalance(accounts[3], 0);
  }).timeout(6000);

  it('ERC20 compatibility: should return 18 for decimals', async () => {
    const decimals = await referenceToken.decimals();
    assert.strictEqual(decimals, '18');
    await util.log(`decimals: ${decimals}`);
  }).timeout(6000);

  it('ERC20 compatibility: should let addr 2 send 3 XRT to addr 1', async () => {
    await referenceToken.transfer(accounts[1], web3.utils.toWei('3'), {
      gas: 300000,
      from: accounts[2],
    });

    await util.getBlock();

    await util.assertTotalSupply(8.65);
    await util.assertBalance(accounts[1], 4.53);
    await util.assertBalance(accounts[2], 1.12);
  }).timeout(6000);

  it('ERC20 compatibility: should approve addr 3 to send XRT from addr 1', async () => {
    await referenceToken.approve(accounts[3], web3.utils.toWei('3.5'), {
      gas: 300000,
      from: accounts[1],
    });

    await util.getBlock();

    const allowance = await referenceToken.allowance(accounts[1], accounts[3]);
    assert.strictEqual(allowance, web3.utils.toWei('3.5'));
    await util.log(`allowance: ${allowance}`);
  }).timeout(6000);

  it('ERC20 compatibility: should let addr 3 send 3 XRT from addr 1', async () => {
    await referenceToken.transferFrom(accounts[1], accounts[2], web3.utils.toWei('3'), {
      gas: 300000,
      from: accounts[3],
    });

    await util.getBlock();

    await util.assertTotalSupply(8.65);
    await util.assertBalance(accounts[1], 1.53);
    await util.assertBalance(accounts[2], 4.12);
  }).timeout(6000);

  it('ERC20 compatibility: should let not addr 3 send one more XRT from addr 1', async () => {
    await referenceToken.transferFrom(accounts[1], accounts[2], web3.utils.toWei('1'), {
      gas: 300000,
      from: accounts[3],
    }).should.be.rejectedWith('invalid opcode');

    await util.getBlock();

    await util.assertTotalSupply(8.65);
    await util.assertBalance(accounts[1], 1.53);
    await util.assertBalance(accounts[2], 4.12);
  }).timeout(6000);

  it('ERC20 compatibility: should disable ERC20 compatibility', async () => {
    await referenceToken.disableERC20({
      gas: 300000,
      from: accounts[0],
    });
  }).timeout(6000);

  it('ERC20 compatibility: should not return 18 for decimals', async () => {
    await referenceToken.decimals().should.be.rejectedWith('invalid opcode');
    await util.log('decimals() rejected with invalid opcode');
  }).timeout(6000);

  it('ERC20 compatibility: should not let addr 2 send 3 XRT to addr 1', async () => {
    await referenceToken.transfer(accounts[1], web3.utils.toWei('3'), {
      gas: 300000,
      from: accounts[2],
    }).should.be.rejectedWith('invalid opcode');

    await util.getBlock();

    await util.assertTotalSupply(8.65);
    await util.assertBalance(accounts[1], 1.53);
    await util.assertBalance(accounts[2], 4.12);
  }).timeout(6000);

  it('ERC20 compatibility: should not approve addr 3 to send XRT from addr 1', async () => {
    await referenceToken.approve(accounts[3], web3.utils.toWei('3.5'), {
      gas: 300000,
      from: accounts[1],
    }).should.be.rejectedWith('invalid opcode');

    await util.log('approve() rejected with invalid opcode');
  }).timeout(6000);

  it('ERC20 compatibility: should not let addr 3 send 1 XRT from addr 1', async () => {
    await referenceToken.transferFrom(accounts[1], accounts[2], web3.utils.toWei('0.5'), {
      gas: 300000,
      from: accounts[3],
    }).should.be.rejectedWith('invalid opcode');

    await util.getBlock();

    await util.assertTotalSupply(8.65);
    await util.assertBalance(accounts[1], 1.53);
    await util.assertBalance(accounts[2], 4.12);
  }).timeout(6000);

  it('ERC20 compatibility: should enable ERC20 compatibility again', async () => {
    await referenceToken.enableERC20({
      gas: 300000,
      from: accounts[0],
    });

    const decimals = await referenceToken.decimals();
    assert.strictEqual(decimals, '18');
    await util.log(`decimals: ${decimals}`);
  }).timeout(6000);
});
