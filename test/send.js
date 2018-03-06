/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const util = require('./util');

exports.test = function() {
  it('should let addr 1 send 3 XRT to addr 2', async function() {
    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 7);
    await util.assertBalance(this.accounts[2], 0);

    await this.referenceToken.send(
      this.accounts[2],
      this.web3.utils.toWei('3'),
      { gas: 300000, from: this.accounts[1] }
    );
    await util.getBlock();

    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 4);
    await util.assertBalance(this.accounts[2], 3);
  }).timeout(6000);

  it('should not let addr 1 send 8 XRT (not enough funds)', async function() {
    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 4);
    await util.assertBalance(this.accounts[2], 3);

    const tx = await this.referenceToken.send(
      this.accounts[2],
      this.web3.utils.toWei('8'),
      { gas: 300000, from: this.accounts[1] }
    );
    assert.equal('0x00', tx.status);

    await util.getBlock();

    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 4);
    await util.assertBalance(this.accounts[2], 3);
  });

  it('should not let addr 1 send -3 XRT (negative amount)', async function() {
    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 4);
    await util.assertBalance(this.accounts[2], 3);

    const tx = await this.referenceToken.send(
      this.accounts[2],
      this.web3.utils.toWei('-3'),
      { gas: 300000, from: this.accounts[1] }
    );
    assert.equal('0x00', tx.status);

    await util.getBlock();

    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 4);
    await util.assertBalance(this.accounts[2], 3);
  }).timeout(6000);

  it('should not let addr 1 send 0.007 XRT (< granulairty)', async function() {
    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 4);
    await util.assertBalance(this.accounts[2], 3);

    const tx = await this.referenceToken.send(
      this.accounts[2],
      this.web3.utils.toWei('0.007'),
      { gas: 300000, from: this.accounts[1] }
    );
    assert.equal('0x00', tx.status);

    await util.getBlock();

    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 4);
    await util.assertBalance(this.accounts[2], 3);
  }).timeout(6000);
};
