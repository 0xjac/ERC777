/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const { URL } = require('url');
const Web3 = require('web3');
const ERC1820 = require('erc1820');
const OldReferenceToken = artifacts.require('ReferenceToken');
const utils = require('./utils');

contract('ReferenceToken', function(accounts) {
  const provider = new URL(this.web3.currentProvider.host);
  provider.protocol = 'ws';
  const web3 = new Web3(provider.toString());

  accounts = accounts.map(web3.utils.toChecksumAddress); // normalize addresses

  const ReferenceToken = new web3.eth.Contract(
    OldReferenceToken.abi,
    { data: OldReferenceToken.bytecode }
  );

  let token = {
    name: 'ReferenceToken',
    symbol: 'XRT',
    granularity: '0.01',
    defaultOperators: [accounts[6], accounts[7]],
    burnOperator: accounts[8],
    defaultBalance: 0,
    initialSupply: 10,
  };

  const deployContract = ReferenceToken
    .deploy({ arguments: [
      token.name,
      token.symbol,
      web3.utils.toWei(token.granularity),
      token.defaultOperators,
      token.burnOperator,
      web3.utils.toWei(token.initialSupply.toString()),
    ] });

  beforeEach(async function() {
    let erc1820Registry = await ERC1820.deploy(web3, accounts[0]);
    assert.ok(erc1820Registry.options.address);

    // Use Web3.js 1.0
    const estimateGas = await deployContract.estimateGas();
    token.contract = await deployContract
      .send({ from: accounts[0], gasLimit: estimateGas });
    assert.ok(token.contract.options.address);

    token.disableERC20 = async function() {
      await token.contract.methods
        .disableERC20()
        .send({ gas: 300000, from: accounts[0] });
    };

    token.mintForAccount = async function(account, amount, operator) {
      const mintTx = token.contract.methods
        .mint(account, web3.utils.toWei(amount), '0xbeef', '0xcafe');
      const gas = await mintTx.estimateGas();
      await mintTx.send({ gas: gas, from: operator });
    };
  });

  after(async function() { await web3.currentProvider.connection.close(); });

  describe('Creation', function() {
    it('should not deploy the token with a granularity of 0', async function() {
      const estimateGas = await deployContract.estimateGas();
      await ReferenceToken
        .deploy({ arguments: [
          token.name,
          token.symbol,
          web3.utils.toWei('0'),
          token.defaultOperators,
          token.burnOperator,
          web3.utils.toWei(token.initialSupply.toString()),
        ] })
        .send({ from: accounts[0], gasLimit: estimateGas })
        .should.be.rejectedWith('revert');
    });
  });

  require('./utils/attributes').test(web3, accounts, token);
  require('./utils/mint').test(web3, accounts, token);
  require('./utils/burn').test(web3, accounts, token);
  require('./utils/send').test(web3, accounts, token);
  require('./utils/operator').test(web3, accounts, token);
  require('./utils/operatorBurn').test(web3, accounts, token);
  require('./utils/operatorSend').test(web3, accounts, token);
  require('./utils/tokensSender').test(web3, accounts, token);
  require('./utils/tokensRecipient').test(web3, accounts, token);
  require('./utils/erc20Compatibility').test(web3, accounts, token);

  describe('ERC20 Disable', function() {
    it('should disable ERC20 compatibility', async function() {
      let erc1820Registry = utils.getERC1820Registry(web3);
      let erc20Hash = web3.utils.keccak256('ERC20Token');
      let erc20Addr = await erc1820Registry.methods
        .getInterfaceImplementer(token.contract.options.address, erc20Hash)
        .call();

      assert.strictEqual(erc20Addr, token.contract.options.address);

      await token.disableERC20();

      await utils.getBlock(web3);
      erc20Addr = await erc1820Registry.methods
        .getInterfaceImplementer(token.contract.options.address, erc20Hash)
        .call();

      assert.strictEqual(erc20Addr, utils.zeroAddress);
    });
  });

  require('./utils/erc20Disabled').test(web3, accounts, token);
});
