import { NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';
import { query as dbQuery } from '@/lib/db';
import pool from '@/lib/db'

async function handler(
  req: AuthRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'POST') {
      const { goal_id, amount, date, notes } = req.body;

      if (!goal_id || !amount || !date) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Start transaction
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Add contribution
        const contribQuery = `
          INSERT INTO goal_contributions (goal_id, amount, date, notes)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        const contribResult = await client.query(contribQuery, [
          goal_id,
          amount,
          date,
          notes || null,
        ]);

        // Update goal current_amount
        await client.query(
          'UPDATE financial_goals SET current_amount = current_amount + $1 WHERE id = $2',
          [amount, goal_id]
        );

        await client.query('COMMIT');

        res.status(201).json(contribResult.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Goal contributions API error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}

export default authMiddleware(handler);
