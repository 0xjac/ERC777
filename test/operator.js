/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const util = require('./util');

exports.test = function() {
  it('should detect addr 3 is not an operator for addr 1', async function() {
    assert.isFalse(await this.referenceToken
      .isOperatorFor(this.accounts[3], this.accounts[1])
    );
  }).timeout(6000);

  it('should authorize addr 3 as an operator for addr 1', async function() {
    await this.referenceToken.authorizeOperator(
      this.accounts[3],
      { from: this.accounts[1], gas: 300000 }
    );
  }).timeout(6000);

  it('should indicate that addr 3 is an operator for addr 1', async function() {
    await util.getBlock();
    assert.isTrue(await this.referenceToken
      .isOperatorFor(this.accounts[3], this.accounts[1])
    );
  });

  it('should let addr 3 send 1.12 XRT from addr 1 to addr 2', async function() {
    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 4);
    await util.assertBalance(this.accounts[2], 3);

    await this.referenceToken.operatorSend(
      this.accounts[1],
      this.accounts[2],
      this.web3.utils.toWei('1.12'),
      '0x',
      '0x',
      { gas: 300000, from: this.accounts[3] }
    );
    await util.getBlock();

    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 2.88);
    await util.assertBalance(this.accounts[2], 4.12);
  }).timeout(6000);

  it('should revoke addr 3 as an operator for addr 1', async function() {
    assert.isTrue(await this.referenceToken
      .isOperatorFor(this.accounts[3], this.accounts[1])
    );

    await this.referenceToken.revokeOperator(this.accounts[3],
      { from: this.accounts[1], gas: 300000 }
    );
    await util.getBlock();

    assert.isFalse(await this.referenceToken
      .isOperatorFor(this.accounts[3], this.accounts[1])
    );
  }).timeout(6000);

  it('should not let addr 3 send from addr 1 (not operator)', async function() {
    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 2.88);
    await util.assertBalance(this.accounts[2], 4.12);

    const tx = await this.referenceToken.operatorSend(
      this.accounts[1],
      this.accounts[2],
      this.web3.utils.toWei('3.72'),
      '0x',
      '0x',
      { gas: 300000, from: this.accounts[3] }
    );
    assert.equal('0x00', tx.status);

    await util.getBlock();

    await util.assertTotalSupply(7);
    await util.assertBalance(this.accounts[1], 2.88);
    await util.assertBalance(this.accounts[2], 4.12);
  }).timeout(6000);
};
