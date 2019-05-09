/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();

module.exports = function suite() {
  const sendInputs = [
    { amount: '3.6', data: null, reason: 'without data' },
    { amount: '3.6', data: '0xcafe', reason: 'with data' },
    { amount: '0', data: null, reason: '0 tokens' },
  ];

  for (let input of sendInputs) {
    it(`burn (${input.reason})`, async function() {
      const expectedBalanceFrom = this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(this.test.ctx.burn.self).call()
      );
      await this.test.ctx.mint.method.apply(this, [{ amount: input.amount, holder: this.test.ctx.burn.self }]);

      const totalSupplyBefore = await this.test.ctx.token.contract.methods.totalSupply().call();

      const tx = await this.test.ctx.token.contract.methods
        .burn(this.test.ctx.web3.utils.toWei(input.amount, 'ether'), input.data === null ? '0x' : input.data)
        .send({ from: this.test.ctx.burn.self });

      const totalSupplyAfter = await this.test.ctx.token.contract.methods.totalSupply().call();
      const balanceFromAfter = this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(this.test.ctx.burn.self).call()
      );

      assert.nestedProperty(tx, 'events.Burned');
      assert.deepInclude(tx.events.Burned, { event: 'Burned' });
      assert.deepInclude(tx.events.Burned, {
        returnValues: {
          '0': this.test.ctx.burn.self,
          '1': this.test.ctx.burn.self,
          '2': this.test.ctx.web3.utils.toWei(input.amount, 'ether'),
          '3': input.data,
          '4': null,
          operator: this.test.ctx.burn.self,
          from: this.test.ctx.burn.self,
          amount: this.test.ctx.web3.utils.toWei(input.amount, 'ether'),
          data: input.data,
          operatorData: null,
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
  xit('burn (ERC20)');

  const notSendInput = [
    { mintAmount: '5', amount: '-4.7', data: '0xbeef', reason: 'negative amount' },
    { mintAmount: '5', amount: '63.8', data: '0xbeef', reason: 'insufficient funds' },
    { mintAmount: '5', amount: '2.789', data: '0xbeef', reason: 'granularity' },
  ];

  for (let input of notSendInput) {
    it(`prevent burn (${input.reason})`, async function() {
      await this.test.ctx.mint.method.apply(this, [{ amount: input.mintAmount, holder: this.test.ctx.burn.self }]);

      const totalSupplyBefore = await this.test.ctx.token.contract.methods.totalSupply().call();
      const balanceFromBefore = this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(this.test.ctx.burn.self).call()
      );

      await this.test.ctx.token.contract.methods
        .burn(this.test.ctx.web3.utils.toWei(input.amount, 'ether'), input.data === null ? '0x' : input.data)
        .send({ from: this.test.ctx.burn.self })
        .should.be.rejectedWith('revert');

      const totalSupplyAfter = await this.test.ctx.token.contract.methods.totalSupply().call();
      const balanceFromAfter = this.test.ctx.web3.utils.fromWei(
        await this.test.ctx.token.contract.methods.balanceOf(this.test.ctx.burn.self).call()
      );

      assert.equal(balanceFromBefore, balanceFromAfter);

      assert.equal(
        '0',
        this.test.ctx.web3.utils.fromWei(
          await this.test.ctx.token.contract.methods.balanceOf('0x0000000000000000000000000000000000000000').call())
      );

      assert.equal(totalSupplyBefore, totalSupplyAfter);
    });
  }
};
