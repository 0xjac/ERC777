/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const util = require('./util');

exports.test = function() {
  it('should burn 3 XRT for addr 1', async function() {
    await util.assertBalance(this.accounts[1], 10);
    await this.referenceToken.burn(
      this.accounts[1],
      this.web3.utils.toWei('3'),
      '0x',
      '0x',
      { gas: 300000, from: this.accounts[0] }
    );

    await util.getBlock();
    await util.assertBalance(this.accounts[1], 7);
    await util.assertTotalSupply(7);
  });

  it('should not burn 8 XRT for addr 1 (not enough funds)', async function() {
    await util.assertBalance(this.accounts[1], 7);
    const tx = await this.referenceToken.burn(
      this.accounts[1],
      this.web3.utils.toWei('8'),
      '0x',
      '0x',
      { gas: 300000, from: this.accounts[0] }
    );
    assert.equal('0x00', tx.status);

    await util.getBlock();
    await util.assertBalance(this.accounts[1], 7);
    await util.assertTotalSupply(7);
  });

  it('should not let addr 1 burn -3 XRT (negative amount)', async function() {
    await util.assertBalance(this.accounts[1], 7);
    const tx = await this.referenceToken.burn(
      this.accounts[1],
      this.web3.utils.toWei('-3'),
      '0x',
      '0x',
      { gas: 300000, from: this.accounts[0] }
    );
    assert.equal('0x00', tx.status);

    await util.getBlock();

    await util.assertBalance(this.accounts[1], 7);
    await util.assertTotalSupply(7);
  }).timeout(6000);

  it('should not let addr 1 burn 0.007 XRT (< granulairty)', async function() {
    await util.assertBalance(this.accounts[1], 7);
    const tx = await this.referenceToken.burn(
      this.accounts[1],
      this.web3.utils.toWei('0.007'),
      '0x',
      '0x',
      { gas: 300000, from: this.accounts[0] }
    );
    assert.equal('0x00', tx.status);

    await util.getBlock();

    await util.assertBalance(this.accounts[1], 7);
    await util.assertTotalSupply(7);
  }).timeout(6000);
};
