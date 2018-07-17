/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
const ERC820Registry = artifacts.require('ERC820Registry');
const testAccounts = [
  '0x093d49D617a10F26915553255Ec3FEE532d2C12F',
  '0x1dc728786E09F862E39Be1f39dD218EE37feB68D',
  '0x2eeDf8a799B73BC02E4664183eB72422C377153B',
  '0x3bF958Fa0626e898F548a8F95Cf9AB3A4Db65169',
  '0x4bd1280852Cadb002734647305AFC1db7ddD6Acb',
  '0x5cE162cFa6208d7c50A7cB3525AC126155e7bCe4',
  '0x6b09D6433a379752157fD1a9E537c5CAe5fa3168',
  '0x7dc0a40D64d72bb4590652B8f5C687bF7F26400c',
  '0x8dF64de79608F0aE9e72ECAe3A400582AeD8101C',
  '0x9a5279029e9A2D6E787c5A09CB068AB3D45e209d'
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
