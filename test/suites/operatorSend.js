/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();

module.exports = function suite() {
  const sendInputs = [
    {
      operator: function() { return this.test.ctx.accounts[7]; },
      from: function() { return this.test.ctx.accounts[7]; },
      to: function() { return this.test.ctx.accounts[8]; },
      amount: '3.6',
      data: '0xcafe',
      operatorData: '0xbeef',
      reason: 'own operator',
    }, {
      operator: function() { return this.test.ctx.accounts[6]; },
      from: function() { return this.test.ctx.accounts[7]; },
      to: function() { return this.test.ctx.accounts[8]; },
      amount: '3.6',
      data: null,
      operatorData: null,
      reason: 'without data, without operatorData',
    }, {
      operator: function() { return this.test.ctx.accounts[6]; },
      from: function() { return this.test.ctx.accounts[7]; },
      to: function() { return this.test.ctx.accounts[8]; },
      amount: '3.6',
      data: '0xcafe',
      operatorData: null,
      reason: 'with data, without operatorData',
    }, {
      operator: function() { return this.test.ctx.accounts[6]; },
      from: function() { return this.test.ctx.accounts[7]; },
      to: function() { return this.test.ctx.accounts[8]; },
      amount: '3.6',
      data: null,
      operatorData: '0xbeef',
      reason: 'without data, with operatorData',
    }, {
      operator: function() { return this.test.ctx.accounts[6]; },
      from: function() { return this.test.ctx.accounts[7]; },
      to: function() { return this.test.ctx.accounts[8]; },
      amount: '3.6',
      data: '0xcafe',
      operatorData: '0xbeef',
      reason: 'with data, with operatorData',
    }, {
      operator: function() { return this.test.ctx.token.defaultOperators[0]; },
      from: function() { return this.test.ctx.accounts[7]; },
      to: function() { return this.test.ctx.accounts[8]; },
      amount: '3.6',
      data: '0xcafe',
      operatorData: '0xbeef',
      reason: 'default operator',
    }, {
      operator: function() { return this.test.ctx.accounts[6]; },
      from: function() { return this.test.ctx.accounts[7]; },
      to: function() { return this.test.ctx.accounts[8]; },
      amount: '0',
      data: '0xcafe',
      operatorData: '0xbeef',
      reason: '0 tokens',
    },
  ];

  for (let input of sendInputs) {
    it(`operatorSend (${input.reason})`, async function() {
      if (input.reason === 'default operator' && this.test.ctx.token.defaultOperators.length === 0) {
        this.test.ctx.skipTest();
      }

      const operator = input.operator.apply(this);
      const from = input.from.apply(this);
      const to = input.to.apply(this);

      if (input.reason !== 'default operator' && input.reason !== 'own operator') {
        await this.test.ctx.token.contract.methods.authorizeOperator(operator).send({ from: from });
      }

      const expectedBalanceFrom = this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(from).call(), 'ether'
      );
      await this.test.ctx.mint.method.apply(this, [{ amount: input.amount, holder: from }]);

      const balanceTo = this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(to).call(), 'ether'
      );

      const tx = await this.test.ctx.token.contract.methods
        .operatorSend(
          from,
          to,
          this.test.ctx.web3.utils.toWei(input.amount, 'ether'),
          input.data === null ? '0x' : input.data,
          input.operatorData === null ? '0x' : input.operatorData
        )
        .send({ from: operator });

      assert.nestedProperty(tx, 'events.Sent');
      assert.deepInclude(tx.events.Sent, { event: 'Sent' });
      assert.deepInclude(tx.events.Sent, {
        returnValues: {
          '0': operator,
          '1': from,
          '2': to,
          '3': this.test.ctx.web3.utils.toWei(input.amount, 'ether'),
          '4': input.data,
          '5': input.operatorData,
          operator: operator,
          from: from,
          to: to,
          amount: this.test.ctx.web3.utils.toWei(input.amount, 'ether'),
          data: input.data,
          operatorData: input.operatorData,
        },
      });

      const expectedBalanceTo = [balanceTo, input.amount]
        .map(val => parseInt(this.test.ctx.web3.utils.toWei(val, 'ether')))
        .reduce((acc, current) => acc + current, 0)
        .toString();

      assert.equal(
        this.test.ctx.web3.utils.fromWei(expectedBalanceFrom, 'ether'),
        this.test.ctx.web3.utils.fromWei(
          await this.test.ctx.token.contract.methods.balanceOf(from).call(), 'ether')
      );

      assert.equal(
        this.test.ctx.web3.utils.fromWei(expectedBalanceTo, 'ether'),
        this.test.ctx.web3.utils.fromWei(
          await this.test.ctx.token.contract.methods.balanceOf(to).call(), 'ether')
      );
    });
  }
  xit('operatorSend (ERC20)');

  const notSendInput = [
    {
      operator: 9,
      from: 7,
      to: 8,
      mintAmount: '5',
      amount: '-4.7',
      data: '0xcafe',
      operatorData: '0xbeef',
      reason: 'negative amount',
    }, {
      operator: 9,
      from: 7,
      to: 8,
      mintAmount: '5',
      amount: '6.8',
      data: '0xcafe',
      operatorData: '0xbeef',
      reason: 'insufficient funds',
    }, {
      operator: 9,
      from: 7,
      to: 8,
      mintAmount: '5',
      amount: '2.789',
      data: '0xcafe',
      operatorData: '0xbeef',
      reason: 'granularity',
    }, {
      operator: 9,
      from: 7,
      to: 8,
      mintAmount: '5',
      amount: '2.7',
      data: '0xcafe',
      operatorData: '0xbeef',
      reason: 'unauthorized operator',
    }, {
      operator: 9,
      from: 7,
      to: null,
      mintAmount: '5',
      amount: '2.4',
      data: '0xcafe',
      operatorData: '0xbeef',
      reason: 'recipient is 0x0',
    },
  ];

  for (let input of notSendInput) {
    it(`prevent send (${input.reason})`, async function() {
      input.operator = this.test.ctx.accounts[input.operator];
      input.from = this.test.ctx.accounts[input.from];
      input.to = input.to === null ? '0x0000000000000000000000000000000000000000' : this.test.ctx.accounts[input.to];

      await this.test.ctx.mint.method.apply(this, [{ amount: input.mintAmount, holder: input.from }]);
      if (input.reason !== 'unauthorized operator') {
        await this.test.ctx.token.contract.methods.authorizeOperator(input.operator).send({ from: input.from });
      }

      const balanceFrom = this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(input.from).call(), 'ether'
      );
      const balanceTo = this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(input.to).call(), 'ether'
      );

      await this.test.ctx.token.contract.methods
        .operatorSend(
          input.from,
          input.to,
          this.test.ctx.web3.utils.toWei(input.amount, 'ether'),
          input.data === null ? '0x' : input.data,
          input.operatorData === null ? '0x' : input.operatorData
        )
        .send({ from: input.operator })
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
};
