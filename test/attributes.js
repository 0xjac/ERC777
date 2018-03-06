/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const util = require('./util');

exports.test = function() {
  it('should have the name "Reference Token"', async function() {
    const name = await this.referenceToken.name();
    assert.strictEqual(name, 'Reference Token');
  });

  it('should have the symbol "XRT"', async function() {
    const symbol = await this.referenceToken.symbol();
    assert.strictEqual(symbol, 'XRT');
  });

  it('should have a granularity of 0.01', async function() {
    const granularity = await this.referenceToken.granularity();
    assert.strictEqual(this.web3.utils.fromWei(granularity), '0.01');
  });

  it('should have a total supply of 0', async function() {
    await util.assertTotalSupply(0);
  });

  it("should have balances of '0' for all accounts", async function() {
    for (let account of this.accounts) { await util.assertBalance(account, 0); }
  });
};
