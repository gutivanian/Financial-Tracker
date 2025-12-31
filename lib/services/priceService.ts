// lib/services/priceService.ts
import axios, { AxiosError } from 'axios';
import NodeCache from 'node-cache';
import { query as dbQuery } from '@/lib/db';

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  cache: {
    ttl: 300, // 5 minutes
  },
  batch: {
    defaultSize: 3,
    delayMs: 2000,
    coingeckoSize: 5,
  },
  api: {
    timeout: 10000,
    retries: 3,
    retryDelayMs: 1000,
    rateLimitRetryDelayMs: 60000, // 60 seconds for 429 errors
  },
  exchange: {
    fallbackRate: 15800,
  },
  validation: {
    maxPriceChangePercent: 0.5, // 50% max change
  },
} as const;

// ============================================================================
// TYPES
// ============================================================================
export type PriceSource = 'coingecko' | 'yahoo_finance' | 'alpha_vantage' | 'finnhub';
export type Currency = 'USD' | 'IDR';
export type AssetType = 'crypto' | 'stocks_id' | 'stocks_us' | 'commodities' | 'bonds';

export interface PriceData {
  price: number;
  currency: Currency;
  priceInIDR?: number;
  exchangeRate?: number;
  source: string;
  lastUpdated: string;
  fromCache?: boolean;
  cacheAge?: number; // in minutes
}

interface APIMetrics {
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  avgResponseTime: number;
  lastError?: string;
  rateLimitHits: number;
}

interface PriceSourceInfo {
  value: PriceSource;
  label: string;
  description: string;
  supports: AssetType[];
  batchSize: number;
}

// ============================================================================
// STATE
// ============================================================================
const priceCache = new NodeCache({ stdTTL: CONFIG.cache.ttl });
const metrics: Record<string, APIMetrics> = {};
let lastKnownExchangeRate: number = CONFIG.exchange.fallbackRate;

// API Keys
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
const FINNHUB_KEY = process.env.FINNHUB_API_KEY || 'demo';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Record API call metrics
 */
function recordAPICall(
  source: string,
  success: boolean,
  duration: number,
  error?: string,
  isRateLimited = false
): void {
  if (!metrics[source]) {
    metrics[source] = {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      avgResponseTime: 0,
      rateLimitHits: 0,
    };
  }

  const m = metrics[source];
  m.totalCalls++;
  if (success) {
    m.successCalls++;
  } else {
    m.failedCalls++;
    m.lastError = error;
  }
  if (isRateLimited) {
    m.rateLimitHits++;
  }
  m.avgResponseTime = (m.avgResponseTime * (m.totalCalls - 1) + duration) / m.totalCalls;
}

/**
 * Get API metrics
 */
export function getAPIMetrics(): Record<string, APIMetrics> {
  return { ...metrics };
}

/**
 * Reset API metrics
 */
export function resetAPIMetrics(): void {
  Object.keys(metrics).forEach(key => delete metrics[key]);
}

/**
 * Check if error is a rate limit error (429)
 */
function isRateLimitError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 429;
  }
  return false;
}

/**
 * Fetch with retry logic and exponential backoff
 * Special handling for 429 rate limit errors
 */
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  source: string,
  maxRetries = CONFIG.api.retries,
  baseDelay = CONFIG.api.retryDelayMs
): Promise<T> {
  const startTime = Date.now();
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fetchFn();
      const duration = Date.now() - startTime;
      recordAPICall(source, true, duration);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if it's a rate limit error
      const isRateLimit = isRateLimitError(error);
      
      // Don't retry on the last attempt
      if (attempt === maxRetries - 1) {
        const duration = Date.now() - startTime;
        recordAPICall(source, false, duration, lastError.message, isRateLimit);
        break;
      }

      // Special handling for rate limit errors (429)
      if (isRateLimit) {
        const rateLimitDelay = CONFIG.api.rateLimitRetryDelayMs;
        console.warn(
          `⚠️  Rate limit hit for ${source}. Waiting ${rateLimitDelay / 1000}s before retry ${attempt + 1}/${maxRetries}`
        );
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
      } else {
        // Exponential backoff for other errors: 1s, 2s, 4s, etc.
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⏳ Retry ${attempt + 1}/${maxRetries} for ${source} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Validate price data
 */
function validatePrice(
  price: number,
  previousPrice?: number,
  symbol?: string
): boolean {
  if (!isFinite(price) || price <= 0) {
    console.warn(`❌ Invalid price value: ${price} for ${symbol}`);
    return false;
  }

  // Check for unrealistic price changes
  if (previousPrice && previousPrice > 0) {
    const changePercent = Math.abs(price - previousPrice) / previousPrice;
    if (changePercent > CONFIG.validation.maxPriceChangePercent) {
      console.warn(
        `⚠️  Suspicious price change for ${symbol}: ${previousPrice} -> ${price} (${(changePercent * 100).toFixed(2)}%)`
      );
      // Return true but log warning - might be legitimate in volatile markets
    }
  }

  return true;
}

/**
 * Handle Axios errors with better error messages
 */
function handleAxiosError(error: unknown, source: string, identifier: string): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      const status = axiosError.response.status;
      if (status === 429) {
        throw new Error(
          `${source} API rate limit exceeded for ${identifier}. Please wait before retrying.`
        );
      }
      throw new Error(
        `${source} API error (${status}): ${JSON.stringify(axiosError.response.data)} for ${identifier}`
      );
    } else if (axiosError.request) {
      throw new Error(`${source} API network error: No response received for ${identifier}`);
    }
  }
  
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(`${source} API failed for ${identifier}: ${message}`);
}

// ============================================================================
// EXCHANGE RATE
// ============================================================================

/**
 * Get current exchange rate USD to IDR
 */
export async function getUSDtoIDRRate(): Promise<number> {
  const cacheKey = 'exchange_rate_usd_idr';
  const cached = priceCache.get<number>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithRetry(
      () =>
        axios.get('https://api.exchangerate.host/latest', {
          params: {
            base: 'USD',
            symbols: 'IDR',
          },
          timeout: 5000,
        }),
      'exchange_rate'
    );

    const rate = response.data.rates?.IDR;
    if (!rate || typeof rate !== 'number' || rate <= 0) {
      throw new Error('Invalid IDR rate in response');
    }

    lastKnownExchangeRate = rate;
    priceCache.set(cacheKey, rate);
    console.log(`✅ Updated USD-IDR exchange rate: ${rate}`);
    return rate;
  } catch (error) {
    console.error('❌ Error fetching USD-IDR rate, using fallback:', error);
    return lastKnownExchangeRate;
  }
}

// ============================================================================
// PRICE FETCHING FUNCTIONS
// ============================================================================

/**
 * Fetch price from CoinGecko
 */
async function fetchFromCoinGecko(coinId: string): Promise<PriceData> {
  try {
    return await fetchWithRetry(
      async () => {
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price`,
          {
            params: {
              ids: coinId,
              vs_currencies: 'usd,idr',
            },
            timeout: CONFIG.api.timeout,
          }
        );

        const data = response.data[coinId];
        if (!data || !data.usd) {
          throw new Error(`No price data returned for ${coinId}`);
        }

        if (!validatePrice(data.usd, undefined, coinId)) {
          throw new Error(`Invalid price received for ${coinId}`);
        }

        return {
          price: data.usd,
          currency: 'USD' as Currency,
          priceInIDR: data.idr,
          exchangeRate: data.idr && data.usd ? data.idr / data.usd : undefined,
          source: 'CoinGecko',
          lastUpdated: new Date().toISOString(),
        };
      },
      'CoinGecko'
    );
  } catch (error) {
    handleAxiosError(error, 'CoinGecko', coinId);
  }
}

/**
 * Fetch price from Yahoo Finance
 */
async function fetchFromYahooFinance(ticker: string): Promise<PriceData> {
  try {
    return await fetchWithRetry(
      async () => {
        const response = await axios.get(
          `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`,
          {
            params: {
              interval: '1d',
              range: '1d',
            },
            timeout: CONFIG.api.timeout,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          }
        );

        const result = response.data.chart?.result?.[0];
        if (!result?.meta?.regularMarketPrice) {
          throw new Error('Invalid response structure from Yahoo Finance');
        }

        const price = result.meta.regularMarketPrice;
        const currency = result.meta.currency || 'USD';

        if (!validatePrice(price, undefined, ticker)) {
          throw new Error(`Invalid price received for ${ticker}`);
        }

        // Determine if price is in IDR or USD
        const isIDR = currency === 'IDR' || ticker.includes('.JK');

        const priceData: PriceData = {
          price,
          currency: isIDR ? 'IDR' : 'USD',
          source: 'Yahoo Finance',
          lastUpdated: new Date().toISOString(),
        };

        if (!isIDR) {
          const exchangeRate = await getUSDtoIDRRate();
          priceData.priceInIDR = price * exchangeRate;
          priceData.exchangeRate = exchangeRate;
        } else {
          priceData.priceInIDR = price;
        }

        return priceData;
      },
      'Yahoo Finance'
    );
  } catch (error) {
    handleAxiosError(error, 'Yahoo Finance', ticker);
  }
}

/**
 * Fetch price from Alpha Vantage
 */
async function fetchFromAlphaVantage(symbol: string): Promise<PriceData> {
  if (ALPHA_VANTAGE_KEY === 'demo') {
    throw new Error('Alpha Vantage requires API key. Set ALPHA_VANTAGE_API_KEY environment variable.');
  }

  try {
    return await fetchWithRetry(
      async () => {
        const response = await axios.get('https://www.alphavantage.co/query', {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: symbol,
            apikey: ALPHA_VANTAGE_KEY,
          },
          timeout: CONFIG.api.timeout,
        });

        const quote = response.data['Global Quote'];
        if (!quote || !quote['05. price']) {
          throw new Error('Invalid response structure from Alpha Vantage');
        }

        const price = parseFloat(quote['05. price']);
        if (!validatePrice(price, undefined, symbol)) {
          throw new Error(`Invalid price received for ${symbol}`);
        }

        const exchangeRate = await getUSDtoIDRRate();

        return {
          price,
          currency: 'USD' as Currency,
          priceInIDR: price * exchangeRate,
          exchangeRate,
          source: 'Alpha Vantage',
          lastUpdated: new Date().toISOString(),
        };
      },
      'Alpha Vantage'
    );
  } catch (error) {
    handleAxiosError(error, 'Alpha Vantage', symbol);
  }
}

/**
 * Fetch price from Finnhub
 */
async function fetchFromFinnhub(symbol: string): Promise<PriceData> {
  if (FINNHUB_KEY === 'demo') {
    throw new Error('Finnhub requires API key. Set FINNHUB_API_KEY environment variable.');
  }

  try {
    return await fetchWithRetry(
      async () => {
        const response = await axios.get('https://finnhub.io/api/v1/quote', {
          params: {
            symbol: symbol,
            token: FINNHUB_KEY,
          },
          timeout: CONFIG.api.timeout,
        });

        if (!response.data?.c) {
          throw new Error('Invalid response structure from Finnhub');
        }

        const price = response.data.c;
        if (!validatePrice(price, undefined, symbol)) {
          throw new Error(`Invalid price received for ${symbol}`);
        }

        const exchangeRate = await getUSDtoIDRRate();

        return {
          price,
          currency: 'USD' as Currency,
          priceInIDR: price * exchangeRate,
          exchangeRate,
          source: 'Finnhub',
          lastUpdated: new Date().toISOString(),
        };
      },
      'Finnhub'
    );
  } catch (error) {
    handleAxiosError(error, 'Finnhub', symbol);
  }
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Get cached price from database
 */
async function getCachedPriceFromDB(
  instrumentId: number
): Promise<PriceData | null> {
  try {
    const result = await dbQuery(
      `SELECT last_price, last_price_idr, last_updated, price_source, currency 
       FROM investment_instruments 
       WHERE id = $1 AND last_price IS NOT NULL`,
      [instrumentId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const lastUpdated = new Date(row.last_updated);
    const now = new Date();
    const ageInMinutes = Math.floor(
      (now.getTime() - lastUpdated.getTime()) / 60000
    );

    return {
      price: parseFloat(row.last_price),
      currency: (row.currency || 'USD') as Currency,
      priceInIDR: row.last_price_idr
        ? parseFloat(row.last_price_idr)
        : undefined,
      source: `${row.price_source} (Cached)`,
      lastUpdated: row.last_updated,
      fromCache: true,
      cacheAge: ageInMinutes,
    };
  } catch (error) {
    console.error('Error getting cached price from DB:', error);
    return null;
  }
}

/**
 * Save price to database cache
 */
async function savePriceToDB(
  instrumentId: number,
  priceData: PriceData,
  error: string | null = null
): Promise<void> {
  try {
    await dbQuery(
      `UPDATE investment_instruments 
       SET last_price = $1,
           last_price_idr = $2,
           last_updated = $3,
           price_fetch_error = $4,
           price_source = $5
       WHERE id = $6`,
      [
        priceData.price,
        priceData.priceInIDR || null,
        new Date(),
        error,
        priceData.source,
        instrumentId,
      ]
    );
  } catch (error) {
    console.error('Error saving price to DB:', error);
  }
}

// ============================================================================
// MAIN PRICE FETCHING FUNCTION
// ============================================================================

/**
 * Get price for a specific instrument
 */
export async function getInstrumentPrice(
  instrumentId: number,
  priceSource: string,
  priceMapping: string,
  skipCache: boolean = false
): Promise<PriceData | null> {
  if (!priceSource || !priceMapping) {
    throw new Error(
      'Price source and mapping are required.'
    );
  }

  // Normalize price source
  const normalizedSource = priceSource.toLowerCase().replace(/\s+/g, '_');

  // Check memory cache first (unless skipCache is true)
  const cacheKey = `${normalizedSource}_${priceMapping}`;
  if (!skipCache) {
    const cached = priceCache.get<PriceData>(cacheKey);
    if (cached) {
      console.log(`💾 Using memory cache for ${priceMapping}`);
      return cached;
    }
  }

  // Get previous price for validation
  const previousPrice = await getCachedPriceFromDB(instrumentId);

  let priceData: PriceData | null = null;
  let fetchError: string | null = null;

  try {
    switch (normalizedSource) {
      case 'coingecko':
        priceData = await fetchFromCoinGecko(priceMapping);
        break;

      case 'yahoo_finance':
      case 'yahoo':
        priceData = await fetchFromYahooFinance(priceMapping);
        break;

      case 'alpha_vantage':
      case 'alphavantage':
        priceData = await fetchFromAlphaVantage(priceMapping);
        break;

      case 'finnhub':
        priceData = await fetchFromFinnhub(priceMapping);
        break;

      default:
        throw new Error(
          `Unsupported price source: ${priceSource}. Supported sources: coingecko, yahoo_finance, alpha_vantage, finnhub`
        );
    }

    if (priceData) {
      // Validate against previous price if available
      validatePrice(priceData.price, previousPrice?.price, priceMapping);

      // Save to memory cache
      priceCache.set(cacheKey, priceData);

      // Save to database cache
      await savePriceToDB(instrumentId, priceData, null);

      console.log(
        `✅ Fetched fresh price for ${priceMapping}: ${priceData.currency} ${priceData.price}`
      );
    }

    return priceData;
  } catch (error: unknown) {
    fetchError = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error fetching price for ${priceMapping}:`, fetchError);

    // Try to get cached price from database as fallback
    const cachedPrice = await getCachedPriceFromDB(instrumentId);

    if (cachedPrice) {
      console.log(
        `📦 Using cached price from DB (${cachedPrice.cacheAge} minutes old)`
      );

      // Save error to DB
      await dbQuery(
        'UPDATE investment_instruments SET price_fetch_error = $1 WHERE id = $2',
        [fetchError, instrumentId]
      );

      return cachedPrice;
    }

    // No cache available - this is a real error
    throw new Error(
      `Failed to fetch price for ${priceMapping} and no cache available: ${fetchError}`
    );
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Batch fetch prices for multiple instruments with optimized grouping
 */
export async function batchGetPrices(
  instruments: Array<{
    id: number;
    priceSource: string;
    priceMapping: string;
  }>
): Promise<Record<number, PriceData | null>> {
  const results: Record<number, PriceData | null> = {};

  if (instruments.length === 0) return results;

  // Group by price source to optimize API calls
  const bySource = instruments.reduce((acc, inst) => {
    const key = inst.priceSource.toLowerCase().replace(/\s+/g, '_');
    if (!acc[key]) acc[key] = [];
    acc[key].push(inst);
    return acc;
  }, {} as Record<string, typeof instruments>);

  console.log(
    `📊 Batch processing ${instruments.length} instruments across ${Object.keys(bySource).length} sources`
  );

  // Process each source group with appropriate batch size
  for (const [source, items] of Object.entries(bySource)) {
    const batchSize =
      source === 'coingecko'
        ? CONFIG.batch.coingeckoSize
        : CONFIG.batch.defaultSize;

    console.log(
      `🔄 Processing ${items.length} items from ${source} (batch size: ${batchSize})`
    );

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      // Use Promise.allSettled to handle individual failures gracefully
      const batchResults = await Promise.allSettled(
        batch.map((inst) =>
          getInstrumentPrice(inst.id, inst.priceSource, inst.priceMapping).then(
            (price) => ({ id: inst.id, price, mapping: inst.priceMapping })
          )
        )
      );

      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          results[result.value.id] = result.value.price;
        } else {
          const failedInst = batch[idx];
          console.error(
            `❌ Failed to fetch price for ${failedInst.priceMapping}:`,
            result.reason
          );
          results[failedInst.id] = null;
        }
      });

      // Delay between batches to respect rate limits
      if (i + batchSize < items.length) {
        console.log(`⏳ Waiting ${CONFIG.batch.delayMs}ms before next batch...`);
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.batch.delayMs)
        );
      }
    }
  }

  const successCount = Object.values(results).filter((r) => r !== null).length;
  console.log(
    `✅ Batch complete: ${successCount}/${instruments.length} successful`
  );

  return results;
}

// ============================================================================
// CONFIGURATION & METADATA
// ============================================================================

/**
 * Get available price sources with their configurations
 */
export function getAvailablePriceSources(): PriceSourceInfo[] {
  return [
    {
      value: 'coingecko',
      label: 'CoinGecko',
      description: 'Free API for cryptocurrency prices',
      supports: ['crypto'],
      batchSize: CONFIG.batch.coingeckoSize,
    },
    {
      value: 'yahoo_finance',
      label: 'Yahoo Finance',
      description: 'Free API for stocks, ETFs, and commodities',
      supports: ['stocks_id', 'stocks_us', 'commodities', 'bonds'],
      batchSize: CONFIG.batch.defaultSize,
    },
    {
      value: 'alpha_vantage',
      label: 'Alpha Vantage',
      description: 'Free tier: 25 requests/day (requires API key)',
      supports: ['stocks_us'],
      batchSize: 1,
    },
    {
      value: 'finnhub',
      label: 'Finnhub',
      description: 'Free tier: 60 requests/minute (requires API key)',
      supports: ['stocks_us'],
      batchSize: CONFIG.batch.defaultSize,
    },
  ];
}

/**
 * Get recommended price source for asset type
 */
export function getRecommendedSource(assetType: AssetType): PriceSource {
  switch (assetType) {
    case 'crypto':
      return 'coingecko';
    case 'stocks_id':
    case 'stocks_us':
    case 'commodities':
    case 'bonds':
      return 'yahoo_finance';
    default:
      return 'yahoo_finance';
  }
}

/**
 * Validate if source supports asset type
 */
export function validateSourceForAssetType(
  priceSource: string,
  assetType: AssetType
): boolean {
  const sources = getAvailablePriceSources();
  const source = sources.find((s) => s.value === priceSource);

  if (!source) return false;
  return source.supports.includes(assetType);
}

/**
 * Get example mapping for a price source and asset type
 */
export function getMappingExample(
  priceSource: string,
  assetType: AssetType
): string {
  switch (priceSource.toLowerCase()) {
    case 'coingecko':
      return 'bitcoin, ethereum, binancecoin';

    case 'yahoo_finance':
    case 'yahoo':
      if (assetType === 'stocks_id') return 'BBCA.JK, BMRI.JK, TLKM.JK';
      if (assetType === 'stocks_us') return 'AAPL, MSFT, GOOGL';
      if (assetType === 'commodities')
        return 'GC=F (Gold), SI=F (Silver), CL=F (Oil)';
      return 'AAPL, MSFT, GOOGL';

    case 'alpha_vantage':
    case 'alphavantage':
      return 'AAPL, MSFT, IBM';

    case 'finnhub':
      return 'AAPL, TSLA, NVDA';

    default:
      return '';
  }
}

/**
 * Clear all caches (memory and optionally database)
 */
export async function clearAllCaches(clearDatabase = false): Promise<void> {
  priceCache.flushAll();
  console.log('✅ Memory cache cleared');

  if (clearDatabase) {
    try {
      await dbQuery(
        `UPDATE investment_instruments 
         SET last_price = NULL, 
             last_price_idr = NULL, 
             last_updated = NULL,
             price_fetch_error = NULL`
      );
      console.log('✅ Database cache cleared');
    } catch (error) {
      console.error('❌ Error clearing database cache:', error);
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    keys: priceCache.keys().length,
    stats: priceCache.getStats(),
  };
}