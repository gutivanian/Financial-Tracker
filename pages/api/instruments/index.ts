// pages\api\instruments\index.ts
import { NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';
import { query as dbQuery } from '@/lib/db';

// Validation helpers
const PRICE_SOURCES = [
  { 
    value: 'coingecko', 
    label: 'CoinGecko', 
    supports: ['crypto']
  },
  { 
    value: 'yahoo_finance', 
    label: 'Yahoo Finance', 
    supports: ['stocks_id', 'stocks_us', 'commodities', 'bonds']
  },
  { 
    value: 'alpha_vantage', 
    label: 'Alpha Vantage', 
    supports: ['stocks_us']
  },
  { 
    value: 'finnhub', 
    label: 'Finnhub', 
    supports: ['stocks_us']
  },
];

function getRecommendedSource(assetType: string): string {
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

function validateSourceForAssetType(priceSource: string, assetType: string): boolean {
  const source = PRICE_SOURCES.find(s => s.value === priceSource);
  if (!source) return false;
  return source.supports.includes(assetType);
}

function getMappingExample(priceSource: string, assetType: string): string {
  switch (priceSource.toLowerCase()) {
    case 'coingecko':
      return 'bitcoin, ethereum, binancecoin';
    case 'yahoo_finance':
    case 'yahoo':
      if (assetType === 'stocks_id') return 'BBCA.JK, BMRI.JK, TLKM.JK';
      if (assetType === 'stocks_us') return 'AAPL, MSFT, GOOGL';
      if (assetType === 'commodities') return 'GC=F (Gold), SI=F (Silver), CL=F (Oil)';
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

async function handler(req: AuthRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { asset_type, search, market, is_active } = req.query;

      let query = `
        SELECT 
          id,
          name,
          symbol,
          asset_type,
          market,
          currency,
          country,
          description,
          logo_url,
          price_source,
          price_mapping,
          last_price,
          last_price_idr,
          last_updated,
          price_fetch_error,
          is_active,
          created_at,
          updated_at
        FROM investment_instruments
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;

      if (asset_type) {
        query += ` AND asset_type = $${paramIndex}`;
        params.push(asset_type);
        paramIndex++;
      }

      if (market) {
        query += ` AND market = $${paramIndex}`;
        params.push(market);
        paramIndex++;
      }

      if (search) {
        query += ` AND (name ILIKE $${paramIndex} OR symbol ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (is_active !== undefined && is_active !== 'all') {
        query += ` AND is_active = $${paramIndex}`;
        params.push(is_active === 'true');
        paramIndex++;
      }

      query += ` ORDER BY asset_type, name`;

      const result = await dbQuery(query, params);

      // Group by asset type for easier frontend handling
      const grouped = {
        stocks_id: result.rows.filter((i: any) => i.asset_type === 'stocks_id'),
        stocks_us: result.rows.filter((i: any) => i.asset_type === 'stocks_us'),
        crypto: result.rows.filter((i: any) => i.asset_type === 'crypto'),
        commodities: result.rows.filter((i: any) => i.asset_type === 'commodities'),
        bonds: result.rows.filter((i: any) => i.asset_type === 'bonds'),
        all: result.rows,
      };

      res.status(200).json(grouped);

    } else if (req.method === 'POST') {
      const {
        name,
        symbol,
        asset_type,
        market,
        currency,
        country,
        description,
        logo_url,
        price_source,
        price_mapping,
        is_active = true,
      } = req.body;

      // Validate required fields
      if (!name || !symbol || !asset_type || !price_source || !price_mapping) {
        return res.status(400).json({ 
          message: 'Missing required fields',
          required: ['name', 'symbol', 'asset_type', 'price_source', 'price_mapping'],
          note: 'All instruments must have API price source configured. Manual updates are not supported.'
        });
      }

      // Validate price source is not manual
      if (price_source === 'manual') {
        return res.status(400).json({ 
          message: 'Manual price source is not allowed. All instruments must use API.',
          recommended_source: getRecommendedSource(asset_type),
          example_mapping: getMappingExample(getRecommendedSource(asset_type), asset_type)
        });
      }

      // Validate source supports asset type
      if (!validateSourceForAssetType(price_source, asset_type)) {
        return res.status(400).json({ 
          message: `Price source '${price_source}' does not support asset type '${asset_type}'`,
          recommended_source: getRecommendedSource(asset_type),
          example_mapping: getMappingExample(getRecommendedSource(asset_type), asset_type),
          available_sources: PRICE_SOURCES.filter(s => s.supports.includes(asset_type)).map(s => s.value)
        });
      }

      // Set default currency based on asset type if not provided
      let finalCurrency = currency;
      if (!finalCurrency) {
        if (asset_type === 'stocks_id') {
          finalCurrency = 'IDR';
        } else if (['stocks_us', 'crypto', 'commodities'].includes(asset_type)) {
          finalCurrency = 'USD';
        } else {
          finalCurrency = 'IDR';
        }
      }

      // Check if symbol already exists in the same market
      const existing = await dbQuery(
        'SELECT id, name FROM investment_instruments WHERE symbol = $1 AND (market = $2 OR market IS NULL AND $2 IS NULL)',
        [symbol.toUpperCase(), market || null]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ 
          message: 'Instrument with this symbol already exists in this market',
          existing_instrument: existing.rows[0]
        });
      }

      // Insert new instrument
      const query = `
        INSERT INTO investment_instruments (
          name, symbol, asset_type, market, currency, country,
          description, logo_url, price_source, price_mapping, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const result = await dbQuery(query, [
        name.trim(),
        symbol.toUpperCase().trim(),
        asset_type,
        market || null,
        finalCurrency,
        country || null,
        description || null,
        logo_url || null,
        price_source,
        price_mapping.trim(),
        is_active,
      ]);

      const instrument = result.rows[0];

      res.status(201).json({
        message: 'Instrument created successfully',
        instrument,
        note: 'Price will be fetched automatically on next refresh'
      });

    } else if (req.method === 'PUT') {
      const { id } = req.query;
      const {
        name,
        symbol,
        asset_type,
        market,
        currency,
        country,
        description,
        logo_url,
        price_source,
        price_mapping,
        is_active,
      } = req.body;

      // Validate required fields
      if (!name || !symbol || !asset_type || !price_source || !price_mapping) {
        return res.status(400).json({ 
          message: 'Missing required fields',
          required: ['name', 'symbol', 'asset_type', 'price_source', 'price_mapping']
        });
      }

      // Validate price source is not manual
      if (price_source === 'manual') {
        return res.status(400).json({ 
          message: 'Manual price source is not allowed',
          recommended_source: getRecommendedSource(asset_type),
          example_mapping: getMappingExample(getRecommendedSource(asset_type), asset_type)
        });
      }

      // Validate source supports asset type
      if (!validateSourceForAssetType(price_source, asset_type)) {
        return res.status(400).json({ 
          message: `Price source '${price_source}' does not support asset type '${asset_type}'`,
          recommended_source: getRecommendedSource(asset_type),
          example_mapping: getMappingExample(getRecommendedSource(asset_type), asset_type),
          available_sources: PRICE_SOURCES.filter(s => s.supports.includes(asset_type)).map(s => s.value)
        });
      }

      // Check if symbol already exists (excluding current record)
      const existing = await dbQuery(
        'SELECT id, name FROM investment_instruments WHERE symbol = $1 AND (market = $2 OR market IS NULL AND $2 IS NULL) AND id != $3',
        [symbol.toUpperCase(), market || null, id]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ 
          message: 'Instrument with this symbol already exists in this market',
          existing_instrument: existing.rows[0]
        });
      }

      // Set default currency if not provided
      let finalCurrency = currency;
      if (!finalCurrency) {
        if (asset_type === 'stocks_id') {
          finalCurrency = 'IDR';
        } else if (['stocks_us', 'crypto', 'commodities'].includes(asset_type)) {
          finalCurrency = 'USD';
        } else {
          finalCurrency = 'IDR';
        }
      }

      // Update instrument
      const query = `
        UPDATE investment_instruments SET
          name = $1,
          symbol = $2,
          asset_type = $3,
          market = $4,
          currency = $5,
          country = $6,
          description = $7,
          logo_url = $8,
          price_source = $9,
          price_mapping = $10,
          is_active = $11,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING *
      `;

      const result = await dbQuery(query, [
        name.trim(),
        symbol.toUpperCase().trim(),
        asset_type,
        market || null,
        finalCurrency,
        country || null,
        description || null,
        logo_url || null,
        price_source,
        price_mapping.trim(),
        is_active !== undefined ? is_active : true,
        id,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          message: 'Instrument not found'
        });
      }

      const instrument = result.rows[0];

      res.status(200).json({
        message: 'Instrument updated successfully',
        instrument,
        note: 'Price will be refreshed on next update'
      });

    } else if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ 
          message: 'Instrument ID is required'
        });
      }

      // Check if instrument is being used in investments
      const checkQuery = await dbQuery(
        `SELECT COUNT(*) as count, 
         STRING_AGG(DISTINCT i.name, ', ') as investment_names
         FROM investments i
         WHERE i.instrument_id = $1
         GROUP BY i.instrument_id`,
        [id]
      );

      if (checkQuery.rows.length > 0) {
        const count = parseInt(checkQuery.rows[0].count);
        const investmentNames = checkQuery.rows[0].investment_names;
        
        return res.status(400).json({ 
          message: `Cannot delete instrument that is being used in ${count} investment(s)`,
          investments_count: count,
          investment_names: investmentNames,
          suggestion: 'Please delete or reassign the investments first, or set the instrument to inactive instead.'
        });
      }

      // Delete the instrument
      const result = await dbQuery(
        'DELETE FROM investment_instruments WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          message: 'Instrument not found'
        });
      }

      res.status(200).json({ 
        message: 'Instrument deleted successfully',
        instrument: result.rows[0]
      });

    } else {
      res.status(405).json({ 
        message: 'Method not allowed',
        allowed_methods: ['GET', 'POST', 'PUT', 'DELETE']
      });
    }
  } catch (error: any) {
    console.error('Instruments API error:', error);
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ 
        message: 'Duplicate instrument detected',
        error: 'An instrument with this symbol already exists'
      });
    }
    
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ 
        message: 'Invalid reference',
        error: 'Referenced data does not exist'
      });
    }
    
    if (error.code === '23502') { // Not null violation
      return res.status(400).json({ 
        message: 'Missing required data',
        error: 'A required field is empty'
      });
    }
    
    if (error.code === '23514') { // Check constraint violation
      return res.status(400).json({ 
        message: 'Invalid data',
        error: 'Data does not meet validation requirements (e.g., manual price source not allowed)'
      });
    }
    
    res.status(500).json({ 
      message: 'Internal server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      code: error.code
    });
  }
}

export default authMiddleware(handler);