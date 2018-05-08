/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
const ERC820Registry = artifacts.require('ERC820Registry');
const testAccounts = [
  '0x093d49d617a10f26915553255ec3fee532d2c12f',
  '0x1dc728786e09f862e39be1f39dd218ee37feb68d',
  '0x2eedf8a799b73bc02e4664183eb72422c377153b',
  '0x3bf958fa0626e898f548a8f95cf9ab3a4db65169',
  '0x4bd1280852cadb002734647305afc1db7ddd6acb',
  '0x5ce162cfa6208d7c50a7cb3525ac126155e7bce4',
  '0x6b09d6433a379752157fd1a9e537c5cae5fa3168',
  '0x7dc0a40d64d72bb4590652b8f5c687bf7f26400c',
  '0x8df64de79608f0ae9e72ecae3a400582aed8101c',
  '0x9a5279029e9a2d6e787c5a09cb068ab3d45e209d',
];
const blocks = [];
let blockIdx = 0;

let log = (msg) => process.env.MOCHA_VERBOSE && console.log(msg);

module.exports = {
  log,

  formatAccount(account) {
    if (testAccounts.includes(account)) { return `${account.slice(0, 4)}...`; }
    return account.slice(0, 8);
  },

  async getBlock(web3) {
    blocks[blockIdx] = await web3.eth.getBlockNumber();
    this.log(`block ${blockIdx} -> ${blocks[blockIdx]}`);
    blockIdx++;
  },

  async assertTotalSupply(web3, token, expected) {
    const totalSupply = (
      await token.contract.methods.totalSupply().call()).toString();
    assert.equal(web3.utils.fromWei(totalSupply), expected);
    this.log(`totalSupply: ${web3.utils.fromWei(totalSupply)}`);
  },

  async assertBalance(web3, token, account, expected) {
    const balance = (
      await token.contract.methods.balanceOf(account).call()).toString();
    assert.equal(web3.utils.fromWei(balance), expected);
    this.log(`balance[${account}]: ${web3.utils.fromWei(balance)}`);
  },

  getERC820Registry(web3) {
    return new web3.eth.Contract(
      ERC820Registry.abi,
      '0x991a1bcb077599290d7305493c9a630c20f8b798'
    );
  },

  async mintForAllAccounts(web3, accounts, token, operator, amount, gas) {
    const mintBatch = new web3.BatchRequest();
    for (let account of accounts) {
      mintBatch.add(
        token.genMintTxForAccount(account, amount, accounts[0], gas)
      );
    }
    await mintBatch.execute();
  },
};
