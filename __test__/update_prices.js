// __test__/update_prices.js
// Script untuk update harga semua investment instruments dari API
// Run with: node __test__/update_prices.js

require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Database configuration with proper string handling
const dbConfig = {
  user: String(process.env.DB_USER || ''),
  host: String(process.env.DB_HOST || ''),
  database: String(process.env.DB_NAME || ''),
  password: String(process.env.DB_PASSWORD || ''),
  port: parseInt(process.env.DB_PORT || '5432'),
};

// Validate required fields
if (!dbConfig.user || !dbConfig.host || !dbConfig.database || !dbConfig.password) {
  console.error('❌ Missing required database configuration in .env file');
  console.error('Required: DB_USER, DB_HOST, DB_NAME, DB_PASSWORD');
  process.exit(1);
}

// Add SSL if enabled
if (process.env.DB_SSL === 'true') {
  if (process.env.DB_CA_PATH) {
    const caPath = path.resolve(process.cwd(), process.env.DB_CA_PATH);
    if (fs.existsSync(caPath)) {
      dbConfig.ssl = {
        rejectUnauthorized: true,
        ca: fs.readFileSync(caPath).toString(),
      };
      console.log('🔒 SSL enabled with CA certificate');
    } else {
      console.warn('⚠️  CA certificate file not found at:', caPath);
      dbConfig.ssl = { rejectUnauthorized: false };
      console.log('🔒 SSL enabled without certificate verification');
    }
  } else {
    dbConfig.ssl = { rejectUnauthorized: false };
    console.log('🔒 SSL enabled without certificate verification');
  }
}

const pool = new Pool(dbConfig);

// API Keys - ensure they are strings
const ALPHA_VANTAGE_KEY = String(process.env.ALPHA_VANTAGE_API_KEY || '');
const FINNHUB_KEY = String(process.env.FINNHUB_API_KEY || '');

// Statistics
const stats = {
  total: 0,
  success: 0,
  cached: 0,
  failed: 0,
  skipped: 0,
  errors: [],
};

// Cache for exchange rate
let cachedUSDtoIDR = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Get USD to IDR exchange rate with multiple fallbacks
 */
async function getUSDtoIDR() {
  // Return cached value if still valid
  if (cachedUSDtoIDR && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return cachedUSDtoIDR;
  }

  const apis = [
    {
      name: 'ExchangeRate-API',
      fetch: async () => {
        const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
          timeout: 10000,
        });
        return response.data.rates?.IDR;
      }
    },
    {
      name: 'Yahoo Finance (USDIDR)',
      fetch: async () => {
        const response = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/USDIDR=X', {
          params: { interval: '1d', range: '1d' },
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        return response.data.chart?.result?.[0]?.meta?.regularMarketPrice;
      }
    },
    {
      name: 'CurrencyAPI',
      fetch: async () => {
        const response = await axios.get('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', {
          timeout: 10000,
        });
        return response.data.usd?.idr;
      }
    },
    {
      name: 'FreeCurrencyAPI',
      fetch: async () => {
        const response = await axios.get('https://api.freecurrencyapi.com/v1/latest', {
          params: {
            apikey: 'fca_live_SkrD6GQubAAA8DGpvmOJ6XLNQvLB8iVYSDRkMStH',
            base_currency: 'USD',
            currencies: 'IDR'
          },
          timeout: 10000,
        });
        return response.data.data?.IDR;
      }
    }
  ];

  for (const api of apis) {
    try {
      console.log(`💱 Trying ${api.name}...`);
      const rate = await api.fetch();
      
      if (rate && rate > 0) {
        cachedUSDtoIDR = rate;
        cacheTimestamp = Date.now();
        console.log(`✅ Exchange Rate (${api.name}): 1 USD = Rp ${rate.toLocaleString('id-ID', { maximumFractionDigits: 2 })}`);
        return rate;
      }
    } catch (error) {
      console.log(`   ❌ ${api.name} failed: ${error.message}`);
    }
  }

  // All APIs failed, use fallback
  console.warn('⚠️  All exchange rate APIs failed, using fallback: Rp 15,800');
  cachedUSDtoIDR = 15800;
  cacheTimestamp = Date.now();
  return 15800;
}

/**
 * Fetch price from CoinGecko
 */
async function fetchFromCoinGecko(coinId) {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: { 
          ids: coinId, 
          vs_currencies: 'usd,idr',
          precision: 'full'
        },
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    const data = response.data[coinId];
    if (!data || !data.usd) {
      throw new Error('Coin not found or invalid response');
    }
    
    // If IDR not available, calculate it
    const usdToIDR = await getUSDtoIDR();
    const priceIDR = data.idr || (data.usd * usdToIDR);
    
    return {
      price: data.usd,
      priceIDR: priceIDR,
      source: 'CoinGecko',
      currency: 'USD',
    };
  } catch (error) {
    throw new Error(`CoinGecko: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Fetch price from Yahoo Finance
 */
async function fetchFromYahooFinance(ticker) {
  try {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`,
      {
        params: { interval: '1d', range: '1d' },
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    const result = response.data.chart?.result?.[0];
    if (!result || !result.meta || result.meta.regularMarketPrice == null) {
      throw new Error('Invalid response structure or no price available');
    }

    const price = result.meta.regularMarketPrice;
    const currency = result.meta.currency || 'USD';
    
    // Determine if this is IDR based
    const isIDR = currency === 'IDR' || ticker.includes('.JK') || ticker.includes('.JKT');

    if (isIDR) {
      return {
        price: price,
        priceIDR: price,
        source: 'Yahoo Finance',
        currency: 'IDR',
      };
    } else {
      const usdToIDR = await getUSDtoIDR();
      return {
        price: price,
        priceIDR: price * usdToIDR,
        source: 'Yahoo Finance',
        currency: currency,
      };
    }
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Ticker not found on Yahoo Finance');
    }
    throw new Error(`Yahoo: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Fetch price from Alpha Vantage
 */
async function fetchFromAlphaVantage(symbol) {
  if (!ALPHA_VANTAGE_KEY || ALPHA_VANTAGE_KEY.length === 0) {
    throw new Error('Alpha Vantage requires valid API key in .env');
  }

  try {
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: symbol,
        apikey: ALPHA_VANTAGE_KEY,
      },
      timeout: 15000,
    });

    // Check for API error messages
    if (response.data['Error Message']) {
      throw new Error(response.data['Error Message']);
    }

    if (response.data['Note']) {
      throw new Error('API rate limit reached');
    }

    const quote = response.data['Global Quote'];
    if (!quote || !quote['05. price']) {
      throw new Error('Invalid response or symbol not found');
    }

    const price = parseFloat(quote['05. price']);
    if (isNaN(price)) {
      throw new Error('Invalid price value');
    }

    const usdToIDR = await getUSDtoIDR();

    return {
      price: price,
      priceIDR: price * usdToIDR,
      source: 'Alpha Vantage',
      currency: 'USD',
    };
  } catch (error) {
    throw new Error(`AlphaVantage: ${error.message}`);
  }
}

/**
 * Fetch price from Finnhub
 */
async function fetchFromFinnhub(symbol) {
  if (!FINNHUB_KEY || FINNHUB_KEY.length === 0) {
    throw new Error('Finnhub requires valid API key in .env');
  }

  try {
    const response = await axios.get('https://finnhub.io/api/v1/quote', {
      params: { symbol: symbol, token: FINNHUB_KEY },
      timeout: 15000,
    });

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    if (!response.data || response.data.c == null || response.data.c === 0) {
      throw new Error('Invalid response or symbol not found');
    }

    const price = response.data.c;
    const usdToIDR = await getUSDtoIDR();

    return {
      price: price,
      priceIDR: price * usdToIDR,
      source: 'Finnhub',
      currency: 'USD',
    };
  } catch (error) {
    throw new Error(`Finnhub: ${error.message}`);
  }
}

/**
 * Fetch price based on source with retry logic
 */
async function fetchPrice(priceSource, priceMapping, retries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = 5000 * attempt; // 5s, 10s, 15s
        console.log(`   🔄 Retry attempt ${attempt}/${retries} (waiting ${delay/1000}s)...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      switch (priceSource.toLowerCase()) {
        case 'coingecko':
          return await fetchFromCoinGecko(priceMapping);
        
        case 'yahoo_finance':
        case 'yahoo':
          return await fetchFromYahooFinance(priceMapping);
        
        case 'alpha_vantage':
        case 'alphavantage':
          return await fetchFromAlphaVantage(priceMapping);
        
        case 'finnhub':
          return await fetchFromFinnhub(priceMapping);
        
        default:
          throw new Error(`Unknown source: ${priceSource}`);
      }
    } catch (error) {
      lastError = error;
      
      // Don't retry for certain errors
      if (error.message.includes('not found') || 
          error.message.includes('Invalid') ||
          error.message.includes('requires valid API key')) {
        throw error;
      }
      
      // Special handling for rate limit (429)
      if (error.message.includes('429')) {
        console.log(`   ⏳ Rate limited, waiting longer...`);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Extra 10s for rate limit
        }
      }
    }
  }
  
  throw lastError;
}

/**
 * Update price in database
 */
async function updatePriceInDB(instrumentId, priceData, error = null) {
  const query = `
    UPDATE investment_instruments 
    SET last_price = $1,
        last_price_idr = $2,
        last_updated = $3,
        price_fetch_error = $4
    WHERE id = $5
  `;

  await pool.query(query, [
    priceData?.price || null,
    priceData?.priceIDR || null,
    new Date(),
    error,
    instrumentId,
  ]);
}

/**
 * Process single instrument
 */
async function processInstrument(instrument) {
  const { id, name, symbol, price_source, price_mapping } = instrument;
  
  console.log(`\n📊 Processing: ${symbol} - ${name}`);
  console.log(`   Source: ${price_source} | Mapping: ${price_mapping}`);

  // Skip manual instruments
  if (price_source === 'manual') {
    console.log('   ⏭️  Skipped (manual update)');
    stats.skipped++;
    return;
  }

  // Skip if no mapping
  if (!price_mapping) {
    console.log('   ⏭️  Skipped (no mapping configured)');
    stats.skipped++;
    return;
  }

  try {
    const priceData = await fetchPrice(price_source, price_mapping);
    
    await updatePriceInDB(id, priceData, null);
    
    const displayCurrency = priceData.currency || 'USD';
    const displayPrice = displayCurrency === 'IDR' ? 
      `Rp ${priceData.price.toLocaleString('id-ID', { maximumFractionDigits: 0 })}` :
      `$${priceData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    console.log(`   ✅ Success: ${displayPrice} = Rp ${priceData.priceIDR.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`);
    console.log(`   📍 Source: ${priceData.source}`);
    stats.success++;
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    
    await updatePriceInDB(id, null, error.message);
    
    stats.failed++;
    stats.errors.push({
      instrument: `${symbol} - ${name}`,
      source: price_source,
      mapping: price_mapping,
      error: error.message,
    });
  }
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(80));
  console.log('INVESTMENT INSTRUMENTS PRICE UPDATER');
  console.log('='.repeat(80));
  console.log(`Started at: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
  console.log(`Working directory: ${process.cwd()}\n`);

  try {
    // Verify .env is loaded
    console.log('🔍 Checking environment variables...');
    if (!process.env.DB_USER) {
      throw new Error('.env file not loaded or DB_USER not set');
    }
    console.log('✅ Environment variables loaded\n');

    // Show database config (without password)
    console.log('📋 Database Configuration:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Port: ${dbConfig.port}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   SSL: ${dbConfig.ssl ? 'Enabled' : 'Disabled'}\n`);

    // Test database connection
    console.log('🔌 Testing database connection...');
    const testResult = await pool.query('SELECT NOW() as now, version() as version');
    console.log('✅ Database connected');
    console.log(`   Server time: ${testResult.rows[0].now}`);
    console.log(`   PostgreSQL: ${testResult.rows[0].version.split(',')[0]}\n`);

    // Get exchange rate first
    console.log('💱 Fetching exchange rate...');
    await getUSDtoIDR();
    console.log('');

    // Get all instruments
    const result = await pool.query(`
      SELECT id, name, symbol, asset_type, price_source, price_mapping, 
             last_updated, last_price, last_price_idr
      FROM investment_instruments
      WHERE is_active = true
      ORDER BY 
        CASE asset_type
          WHEN 'crypto' THEN 1
          WHEN 'stock' THEN 2
          WHEN 'mutual_fund' THEN 3
          WHEN 'bond' THEN 4
          WHEN 'commodity' THEN 5
          ELSE 6
        END,
        name
    `);

    const instruments = result.rows;
    stats.total = instruments.length;

    console.log(`📦 Found ${instruments.length} active instruments\n`);

    if (instruments.length === 0) {
      console.log('No instruments to update. Exiting.');
      return;
    }

    // Group by asset type for organized output
    const groupedInstruments = instruments.reduce((acc, inst) => {
      if (!acc[inst.asset_type]) acc[inst.asset_type] = [];
      acc[inst.asset_type].push(inst);
      return acc;
    }, {});

    // Process instruments by type
    for (const [assetType, typeInstruments] of Object.entries(groupedInstruments)) {
      console.log('─'.repeat(80));
      console.log(`📂 ${assetType.toUpperCase()} (${typeInstruments.length} instruments)`);
      console.log('─'.repeat(80));

      for (const instrument of typeInstruments) {
        await processInstrument(instrument);
        
        // Small delay between instruments to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      console.log('');
    }

    // Print summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Instruments:  ${stats.total}`);
    console.log(`✅ Success:         ${stats.success}`);
    console.log(`❌ Failed:          ${stats.failed}`);
    console.log(`⏭️  Skipped:         ${stats.skipped}`);
    
    const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0;
    console.log(`📊 Success Rate:    ${successRate}%`);
    console.log('='.repeat(80));

    if (stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      stats.errors.forEach((err, index) => {
        console.log(`\n${index + 1}. ${err.instrument}`);
        console.log(`   Source: ${err.source} | Mapping: ${err.mapping}`);
        console.log(`   Error: ${err.error}`);
      });
    }

    console.log(`\nCompleted at: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n💥 Fatal Error:', error);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { getUSDtoIDR, fetchPrice };