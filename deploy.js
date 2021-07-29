const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const { interface, bytecode } = require('./compile.js');
const secrets = require('./secrets/provider.js');

const provider = new HDWalletProvider(secrets.walletPassphrase, secrets.infuraAPI);
const web3 = new Web3(provider);

const deploy = async () => {
  // Get a list of all accounts
  const accounts = await web3.eth.getAccounts();

  // Use one of those accounts to deploy
  // the contract
  console.log('Attempting to deploy from account', accounts[0]);
  const result = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: '1000000' });
  console.log('Contract deployed to', result.options.address);

};

deploy();

// node deploy.js
