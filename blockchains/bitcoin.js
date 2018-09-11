
const Blockchain = require ('./base/Blockchain')
    , request = require('request-promise');

module.exports = class Bitcoin extends Blockchain {

   constructor () {
      super();
      this.rootCurrency = {
         symbol: `BTC`,
         name: `Bitcoin`,
      };
   }

   getAccountBalanceUrl(bcAddress) {
      return `https://blockchain.info/q/addressbalance/${bcAddress}`;
   }

   async getBalance (bcAddress) {
      // eth ---------------------------
      let response = await request( this.getAccountBalanceUrl(bcAddress) )
         .catch ( err => {throw err} );

      let balances = {};
      balances[this.rootCurrency.symbol] = {
         amount: parseFloat(response) / 100000000,
         name: this.rootCurrency.name,
         symbol: this.rootCurrency.symbol,
      };

      return Object.values (balances);
   }
};
