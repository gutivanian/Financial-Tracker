// pages\api\investments\index.ts
import { NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';
import { query as dbQuery } from '@/lib/db';
import { batchGetPrices } from '@/lib/services/priceService';

async function handler(
  req: AuthRequest,
  res: NextApiResponse
) {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // ============================================
    // GET - Fetch all investments with prices
    // ============================================
    if (req.method === 'GET') {
      const { with_prices = 'true' } = req.query;

      // Query investments with instrument details
      const selectQuery = `
        SELECT 
          i.id,
          i.user_id,
          i.instrument_id,
          i.quantity,
          i.purchase_price,
          i.purchase_date,
          i.platform,
          i.notes,
          i.created_at,
          i.updated_at,
          inst.name,
          inst.symbol as instrument_symbol,
          inst.asset_type,
          inst.market as instrument_market,
          inst.currency as instrument_currency,
          inst.price_source,
          inst.price_mapping,
          inst.last_price,
          inst.last_price_idr,
          inst.last_updated as price_last_updated,
          inst.price_fetch_error,
          (i.purchase_price * i.quantity) as total_cost,
          CASE 
            WHEN inst.last_price_idr IS NOT NULL THEN (inst.last_price_idr * i.quantity)
            WHEN inst.last_price IS NOT NULL THEN (inst.last_price * i.quantity)
            ELSE (i.purchase_price * i.quantity)
          END as current_value,
          CASE 
            WHEN inst.last_price_idr IS NOT NULL THEN inst.last_price_idr
            WHEN inst.last_price IS NOT NULL THEN inst.last_price
            ELSE i.purchase_price
          END as current_price
        FROM investments i
        INNER JOIN investment_instruments inst ON i.instrument_id = inst.id
        WHERE i.user_id = $1
        ORDER BY inst.asset_type, inst.name
      `;

      const result = await dbQuery(selectQuery, [userId]);
      let investments = result.rows;

      // Fetch real-time prices if requested
      if (with_prices === 'true' && investments.length > 0) {
        // Get unique instruments that need price update
        const instrumentsToFetch = investments
          .filter((inv: any) => inv.price_source && inv.price_mapping)
          .reduce((acc: any[], inv: any) => {
            // Check if we already have this instrument
            if (!acc.find(item => item.id === inv.instrument_id)) {
              acc.push({
                id: inv.instrument_id,
                priceSource: inv.price_source,
                priceMapping: inv.price_mapping,
              });
            }
            return acc;
          }, []);

        if (instrumentsToFetch.length > 0) {
          console.log(`📊 Fetching prices for ${instrumentsToFetch.length} unique instruments...`);
          
          try {
            const prices = await batchGetPrices(instrumentsToFetch);

            // After fetching, re-query to get updated prices from DB
            const updatedResult = await dbQuery(selectQuery, [userId]);
            investments = updatedResult.rows;

            // Add real_time_price info to investments
            investments = investments.map((inv: any) => {
              const priceData = prices[inv.instrument_id];
              
              if (priceData) {
                return {
                  ...inv,
                  real_time_price: priceData,
                };
              }

              return inv;
            });

            console.log(`✅ Successfully fetched prices`);
          } catch (priceError: any) {
            console.error('❌ Error fetching prices:', priceError.message);
            // Continue with cached prices from DB
            // Don't throw error, just use last known prices
            console.log('⚠️  Using cached prices from database');
          }
        } else {
          console.log('ℹ️  No instruments with API configuration found');
        }
      }

      // Calculate gain/loss for each investment
      investments = investments.map((inv: any) => {
        const totalCost = parseFloat(inv.total_cost) || 0;
        const currentValue = parseFloat(inv.current_value) || 0;
        const gainLoss = currentValue - totalCost;
        const gainLossPercentage = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

        return {
          ...inv,
          total_cost: totalCost,
          current_value: currentValue,
          current_price: parseFloat(inv.current_price) || 0,
          gain_loss: gainLoss,
          gain_loss_percentage: gainLossPercentage,
        };
      });

      // Calculate portfolio summary
      const summary = {
        total_invested: 0,
        current_value: 0,
        total_gain_loss: 0,
        total_gain_loss_percentage: 0,
        by_asset_type: {} as Record<string, any>,
        total_instruments: 0,
        total_investments: investments.length,
      };

      investments.forEach((inv: any) => {
        const totalCost = inv.total_cost;
        const currentValue = inv.current_value;
        const gainLoss = inv.gain_loss;

        summary.total_invested += totalCost;
        summary.current_value += currentValue;
        summary.total_gain_loss += gainLoss;

        // Group by asset type
        const assetType = inv.asset_type || 'unknown';
        if (!summary.by_asset_type[assetType]) {
          summary.by_asset_type[assetType] = {
            total_invested: 0,
            current_value: 0,
            gain_loss: 0,
            gain_loss_percentage: 0,
            count: 0,
          };
        }
        summary.by_asset_type[assetType].total_invested += totalCost;
        summary.by_asset_type[assetType].current_value += currentValue;
        summary.by_asset_type[assetType].gain_loss += gainLoss;
        summary.by_asset_type[assetType].count += 1;
      });

      // Calculate percentages for asset types
      Object.keys(summary.by_asset_type).forEach(assetType => {
        const assetData = summary.by_asset_type[assetType];
        if (assetData.total_invested > 0) {
          assetData.gain_loss_percentage = (assetData.gain_loss / assetData.total_invested) * 100;
        }
      });

      if (summary.total_invested > 0) {
        summary.total_gain_loss_percentage = 
          (summary.total_gain_loss / summary.total_invested) * 100;
      }

      // Count unique instruments
      const uniqueInstruments = new Set(investments.map((inv: any) => inv.instrument_id));
      summary.total_instruments = uniqueInstruments.size;

      return res.status(200).json({
        success: true,
        investments,
        summary,
      });
    }

    // ============================================
    // POST - Create new investment
    // ============================================
    else if (req.method === 'POST') {
      const {
        instrument_id,
        purchase_date,
        purchase_price,
        quantity,
        platform,
        notes,
      } = req.body;

      // Validate required fields
      if (!instrument_id || !purchase_date || !purchase_price || !quantity) {
        return res.status(400).json({ 
          success: false,
          message: 'Missing required fields',
          required: ['instrument_id', 'purchase_date', 'purchase_price', 'quantity']
        });
      }

      // Validate numeric fields
      const parsedPrice = parseFloat(purchase_price);
      const parsedQuantity = parseFloat(quantity);

      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Purchase price must be a positive number'
        });
      }

      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Quantity must be a positive number'
        });
      }

      // Validate date
      const purchaseDate = new Date(purchase_date);
      if (isNaN(purchaseDate.getTime())) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid purchase date format'
        });
      }

      // Check if date is not in the future
      if (purchaseDate > new Date()) {
        return res.status(400).json({ 
          success: false,
          message: 'Purchase date cannot be in the future'
        });
      }

      // Verify instrument exists and has valid price configuration
      const instQuery = await dbQuery(
        `SELECT id, name, symbol, price_source, price_mapping, is_active, asset_type
         FROM investment_instruments 
         WHERE id = $1`,
        [instrument_id]
      );
      
      if (instQuery.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Instrument not found. Please select a valid instrument.'
        });
      }

      const instrument = instQuery.rows[0];

      // Check if instrument is active
      if (!instrument.is_active) {
        return res.status(400).json({ 
          success: false,
          message: `Instrument "${instrument.name}" (${instrument.symbol}) is not active. Please select an active instrument.`
        });
      }

      // Validate price source and mapping exist
      if (!instrument.price_source || !instrument.price_mapping) {
        return res.status(400).json({ 
          success: false,
          message: `Instrument "${instrument.name}" does not have price API configured. Please update the instrument's price source and mapping in Master Data first.`,
          instrument: {
            id: instrument.id,
            name: instrument.name,
            symbol: instrument.symbol,
            asset_type: instrument.asset_type
          }
        });
      }

      // Check for manual price source (should not exist but just in case)
      if (instrument.price_source === 'manual') {
        return res.status(400).json({ 
          success: false,
          message: `Instrument "${instrument.name}" has manual price source which is not allowed. All instruments must use API price sources. Please update the instrument in Master Data.`,
          instrument: {
            id: instrument.id,
            name: instrument.name,
            symbol: instrument.symbol,
            asset_type: instrument.asset_type
          }
        });
      }

      // Insert new investment
      const insertQuery = `
        INSERT INTO investments (
          user_id, instrument_id, purchase_date,
          purchase_price, quantity, platform, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await dbQuery(insertQuery, [
        userId,
        instrument_id,
        purchase_date,
        parsedPrice,
        parsedQuantity,
        platform || null,
        notes || null,
      ]);

      console.log(`✅ Investment created: ${instrument.name} (${instrument.symbol})`);

      return res.status(201).json({
        success: true,
        message: 'Investment created successfully',
        investment: result.rows[0]
      });
    }

    // ============================================
    // PUT - Update existing investment
    // ============================================
    else if (req.method === 'PUT') {
      const { id } = req.query;
      const {
        instrument_id,
        purchase_date,
        purchase_price,
        quantity,
        platform,
        notes,
      } = req.body;

      if (!id) {
        return res.status(400).json({ 
          success: false,
          message: 'Investment ID is required' 
        });
      }

      // Validate at least one field to update
      const hasUpdate = instrument_id || purchase_date || purchase_price || quantity || 
                       platform !== undefined || notes !== undefined;
      
      if (!hasUpdate) {
        return res.status(400).json({ 
          success: false,
          message: 'No fields to update. Please provide at least one field to update.'
        });
      }

      // Validate numeric fields if provided
      if (purchase_price !== undefined && purchase_price !== null) {
        const parsedPrice = parseFloat(purchase_price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
          return res.status(400).json({ 
            success: false,
            message: 'Purchase price must be a positive number'
          });
        }
      }

      if (quantity !== undefined && quantity !== null) {
        const parsedQuantity = parseFloat(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
          return res.status(400).json({ 
            success: false,
            message: 'Quantity must be a positive number'
          });
        }
      }

      // Validate date if provided
      if (purchase_date) {
        const date = new Date(purchase_date);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid purchase date format'
          });
        }

        if (date > new Date()) {
          return res.status(400).json({ 
            success: false,
            message: 'Purchase date cannot be in the future'
          });
        }
      }

      // Check if investment exists and belongs to user
      const existingInv = await dbQuery(
        'SELECT id, instrument_id FROM investments WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (existingInv.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Investment not found or you do not have permission to update it'
        });
      }

      // If instrument_id is being changed, verify it exists and has valid configuration
      if (instrument_id && instrument_id !== existingInv.rows[0].instrument_id) {
        const instQuery = await dbQuery(
          `SELECT id, name, symbol, price_source, price_mapping, is_active, asset_type
           FROM investment_instruments 
           WHERE id = $1`,
          [instrument_id]
        );
        
        if (instQuery.rows.length === 0) {
          return res.status(404).json({ 
            success: false,
            message: 'Instrument not found'
          });
        }

        const instrument = instQuery.rows[0];

        if (!instrument.is_active) {
          return res.status(400).json({ 
            success: false,
            message: `Instrument "${instrument.name}" (${instrument.symbol}) is not active`
          });
        }

        if (!instrument.price_source || !instrument.price_mapping) {
          return res.status(400).json({ 
            success: false,
            message: `Instrument "${instrument.name}" does not have price API configured. Please update the instrument in Master Data first.`,
            instrument: {
              id: instrument.id,
              name: instrument.name,
              symbol: instrument.symbol,
              asset_type: instrument.asset_type
            }
          });
        }

        if (instrument.price_source === 'manual') {
          return res.status(400).json({ 
            success: false,
            message: `Instrument "${instrument.name}" has manual price source which is not allowed. Please update the instrument in Master Data.`,
            instrument: {
              id: instrument.id,
              name: instrument.name,
              symbol: instrument.symbol,
              asset_type: instrument.asset_type
            }
          });
        }
      }

      // Update investment
      const updateQuery = `
        UPDATE investments SET
          instrument_id = COALESCE($1, instrument_id),
          purchase_date = COALESCE($2, purchase_date),
          purchase_price = COALESCE($3, purchase_price),
          quantity = COALESCE($4, quantity),
          platform = COALESCE($5, platform),
          notes = COALESCE($6, notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7 AND user_id = $8
        RETURNING *
      `;

      const result = await dbQuery(updateQuery, [
        instrument_id || null,
        purchase_date || null,
        purchase_price ? parseFloat(purchase_price) : null,
        quantity ? parseFloat(quantity) : null,
        platform !== undefined ? platform : null,
        notes !== undefined ? notes : null,
        id,
        userId,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Investment not found or unauthorized' 
        });
      }

      console.log(`✅ Investment updated: ID ${id}`);

      return res.status(200).json({
        success: true,
        message: 'Investment updated successfully',
        investment: result.rows[0]
      });
    }

    // ============================================
    // DELETE - Remove investment
    // ============================================
    else if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ 
          success: false,
          message: 'Investment ID is required' 
        });
      }

      // Get investment details before deletion for logging
      const invQuery = await dbQuery(
        `SELECT i.id, i.quantity, inst.name, inst.symbol
         FROM investments i
         INNER JOIN investment_instruments inst ON i.instrument_id = inst.id
         WHERE i.id = $1 AND i.user_id = $2`,
        [id, userId]
      );

      if (invQuery.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Investment not found or you do not have permission to delete it' 
        });
      }

      const investment = invQuery.rows[0];

      // Delete investment
      const result = await dbQuery(
        'DELETE FROM investments WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );

      console.log(`🗑️  Investment deleted: ${investment.name} (${investment.symbol}) - Quantity: ${investment.quantity}`);

      return res.status(200).json({ 
        success: true,
        message: 'Investment deleted successfully',
        investment: result.rows[0]
      });
    }

    // ============================================
    // Method not allowed
    // ============================================
    else {
      return res.status(405).json({ 
        success: false,
        message: 'Method not allowed',
        allowed_methods: ['GET', 'POST', 'PUT', 'DELETE']
      });
    }
  } catch (error: any) {
    console.error('❌ Investments API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
  }
}

export default authMiddleware(handler);