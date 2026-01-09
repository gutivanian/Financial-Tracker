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
          ta.name as to_account_name,
          CASE 
            WHEN t.is_split_payment = true THEN
              (
                SELECT json_agg(
                  json_build_object(
                    'account_id', ts.account_id,
                    'account_name', acc.name,
                    'amount', ts.amount,
                    'percentage', ts.percentage
                  ) ORDER BY ts.id
                )
                FROM transaction_splits ts
                LEFT JOIN accounts acc ON ts.account_id = acc.id
                WHERE ts.transaction_id = t.id
              )
            ELSE NULL
          END as splits
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
        is_split_payment,
        splits,
      } = req.body;

      // Validate required fields
      if (!type || !amount || !date) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Validate split payment
      if (is_split_payment) {
        if (!splits || !Array.isArray(splits) || splits.length === 0) {
          return res.status(400).json({ message: 'Split payment requires at least one split entry' });
        }

        // Validate total splits = transaction amount
        const totalSplits = splits.reduce((sum: number, s: any) => sum + parseFloat(s.amount || 0), 0);
        const txnAmount = parseFloat(amount);
        if (Math.abs(totalSplits - txnAmount) > 0.01) {
          return res.status(400).json({
            message: `Split amounts total (${totalSplits}) must equal transaction amount (${txnAmount})`
          });
        }

        // Validate all splits have account_id and amount
        for (const split of splits) {
          if (!split.account_id || !split.amount || parseFloat(split.amount) <= 0) {
            return res.status(400).json({ message: 'Each split must have valid account_id and amount' });
          }
        }
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
            description, notes, merchant, tags, admin_fee, is_split_payment, split_count
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
          is_split_payment || false,
          is_split_payment ? (splits?.length || 1) : 1,
        ];

        const result = await dbQuery(insertQuery, params);
        const transactionId = result.rows[0].id;

        // Handle split payment
        if (is_split_payment && splits && splits.length > 0) {
          // Insert split details
          for (const split of splits) {
            const splitAmount = parseFloat(split.amount);
            const percentage = (splitAmount / parseFloat(amount)) * 100;

            await dbQuery(
              `INSERT INTO transaction_splits (transaction_id, account_id, amount, percentage)
               VALUES ($1, $2, $3, $4)`,
              [transactionId, split.account_id, splitAmount, percentage]
            );

            // Update each account balance
            if (type === 'expense') {
              await dbQuery(
                'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [splitAmount, split.account_id, userId]
              );
            } else if (type === 'income') {
              await dbQuery(
                'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [splitAmount, split.account_id, userId]
              );
            } else if (type === 'adjustment_in') {
              await dbQuery(
                'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [splitAmount, split.account_id, userId]
              );
            } else if (type === 'adjustment_out') {
              await dbQuery(
                'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [splitAmount, split.account_id, userId]
              );
            }
          }
        }
        // Handle regular single account transaction
        else if (type === 'income' && account_id) {
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
        } else if (type === 'adjustment_in' && account_id) {
          // Adjustment In: add to account (balance correction)
          await dbQuery(
            'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
            [amount, account_id, userId]
          );
        } else if (type === 'adjustment_out' && account_id) {
          // Adjustment Out: subtract from account (balance correction)
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

        // Calculate delta amounts
        const oldAmount = parseFloat(oldTxnData.amount);
        const newAmount = parseFloat(amount);
        const amountDelta = newAmount - oldAmount;

        const oldAdminFee = parseFloat(oldTxnData.admin_fee || 0);
        const newAdminFee = parseFloat(admin_fee || 0);
        const adminFeeDelta = newAdminFee - oldAdminFee;

        // Check if transaction type, account, or significant fields changed
        const typeChanged = oldTxnData.type !== type;
        const accountChanged = oldTxnData.account_id !== account_id;
        const toAccountChanged = oldTxnData.to_account_id !== to_account_id;
        const amountChanged = amountDelta !== 0;
        const adminFeeChanged = adminFeeDelta !== 0;

        // Get Admin Fee category if needed
        let adminFeeCategoryId = null;
        if ((oldTxnData.type === 'transfer' || type === 'transfer') && (oldAdminFee > 0 || newAdminFee > 0)) {
          const adminFeeCatResult = await dbQuery(
            `SELECT id FROM categories WHERE user_id = $1 AND name = 'Admin Fee' AND type = 'expense' LIMIT 1`,
            [userId]
          );
          if (adminFeeCatResult.rows.length > 0) {
            adminFeeCategoryId = adminFeeCatResult.rows[0].id;
          }
        }

        // Find existing admin fee transaction if this is/was a transfer
        let existingAdminFeeTransaction = null;
        if (oldTxnData.type === 'transfer' && oldAdminFee > 0 && adminFeeCategoryId) {
          const adminFeeTxnResult = await dbQuery(
            `SELECT * FROM transactions 
             WHERE user_id = $1 
             AND account_id = $2 
             AND category_id = $3 
             AND type = 'expense'
             AND amount = $4
             AND date = $5
             AND notes LIKE '%transfer transaction ID: ' || $6 || '%'
             LIMIT 1`,
            [userId, oldTxnData.account_id, adminFeeCategoryId, oldAdminFee, oldTxnData.date, id]
          );
          if (adminFeeTxnResult.rows.length > 0) {
            existingAdminFeeTransaction = adminFeeTxnResult.rows[0];
          }
        }

        // If type, account, or to_account changed, do full revert and apply
        if (typeChanged || accountChanged || toAccountChanged) {
          // Revert old transaction effects completely
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
          } else if (oldTxnData.type === 'adjustment_in' && oldTxnData.account_id) {
            await dbQuery(
              'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
              [oldTxnData.amount, oldTxnData.account_id, userId]
            );
          } else if (oldTxnData.type === 'adjustment_out' && oldTxnData.account_id) {
            await dbQuery(
              'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
              [oldTxnData.amount, oldTxnData.account_id, userId]
            );
          } else if (oldTxnData.type === 'transfer') {
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
            // Delete old admin fee transaction if exists
            if (existingAdminFeeTransaction) {
              await dbQuery(
                'DELETE FROM transactions WHERE id = $1',
                [existingAdminFeeTransaction.id]
              );
              // Balance already adjusted by the deletion
              await dbQuery(
                'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [oldAdminFee, oldTxnData.account_id, userId]
              );
            }
          }
        } else {
          // Only amount changed, update by delta
          if (amountChanged) {
            if (type === 'income' && account_id) {
              // For income: if amount increased, add delta; if decreased, subtract delta
              await dbQuery(
                'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [amountDelta, account_id, userId]
              );
            } else if (type === 'expense' && account_id) {
              // For expense: if amount increased, subtract delta; if decreased, add delta
              await dbQuery(
                'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [amountDelta, account_id, userId]
              );
            } else if (type === 'adjustment_in' && account_id) {
              // For adjustment in: if amount increased, add delta; if decreased, subtract delta
              await dbQuery(
                'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [amountDelta, account_id, userId]
              );
            } else if (type === 'adjustment_out' && account_id) {
              // For adjustment out: if amount increased, subtract delta; if decreased, add delta
              await dbQuery(
                'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [amountDelta, account_id, userId]
              );
            } else if (type === 'transfer' && account_id && to_account_id) {
              // For transfer: update both accounts by delta
              await dbQuery(
                'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [amountDelta, account_id, userId]
              );
              await dbQuery(
                'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [amountDelta, to_account_id, userId]
              );
            }
          }

          // Handle admin fee changes for transfer
          if (type === 'transfer' && adminFeeChanged && account_id && adminFeeCategoryId) {
            if (existingAdminFeeTransaction) {
              // Update existing admin fee transaction
              if (newAdminFee > 0) {
                // Update the amount
                await dbQuery(
                  'UPDATE transactions SET amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                  [newAdminFee, existingAdminFeeTransaction.id]
                );
                // Update account balance by delta
                await dbQuery(
                  'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                  [adminFeeDelta, account_id, userId]
                );
              } else {
                // Delete admin fee transaction if new fee is 0
                await dbQuery(
                  'DELETE FROM transactions WHERE id = $1',
                  [existingAdminFeeTransaction.id]
                );
                // Refund the old admin fee
                await dbQuery(
                  'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                  [oldAdminFee, account_id, userId]
                );
              }
            } else if (newAdminFee > 0) {
              // Create new admin fee transaction
              await dbQuery(
                `INSERT INTO transactions (
                  user_id, account_id, category_id, type, amount, date,
                  description, notes
                ) VALUES ($1, $2, $3, 'expense', $4, $5, $6, $7)`,
                [
                  userId,
                  account_id,
                  adminFeeCategoryId,
                  newAdminFee,
                  date,
                  `Admin fee for transfer to ${to_account_id}`,
                  `Auto-generated admin fee for transfer transaction ID: ${id}`
                ]
              );
              // Deduct new admin fee from account
              await dbQuery(
                'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [newAdminFee, account_id, userId]
              );
            }
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

        // If type or account changed, apply new transaction effects
        if (typeChanged || accountChanged || toAccountChanged) {
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
          } else if (type === 'adjustment_in' && account_id) {
            await dbQuery(
              'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
              [amount, account_id, userId]
            );
          } else if (type === 'adjustment_out' && account_id) {
            await dbQuery(
              'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
              [amount, account_id, userId]
            );
          } else if (type === 'transfer' && account_id && to_account_id) {
            await dbQuery(
              'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
              [amount, account_id, userId]
            );
            await dbQuery(
              'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
              [amount, to_account_id, userId]
            );
            // Create new admin fee transaction if needed
            if (newAdminFee > 0 && adminFeeCategoryId) {
              await dbQuery(
                `INSERT INTO transactions (
                  user_id, account_id, category_id, type, amount, date,
                  description, notes
                ) VALUES ($1, $2, $3, 'expense', $4, $5, $6, $7)`,
                [
                  userId,
                  account_id,
                  adminFeeCategoryId,
                  newAdminFee,
                  date,
                  `Admin fee for transfer to ${to_account_id}`,
                  `Auto-generated admin fee for transfer transaction ID: ${id}`
                ]
              );
              await dbQuery(
                'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [newAdminFee, account_id, userId]
              );
            }
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

        // Handle split payment deletion
        if (txnData.is_split_payment) {
          // Get all splits for this transaction
          const splitsResult = await dbQuery(
            'SELECT * FROM transaction_splits WHERE transaction_id = $1',
            [id]
          );

          // Revert balance changes for each split
          for (const split of splitsResult.rows) {
            if (txnData.type === 'expense') {
              await dbQuery(
                'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [split.amount, split.account_id, userId]
              );
            } else if (txnData.type === 'income') {
              await dbQuery(
                'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [split.amount, split.account_id, userId]
              );
            } else if (txnData.type === 'adjustment_in') {
              await dbQuery(
                'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [split.amount, split.account_id, userId]
              );
            } else if (txnData.type === 'adjustment_out') {
              await dbQuery(
                'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                [split.amount, split.account_id, userId]
              );
            }
          }

          // Delete all splits (CASCADE should handle this, but explicit is better)
          await dbQuery(
            'DELETE FROM transaction_splits WHERE transaction_id = $1',
            [id]
          );
        }

        // If this is a transfer with admin fee, find and delete the admin fee transaction
        if (txnData.type === 'transfer' && txnData.admin_fee && parseFloat(txnData.admin_fee) > 0) {
          // Get Admin Fee category
          const adminFeeCatResult = await dbQuery(
            `SELECT id FROM categories WHERE user_id = $1 AND name = 'Admin Fee' AND type = 'expense' LIMIT 1`,
            [userId]
          );
          
          if (adminFeeCatResult.rows.length > 0) {
            const adminFeeCategoryId = adminFeeCatResult.rows[0].id;
            
            // Find and delete the admin fee transaction
            await dbQuery(
              `DELETE FROM transactions 
               WHERE user_id = $1 
               AND account_id = $2 
               AND category_id = $3 
               AND type = 'expense'
               AND amount = $4
               AND notes LIKE '%transfer transaction ID: ' || $5 || '%'`,
              [userId, txnData.account_id, adminFeeCategoryId, txnData.admin_fee, id]
            );
          }
        }

        // Delete main transaction
        await dbQuery(
          'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
          [id, userId]
        );

        // Revert account balance changes for non-split payments
        if (!txnData.is_split_payment) {
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
        } else if (txnData.type === 'adjustment_in' && txnData.account_id) {
          await dbQuery(
            'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
            [txnData.amount, txnData.account_id, userId]
          );
        } else if (txnData.type === 'adjustment_out' && txnData.account_id) {
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
          // Revert admin fee (balance already restored by deleting admin fee transaction)
          if (txnData.admin_fee && parseFloat(txnData.admin_fee) > 0 && txnData.account_id) {
            await dbQuery(
              'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
              [txnData.admin_fee, txnData.account_id, userId]
            );
          }
        }
        }  // End of !is_split_payment check

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
