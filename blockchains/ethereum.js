
const Blockchain = require ('./base/Blockchain')
    , moment = require('moment')
    , request = require('request-promise');

const etherscanioApiKey = 'X3Y9VC9AB4INQBVM1IKRRJ7J6APAU4Y9QB';

module.exports = class Ethereum extends Blockchain {

   constructor () {
      super();
   }

   getSymbol() {
      return 'ETH';
   }

   getName() {
      return 'Ethereum';
   }

   parseHashFromLink(link) {
      const tryparse = (tag) => {
         let pos = link.indexOf(tag);
         if (pos !== -1)
            return link.substr(pos + tag.length);
      }
      return tryparse('etherscan.io/tx/');
   }

   tokenTxUrl (bcAddress) {
      return `https://api.etherscan.io/api?module=account&action=tokentx&address=${bcAddress}&startblock=0&endblock=99999999999&sort=asc&apikey=${etherscanioApiKey}`;
   }

   accountBalanceUrl (bcAddress) {
      return `https://api.etherscan.io/api?module=account&action=balance&address=${bcAddress}&startblock=0&endblock=999999999&sort=asc&apikey=${etherscanioApiKey}`;
   }

   getReadTxUrl(hash) {
      return `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${hash}&apikey=${etherscanioApiKey}`;
   }

   getBlockByNumberUrl(hash) {
      return `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${hash}&boolean=true&apikey=${etherscanioApiKey}`;
   }

   async getBalance (bcAddress) {
      let balances = {};

      // tokens ---------------------------
      let response = await request( this.tokenTxUrl(bcAddress) )
         .catch ( err => {throw err} );

      let responseObj = JSON.parse(response);
      if (!responseObj)
         throw new Error(`Failed parsing etherscan.io response, parsed object is null`);
      if (!responseObj.status)
         throw new Error(`Failed getting wallet balance from etherscan.io, response status is ${responseObj.status}`);

      if (responseObj.result && responseObj.result.length)
         balances = this.aggregateTokenTxs(responseObj.result, bcAddress);

      // eth ---------------------------
      response = await request( this.accountBalanceUrl(bcAddress) )
         .catch ( err => {throw err} );

      responseObj = JSON.parse(response);
      if (!responseObj)
         throw new Error(`Failed parsing etherscan.io response, parsed object is null`);
      if (!responseObj.status)
         throw new Error(`Failed getting wallet balance from etherscan.io, response status is ${responseObj.status}`);

      if (typeof responseObj.result === 'string')
         responseObj.result = parseFloat(responseObj.result);

      if (typeof responseObj.result !== 'number')
         throw new Error(`Failed getting wallet balance from etherscan.io, unexpected result object type ${typeof responseObj.result}`);

      balances[this.getSymbol()] = {
         amount: responseObj.result / Math.pow(10, 18),
         name: this.getName(),
         symbol: this.getSymbol(),
      };

      return Object.values (balances);
   }

   aggregateTokenTxs (txs, bcAddress) {
      let balances = {};

      txs.forEach( tx => {
         let symbol = tx['tokenSymbol'];
         if (symbol && !symbol.length)
            // example https://etherscan.io/tx/0x6a325d69f82a6c4d69024d5f104e4476821a1e96ec341ba038696a0f76f05709
            symbol = 'ERC20';
         if (symbol && symbol.length) {
            let dir = tx.to.toLowerCase() === bcAddress.toLowerCase() ? 1 : -1;
            let decimal = parseInt(tx['tokenDecimal']);
            let balance = balances[symbol];
            let decimalValue = decimal ? Math.pow(10, decimal) : 1;
            let value = parseInt(tx.value) / decimalValue * dir;
            if (!balance) {
               balances[symbol] = {
                  amount: value,
                  symbol,
                  name: tx['tokenName'],
                  extra: {
                     contractAddress: tx['contractAddress'],
                  },
                  isToken: true,
               }
            } else {
               balance.amount += value;
            }
         } else
            console.log(`ccwallet | Ignoring token transaction without symbol, txhash ${tx['hash']}, contractAddress ${tx['contractAddress']}`);
      });

      return balances;
   }

   async readTx(hash) {
      let response = await request( this.getReadTxUrl(hash) )
          .catch ( err => {throw err} );

      let rawtx;
      try {
         rawtx = JSON.parse(response)
      } catch (e) {
         console.log(`blockcypher.com JSON returned: ${rawtx}`);
         throw new Error(`Failed reading TX from blockcypher.com, bad JSON returned: ${e.message}`);
      }
      const amount = parseInt(rawtx['result']['value'], 16) / Math.pow(10, 18);
      const fee = parseInt(rawtx['result']['gas'], 16) * parseInt(rawtx['result']['gasPrice'], 16) / Math.pow(10, 18);

      response = await request( this.getBlockByNumberUrl(rawtx['result']['blockNumber']) )
          .catch ( err => {throw err} );

      let rawblock;
      try {
         rawblock = JSON.parse(response)
      } catch (e) {
         console.log(`etherscan JSON returned: ${rawblock}`);
         throw new Error(`Failed reading TX from etherscan.io, bad JSON returned: ${e.message}`);
      }
      const timestamp = parseInt(rawblock['result']['timestamp'], 16) * 1000;

      let tx = {
         hash,
         timestamp,
         fee,
         amount,
         symbol: this.getSymbol(),
         currencyName: this.getName(),
      }

      return tx;
   }
};
