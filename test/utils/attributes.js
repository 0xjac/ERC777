const utils = require('./index');

exports.test = function(web3, accounts, token) {
  describe('attributes', function() {
    let balances = {};
    for (let account of accounts) {
      balances[account] = token.defaultBalance;
    }

    it(`should have the name "${token.name}"`, async function() {
      const name = await token.contract.methods.name().call();
      assert.strictEqual(name, token.name);
    });

    it(`should have the symbol "${token.symbol}"`, async function() {
      const symbol = await token.contract.methods.symbol().call();
      assert.strictEqual(symbol, token.symbol);
    });

    it(`should have a granularity of ${token.granularity}`,
      async function() {
        const granularity = (
          await token.contract.methods.granularity().call()).toString();
        assert.strictEqual(
          web3.utils.fromWei(granularity),
          token.granularity
        );
      }
    );

    it(`should have a total supply of ${token.totalSupply}`,
      async function() {
        await utils.assertTotalSupply(web3, token, token.totalSupply);
      }
    );

    it(`should have a balance of ${token.defaultBalance} for all accounts`,
      async function() {
        for (let acc in balances) {
          await utils.assertBalance(web3, token, acc, balances[acc]);
        }
      }
    );
  });
};
