# ccwallet - CryptoCurrency Wallet API Library

Allowed communicating with multiple blockchains, reading wallet balances.

At the moment it implements only Bitcoin and Etherium, using Blockchain.info and Etherscan.io to pull balances. Idealy, it would implement direct RPC communciation with nodes.

    const ccwallet = require('ccwallet');
    const Blockchain = ccwallet.blockchains['BTC'];
    let blockchain = new Blockchain();
    let balances = await blockchain.getBalance(wallet.address);
         
