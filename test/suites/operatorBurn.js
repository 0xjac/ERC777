/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();

module.exports = function suite() {
  const sendInputs = [
    {
      from: function() { return this.test.ctx.burn.operator; },
      amount: '3.6',
      data: '0xcafe',
      operatorData: '0xbeef',
      reason: 'own operator',
    }, {
      from: function() { return this.test.ctx.accounts[7]; },
      amount: '3.6',
      data: null,
      operatorData: null,
      reason: 'without data, without operatorData',
    }, {
      from: function() { return this.test.ctx.accounts[7]; },
      amount: '3.6',
      data: '0xcafe',
      operatorData: null,
      reason: 'with data, without operatorData',
    }, {
      from: function() { return this.test.ctx.accounts[7]; },
      amount: '3.6',
      data: null,
      operatorData: '0xbeef',
      reason: 'without data, with operatorData',
    }, {
      from: function() { return this.test.ctx.accounts[7]; },
      amount: '3.6',
      data: '0xcafe',
      operatorData: '0xbeef',
      reason: 'with data, with operatorData',
    }, {
      from: function() { return this.test.ctx.accounts[7]; },
      amount: '0',
      data: '0xcafe',
      operatorData: '0xbeef',
      reason: '0 tokens',
    },
  ];

  for (let input of sendInputs) {
    it(`operatorBurn (${input.reason})`, async function() {
      const from = input.from.apply(this);

      if (input.reason !== 'own operator') {
        await this.test.ctx.token.contract.methods.authorizeOperator(this.test.ctx.burn.operator).send({ from: from });
      }

      const expectedBalanceFrom = this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(from).call(),
        'ether'
      );
      await this.test.ctx.mint.method.apply(this, [{ amount: input.amount, holder: from }]);

      const totalSupplyBefore = await this.test.ctx.token.contract.methods.totalSupply().call();

      const tx = await this.test.ctx.token.contract.methods
        .operatorBurn(
          from,
          this.test.ctx.web3.utils.toWei(input.amount, 'ether'),
          input.data === null ? '0x' : input.data,
          input.operatorData === null ? '0x' : input.operatorData
        )
        .send({ from: this.test.ctx.burn.operator });

      const totalSupplyAfter = await this.test.ctx.token.contract.methods.totalSupply().call();
      const balanceFromAfter = this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(from).call(),
        'ether'
      );

      assert.nestedProperty(tx, 'events.Burned');
      assert.deepInclude(tx.events.Burned, { event: 'Burned' });
      assert.deepInclude(tx.events.Burned, {
        returnValues: {
          '0': this.test.ctx.burn.operator,
          '1': from,
          '2': this.test.ctx.web3.utils.toWei(input.amount, 'ether'),
          '3': input.data,
          '4': input.operatorData,
          operator: this.test.ctx.burn.operator,
          from: from,
          amount: this.test.ctx.web3.utils.toWei(input.amount, 'ether'),
          data: input.data,
          operatorData: input.operatorData,
        },
      });

      assert.equal(expectedBalanceFrom, balanceFromAfter);

      assert.equal(
        '0',
        this.test.ctx.web3.utils.fromWei(
          await this.test.ctx.token.contract.methods.balanceOf('0x0000000000000000000000000000000000000000').call(),
          'ether'
        )
      );

      assert.equal(
        this.test.ctx.web3.utils.fromWei((totalSupplyBefore - totalSupplyAfter).toString(), 'ether'),
        input.amount
      );
    });
  }

  xit('operatorBurn (ERC20)');
  const notSendInput = [
    {
      from: 7,
      mintAmount: '5',
      amount: '-4.7',
      data: '0xcafe',
      operatorData: '0xbeef',
      reason: 'negative amount',
    }, {
      from: 7,
      mintAmount: '5',
      amount: '6.8',
      data: '0xcafe',
      operatorData: '0xbeef',
      reason: 'insufficient funds',
    }, {
      from: 7,
      mintAmount: '5',
      amount: '2.789',
      data: '0xcafe',
      operatorData: '0xbeef',
      reason: 'granularity',
    }, {
      from: 7,
      mintAmount: '5',
      amount: '2.7',
      data: '0xcafe',
      operatorData: '0xbeef',
      reason: 'unauthorized operator',
    },
  ];

  for (let input of notSendInput) {
    it(`prevent operatorBurn (${input.reason})`, async function() {
      input.from = this.test.ctx.accounts[input.from];
      await this.test.ctx.mint.method.apply(this, [{ amount: input.mintAmount, holder: input.from }]);
      if (input.reason !== 'unauthorized operator') {
        await this.test.ctx.token.contract.methods
          .authorizeOperator(this.test.ctx.burn.operator).send({ from: input.from });
      }

      const totalSupplyBefore = await this.test.ctx.token.contract.methods.totalSupply().call();
      const balanceFromBefore = this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(input.from).call(), 'ether'
      );

      await this.test.ctx.token.contract.methods
        .operatorBurn(
          input.from,
          this.test.ctx.web3.utils.toWei(input.amount, 'ether'),
          input.data === null ? '0x' : input.data,
          input.operatorData === null ? '0x' : input.operatorData
        )
        .send({ from: this.test.ctx.burn.operator })
        .should.be.rejectedWith('revert');

      const totalSupplyAfter = await this.test.ctx.token.contract.methods.totalSupply().call();
      const balanceFromAfter = this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(input.from).call(), 'ether'
      );

      assert.equal(balanceFromBefore, balanceFromAfter);

      assert.equal(
        '0',
        this.test.ctx.web3.utils.fromWei(
          await this.test.ctx.token.contract.methods.balanceOf('0x0000000000000000000000000000000000000000').call(),
          'ether'
        )
      );

      assert.equal(totalSupplyBefore, totalSupplyAfter);
    });
  }
};
