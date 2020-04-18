
const Blockchain = require ('./base/Blockchain')
    , moment = require('moment')
    , request = require('request-promise');

module.exports = class Bitcoin extends Blockchain {

   constructor () {
      super();
   }

   getSymbol() {
      return 'BTC';
   }

   getName() {
      return 'Bitcoin';
   }

   parseHashFromLink(link) {
      const tryparse = (tag) => {
         let pos = link.indexOf(tag);
         if (pos !== -1)
            return link.substr(pos + tag.length);
      }
      return tryparse('blockstream.info/tx/')
         || tryparse('blockchain.com/btc/tx/')
         || tryparse('btc.com/')
         || tryparse('live.blockcypher.com/btc/tx/')
         || tryparse('explorer.bitcoin.com/btc/tx/')
         || tryparse('blockchair.com/bitcoin/transaction/')
         || tryparse('sochain.com/tx/BTC/')
         || tryparse('bitaps.com/')
         || tryparse('blockchain.info/btc/tx/')
         ;
   }

   getAccountBalanceUrl(bcAddress) {
      return `https://blockchain.info/q/addressbalance/${bcAddress}`;
   }

   getReadTxUrl(hash) {
      return `https://api.blockcypher.com/v1/btc/main/txs/${hash}`;
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
      let amount = rawtx['outputs'] && rawtx['outputs'].reduce( (sum, v) => sum + v['value'] / 100000000, 0) || 0;
      let tx = {
         hash: rawtx['hash'],
         timestamp: +moment(rawtx['confirmed']),
         fee: rawtx['fees'] / 100000000,
         amount,
         symbol: this.getSymbol(),
         currencyName: this.getName(),
      }

      return tx;
   }

   async getBalance(bcAddress) {
      let response = await request( this.getAccountBalanceUrl(bcAddress) )
         .catch ( err => {throw err} );

      let balances = {};
      balances[this.getSymbol()] = {
         amount: parseFloat(response) / 100000000,
         name: this.getName(),
         symbol: this.getSymbol(),
      };

      return Object.values (balances);
   }
};
