/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
const ERC1820 = require('erc1820');
const testAccounts = [
  '0x093d49D617a10F26915553255Ec3FEE532d2C12F',
  '0x1dc728786E09F862E39Be1f39dD218EE37feB68D',
  '0x2eeDf8a799B73BC02E4664183eB72422C377153B',
  '0x3bF958Fa0626e898F548a8F95Cf9AB3A4Db65169',
  '0x4bd1280852Cadb002734647305AFC1db7ddD6Acb',
  '0x5cE162cFa6208d7c50A7cB3525AC126155e7bCe4',
  '0x6b09D6433a379752157fD1a9E537c5CAe5fa3168',
  '0x7dc0a40D64d72bb4590652B8f5C687bF7F26400c',
  '0x8dF64de79608F0aE9e72ECAe3A400582AeD8101C',
  '0x9a5279029e9A2D6E787c5A09CB068AB3D45e209d',
];
const blocks = [];
let blockIdx = 0;

const log = (msg) => process.env.MOCHA_VERBOSE && console.log(msg);
const zeroAddress = '0x0000000000000000000000000000000000000000';

function assertEventWillBeCalled(contract, name, data) {
  return new Promise((resolve, reject) => {
    contract.once(name, function(err, event) {
      if (err) { reject(err); }
      log(`${name} called with ${JSON.stringify(event.returnValues)}`);
      assert.deepOwnInclude(
        event.returnValues, data, `Event: ${name}: invalid data`);
      resolve();
    });
  });
}

module.exports = {
  zeroAddress,
  log,
  assertEventWillBeCalled,
  assertEventsWillBeCalled(contract, events) {
    return Promise.all(events
      .map(event => assertEventWillBeCalled(contract, event.name, event.data)));
  },

  formatAccount(account) {
    if (testAccounts.includes(account)) { return `${account.slice(0, 4)}...`; }
    return account.slice(0, 8);
  },

  async getBlock(web3) {
    blocks[blockIdx] = await web3.eth.getBlockNumber();
    this.log(`block ${blockIdx} -> ${blocks[blockIdx]}`);
    blockIdx++;
  },

  async assertTotalSupply(web3, token, expected) {
    const totalSupply = (
      await token.contract.methods.totalSupply().call()).toString();
    assert.equal(web3.utils.fromWei(totalSupply), expected);
    this.log(`totalSupply: ${web3.utils.fromWei(totalSupply)}`);
  },

  async assertBalance(web3, token, account, expected) {
    const balance = (
      await token.contract.methods.balanceOf(account).call()).toString();
    assert.equal(web3.utils.fromWei(balance), expected);
    this.log(`balance[${account}]: ${web3.utils.fromWei(balance)}`);
  },

  getERC1820Registry(web3) {
    return ERC1820.ERC1820Registry(web3);
  },

  async mintForAllAccounts(web3, accounts, token, operator, amount) {
    let erc1820Registry = ERC1820.ERC1820Registry(web3);
    let hook;
    for (let account of accounts) {
      hook = await erc1820Registry.methods.getInterfaceImplementer(
        account, web3.utils.keccak256('ERC777TokensRecipient')).call();
      if (hook === zeroAddress) { hook = '0x0'; }
      log(`mint ${amount} for ${account} by ${operator} (hook: ${hook})`);
      await token.mintForAccount(account, amount, operator);
    }
  },

  async assertHookCalled(
    web3,
    hook,
    token,
    operator,
    from,
    to,
    data,
    operatorData,
    balanceFrom,
    balanceTo,
  ) {
    assert.strictEqual(
      await hook.methods.token(to).call(),
      web3.utils.toChecksumAddress(token)
    );
    assert.strictEqual(
      await hook.methods.operator(to).call(),
      web3.utils.toChecksumAddress(operator)
    );
    assert.strictEqual(
      await hook.methods.from(to).call(),
      web3.utils.toChecksumAddress(from)
    );
    assert.strictEqual(
      await hook.methods.to(to).call(),
      web3.utils.toChecksumAddress(to)
    );
    assert.strictEqual(await hook.methods.data(to).call(), data);
    assert.strictEqual(
      await hook.methods.operatorData(to).call(), operatorData);

    assert.equal(
      web3.utils.fromWei(await hook.methods.balanceOf(from).call()),
      balanceFrom
    );

    assert.equal(
      web3.utils.fromWei(await hook.methods.balanceOf(to).call()),
      balanceTo
    );
  },

  async assertHookNotCalled(hook, to) {
    assert.strictEqual(await hook.methods.token(to).call(), zeroAddress);
    assert.strictEqual(await hook.methods.operator(to).call(), zeroAddress);
    assert.strictEqual(await hook.methods.from(to).call(), zeroAddress);
    assert.strictEqual(await hook.methods.to(to).call(), zeroAddress);
    assert.strictEqual(await hook.methods.data(to).call(), null);
    assert.strictEqual(await hook.methods.operatorData(to).call(), null);
  },
};
