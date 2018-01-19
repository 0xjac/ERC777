/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const assert = chai.assert;

module.exports = (web3, tokenContract) => {
  const blocks = [];
  let blockIdx = 0;

  return {
    log(msg) { process.env.MOCHA_VERBOSE && console.log(msg); },

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
  };
};
