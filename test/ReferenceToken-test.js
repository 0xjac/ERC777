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
const { utils } = Web3;
const log = (msg) => { if (process.env.MOCHA_VERBOSE) console.log(msg); };
const blocks = [];

describe('EIP777 Reference Token Test', () => {
  let testrpc;
  let web3;
  let accounts;
  let referenceToken;
  let tokenableContractsRegistry;
  let interfaceImplementationRegistry;

  before(async () => {
    testrpc = TestRPC.server({
      ws: true,
      gasLimit: 5800000,
      total_accounts: 10,
    });
    testrpc.listen(8546, '127.0.0.1');

    web3 = new Web3('ws://localhost:8546');
    accounts = await web3.eth.getAccounts();

    interfaceImplementationRegistry = await EIP820.deploy(web3, accounts[0]);
    assert.ok(interfaceImplementationRegistry.$address);
  });

  after(async () => await testrpc.close());

  it('should deploy the reference token contract', async () => {

    tokenableContractsRegistry = await TokenableContractsRegistry.new(web3);
    assert.ok(tokenableContractsRegistry.$address);

    referenceToken = await ReferenceToken.new(web3,
      'Reference Token', 'XRT', tokenableContractsRegistry.$address);
    assert.ok(referenceToken.$address);

    const name = await referenceToken.name();
    assert.strictEqual(name, 'Reference Token');
    log(`name: ${name}`);

    const symbol = await referenceToken.symbol();
    assert.strictEqual(symbol, 'XRT');
    log(`symbol: ${symbol}`);

    const decimals = await referenceToken.decimals();
    assert.strictEqual(decimals, '18');
    log(`decimals: ${decimals}`);

    const totalSupply = await referenceToken.totalSupply();
    assert.strictEqual(totalSupply, '0');
    log(`totalSupply: ${totalSupply}`);
  }).timeout(20000);

  it('should mint 10 tokens for address 1', async () => {
    blocks[0] = await web3.eth.getBlockNumber();
    log(`block 0 -> ${blocks[0]}`);

    await referenceToken.ownerMint(accounts[1], 10, '0x', {
      gas: 300000,
      from: accounts[0]
    });

    blocks[1] = await web3.eth.getBlockNumber();
    log(`block 1 -> ${blocks[1]}`);

    const totalSupply = await referenceToken.totalSupply();
    assert.equal(totalSupply, 10);
    log(`totalSupply: ${totalSupply}`);

    const balance = await referenceToken.balanceOf(accounts[1]);
    assert.equal(balance, 10);
    log(`balance[${accounts[1]}]: ${balance}`);
  }).timeout(6000);
});
