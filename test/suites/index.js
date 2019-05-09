/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const attributes = require('./attributes');
const operators = require('./operators');
const mint = require('./mint');
const send = require('./send');
const operatorSend = require('./operatorSend');
const burn = require('./burn');
const operatorBurn = require('./operatorBurn');
const tokensToSend = require('./tokensToSend');
const tokensReceived = require('./tokensReceived');

module.exports = function suites() {
  describe('Attributes', attributes.bind(this));
  describe('Operators', operators.bind(this));
  describe('Mint', mint.bind(this));
  describe('Send', send.bind(this));
  describe('OperatorSend', operatorSend.bind(this));
  describe('Burn', burn.bind(this));
  describe('OperatorBurn', operatorBurn.bind(this));
  describe('TokensToSend Hook', tokensToSend.bind(this));
  describe('TokensReceived Hook', tokensReceived.bind(this));
};
