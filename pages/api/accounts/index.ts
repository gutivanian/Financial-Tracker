// pftu\pages\api\accounts\index.ts
import { NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';
import { query as dbQuery } from '@/lib/db';

async function handler(req: AuthRequest, res: NextApiResponse) {
  const userId = req.user?.userId;

  try {
    if (req.method === 'GET') {
      const query = `
        SELECT * FROM accounts
        WHERE user_id = $1
        ORDER BY 
          CASE type
            WHEN 'bank' THEN 1
            WHEN 'e-wallet' THEN 2
            WHEN 'cash' THEN 3
            WHEN 'credit_card' THEN 4
          END,
          name
      `;

      const result = await dbQuery(query, [userId]);
      res.status(200).json(result.rows);

    } else if (req.method === 'POST') {
      const { name, type, balance, currency, icon, color } = req.body;

      if (!name || !type) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const query = `
        INSERT INTO accounts (
          user_id, name, type, balance, currency, icon, color
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await dbQuery(query, [
        userId,
        name,
        type,
        balance || 0,
        currency || 'IDR',
        icon || null,
        color || null,
      ]);

      res.status(201).json(result.rows[0]);

    } else if (req.method === 'PUT') {
      const { id } = req.query;
      const { name, balance, icon, color, is_active } = req.body;

      const query = `
        UPDATE accounts SET
          name = COALESCE($1, name),
          balance = COALESCE($2, balance),
          icon = COALESCE($3, icon),
          color = COALESCE($4, color),
          is_active = COALESCE($5, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 AND user_id = $7
        RETURNING *
      `;

      const result = await dbQuery(query, [
        name,
        balance,
        icon,
        color,
        is_active,
        id,
        userId,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Account not found' });
      }

      res.status(200).json(result.rows[0]);

    } else if (req.method === 'DELETE') {
      const { id } = req.query;

      await dbQuery(
        'DELETE FROM accounts WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      res.status(200).json({ message: 'Account deleted' });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Accounts API error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}

export default authMiddleware(handler);
