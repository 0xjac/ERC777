/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const artifacts = require('../js/artifacts')();
const suites = require('./suites');

describe('ReferenceToken', function() {
  beforeEach(async function() {
    this.erc20 = true;

    this.token = {
      name: 'ReferenceToken',
      symbol: 'XRT',
      granularity: '0.01',
      defaultOperators: [this.accounts[6], this.accounts[7]],
      initialSupply: '10',
    };

    this.mint = {
      holder: this.accounts[3],
      amount: '5.3',
      operator: this.accounts[0],
    };

    this.mint.method = async function mint(_parameters, _options) {
      const parameters = Object.assign({
        holder: this.mint.holder,
        amount: this.mint.amount,
        data: '0x',
        operatorData: '0x',
      }, _parameters);
      const options = Object.assign({ gas: 300000, from: this.mint.operator }, _options);

      return this.token.contract.methods
        .mint(
          parameters.holder,
          this.web3.utils.toWei(parameters.amount, 'ether'),
          parameters.data,
          parameters.operatorData,
        ).send(options);
    };

    this.burn = {
      operator: this.accounts[8],
      self: this.accounts[0],
      holder: this.accounts[5],
    };

    this.token.contract = await artifacts.contracts.examples.ReferenceToken.ReferenceToken.deploy(
      this.web3, {
        from: this.accounts[0],
        arguments: [
          this.token.name,
          this.token.symbol,
          this.web3.utils.toWei(this.token.granularity, 'ether'),
          this.token.defaultOperators,
          this.web3.utils.toWei(this.test.ctx.token.initialSupply, 'ether'),
        ],
      }
    );
    await this.token.contract.methods.allowBurn(this.burn.operator).send({ from: this.accounts[0] });
  });
  suites.apply(this);
});
