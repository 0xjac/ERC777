/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const ganache = require('ganache-cli');
const Web3 = require('web3');

const initGanacheServer = (host, port) => {
  const server = ganache.server({
    ws: true,
    gasLimit: 5800000,
    total_accounts: 10, // eslint-disable-line camelcase
  });
  server.listen(port, host);
  return server;
};

const initWeb3 = (host, port) => {
  const web3 = new Web3(`ws://${host}:${port}`);
  web3.extend({
    property: 'evm',
    methods: [
      new web3.extend.Method({ name: 'snapshot', call: 'evm_snapshot', params: 0, outputFormatter: parseInt }),
      new web3.extend.Method({ name: 'revert', call: 'evm_revert', params: 1, inputFormatter: [parseInt] }),
    ],
  });
  return web3;
};

const getAccounts = async (web3) => (await web3.eth.getAccounts()).map(web3.utils.toChecksumAddress);

const getTotalSupply = async (web3, token) => (
  web3.utils.fromWei((await token.contract.methods.totalSupply().call()).toString()));

const init = (host, port) => {
  const ganacheServer = initGanacheServer(host, port);
  const web3 = initWeb3(host, port);
  return { ganacheServer, web3 };
};
module.exports = { initGanacheServer, initWeb3, init, getAccounts, getTotalSupply };
