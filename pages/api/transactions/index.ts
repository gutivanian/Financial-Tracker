// pftu\pages\api\transactions\index.ts
import { NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';
import { query as dbQuery } from '@/lib/db';
import { Transaction } from '@/lib/types';

async function handler(
  req: AuthRequest,
  res: NextApiResponse
) {
  const userId = req.user?.userId;

  try {
    if (req.method === 'GET') {
      const { 
        start_date, 
        end_date, 
        type, 
        category_id, 
        account_id,
        limit = '50',
        offset = '0'
      } = req.query;

      let query = `
        SELECT 
          t.*,
          a.name as account_name,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
      `;
      
      const params: any[] = [userId];
      let paramIndex = 2;

      if (start_date) {
        query += ` AND t.date >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
      }

      if (end_date) {
        query += ` AND t.date <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
      }

      if (type) {
        query += ` AND t.type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (category_id) {
        query += ` AND t.category_id = $${paramIndex}`;
        params.push(category_id);
        paramIndex++;
      }

      if (account_id) {
        query += ` AND t.account_id = $${paramIndex}`;
        params.push(account_id);
        paramIndex++;
      }

      query += ` ORDER BY t.date DESC, t.created_at DESC`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit as string), parseInt(offset as string));

      const result = await dbQuery(query, params);

      // Get total count
      let countQuery = `SELECT COUNT(*) FROM transactions WHERE user_id = $1`;
      const countParams: any[] = [userId];
      let countParamIndex = 2;

      if (start_date) {
        countQuery += ` AND date >= $${countParamIndex}`;
        countParams.push(start_date);
        countParamIndex++;
      }
      if (end_date) {
        countQuery += ` AND date <= $${countParamIndex}`;
        countParams.push(end_date);
        countParamIndex++;
      }
      if (type) {
        countQuery += ` AND type = $${countParamIndex}`;
        countParams.push(type);
        countParamIndex++;
      }
      if (category_id) {
        countQuery += ` AND category_id = $${countParamIndex}`;
        countParams.push(category_id);
        countParamIndex++;
      }
      if (account_id) {
        countQuery += ` AND account_id = $${countParamIndex}`;
        countParams.push(account_id);
      }

      const countResult = await dbQuery(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      res.status(200).json({
        transactions: result.rows,
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

    } else if (req.method === 'POST') {
      const {
        account_id,
        category_id,
        type,
        amount,
        date,
        description,
        notes,
        merchant,
        tags,
      } = req.body;

      // Validate required fields
      if (!type || !amount || !date) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const query = `
        INSERT INTO transactions (
          user_id, account_id, category_id, type, amount, date,
          description, notes, merchant, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const params = [
        userId,
        account_id || null,
        category_id || null,
        type,
        amount,
        date,
        description || null,
        notes || null,
        merchant || null,
        tags || null,
      ];

      const result = await dbQuery(query, params);

      // Update account balance
      if (account_id) {
        const balanceChange = type === 'income' ? amount : -amount;
        await dbQuery(
          'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
          [balanceChange, account_id]
        );
      }

      res.status(201).json(result.rows[0]);

    } else if (req.method === 'PUT') {
      const { id } = req.query;
      const {
        account_id,
        category_id,
        type,
        amount,
        date,
        description,
        notes,
        merchant,
        tags,
      } = req.body;

      // Get old transaction for balance update
      const oldTxn = await dbQuery(
        'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (oldTxn.rows.length === 0) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      const query = `
        UPDATE transactions SET
          account_id = $1,
          category_id = $2,
          type = $3,
          amount = $4,
          date = $5,
          description = $6,
          notes = $7,
          merchant = $8,
          tags = $9,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $10 AND user_id = $11
        RETURNING *
      `;

      const params = [
        account_id || null,
        category_id || null,
        type,
        amount,
        date,
        description || null,
        notes || null,
        merchant || null,
        tags || null,
        id,
        userId,
      ];

      const result = await dbQuery(query, params);

      // Update account balances
      const oldTxnData = oldTxn.rows[0];
      if (oldTxnData.account_id) {
        const oldBalanceChange = oldTxnData.type === 'income' ? -oldTxnData.amount : oldTxnData.amount;
        await dbQuery(
          'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
          [oldBalanceChange, oldTxnData.account_id]
        );
      }

      if (account_id) {
        const newBalanceChange = type === 'income' ? amount : -amount;
        await dbQuery(
          'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
          [newBalanceChange, account_id]
        );
      }

      res.status(200).json(result.rows[0]);

    } else if (req.method === 'DELETE') {
      const { id } = req.query;

      // Get transaction for balance update
      const txn = await dbQuery(
        'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (txn.rows.length === 0) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      await dbQuery(
        'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      // Update account balance
      const txnData = txn.rows[0];
      if (txnData.account_id) {
        const balanceChange = txnData.type === 'income' ? -txnData.amount : txnData.amount;
        await dbQuery(
          'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
          [balanceChange, txnData.account_id]
        );
      }

      res.status(200).json({ message: 'Transaction deleted' });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Transactions API error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}

export default authMiddleware(handler);
