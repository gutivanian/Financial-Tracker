// test_price.js
// Run with: node test_price.js

const https = require('https');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...headers
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 429) {
          reject(new Error('Rate limited (429) - Too many requests'));
          return;
        }
        
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          return;
        }

        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON Parse Error: ${data.substring(0, 100)}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test data
const testData = {
  crypto: [
    { symbol: 'BTC', coinId: 'bitcoin', name: 'Bitcoin' },
    { symbol: 'ETH', coinId: 'ethereum', name: 'Ethereum' },
    { symbol: 'BNB', coinId: 'binancecoin', name: 'Binance Coin' },
    { symbol: 'SOL', coinId: 'solana', name: 'Solana' },
    { symbol: 'ADA', coinId: 'cardano', name: 'Cardano' },
  ],
  stocksUS: [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
  ],
  stocksID: [
    { symbol: 'BBCA.JK', name: 'Bank Central Asia' },
    { symbol: 'BMRI.JK', name: 'Bank Mandiri' },
    { symbol: 'TLKM.JK', name: 'Telkom Indonesia' },
    { symbol: 'BBRI.JK', name: 'Bank Rakyat Indonesia' },
    { symbol: 'ASII.JK', name: 'Astra International' },
  ],
  commodities: [
    { symbol: 'GC=F', name: 'Gold Futures' },
    { symbol: 'SI=F', name: 'Silver Futures' },
    { symbol: 'CL=F', name: 'Crude Oil Futures' },
  ]
};

// Statistics
const stats = {
  total: 0,
  success: 0,
  failed: 0,
  cached: 0,
  errors: [],
};

async function getUSDtoIDR() {
  const apis = [
    {
      name: 'FreeCurrencyAPI',
      url: 'https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_SkrD6GQubAAA8DGpvmOJ6XLNQvLB8iVYSDRkMStH&base_currency=USD&currencies=IDR',
      parse: (data) => data.data?.IDR
    },
    {
      name: 'ExchangeRate-API',
      url: 'https://api.exchangerate-api.com/v4/latest/USD',
      parse: (data) => data.rates?.IDR
    },
    {
      name: 'Yahoo Finance (USDIDR)',
      url: 'https://query1.finance.yahoo.com/v8/finance/chart/USDIDR=X?interval=1d&range=1d',
      parse: (data) => data.chart?.result?.[0]?.meta?.regularMarketPrice
    },
    {
      name: 'CurrencyAPI',
      url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
      parse: (data) => data.usd?.idr
    }
  ];

  log(colors.cyan, '\n💱 Fetching USD to IDR exchange rate...');
  
  for (const api of apis) {
    try {
      log(colors.yellow, `   Trying ${api.name}...`);
      const data = await httpsGet(api.url);
      const rate = api.parse(data);
      
      if (rate && rate > 0) {
        log(colors.green, `✅ Exchange Rate (${api.name}): 1 USD = Rp ${rate.toLocaleString('id-ID', {maximumFractionDigits: 2})}`);
        return rate;
      }
    } catch (error) {
      log(colors.red, `   ❌ ${api.name} failed: ${error.message}`);
    }
  }
  
  // All APIs failed, use fallback
  log(colors.yellow, '⚠️  All exchange rate APIs failed');
  log(colors.yellow, '📌 Using fallback rate: Rp 15,800');
  return 15800;
}

async function fetchCrypto(usdToIDR) {
  log(colors.bright + colors.magenta, '\n' + '='.repeat(80));
  log(colors.bright + colors.magenta, '🪙 FETCHING CRYPTO PRICES FROM COINGECKO');
  log(colors.bright + colors.magenta, '='.repeat(80));
  
  try {
    const ids = testData.crypto.map(c => c.coinId).join(',');
    log(colors.cyan, `\n📡 Requesting: ${ids}`);
    
    const data = await httpsGet(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,idr`
    );
    
    console.log('\n' + '─'.repeat(80));
    console.log('Symbol'.padEnd(8) + 'Name'.padEnd(20) + 'USD Price'.padEnd(20) + 'IDR Price');
    console.log('─'.repeat(80));
    
    testData.crypto.forEach(crypto => {
      stats.total++;
      const price = data[crypto.coinId];
      
      if (price && price.usd) {
        stats.success++;
        const usdStr = `$${price.usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        // Calculate IDR from USD if not available
        const idrPrice = price.idr || (price.usd * usdToIDR);
        const idrStr = `Rp ${idrPrice.toLocaleString('id-ID', {maximumFractionDigits: 0})}`;
        
        log(
          colors.green,
          crypto.symbol.padEnd(8) + 
          crypto.name.padEnd(20) + 
          usdStr.padEnd(20) + 
          idrStr
        );
      } else {
        stats.failed++;
        log(colors.red, `${crypto.symbol.padEnd(8)} ${crypto.name.padEnd(20)} ❌ No data`);
        stats.errors.push(`${crypto.symbol}: No data in response`);
      }
    });
    
    console.log('─'.repeat(80));
    
    return data;
  } catch (error) {
    log(colors.red, `\n❌ CoinGecko Error: ${error.message}`);
    
    // Try individual crypto as fallback
    log(colors.yellow, '⚠️  Trying alternative method...');
    
    let anySuccess = false;
    console.log('\n' + '─'.repeat(80));
    console.log('Symbol'.padEnd(8) + 'Name'.padEnd(20) + 'USD Price'.padEnd(20) + 'IDR Price');
    console.log('─'.repeat(80));
    
    for (const crypto of testData.crypto) {
      stats.total++;
      try {
        const data = await httpsGet(
          `https://api.coingecko.com/api/v3/simple/price?ids=${crypto.coinId}&vs_currencies=usd`
        );
        
        if (data[crypto.coinId] && data[crypto.coinId].usd) {
          stats.success++;
          anySuccess = true;
          const usdPrice = data[crypto.coinId].usd;
          const idrPrice = usdPrice * usdToIDR;
          
          const usdStr = `$${usdPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
          const idrStr = `Rp ${idrPrice.toLocaleString('id-ID', {maximumFractionDigits: 0})}`;
          
          log(
            colors.green,
            crypto.symbol.padEnd(8) + 
            crypto.name.padEnd(20) + 
            usdStr.padEnd(20) + 
            idrStr
          );
        } else {
          throw new Error('No data');
        }
        
        await sleep(500); // Small delay between requests
      } catch (err) {
        stats.failed++;
        log(colors.red, `${crypto.symbol.padEnd(8)} ${crypto.name.padEnd(20)} ❌ ${err.message}`);
        stats.errors.push(`${crypto.symbol}: ${err.message}`);
      }
    }
    
    console.log('─'.repeat(80));
    
    if (!anySuccess) {
      stats.errors.push(`CoinGecko API: All requests failed`);
    }
    
    return null;
  }
}

async function fetchStock(ticker, name, isIDR = false, usdToIDR = 15800) {
  stats.total++;
  
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    const data = await httpsGet(url);
    
    if (!data.chart || !data.chart.result || !data.chart.result[0]) {
      throw new Error('Invalid response structure');
    }
    
    const result = data.chart.result[0];
    
    if (!result.meta || result.meta.regularMarketPrice === undefined) {
      throw new Error('No price in response');
    }
    
    const price = result.meta.regularMarketPrice;
    const currency = result.meta.currency || 'USD';
    
    stats.success++;
    
    if (isIDR) {
      return {
        symbol: ticker,
        name,
        price,
        currency: 'IDR',
        priceIDR: price,
        success: true,
      };
    } else {
      return {
        symbol: ticker,
        name,
        price,
        currency: 'USD',
        priceIDR: price * usdToIDR,
        exchangeRate: usdToIDR,
        success: true,
      };
    }
  } catch (error) {
    stats.failed++;
    stats.errors.push(`${ticker}: ${error.message}`);
    
    return {
      symbol: ticker,
      name,
      error: error.message,
      success: false,
    };
  }
}

async function fetchUSStocks(usdToIDR) {
  log(colors.bright + colors.blue, '\n' + '='.repeat(80));
  log(colors.bright + colors.blue, '📈 FETCHING US STOCKS FROM YAHOO FINANCE');
  log(colors.bright + colors.blue, '='.repeat(80));
  
  console.log('\n' + '─'.repeat(80));
  console.log('Symbol'.padEnd(8) + 'Name'.padEnd(25) + 'USD Price'.padEnd(20) + 'IDR Price');
  console.log('─'.repeat(80));
  
  for (const stock of testData.stocksUS) {
    log(colors.cyan, `\n📡 Fetching ${stock.symbol}...`);
    
    const data = await fetchStock(stock.symbol, stock.name, false, usdToIDR);
    
    if (data.success) {
      const usdStr = `$${data.price.toFixed(2)}`;
      const idrStr = `Rp ${data.priceIDR.toLocaleString('id-ID', {maximumFractionDigits: 0})}`;
      
      log(
        colors.green,
        `${stock.symbol.padEnd(8)} ${stock.name.padEnd(25)} ${usdStr.padEnd(20)} ${idrStr}`
      );
    } else {
      log(colors.red, `${stock.symbol.padEnd(8)} ${stock.name.padEnd(25)} ❌ ${data.error}`);
    }
    
    // Delay to avoid rate limiting
    if (testData.stocksUS.indexOf(stock) < testData.stocksUS.length - 1) {
      await sleep(1500); // 1.5 second delay
      log(colors.yellow, '⏳ Waiting 1.5 seconds...');
    }
  }
  
  console.log('─'.repeat(80));
}

async function fetchIDStocks() {
  log(colors.bright + colors.green, '\n' + '='.repeat(80));
  log(colors.bright + colors.green, '🇮🇩 FETCHING INDONESIAN STOCKS FROM YAHOO FINANCE');
  log(colors.bright + colors.green, '='.repeat(80));
  
  console.log('\n' + '─'.repeat(80));
  console.log('Symbol'.padEnd(12) + 'Name'.padEnd(30) + 'IDR Price');
  console.log('─'.repeat(80));
  
  for (const stock of testData.stocksID) {
    log(colors.cyan, `\n📡 Fetching ${stock.symbol}...`);
    
    const data = await fetchStock(stock.symbol, stock.name, true);
    
    if (data.success) {
      const idrStr = `Rp ${data.price.toLocaleString('id-ID', {maximumFractionDigits: 0})}`;
      log(colors.green, `${stock.symbol.padEnd(12)} ${stock.name.padEnd(30)} ${idrStr}`);
    } else {
      log(colors.red, `${stock.symbol.padEnd(12)} ${stock.name.padEnd(30)} ❌ ${data.error}`);
    }
    
    // Delay to avoid rate limiting
    if (testData.stocksID.indexOf(stock) < testData.stocksID.length - 1) {
      await sleep(1500);
      log(colors.yellow, '⏳ Waiting 1.5 seconds...');
    }
  }
  
  console.log('─'.repeat(80));
}

async function fetchCommodities(usdToIDR) {
  log(colors.bright + colors.yellow, '\n' + '='.repeat(80));
  log(colors.bright + colors.yellow, '🥇 FETCHING COMMODITIES FROM YAHOO FINANCE');
  log(colors.bright + colors.yellow, '='.repeat(80));
  
  console.log('\n' + '─'.repeat(80));
  console.log('Symbol'.padEnd(10) + 'Name'.padEnd(25) + 'USD Price'.padEnd(20) + 'IDR Price');
  console.log('─'.repeat(80));
  
  for (const commodity of testData.commodities) {
    log(colors.cyan, `\n📡 Fetching ${commodity.symbol}...`);
    
    const data = await fetchStock(commodity.symbol, commodity.name, false, usdToIDR);
    
    if (data.success) {
      const usdStr = `$${data.price.toFixed(2)}`;
      const idrStr = `Rp ${data.priceIDR.toLocaleString('id-ID', {maximumFractionDigits: 0})}`;
      
      log(
        colors.green,
        `${commodity.symbol.padEnd(10)} ${commodity.name.padEnd(25)} ${usdStr.padEnd(20)} ${idrStr}`
      );
    } else {
      log(colors.red, `${commodity.symbol.padEnd(10)} ${commodity.name.padEnd(25)} ❌ ${data.error}`);
    }
    
    // Delay to avoid rate limiting
    if (testData.commodities.indexOf(commodity) < testData.commodities.length - 1) {
      await sleep(1500);
      log(colors.yellow, '⏳ Waiting 1.5 seconds...');
    }
  }
  
  console.log('─'.repeat(80));
}

async function printSummary(duration) {
  log(colors.bright + colors.cyan, '\n' + '='.repeat(80));
  log(colors.bright + colors.cyan, '📊 TEST SUMMARY');
  log(colors.bright + colors.cyan, '='.repeat(80));
  
  const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0;
  
  console.log('\n');
  log(colors.cyan, `Total Requests:  ${stats.total}`);
  log(colors.green, `✅ Successful:   ${stats.success} (${successRate}%)`);
  log(colors.red, `❌ Failed:       ${stats.failed}`);
  log(colors.blue, `⏱️  Duration:     ${duration} seconds`);
  
  if (stats.errors.length > 0) {
    log(colors.yellow, '\n⚠️  ERRORS:');
    const uniqueErrors = [...new Set(stats.errors)];
    uniqueErrors.slice(0, 10).forEach((error, index) => {
      log(colors.red, `   ${index + 1}. ${error}`);
    });
    if (uniqueErrors.length > 10) {
      log(colors.yellow, `   ... and ${uniqueErrors.length - 10} more errors`);
    }
  }
  
  console.log('\n');
  
  if (stats.success === stats.total && stats.total > 0) {
    log(colors.bright + colors.green, '🎉 ALL TESTS PASSED!');
  } else if (stats.success > stats.failed) {
    log(colors.bright + colors.yellow, '⚠️  SOME TESTS FAILED');
  } else if (stats.success > 0) {
    log(colors.bright + colors.red, '❌ MOST TESTS FAILED');
  } else {
    log(colors.bright + colors.red, '❌ ALL TESTS FAILED');
  }
  
  log(colors.bright + colors.cyan, '='.repeat(80) + '\n');
}

// Main function
async function main() {
  console.clear();
  
  log(colors.bright + colors.cyan, '='.repeat(80));
  log(colors.bright + colors.cyan, 'PRICE API TESTING SUITE');
  log(colors.bright + colors.cyan, '='.repeat(80));
  log(colors.cyan, '\nTesting multiple price data sources with rate limit protection\n');
  
  const startTime = Date.now();
  
  try {
    // Get exchange rate
    const usdToIDR = await getUSDtoIDR();
    
    // Fetch crypto prices
    await fetchCrypto(usdToIDR);
    
    log(colors.yellow, '\n⏳ Waiting 2 seconds before fetching stocks...');
    await sleep(2000);
    
    // Fetch US stocks
    await fetchUSStocks(usdToIDR);
    
    log(colors.yellow, '\n⏳ Waiting 2 seconds before fetching Indonesian stocks...');
    await sleep(2000);
    
    // Fetch Indonesian stocks
    await fetchIDStocks();
    
    log(colors.yellow, '\n⏳ Waiting 2 seconds before fetching commodities...');
    await sleep(2000);
    
    // Fetch commodities
    await fetchCommodities(usdToIDR);
    
  } catch (error) {
    log(colors.red, `\n❌ Fatal Error: ${error.message}`);
    log(colors.red, `Stack: ${error.stack}`);
    stats.errors.push(`Fatal: ${error.message}`);
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Print summary
  await printSummary(duration);
}

// Run the test
main().catch(error => {
  log(colors.red, `\n💥 Unhandled Error: ${error.message}`);
  log(colors.red, `Stack: ${error.stack}`);
  process.exit(1);
});