/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const utils = require('../utils');

module.exports = function suite() {
  it('ERC1820 registration', async function() {
    const address = await this.test.ctx.erc1820Registry.methods.getInterfaceImplementer(
      this.test.ctx.token.contract.options.address,
      '0xac7fbab5f54a3ca8194167523c6753bfeb96a445279294b6125b68cce2177054'
    ).call();

    assert.equal(this.test.ctx.token.contract.options.address, address);
  });

  xit('ERC1820 registration (ERC20)');

  it('name', async function() {
    const name = await this.test.ctx.token.contract.methods.name().call();
    assert.strictEqual(name, this.test.ctx.token.name);
  });

  it('symbol', async function() {
    const symbol = await this.test.ctx.token.contract.methods.symbol().call();
    assert.strictEqual(symbol, this.test.ctx.token.symbol);
  });

  it('granularity',
    async function() {
      const granularity = (
        await this.test.ctx.token.contract.methods.granularity().call()).toString();
      assert.strictEqual(
        this.test.ctx.web3.utils.fromWei(granularity),
        this.test.ctx.token.granularity
      );
    }
  );

  it('total supply', async function() {
    assert.strictEqual(
      await utils.getTotalSupply(this.test.ctx.web3, this.test.ctx.token),
      this.test.ctx.token.initialSupply);
  });
};
