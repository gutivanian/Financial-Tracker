// pages\api\investments\update-price.ts
import { NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';
import { query as dbQuery } from '@/lib/db';
import { batchGetPrices } from '@/lib/services/priceService';

async function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    console.log('🔄 Starting batch price update...');

    // Get all active instruments
    const instrumentsQuery = `
      SELECT 
        id, 
        name, 
        symbol, 
        asset_type,
        price_source, 
        price_mapping,
        last_price,
        last_price_idr,
        last_updated
      FROM investment_instruments
      WHERE is_active = true 
        AND price_source IS NOT NULL 
        AND price_mapping IS NOT NULL
        AND price_source != 'manual'
      ORDER BY asset_type, name
    `;

    const result = await dbQuery(instrumentsQuery);
    const instruments = result.rows;

    if (instruments.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No instruments to update',
        stats: {
          total: 0,
          success: 0,
          failed: 0,
          skipped: 0,
          cached: 0,
        },
      });
    }

    console.log(`📦 Found ${instruments.length} instruments to update`);

    // Prepare instruments for batch fetch
    const instrumentsToFetch = instruments.map(inst => ({
      id: inst.id,
      priceSource: inst.price_source,
      priceMapping: inst.price_mapping,
      name: inst.name,
      symbol: inst.symbol,
    }));

    // Fetch prices in batch
    const prices = await batchGetPrices(instrumentsToFetch);

    // Statistics
    const stats = {
      total: instruments.length,
      success: 0,
      failed: 0,
      skipped: 0,
      cached: 0,
      errors: [] as any[],
      updated: [] as any[],
    };

    // Process results
    for (const inst of instruments) {
      const priceData = prices[inst.id];

      if (priceData) {
        if (priceData.error) {
          stats.failed++;
          stats.errors.push({
            instrument: `${inst.symbol} - ${inst.name}`,
            source: inst.price_source,
            mapping: inst.price_mapping,
            error: priceData.error,
          });
        } else {
          if (priceData.fromCache) {
            stats.cached++;
          } else {
            stats.success++;
            stats.updated.push({
              instrument: `${inst.symbol} - ${inst.name}`,
              price: priceData.price,
              priceIDR: priceData.priceInIDR,
              source: priceData.source,
            });
          }
        }
      } else {
        stats.skipped++;
      }
    }

    console.log(`✅ Batch update completed`);
    console.log(`   Success: ${stats.success}`);
    console.log(`   Cached: ${stats.cached}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Skipped: ${stats.skipped}`);

    return res.status(200).json({
      success: true,
      message: `Updated ${stats.success} instruments successfully`,
      stats: {
        total: stats.total,
        success: stats.success,
        failed: stats.failed,
        skipped: stats.skipped,
        cached: stats.cached,
      },
      errors: stats.errors.length > 0 ? stats.errors : undefined,
      updated: stats.updated.length > 0 ? stats.updated.slice(0, 5) : undefined, // Show first 5
    });

  } catch (error: any) {
    console.error('❌ Batch update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update prices',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
}

export default authMiddleware(handler);