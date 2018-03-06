/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const util = require('./util');

exports.test = function() {
  it('should disable ERC20 compatibility', async function() {
    let erc20Hash = await this.erc820Registry.interfaceHash('ERC20Token');
    let erc20Addr = await this.erc820Registry.getInterfaceImplementer(
      this.referenceToken.$address, erc20Hash);

    assert.strictEqual(erc20Addr, this.referenceToken.$address);

    await this.referenceToken.disableERC20(
      { gas: 300000, from: this.accounts[0] }
    );

    await util.getBlock();

    erc20Addr = await this.erc820Registry.getInterfaceImplementer(
      this.referenceToken.$address, erc20Hash);

    assert.strictEqual(erc20Addr, '0x0000000000000000000000000000000000000000');
  }).timeout(6000);

  it('should not return 18 for decimals', async function() {
    await this.referenceToken.decimals(
    ).should.be.rejectedWith('Invalid JSON RPC response');
    await util.log('decimals() rejected with invalid opcode');
  }).timeout(6000);

  it('should not let addr 2 transfer 3 XRT to addr 1', async function() {
    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 1.38);
    await util.assertBalance(this.accounts[2], 5.62);

    const tx = await this.referenceToken.transfer(
      this.accounts[1],
      this.web3.utils.toWei('3'),
      { gas: 300000, from: this.accounts[2] }
    );
    assert.equal('0x00', tx.status);

    await util.getBlock();

    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 1.38);
    await util.assertBalance(this.accounts[2], 5.62);
  }).timeout(6000);

  it('should not approve addr 3 to transfer from addr 1', async function() {
    await this.referenceToken.allowance(this.accounts[1], this.accounts[3]
    ).should.be.rejectedWith('Invalid JSON RPC response');

    const tx = await this.referenceToken.approve(
      this.accounts[3],
      this.web3.utils.toWei('3.5'),
      { gas: 300000, from: this.accounts[1] }
    );
    assert.equal('0x00', tx.status);

    await this.referenceToken.allowance(this.accounts[1], this.accounts[3]
    ).should.be.rejectedWith('Invalid JSON RPC response');
  }).timeout(6000);

  it('should not let addr 3 send 1 XRT from addr 1', async function() {
    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 1.38);
    await util.assertBalance(this.accounts[2], 5.62);

    const tx = await this.referenceToken.transferFrom(
      this.accounts[1],
      this.accounts[2],
      this.web3.utils.toWei('0.5'),
      { gas: 300000, from: this.accounts[3] }
    );
    assert.equal('0x00', tx.status);

    await util.getBlock();

    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 1.38);
    await util.assertBalance(this.accounts[2], 5.62);
  }).timeout(6000);

  it('should enable ERC20 compatibility', async function() {
    let erc20Hash = await this.erc820Registry.interfaceHash('ERC20Token');
    let erc20Addr = await this.erc820Registry.getInterfaceImplementer(
      this.referenceToken.$address, erc20Hash);

    assert.strictEqual(erc20Addr, '0x0000000000000000000000000000000000000000');

    await this.referenceToken.enableERC20(
      { gas: 300000, from: this.accounts[0] }
    );

    await util.getBlock();

    erc20Addr = await this.erc820Registry.getInterfaceImplementer(
      this.referenceToken.$address, erc20Hash);

    assert.strictEqual(erc20Addr, this.referenceToken.$address);
  }).timeout(6000);
};
