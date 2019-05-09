/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const ERC1820 = require('erc1820');
const utils = require('./utils');
const host = '127.0.0.1';
const port = 8546;

before(function() {
  this.skipTest = () => {
    this.ganacheServer.close(); // server must be closed now as the afterEach hook will not be triggered.
    this.skip();
  };
});

beforeEach(async function() {
  const { ganacheServer, web3 } = utils.init(host, port);
  this.web3 = web3;
  this.ganacheServer = ganacheServer;
  this.accounts = await utils.getAccounts(web3);
  this.erc1820Registry = await ERC1820.deploy(web3, this.accounts[0]);
});

afterEach(async function() {
  this.ganacheServer.close();
});
