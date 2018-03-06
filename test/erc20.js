/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const util = require('./util');

exports.test = function() {
  it('should register the "ERC20Token" interface', async function() {
    let erc20Hash = await this.erc820Registry.interfaceHash('ERC20Token');
    let erc20Addr = await this.erc820Registry.getInterfaceImplementer(
      this.referenceToken.$address, erc20Hash);

    assert.strictEqual(erc20Addr, this.referenceToken.$address);
  });

  it('should return 18 for decimals', async function() {
    const decimals = await this.referenceToken.decimals();
    assert.strictEqual(decimals, '18');
    await util.log(`decimals: ${decimals}`);
  }).timeout(6000);

  it('should let addr 2 transfer 1.5 XRT to addr 1', async function() {
    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 2.88);
    await util.assertBalance(this.accounts[2], 4.12);

    await this.referenceToken.transfer(
      this.accounts[1], this.web3.utils.toWei('1.5'),
      { gas: 300000, from: this.accounts[2] }
    );

    await util.getBlock();

    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 4.38);
    await util.assertBalance(this.accounts[2], 2.62);
  }).timeout(6000);

  it('should approve addr 3 to send 3.5 XRT from addr 1', async function() {
    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 4.38);
    await util.assertBalance(this.accounts[2], 2.62);

    await this.referenceToken.approve(
      this.accounts[3],
      this.web3.utils.toWei('3.5'),
      { gas: 300000, from: this.accounts[1] }
    );

    await util.getBlock();

    const allowance = await this.referenceToken.allowance(
      this.accounts[1], this.accounts[3]);
    assert.strictEqual(allowance, this.web3.utils.toWei('3.5'));
    await util.log(`allowance: ${allowance}`);

    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 4.38);
    await util.assertBalance(this.accounts[2], 2.62);
  }).timeout(6000);

  it('should let addr 3 transfer 3 XRT from addr 1', async function() {
    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 4.38);
    await util.assertBalance(this.accounts[2], 2.62);

    await this.referenceToken.transferFrom(
      this.accounts[1],
      this.accounts[2],
      this.web3.utils.toWei('3'),
      { gas: 300000, from: this.accounts[3] }
    );

    await util.getBlock();

    const allowance = await this.referenceToken.allowance(
      this.accounts[1], this.accounts[3]);
    assert.strictEqual(this.web3.utils.fromWei(allowance), '0.5');
    await util.log(`allowance: ${allowance}`);

    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 1.38);
    await util.assertBalance(this.accounts[2], 5.62);
  }).timeout(6000);

  it('should not let addr 3 transfer from addr 1 (not enough funds)',
    async function() {
      await util.assertTotalSupply(7);
      await util.assertBalance(this.accounts[1], 1.38);
      await util.assertBalance(this.accounts[2], 5.62);

      const tx = await this.referenceToken.transferFrom(
        this.accounts[1],
        this.accounts[2],
        this.web3.utils.toWei('1'),
        { gas: 300000, from: this.accounts[3] }
      );
      assert.equal('0x00', tx.status);

      await util.getBlock();

      await util.assertTotalSupply(7);
      await util.assertBalance(this.accounts[1], 1.38);
      await util.assertBalance(this.accounts[2], 5.62);
    }
  ).timeout(6000);
};
