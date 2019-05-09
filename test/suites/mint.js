/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();

module.exports = function suite() {
  it('mint', async function() {
    const balanceBefore = this.test.ctx.web3.utils.fromWei(
      await this.test.ctx.token.contract.methods.balanceOf(this.test.ctx.mint.holder).call()
    );

    const tx = await this.test.ctx.mint.method.apply(this);

    assert.nestedProperty(tx, 'events.Minted');
    assert.deepInclude(tx.events.Minted, { event: 'Minted' });
    assert.deepInclude(tx.events.Minted, {
      returnValues: {
        '0': this.test.ctx.mint.operator,
        '1': this.test.ctx.mint.holder,
        '2': this.test.ctx.web3.utils.toWei(this.test.ctx.mint.amount, 'ether'),
        '3': null,
        '4': null,
        operator: this.test.ctx.mint.operator,
        to: this.test.ctx.mint.holder,
        amount: this.test.ctx.web3.utils.toWei(this.test.ctx.mint.amount, 'ether'),
        data: null,
        operatorData: null,
      },
    });

    const expectedBalance = [balanceBefore, this.test.ctx.mint.amount]
      .map(val => parseInt(this.test.ctx.web3.utils.toWei(val, 'ether')))
      .reduce((acc, current) => acc + current, 0)
      .toString();

    assert.equal(
      this.test.ctx.web3.utils.fromWei(expectedBalance, 'ether'),
      this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(this.test.ctx.mint.holder).call())
    );
  });

  it('mint 0 tokens', async function() {
    const balanceBefore = this.test.ctx.web3.utils.fromWei(
      await this.test.ctx.token.contract.methods.balanceOf(this.test.ctx.mint.holder).call()
    );

    const tx = await this.test.ctx.mint.method.apply(this, [{ amount: '0' }]);

    assert.nestedProperty(tx, 'events.Minted');
    assert.deepInclude(tx.events.Minted, { event: 'Minted' });
    assert.deepInclude(tx.events.Minted, {
      returnValues: {
        '0': this.test.ctx.mint.operator,
        '1': this.test.ctx.mint.holder,
        '2': this.test.ctx.web3.utils.toWei('0', 'ether'),
        '3': null,
        '4': null,
        operator: this.test.ctx.mint.operator,
        to: this.test.ctx.mint.holder,
        amount: this.test.ctx.web3.utils.toWei('0', 'ether'),
        data: null,
        operatorData: null,
      },
    });

    assert.equal(
      balanceBefore,
      this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(this.test.ctx.mint.holder).call())
    );
  });

  xit('mint (ERC20)', async function() {
    if (!this.test.ctx.erc20) { this.test.ctx.skip.apply(this); }

    const balanceBefore = this.test.ctx.web3.utils.fromWei(
      await this.test.ctx.token.contract.methods.balanceOf(this.test.ctx.mint.holder).call()
    );

    const tx = await this.test.ctx.mint.method.apply(this);

    assert.nestedProperty(tx, 'events.Minted');
    assert.deepInclude(tx.events.Minted, { event: 'Minted' });
    assert.deepInclude(tx.events.Minted, {
      returnValues: {
        '0': this.test.ctx.mint.operator,
        '1': this.test.ctx.mint.holder,
        '2': this.test.ctx.web3.utils.toWei(this.test.ctx.mint.amount, 'ether'),
        '3': null,
        '4': null,
        operator: this.test.ctx.mint.operator,
        to: this.test.ctx.mint.holder,
        amount: this.test.ctx.web3.utils.toWei(this.test.ctx.mint.amount, 'ether'),
        data: null,
        operatorData: null,
      },
    });

    let transferPresent = false;
    try {
      assert.nestedProperty(tx, 'events.Transfer', 'No ERC20 Transfer event for minting');
      assert.deepInclude(tx.events.Transfer, { event: 'Transfer' }, 'No ERC20 Transfer event for minting');
      transferPresent = true;
    } catch (err) {
      console.warn(err.message);
    } finally {
      if (transferPresent) {
        assert.deepInclude(tx.events.Transfer, {
          returnValues: {
            '0': '0x0000000000000000000000000000000000000000',
            '1': this.test.ctx.mint.holder,
            '2': this.test.ctx.web3.utils.toWei(this.test.ctx.mint.amount, 'ether'),
            _from: this.test.ctx.mint.operator,
            _to: this.test.ctx.mint.holder,
            _value: this.test.ctx.web3.utils.toWei(this.test.ctx.mint.amount, 'ether'),
          },
        });
      }
    }

    const expectedBalance = [balanceBefore, this.test.ctx.mint.amount]
      .map(val => parseInt(this.test.ctx.web3.utils.toWei(val, 'ether')))
      .reduce((acc, current) => acc + current, 0)
      .toString();

    assert.equal(
      this.test.ctx.web3.utils.fromWei(expectedBalance, 'ether'),
      this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(this.test.ctx.mint.holder).call())
    );
  });

  const inputs = [
    { parameters: { amount: '-3.2' }, reason: '(negative amount)' },
    { parameters: { amount: '0.007' }, reason: '(less than granularity)' },
    { parameters: { holder: '0x0000000000000000000000000000000000000000' }, reason: '(recipient is 0x0)' },
  ];

  for (let input of inputs) {
    it(`not mint ${input.reason}`, async function() {
      const balanceBefore = this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(this.test.ctx.mint.holder).call()
      );

      await this.test.ctx.mint.method.apply(this, [input.parameters]).should.be.rejectedWith('revert');

      assert.equal(
        balanceBefore,
        this.test.ctx.web3.utils.fromWei(
          await this.test.ctx.token.contract.methods.balanceOf(this.test.ctx.mint.holder).call())
      );
    });
  }
};
