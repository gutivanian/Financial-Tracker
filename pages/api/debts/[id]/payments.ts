// pages/api/debts/[id]/payments.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';
import { query as dbQuery } from '@/lib/db';

async function handler(req: AuthRequest, res: NextApiResponse) {
  const userId = req.user?.userId;
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      // Verify debt belongs to user
      const debtCheck = await dbQuery(
        'SELECT id FROM debts WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (debtCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Debt not found' });
      }

      // Get payment history with account info
      const result = await dbQuery(
        `SELECT 
          dp.*,
          a.name as account_name
        FROM debt_payments dp
        LEFT JOIN accounts a ON dp.account_id = a.id
        WHERE dp.debt_id = $1
        ORDER BY dp.payment_date DESC, dp.created_at DESC`,
        [id]
      );

      res.status(200).json({ payments: result.rows });
    } catch (error) {
      console.error('Error fetching payment history:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

export default authMiddleware(handler);
