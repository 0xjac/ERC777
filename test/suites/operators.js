/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();

module.exports = function suite() {
  it('operator for itself', async function() {
    assert.isTrue(await this.test.ctx.token.contract.methods.isOperatorFor(
      this.test.ctx.accounts[4], this.test.ctx.accounts[4]).call()
    );
  });

  it('cannot revoke itself', async function() {
    await this.test.ctx.token.contract.methods
      .revokeOperator(this.test.ctx.accounts[4])
      .send({ from: this.test.ctx.accounts[4] })
      .should.be.rejectedWith('revert');
  });

  it('authorize operator', async function() {
    assert.isFalse(await this.test.ctx.token.contract.methods.isOperatorFor(
      this.test.ctx.accounts[4], this.test.ctx.accounts[5]).call()
    );

    const tx = await this.test.ctx.token.contract.methods
      .authorizeOperator(this.test.ctx.accounts[4])
      .send({ from: this.test.ctx.accounts[5] });

    assert.nestedProperty(tx, 'events.AuthorizedOperator');
    assert.deepInclude(tx.events.AuthorizedOperator, { event: 'AuthorizedOperator' });
    assert.deepInclude(tx.events.AuthorizedOperator, {
      returnValues: {
        '0': this.test.ctx.accounts[4],
        '1': this.test.ctx.accounts[5],
        operator: this.test.ctx.accounts[4],
        tokenHolder: this.test.ctx.accounts[5],
      },
    });

    assert.isTrue(await this.test.ctx.token.contract.methods.isOperatorFor(
      this.test.ctx.accounts[4], this.test.ctx.accounts[5]).call()
    );
  });

  it('revoke operator', async function() {
    await this.test.ctx.token.contract.methods
      .authorizeOperator(this.test.ctx.accounts[4])
      .send({ from: this.test.ctx.accounts[5] });

    assert.isTrue(await this.test.ctx.token.contract.methods.isOperatorFor(
      this.test.ctx.accounts[4], this.test.ctx.accounts[5]).call()
    );

    const tx = await this.test.ctx.token.contract.methods
      .revokeOperator(this.test.ctx.accounts[4])
      .send({ from: this.test.ctx.accounts[5] });

    assert.nestedProperty(tx, 'events.RevokedOperator');
    assert.deepInclude(tx.events.RevokedOperator, { event: 'RevokedOperator' });
    assert.deepInclude(tx.events.RevokedOperator, {
      returnValues: {
        '0': this.test.ctx.accounts[4],
        '1': this.test.ctx.accounts[5],
        operator: this.test.ctx.accounts[4],
        tokenHolder: this.test.ctx.accounts[5],
      },
    });

    assert.isFalse(await this.test.ctx.token.contract.methods.isOperatorFor(
      this.test.ctx.accounts[4], this.test.ctx.accounts[5]).call()
    );
  });

  it('revoke a non-operator', async function() {
    assert.isFalse(await this.test.ctx.token.contract.methods.isOperatorFor(
      this.test.ctx.accounts[4], this.test.ctx.accounts[5]).call()
    );

    const tx = await this.test.ctx.token.contract.methods
      .revokeOperator(this.test.ctx.accounts[4])
      .send({ from: this.test.ctx.accounts[5] });

    assert.nestedProperty(tx, 'events.RevokedOperator');
    assert.deepInclude(tx.events.RevokedOperator, { event: 'RevokedOperator' });
    assert.deepInclude(tx.events.RevokedOperator, {
      returnValues: {
        '0': this.test.ctx.accounts[4],
        '1': this.test.ctx.accounts[5],
        operator: this.test.ctx.accounts[4],
        tokenHolder: this.test.ctx.accounts[5],
      },
    });

    assert.isFalse(await this.test.ctx.token.contract.methods.isOperatorFor(
      this.test.ctx.accounts[4], this.test.ctx.accounts[5]).call()
    );
  });

  it('default operators', async function() {
    assert.sameMembers(
      await this.test.ctx.token.contract.methods.defaultOperators().call(),
      this.test.ctx.token.defaultOperators
    );

    for (let operator of this.test.ctx.token.defaultOperators) {
      assert.isTrue(await this.test.ctx.token.contract.methods.isOperatorFor(
        operator, this.test.ctx.accounts[9]).call()
      );
    }
  });

  it('revoke default operator', async function() {
    if (this.test.ctx.token.defaultOperators.length === 0) { this.test.ctx.skipTest(); }

    assert.isTrue(await this.test.ctx.token.contract.methods.isOperatorFor(
      this.test.ctx.token.defaultOperators[0], this.test.ctx.accounts[5]).call()
    );

    const tx = await this.test.ctx.token.contract.methods
      .revokeOperator(this.test.ctx.token.defaultOperators[0])
      .send({ from: this.test.ctx.accounts[5] });

    assert.nestedProperty(tx, 'events.RevokedOperator');
    assert.deepInclude(tx.events.RevokedOperator, { event: 'RevokedOperator' });
    assert.deepInclude(tx.events.RevokedOperator, {
      returnValues: {
        '0': this.test.ctx.token.defaultOperators[0],
        '1': this.test.ctx.accounts[5],
        operator: this.test.ctx.token.defaultOperators[0],
        tokenHolder: this.test.ctx.accounts[5],
      },
    });

    assert.isFalse(await this.test.ctx.token.contract.methods.isOperatorFor(
      this.test.ctx.token.defaultOperators[0], this.test.ctx.accounts[5]).call()
    );
  });

  it('reinstate default operator', async function() {
    if (this.test.ctx.token.defaultOperators.length === 0) { this.test.ctx.skipTest(); }

    assert.isTrue(await this.test.ctx.token.contract.methods.isOperatorFor(
      this.test.ctx.token.defaultOperators[0], this.test.ctx.accounts[5]).call()
    );

    await this.test.ctx.token.contract.methods
      .revokeOperator(this.test.ctx.token.defaultOperators[0])
      .send({ from: this.test.ctx.accounts[5] });

    assert.isFalse(await this.test.ctx.token.contract.methods.isOperatorFor(
      this.test.ctx.token.defaultOperators[0], this.test.ctx.accounts[5]).call()
    );

    const tx = await this.test.ctx.token.contract.methods
      .authorizeOperator(this.test.ctx.token.defaultOperators[0])
      .send({ from: this.test.ctx.accounts[5] });

    assert.nestedProperty(tx, 'events.AuthorizedOperator');
    assert.deepInclude(tx.events.AuthorizedOperator, { event: 'AuthorizedOperator' });
    assert.deepInclude(tx.events.AuthorizedOperator, {
      returnValues: {
        '0': this.test.ctx.token.defaultOperators[0],
        '1': this.test.ctx.accounts[5],
        operator: this.test.ctx.token.defaultOperators[0],
        tokenHolder: this.test.ctx.accounts[5],
      },
    });

    assert.isTrue(await this.test.ctx.token.contract.methods.isOperatorFor(
      this.test.ctx.token.defaultOperators[0], this.test.ctx.accounts[5]).call()
    );
  });
};
