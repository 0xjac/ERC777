const TestRPC = require('ethereumjs-testrpc');
const Web3 = require('web3');
const chai = require('chai');
const Registry = require('../js/InterfaceImplementationRegistry')
const ERC20CompatibleReferenceToken = require('../js/ERC20CompatibleReferenceToken');

const assert = chai.assert;
const { utils } = Web3;
const log = (msg) => { if (process.env.MOCHA_VERBOSE) console.log(msg); };
const blocks = [];

describe('EIP777 ERC20-Compatible Reference Token Test', () => {
  let testrpc;
  let web3;
  let accounts;
  let registry;
  let erc20ReferenceToken;

  before(async () => {
    testrpc = TestRPC.server({
      ws: true,
      gasLimit: 5800000,
      total_accounts: 10,
    });
    testrpc.listen(8546, '127.0.0.1');

    web3 = new Web3('ws://localhost:8546');
    accounts = await web3.eth.getAccounts();

    registry = await Registry.new(web3);
    assert.ok(registry.$address);
  });

  after(async () => await testrpc.close());

 it('should deploy the ERC20-compat. reference token contract', async () => {
   erc20ReferenceToken = await ERC20CompatibleReferenceToken.new(web3,
     'ERC-20 Compatible Reference Token', 'XRT20', 18);
   assert.ok(erc20ReferenceToken.$address);

   const name = await erc20ReferenceToken.name();
   assert.strictEqual(name, 'ERC-20 Compatible Reference Token');
   log(`name: ${name}`);

   const symbol = await erc20ReferenceToken.symbol();
   assert.strictEqual(symbol, 'XRT20');
   log(`symbol: ${symbol}`);

   const decimals = await erc20ReferenceToken.decimals();
   assert.strictEqual(decimals, '18');
   log(`decimals: ${decimals}`);

   const totalSupply = await erc20ReferenceToken.totalSupply();
   assert.strictEqual(totalSupply, '0');
   log(`totalSupply: ${totalSupply}`);
 }).timeout(20000);

 it('should mint tokens for address 1', async () => {
   blocks[0] = await web3.eth.getBlockNumber();
   log(`block 0 -> ${blocks[0]}`);

   await erc20ReferenceToken.ownerMint(accounts[1], 10, '0x', {
     gas: 300000,
     from: accounts[0]
   });

   blocks[1] = await web3.eth.getBlockNumber();
   log(`block 1 -> ${blocks[1]}`);

   const totalSupply = await erc20ReferenceToken.totalSupply();
   assert.equal(totalSupply, 10);
   log(`totalSupply: ${totalSupply}`);

   const balance = await erc20ReferenceToken.balanceOf(accounts[1]);
   assert.equal(balance, 10);
   log(`balance[${accounts[1]}]: ${balance}`);
 }).timeout(6000);
});
