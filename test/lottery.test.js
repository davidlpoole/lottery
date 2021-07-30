const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const { interface, bytecode } = require('../compile.js');

let accounts;
let lottery;

beforeEach(async () => {
    // Get a list of all accounts
    accounts = await web3.eth.getAccounts();
  
    // Use one of those accounts 
    // to deploy the contract
    lottery = await new web3.eth.Contract(JSON.parse(interface))
      .deploy({ data: bytecode })
      .send({ from: accounts[0], gas: '1000000' });
  });

  describe('Lottery contract', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address);
    });

    it('allows one account to enter', async () => {
        //enter an address into the lottery
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.01', 'ether')
        });
        
        //get the list of players
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });
        
        //check the address was added
        assert.equal(accounts[0], players[0]);
        
        //check only one entry was added
        assert.equal(1, players.length);
    });

    it('allows multiple accounts to enter', async () => {
        //enter an address into the lottery
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.01', 'ether')
        });

        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.01', 'ether')
        });

        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.01', 'ether')
        });
        
        //get the list of players
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });
        
        //check the address was added
        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
        
        //check only one entry was added
        assert.equal(3, players.length);
    });

    it('requires a minimum amount of ether to enter', async () => {
            
        try {
            await lottery.methods.enter().send({
            from: accounts[3],
            value: web3.utils.toWei('0.001', 'ether')
            });
            assert(false);
        } catch (err) {
            assert(err);
        };

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });
        
        // check the players array is empty
        assert.equal(0, players.length);

    });

    it('only manager can call pickWinner', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('3', 'ether')
        });

        // check players array is empty
        const playersBefore = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.equal(1, playersBefore.length);

        try {
            await lottery.methods.pickWinner().send({
                from: accounts[1]
            });
            assert(false);
        } catch (err) {
            assert(err);
        }

        // check players array is empty
        const playersAfter = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.equal(1, playersAfter.length);
    });

    it('sends money to the winner and resets the players array', async () => {
        
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('3', 'ether')
        });

        // check winner received the ether
        const beforeValue = await web3.eth.getBalance(accounts[0]);
        
        await lottery.methods.pickWinner().send({
            from: accounts[0]
        });
        
        const afterValue = await web3.eth.getBalance(accounts[0]);
        const difference = afterValue - beforeValue;
        assert(difference > web3.utils.toWei('2.8','ether'));

        // check players array is empty
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.equal(0, players.length);

    });

  });