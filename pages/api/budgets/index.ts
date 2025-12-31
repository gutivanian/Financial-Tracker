// pftu\pages\api\budgets\index.ts
import { NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';
import { query as dbQuery } from '@/lib/db';

async function handler(req: AuthRequest, res: NextApiResponse) {
  const userId = req.user?.userId;

  try {
if (req.method === 'GET') {
  const { period_start, period_end } = req.query;

  // Default to current month if no period specified
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const periodStart = period_start || defaultStart.toISOString().split('T')[0];
  const periodEnd = period_end || defaultEnd.toISOString().split('T')[0];

  const query = `
    SELECT 
      b.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      c.budget_type,
      COALESCE((
        SELECT SUM(t.amount)
        FROM transactions t
        WHERE t.category_id = b.category_id
          AND t.user_id = b.user_id
          AND t.type = 'expense'
          AND t.date >= GREATEST(b.period_start, $2::date)
          AND t.date <= LEAST(b.period_end, $3::date)
      ), 0) as spent,
      (b.amount - COALESCE((
        SELECT SUM(t.amount)
        FROM transactions t
        WHERE t.category_id = b.category_id
          AND t.user_id = b.user_id
          AND t.type = 'expense'
          AND t.date >= GREATEST(b.period_start, $2::date)
          AND t.date <= LEAST(b.period_end, $3::date)
      ), 0)) as remaining,
      CASE 
        WHEN b.amount > 0 THEN
          (COALESCE((
            SELECT SUM(t.amount)
            FROM transactions t
            WHERE t.category_id = b.category_id
              AND t.user_id = b.user_id
              AND t.type = 'expense'
              AND t.date >= GREATEST(b.period_start, $2::date)
              AND t.date <= LEAST(b.period_end, $3::date)
          ), 0) / b.amount * 100)
        ELSE 0
      END as percentage
    FROM budgets b
    JOIN categories c ON b.category_id = c.id
    WHERE b.user_id = $1
      AND b.period_start <= $3::date
      AND b.period_end >= $2::date
    ORDER BY 
      CASE c.budget_type
        WHEN 'needs' THEN 1
        WHEN 'wants' THEN 2
        WHEN 'savings' THEN 3
        ELSE 4
      END,
      c.name
  `;

  const result = await dbQuery(query, [
    userId,
    periodStart,
    periodEnd,
  ]);

  // Calculate summary by budget type
  const summary = {
    needs: { budget: 0, spent: 0, remaining: 0 },
    wants: { budget: 0, spent: 0, remaining: 0 },
    savings: { budget: 0, spent: 0, remaining: 0 },
    total: { budget: 0, spent: 0, remaining: 0 },
  };

  result.rows.forEach((row: any) => {
    const budgetType = row.budget_type || 'other';
    const spent = parseFloat(row.spent) || 0;
    const remaining = parseFloat(row.remaining) || 0;
    const budget = parseFloat(row.amount) || 0;

    if (budgetType in summary) {
      summary[budgetType as keyof typeof summary].budget += budget;
      summary[budgetType as keyof typeof summary].spent += spent;
      summary[budgetType as keyof typeof summary].remaining += remaining;
    }

    summary.total.budget += budget;
    summary.total.spent += spent;
    summary.total.remaining += remaining;
  });

  res.status(200).json({
    budgets: result.rows,
    summary,
  });
} else if (req.method === 'POST') {
      const {
        category_id,
        amount,
        period_start,
        period_end,
        start_date,
        end_date,
        rollover,
        alert_threshold,
        period,
      } = req.body;

      // Support both field naming conventions
      let actualPeriodStart = period_start || start_date;
      let actualPeriodEnd = period_end || end_date;

      // Auto-generate period_end if not provided or empty
      if (!actualPeriodEnd || actualPeriodEnd === '') {
        const startDate = new Date(actualPeriodStart);
        if (period === 'monthly') {
          actualPeriodEnd = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
            .toISOString().split('T')[0];
        } else if (period === 'yearly') {
          actualPeriodEnd = new Date(startDate.getFullYear(), 11, 31)
            .toISOString().split('T')[0];
        } else {
          // Default to end of month
          actualPeriodEnd = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
            .toISOString().split('T')[0];
        }
      }

      if (!category_id || !amount || !actualPeriodStart) {
        return res.status(400).json({ 
          message: 'Missing required fields',
          required: ['category_id', 'amount', 'start_date or period_start']
        });
      }

      const query = `
        INSERT INTO budgets (
          user_id, category_id, amount, period_start, period_end,
          rollover, alert_threshold
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await dbQuery(query, [
        userId,
        category_id,
        amount,
        actualPeriodStart,
        actualPeriodEnd,
        rollover || false,
        alert_threshold || 80,
      ]);

      res.status(201).json(result.rows[0]);

    } else if (req.method === 'PUT') {
  const { id } = req.query;

  const {
    category_id,      // ✅ Tambahkan ini
    amount,
    period_start,
    period_end,
    start_date,
    end_date,
    rollover,
    alert_threshold,
    period,
    budget_type,      // ✅ Tambahkan ini juga (optional, tergantung schema)
  } = req.body;

  // Support both naming conventions
  let actualPeriodStart = period_start || start_date;
  let actualPeriodEnd = period_end || end_date;

  // Auto-generate period_end if not provided or empty
  if (!actualPeriodEnd || actualPeriodEnd === '') {
    const startDate = new Date(actualPeriodStart);
    if (period === 'monthly') {
      actualPeriodEnd = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
        .toISOString().split('T')[0];
    } else if (period === 'yearly') {
      actualPeriodEnd = new Date(startDate.getFullYear(), 11, 31)
        .toISOString().split('T')[0];
    } else {
      // Default to end of month
      actualPeriodEnd = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
        .toISOString().split('T')[0];
    }
  }

  if (!actualPeriodStart || !amount) {
    return res.status(400).json({ 
      message: 'Missing required fields',
      required: ['amount', 'start_date or period_start']
    });
  }

  const query = `
    UPDATE budgets SET
      category_id = $1,
      amount = $2,
      period_start = $3,
      period_end = $4,
      rollover = $5,
      alert_threshold = $6,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $7 AND user_id = $8
    RETURNING *
  `;

  const result = await dbQuery(query, [
    category_id,           // ✅ $1 - Update category_id
    amount,                // $2
    actualPeriodStart,     // $3
    actualPeriodEnd,       // $4
    rollover || false,     // $5
    alert_threshold || 80, // $6
    id,                    // $7
    userId,                // $8
  ]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Budget not found' });
  }

  res.status(200).json(result.rows[0]);
} else if (req.method === 'DELETE') {
      const { id } = req.query;

      await dbQuery(
        'DELETE FROM budgets WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      res.status(200).json({ message: 'Budget deleted' });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Budgets API error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}

export default authMiddleware(handler);
