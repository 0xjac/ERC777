/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();

const artifacts = require('../../js/artifacts')();

module.exports = function suite() {
  beforeEach(async function() {
    this.hook = {
      self: await artifacts.contracts.test.ContractAccount.ContractAccount.deploy(
        this.web3, { from: this.accounts[5], arguments: [true, true] }),
      balance: '5',
    };
    await this.mint.method.apply(this, [{ amount: this.hook.balance, holder: this.hook.self.options.address }]);
  });

  afterEach(function() { delete this.hook; });

  const inputs = [{
    label: 'called on send (self hook)',
    event: 'NotifiedTokensToSend',
    operator: function() { return this.test.ctx.hook.self.options.address; },
    from: function() { return this.test.ctx.hook.self.options.address; },
    to: function() { return this.test.ctx.accounts[4]; },
    amount: '3',
    data: '0xcafe',
    operatorData: null,
    triggerHook: async function(origin, operator, from, to, amount, data, operatorData) {
      return this.test.ctx.hook.self.methods
        .send(this.test.ctx.token.contract.options.address, to, this.test.ctx.web3.utils.toWei(amount, 'ether'), data)
        .send({ from: origin });
    },
  }, {
    label: 'called on burn (self hook)',
    event: 'NotifiedTokensToSend',
    operator: function() { return this.test.ctx.hook.self.options.address; },
    from: function() { return this.test.ctx.hook.self.options.address; },
    to: function() { return '0x0000000000000000000000000000000000000000'; },
    amount: '3',
    data: '0xcafe',
    operatorData: null,
    triggerHook: async function(origin, operator, from, to, amount, data, operatorData) {
      await this.test.ctx.token.contract.methods.allowBurn(this.test.ctx.hook.self.options.address)
        .send({ from: this.accounts[0] });
      return this.test.ctx.hook.self.methods
        .burn(this.test.ctx.token.contract.options.address, this.test.ctx.web3.utils.toWei(amount, 'ether'), data)
        .send({ from: origin });
    },
  }];

  for (let input of inputs) {
    it(input.label, async function() {
      for (let prop of ['operator', 'from', 'to']) { input[prop] = input[prop].apply(this); }

      const balanceFrom = await this.test.ctx.token.contract.methods
        .balanceOf(input.from).call();
      const balanceTo = await this.test.ctx.token.contract.methods.balanceOf(input.to).call();

      const tx = await input.triggerHook.apply(this, [
        this.accounts[5], input.operator, input.from, input.to, input.amount, input.data, input.operatorData,
      ]);

      assert.nestedProperty(tx, `events.${input.event}`);
      assert.deepInclude(tx.events[input.event], { event: input.event });
      assert.deepInclude(tx.events[input.event], {
        returnValues: {
          '0': this.test.ctx.token.contract.options.address,
          '1': input.operator,
          '2': input.from,
          '3': input.to,
          '4': this.test.ctx.web3.utils.toWei(input.amount, 'ether'),
          '5': balanceFrom,
          '6': balanceTo,
          '7': input.data,
          '8': input.operatorData,
          token: this.test.ctx.token.contract.options.address,
          operator: input.operator,
          from: input.from,
          to: input.to,
          amount: this.test.ctx.web3.utils.toWei(input.amount, 'ether'),
          balanceFrom: balanceFrom,
          balanceTo: balanceTo,
          data: input.data,
          operatorData: input.operatorData,
        },
      });
    });
  }

  xit('called on send (proxy hook)');
  xit('called on burn (proxy hook)');
  xit('revert on send (self hook)');
  xit('revert on burn (self hook)');
  xit('revert on send (proxy hook)');
  xit('revert on burn (proxy hook)');
};
