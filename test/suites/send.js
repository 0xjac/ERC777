/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();

module.exports = function suite() {
  const sendInputs = [
    { from: 7, to: 8, amount: '3.6', data: null, reason: 'without data' },
    { from: 7, to: 8, amount: '0', data: '0xcafe', reason: 'with data' },
    { from: 7, to: 8, amount: '0', data: null, reason: '0 tokens' },
  ];

  for (let input of sendInputs) {
    it(`send (${input.reason})`, async function() {
      input.from = this.test.ctx.accounts[input.from];
      input.to = this.test.ctx.accounts[input.to];
      const expectedBalanceFrom = this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(input.from).call(), 'ether'
      );
      await this.test.ctx.mint.method.apply(this, [{ amount: input.amount, holder: input.from }]);

      const balanceTo = this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(input.to).call(), 'ether'
      );

      const tx = await this.test.ctx.token.contract.methods
        .send(input.to, this.test.ctx.web3.utils.toWei(input.amount, 'ether'), input.data === null ? '0x' : input.data)
        .send({ from: input.from });

      assert.nestedProperty(tx, 'events.Sent');
      assert.deepInclude(tx.events.Sent, { event: 'Sent' });
      assert.deepInclude(tx.events.Sent, {
        returnValues: {
          '0': input.from,
          '1': input.from,
          '2': input.to,
          '3': this.test.ctx.web3.utils.toWei(input.amount, 'ether'),
          '4': input.data,
          '5': null,
          operator: input.from,
          from: input.from,
          to: input.to,
          amount: this.test.ctx.web3.utils.toWei(input.amount, 'ether'),
          data: input.data,
          operatorData: null,
        },
      });

      const expectedBalanceTo = [balanceTo, input.amount]
        .map(val => parseInt(this.test.ctx.web3.utils.toWei(val, 'ether')))
        .reduce((acc, current) => acc + current, 0)
        .toString();

      assert.equal(
        this.test.ctx.web3.utils.fromWei(expectedBalanceFrom, 'ether'),
        this.test.ctx.web3.utils.fromWei(
          await this.test.ctx.token.contract.methods.balanceOf(input.from).call(), 'ether')
      );

      assert.equal(
        this.test.ctx.web3.utils.fromWei(expectedBalanceTo, 'ether'),
        this.test.ctx.web3.utils.fromWei(
          await this.test.ctx.token.contract.methods.balanceOf(input.to).call(), 'ether')
      );
    });
  }

  const notSendInput = [
    { from: 7, to: 8, mintAmount: '5', amount: '-4.7', data: null, reason: 'negative amount' },
    { from: 7, to: 8, mintAmount: '5', amount: '6.8', data: null, reason: 'insufficient funds' },
    { from: 7, to: 8, mintAmount: '5', amount: '2.789', data: null, reason: 'granularity' },
    { from: 7, to: null, mintAmount: '5', amount: '2.4', data: null, reason: 'recipient is 0x0' },
  ];

  for (let input of notSendInput) {
    it(`prevent send (${input.reason})`, async function() {
      input.from = this.test.ctx.accounts[input.from];
      input.to = input.to === null ? '0x0000000000000000000000000000000000000000' : this.test.ctx.accounts[input.to];

      await this.test.ctx.mint.method.apply(this, [{ amount: input.mintAmount, holder: input.from }]);

      const balanceFrom = this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(input.from).call(), 'ether'
      );
      const balanceTo = this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(input.to).call(), 'ether'
      );

      await this.test.ctx.token.contract.methods
        .send(input.to, this.test.ctx.web3.utils.toWei(input.amount, 'ether'), input.data === null ? '0x' : input.data)
        .send({ from: input.from })
        .should.be.rejectedWith('revert');

      assert.equal(
        balanceFrom,
        this.test.ctx.web3.utils.fromWei(
          await this.test.ctx.token.contract.methods.balanceOf(input.from).call(), 'ether')
      );
      assert.equal(
        balanceTo,
        this.test.ctx.web3.utils.fromWei(
          await this.test.ctx.token.contract.methods.balanceOf(input.to).call(), 'ether')
      );
    });
  }
  xit('send (ERC20)');
};
