/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const ganache = require('ganache-cli');
const Web3 = require('web3');
const chai = require('chai');
const assert = chai.assert;
const EIP820Registry = require('eip820');

let log = (msg) => process.env.MOCHA_VERBOSE && console.log(msg);

const blocks = [];
let blockIdx = 0;
let server;
let web3;
let accounts;
let erc820Registry;
let tokenContract;

module.exports = {
  log,
  async setupGanache(host, port) {
    server = ganache.server( // eslint-disable-next-line camelcase
      { ws: true, gasLimit: 5800000, total_accounts: 10 }
    );
    server.listen(port, host);
    web3 = new Web3(`ws://${host}:${port}`);
    log(`Ganache listening on ${host}:${port}`);
    accounts = await web3.eth.getAccounts();

    erc820Registry = await EIP820Registry.deploy(web3, accounts[0]);
    assert.ok(erc820Registry.$address);

    return {
      server,
      web3,
      accounts,
      erc820Registry,
    };
  },

  async getBlock() {
    blocks[blockIdx] = await web3.eth.getBlockNumber();
    this.log(`block ${blockIdx} -> ${blocks[blockIdx]}`);
    blockIdx++;
  },

  async assertTotalSupply(expected) {
    const totalSupply = await tokenContract.totalSupply();
    assert.equal(web3.utils.fromWei(totalSupply), expected);
    this.log(`totalSupply: ${web3.utils.fromWei(totalSupply)}`);
  },

  async assertBalance(account, expected) {
    const balance = await tokenContract.balanceOf(account);
    assert.equal(web3.utils.fromWei(balance), expected);
    this.log(`balance[${account}]: ${web3.utils.fromWei(balance)}`);
  },
  setTokenContract(newTokenContract) { tokenContract = newTokenContract; },
};
