const TestRPC = require('ethereumjs-testrpc');
const Web3 = require('web3');
const chai = require('chai');
const ensSimulator = require('ens-simulator');
const assert = chai.assert;
const { utils } = Web3;
const ReferenceToken = require('../js/ReferenceToken');

describe('EIP777 Reference Token Test', () => {
  let testrpc;
  let web3;
  let ens;
  let accounts;
  let referenceToken;

  before(async () => {
    testrpc = TestRPC.server({
     ws: true,
     gasLimit: 5800000,
     total_accounts: 10,
    });

    testrpc.listen(8546, '127.0.0.1');

    web3 = new Web3('ws://localhost:8546');
    accounts = await web3.eth.getAccounts();
    ens = await ensSimulator.deployENSSimulator(web3);
  });

  after(async () => {
    console.log(testrpc);
    await testrpc.close();
    process.exit(); // TODO figure out what isn't cleaned up
  });

 it('should deploy the reference token contract', async () => {
   referenceToken = await ReferenceToken.new(web3,
     'Reference Token',
     'XRT',
     18
   );
   assert.ok(referenceToken.$address);
 }).timeout(20000);
});
