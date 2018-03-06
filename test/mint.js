/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const util = require('./util');

exports.test = function() {
  it('should mint 10 XRT for addr 1', async function() {
    await this.referenceToken.mint(
      this.accounts[1],
      this.web3.utils.toWei('10'),
      '0x',
      { gas: 300000, from: this.accounts[0] }
    );
    await util.getBlock();

    await util.assertTotalSupply(10);
    await util.assertBalance(this.accounts[1], 10);
  }).timeout(6000);

  it('should not mint -10 XRT (negative amount)', async function() {
    const tx = await this.referenceToken.mint(
      this.accounts[1],
      this.web3.utils.toWei('-10'),
      '0x',
      { gas: 300000, from: this.accounts[0] }
    );
    assert.equal('0x00', tx.status);
    await util.getBlock();

    await util.assertTotalSupply(10);
    await util.assertBalance(this.accounts[1], 10);
  }).timeout(6000);
};
