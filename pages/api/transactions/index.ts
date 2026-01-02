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
          c.color as category_color,
          ta.name as to_account_name
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN accounts ta ON t.to_account_id = ta.id
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
        to_account_id,
        category_id,
        type,
        amount,
        date,
        description,
        notes,
        merchant,
        tags,
        admin_fee,
      } = req.body;

      // Validate required fields
      if (!type || !amount || !date) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Validate transfer specific fields
      if (type === 'transfer') {
        if (!account_id || !to_account_id) {
          return res.status(400).json({ message: 'Transfer requires both from and to accounts' });
        }
        if (account_id === to_account_id) {
          return res.status(400).json({ message: 'Cannot transfer to the same account' });
        }
      }

      // Start transaction
      await dbQuery('BEGIN');

      try {
        // Insert main transaction
        const insertQuery = `
          INSERT INTO transactions (
            user_id, account_id, to_account_id, category_id, type, amount, date,
            description, notes, merchant, tags, admin_fee
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *
        `;

        const params = [
          userId,
          account_id || null,
          to_account_id || null,
          category_id || null,
          type,
          amount,
          date,
          description || null,
          notes || null,
          merchant || null,
          tags || null,
          admin_fee || 0,
        ];

        const result = await dbQuery(insertQuery, params);

        // Update account balances based on transaction type
        if (type === 'income' && account_id) {
          // Income: add to account
          await dbQuery(
            'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
            [amount, account_id, userId]
          );
        } else if (type === 'expense' && account_id) {
          // Expense: subtract from account
          await dbQuery(
            'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
            [amount, account_id, userId]
          );
        } else if (type === 'transfer' && account_id && to_account_id) {
          // Transfer: subtract from source, add to destination
          await dbQuery(
            'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
            [amount, account_id, userId]
          );
          await dbQuery(
            'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
            [amount, to_account_id, userId]
          );

          // If admin fee > 0, create expense transaction for admin fee
          if (admin_fee && parseFloat(admin_fee) > 0) {
            // Get Admin Fee category
            const adminFeeCatResult = await dbQuery(
              `SELECT id FROM categories WHERE user_id = $1 AND name = 'Admin Fee' AND type = 'expense' LIMIT 1`,
              [userId]
            );

            if (adminFeeCatResult.rows.length > 0) {
              const adminFeeCategoryId = adminFeeCatResult.rows[0].id;

              // Insert admin fee transaction
              await dbQuery(
                `INSERT INTO transactions (
                  user_id, account_id, category_id, type, amount, date,
                  description, notes
                ) VALUES ($1, $2, $3, 'expense', $4, $5, $6, $7)`,
                [
                  userId,
                  account_id,
                  adminFeeCategoryId,
                  admin_fee,
                  date,
                  `Admin fee for transfer to ${to_account_id}`,
                  `Auto-generated admin fee for transfer transaction ID: ${result.rows[0].id}`
                ]
              );

              // Subtract admin fee from source account
              await dbQuery(
                'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [admin_fee, account_id, userId]
              );
            }
          }
        }

        // Commit transaction
        await dbQuery('COMMIT');

        res.status(201).json(result.rows[0]);
      } catch (error) {
        // Rollback on error
        await dbQuery('ROLLBACK');
        throw error;
      }

    } else if (req.method === 'PUT') {
      const { id } = req.query;
      const {
        account_id,
        to_account_id,
        category_id,
        type,
        amount,
        date,
        description,
        notes,
        merchant,
        tags,
        admin_fee,
      } = req.body;

      // Get old transaction for balance update
      const oldTxn = await dbQuery(
        'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (oldTxn.rows.length === 0) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      // Validate transfer specific fields
      if (type === 'transfer') {
        if (!account_id || !to_account_id) {
          return res.status(400).json({ message: 'Transfer requires both from and to accounts' });
        }
        if (account_id === to_account_id) {
          return res.status(400).json({ message: 'Cannot transfer to the same account' });
        }
      }

      // Start transaction
      await dbQuery('BEGIN');

      try {
        const oldTxnData = oldTxn.rows[0];

        // Revert old transaction effects
        if (oldTxnData.type === 'income' && oldTxnData.account_id) {
          await dbQuery(
            'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
            [oldTxnData.amount, oldTxnData.account_id, userId]
          );
        } else if (oldTxnData.type === 'expense' && oldTxnData.account_id) {
          await dbQuery(
            'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
            [oldTxnData.amount, oldTxnData.account_id, userId]
          );
        } else if (oldTxnData.type === 'transfer') {
          // Revert transfer
          if (oldTxnData.account_id) {
            await dbQuery(
              'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
              [oldTxnData.amount, oldTxnData.account_id, userId]
            );
          }
          if (oldTxnData.to_account_id) {
            await dbQuery(
              'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
              [oldTxnData.amount, oldTxnData.to_account_id, userId]
            );
          }
          // Revert admin fee if exists
          if (oldTxnData.admin_fee && parseFloat(oldTxnData.admin_fee) > 0 && oldTxnData.account_id) {
            await dbQuery(
              'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
              [oldTxnData.admin_fee, oldTxnData.account_id, userId]
            );
          }
        }

        // Update transaction
        const updateQuery = `
          UPDATE transactions SET
            account_id = $1,
            to_account_id = $2,
            category_id = $3,
            type = $4,
            amount = $5,
            date = $6,
            description = $7,
            notes = $8,
            merchant = $9,
            tags = $10,
            admin_fee = $11,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $12 AND user_id = $13
          RETURNING *
        `;

        const params = [
          account_id || null,
          to_account_id || null,
          category_id || null,
          type,
          amount,
          date,
          description || null,
          notes || null,
          merchant || null,
          tags || null,
          admin_fee || 0,
          id,
          userId,
        ];

        const result = await dbQuery(updateQuery, params);

        // Apply new transaction effects
        if (type === 'income' && account_id) {
          await dbQuery(
            'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
            [amount, account_id, userId]
          );
        } else if (type === 'expense' && account_id) {
          await dbQuery(
            'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
            [amount, account_id, userId]
          );
        } else if (type === 'transfer' && account_id && to_account_id) {
          // Apply transfer
          await dbQuery(
            'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
            [amount, account_id, userId]
          );
          await dbQuery(
            'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
            [amount, to_account_id, userId]
          );

          // Apply admin fee if exists
          if (admin_fee && parseFloat(admin_fee) > 0) {
            await dbQuery(
              'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
              [admin_fee, account_id, userId]
            );
          }
        }

        // Commit transaction
        await dbQuery('COMMIT');

        res.status(200).json(result.rows[0]);
      } catch (error) {
        // Rollback on error
        await dbQuery('ROLLBACK');
        throw error;
      }

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

      // Start transaction
      await dbQuery('BEGIN');

      try {
        const txnData = txn.rows[0];

        // Delete transaction
        await dbQuery(
          'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
          [id, userId]
        );

        // Revert account balance changes
        if (txnData.type === 'income' && txnData.account_id) {
          await dbQuery(
            'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
            [txnData.amount, txnData.account_id, userId]
          );
        } else if (txnData.type === 'expense' && txnData.account_id) {
          await dbQuery(
            'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
            [txnData.amount, txnData.account_id, userId]
          );
        } else if (txnData.type === 'transfer') {
          // Revert transfer
          if (txnData.account_id) {
            await dbQuery(
              'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
              [txnData.amount, txnData.account_id, userId]
            );
          }
          if (txnData.to_account_id) {
            await dbQuery(
              'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
              [txnData.amount, txnData.to_account_id, userId]
            );
          }
          // Revert admin fee if exists
          if (txnData.admin_fee && parseFloat(txnData.admin_fee) > 0 && txnData.account_id) {
            await dbQuery(
              'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
              [txnData.admin_fee, txnData.account_id, userId]
            );
          }
        }

        // Commit transaction
        await dbQuery('COMMIT');

        res.status(200).json({ message: 'Transaction deleted' });
      } catch (error) {
        // Rollback on error
        await dbQuery('ROLLBACK');
        throw error;
      }

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Transactions API error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}

export default authMiddleware(handler);
