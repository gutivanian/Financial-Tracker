// pages\api\prices\index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';
import { getInstrumentPrice, batchGetPrices } from '@/lib/services/priceService';

async function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { symbol, asset_type, market, batch } = req.query;

    // Batch request for multiple instruments
    if (batch === 'true') {
      const instruments = JSON.parse(req.query.instruments as string || '[]');
      const prices = await batchGetPrices(instruments);
      return res.status(200).json(prices);
    }

    // Single instrument request
    if (!symbol || !asset_type) {
      return res.status(400).json({ 
        message: 'Missing required parameters: symbol and asset_type' 
      });
    }

    const priceData = await getInstrumentPrice(
      null, // No instrument ID for ad-hoc price query
      asset_type as string,
      symbol as string
    );

    if (!priceData) {
      return res.status(404).json({ 
        message: 'Price not found for this instrument' 
      });
    }

    res.status(200).json(priceData);
  } catch (error) {
    console.error('Prices API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: String(error) 
    });
  }
}

export default authMiddleware(handler);