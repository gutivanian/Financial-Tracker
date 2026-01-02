// pages/api/debts/warnings.ts
import { NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';
import { query as dbQuery } from '@/lib/db';

async function handler(req: AuthRequest, res: NextApiResponse) {
  const userId = req.user?.userId;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get current day of month
    const today = new Date();
    const currentDay = today.getDate();

    // Query debts that are active and due within 3 days (checking payment_due_date as day of month)
    const result = await dbQuery(
      `SELECT 
        id,
        creditor,
        current_balance,
        minimum_payment,
        payment_due_date,
        payment_type,
        CASE 
          WHEN payment_due_date >= $1 THEN payment_due_date - $1
          ELSE (payment_due_date + 
            EXTRACT(DAY FROM DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') - INTERVAL '1 day')
          ) - $1
        END as days_until_due
      FROM debts
      WHERE user_id = $2
        AND status = 'active'
        AND payment_type = 'manual'
        AND (
          (payment_due_date >= $1 AND payment_due_date - $1 <= 3)
          OR 
          (payment_due_date < $1 AND (payment_due_date + 
            EXTRACT(DAY FROM DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') - INTERVAL '1 day')
          ) - $1 <= 3)
        )
      ORDER BY days_until_due ASC`,
      [currentDay, userId]
    );

    res.status(200).json({ warnings: result.rows });
  } catch (error) {
    console.error('Error fetching debt warnings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export default authMiddleware(handler);
