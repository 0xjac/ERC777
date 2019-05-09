const path = require('path');
const DEFAULT_ARTIFACTS_PATH = path.resolve(__dirname, '../artifacts/combined.json');

module.exports = function loadArtifacts(jsonPath = DEFAULT_ARTIFACTS_PATH) {
  const solcJson = require(jsonPath);
  const artifacts = Object.assign({}, solcJson, {contracts: {}});

  Object.keys(solcJson.contracts).forEach(contractPath => {
    let path = (contractPath.startsWith('./') ? contractPath.slice(2) : contractPath)
      .replace('.sol:', '.').replace(/\//g, '.').split('.');
    let contractName = path.pop();

    let last = path.reduce((obj, key) => obj[key] = obj[key] || {}, artifacts);
    last[contractName] = Object.assign({}, solcJson.contracts[contractPath]);
    last[contractName].abi = JSON.parse(last[contractName].abi);

    last[contractName].deploy = async (web3, options = {}) => {
      if (!last[contractName].bin || last[contractName].bin === '0x') {
        throw new Error(`Missing bytecode for ${contractPath}`);
      }
      if (!last[contractName].abi) {
        throw new Error(`Missing abi for ${contractPath}`);
      }
      if (!options.from) {
        options.from = (await web3.eth.getAccounts())[0];
      }

      let contract = new web3.eth.Contract(last[contractName].abi, null, { from: options.from });
      const gas = await contract.deploy({ data: last[contractName].bin, arguments: options.arguments })
        .estimateGas({ from: options.from });
      if (!options.gas) {
        options.gas = gas;
      } else if (options.gas < gas) {
        console.warn(`Specified gas amount ${options.gas} is lower than the estimated ${gas}.`);
      }
      return await contract.deploy({ arguments: options.arguments, data: last[contractName].bin })
        .send({ from: options.from, gas: options.gas, gasLimit: options.gasLimit });
    };

    last[contractName]
      .instance = (web3, address, options = {}) => new web3.eth.Contract(last[contractName].abi, address, options);
  });

  return artifacts
};
