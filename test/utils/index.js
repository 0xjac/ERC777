/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
const ERC820Registry = artifacts.require('ERC820Registry');

let log = (msg) => process.env.MOCHA_VERBOSE && console.log(msg);

const blocks = [];
let blockIdx = 0;

module.exports = {
  log,
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
