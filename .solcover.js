module.exports = {
    norpc: true,
    copyPackages: ['eip820', 'openzeppelin-solidity'],
    compileCommand: 'npx truffle compile --network coverage',
    testCommand: 'npx truffle test --network coverage',
};
