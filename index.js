
const
   blockchainNameBySymbol = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
   },
   blockchains = {
      'Ethereum': require('./blockchains/ethereum'),
      'Bitcoin': require('./blockchains/bitcoin'),
   };

module.exports = {
   blockchains,
   blockchainNameBySymbol,
};