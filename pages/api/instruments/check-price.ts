// pages/api/instruments/check-price.ts
import { NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';
import { getInstrumentPrice } from '@/lib/services/priceService';

async function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { price_source, price_mapping, asset_type } = req.body;

    if (!price_source || !price_mapping) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: price_source and price_mapping',
      });
    }

    // Validate price source
    const validSources = ['coingecko', 'yahoo_finance', 'alpha_vantage', 'finnhub'];
    if (!validSources.includes(price_source)) {
      return res.status(400).json({
        success: false,
        message: `Invalid price source. Valid sources: ${validSources.join(', ')}`,
      });
    }

    console.log(`🔍 Checking price for: ${price_mapping} (${price_source})`);

    // Attempt to fetch price with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
    );

    const fetchPromise = getInstrumentPrice(
      null, // No instrument ID for test
      price_source,
      price_mapping,
      true // skipCache = true for testing
    );

    const priceData = await Promise.race([fetchPromise, timeoutPromise]) as any;

    // DEBUG: Log raw response
    console.log('🔍 Raw priceData:', JSON.stringify(priceData, null, 2));

    // IMPROVED: More flexible validation
    // Check if priceData exists and has either price or priceIDR
    if (!priceData) {
      return res.status(404).json({
        success: false,
        message: 'No response from price service',
        error: 'Price service returned null or undefined',
        suggestion: 'The API might be unavailable or the mapping is incorrect',
        details: {
          source: price_source,
          mapping: price_mapping,
          asset_type: asset_type,
        },
      });
    }

    // Check if there's an explicit error in the response
    if (priceData.error) {
      return res.status(404).json({
        success: false,
        message: 'Failed to fetch price',
        error: priceData.error,
        suggestion: priceData.suggestion || 'Verify that the mapping is correct',
        details: {
          source: price_source,
          mapping: price_mapping,
          asset_type: asset_type,
        },
      });
    }

    // Check if we have valid price data (either price or priceInIDR must exist)
    const hasValidPrice = (
      (priceData.price !== undefined && priceData.price !== null && !isNaN(priceData.price)) ||
      (priceData.priceInIDR !== undefined && priceData.priceInIDR !== null && !isNaN(priceData.priceInIDR))
    );

    if (!hasValidPrice) {
      // Get specific suggestion based on source
      let suggestion = '';
      let docLink = '';
      
      if (price_source === 'coingecko') {
        suggestion = 'For CoinGecko, use lowercase coin ID (e.g., "dogecoin" not "doge"). Common coins: bitcoin, ethereum, binancecoin, cardano, solana, ripple, polkadot.';
        docLink = 'https://api.coingecko.com/api/v3/coins/list';
      } else if (price_source === 'yahoo_finance') {
        if (asset_type === 'stocks_id') {
          suggestion = 'For Indonesian stocks, add .JK suffix (e.g., "BBCA.JK" not "BBCA"). Common: BBCA.JK, BMRI.JK, TLKM.JK, BBRI.JK. Make sure the stock is actively traded.';
          docLink = 'https://finance.yahoo.com/quote/BBCA.JK';
        } else if (asset_type === 'stocks_us') {
          suggestion = 'For US stocks, use ticker symbol (e.g., "AAPL" for Apple). Check Yahoo Finance for the correct symbol.';
          docLink = 'https://finance.yahoo.com/lookup';
        } else if (asset_type === 'commodities') {
          suggestion = 'For commodities, use futures ticker with =F suffix (e.g., "GC=F" for Gold, "SI=F" for Silver, "CL=F" for Crude Oil).';
          docLink = 'https://finance.yahoo.com/quote/GC=F';
        } else {
          suggestion = 'For Yahoo Finance, verify the ticker symbol format. Indonesian stocks need .JK suffix, US stocks use plain ticker.';
          docLink = 'https://finance.yahoo.com/lookup';
        }
      } else if (price_source === 'alpha_vantage') {
        suggestion = 'For Alpha Vantage, use stock ticker symbol (e.g., "AAPL"). Make sure your API key is configured in .env file.';
        docLink = 'https://www.alphavantage.co/documentation/';
      } else if (price_source === 'finnhub') {
        suggestion = 'For Finnhub, use stock ticker symbol (e.g., "AAPL"). Make sure your API key is configured in .env file.';
        docLink = 'https://finnhub.io/docs/api/symbol-search';
      }

      return res.status(404).json({
        success: false,
        message: 'Failed to fetch price. The mapping might be incorrect or the price data is invalid.',
        error: 'Price data not found or invalid response from API',
        suggestion: suggestion || 'Verify that the mapping is correct for the selected price source',
        details: {
          source: price_source,
          mapping: price_mapping,
          asset_type: asset_type,
          docLink: docLink,
          receivedData: priceData, // Include what we received for debugging
        },
      });
    }

    console.log(`✅ Price check successful: ${priceData.source || price_source}`);

    // Ensure we have both price and priceInIDR
    // If one is missing, calculate it
    let finalPrice = priceData.price;
    let finalPriceIDR = priceData.priceInIDR;
    const currency = priceData.currency || 'USD';

    // If priceInIDR is missing but we have price, calculate it
    if (finalPrice && !finalPriceIDR) {
      if (currency === 'IDR') {
        finalPriceIDR = finalPrice;
      } else {
        // Assume USD to IDR conversion (you should use actual exchange rate)
        const USD_TO_IDR = 15750; // Update this with real-time rate
        finalPriceIDR = finalPrice * USD_TO_IDR;
      }
    }

    // If price is missing but we have priceInIDR, calculate it
    if (finalPriceIDR && !finalPrice) {
      if (currency === 'IDR') {
        finalPrice = finalPriceIDR;
      } else {
        const USD_TO_IDR = 15750;
        finalPrice = finalPriceIDR / USD_TO_IDR;
      }
    }

    // Format response based on currency
    const displayPrice = currency === 'IDR'
      ? `Rp ${finalPrice.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`
      : `$${finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`;

    return res.status(200).json({
      success: true,
      message: 'Price fetched successfully',
      data: {
        price: finalPrice,
        priceIDR: finalPriceIDR,
        currency: currency,
        source: priceData.source || price_source,
        displayPrice: displayPrice,
        displayPriceIDR: `Rp ${finalPriceIDR.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('❌ Price check error:', error);

    // Parse error message for user-friendly response
    let errorMessage = error.message || 'Unknown error occurred';
    let suggestion = '';

    if (errorMessage.includes('not found')) {
      suggestion = 'The symbol/mapping might be incorrect. Please verify it exists on the price source.';
    } else if (errorMessage.includes('timeout')) {
      suggestion = 'The request timed out. The API might be slow or unavailable. Please try again.';
    } else if (errorMessage.includes('rate limit')) {
      suggestion = 'API rate limit reached. Please wait a moment and try again.';
    } else if (errorMessage.includes('API key')) {
      suggestion = 'API key is missing or invalid. Please check your environment variables.';
    } else if (errorMessage.includes('Invalid')) {
      suggestion = 'The response from the API was invalid. Please check your configuration.';
    } else {
      suggestion = 'An unexpected error occurred. Please check the logs for more details.';
    }

    return res.status(400).json({
      success: false,
      message: 'Failed to fetch price',
      error: errorMessage,
      suggestion: suggestion,
      details: {
        source: req.body.price_source,
        mapping: req.body.price_mapping,
        asset_type: req.body.asset_type,
      },
    });
  }
}

export default authMiddleware(handler);