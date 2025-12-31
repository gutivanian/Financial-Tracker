import { NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';
import { query as dbQuery } from '@/lib/db';
import { DashboardStats, SpendingByCategory, MonthlyTrend } from '@/lib/types';

async function handler(
  req: AuthRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userId = req.user?.userId;
    const { period = 'current_month' } = req.query;

    // Determine date range based on period
    let startDate, endDate, monthsBack;
    const now = new Date();
    
    if (period === 'current_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      monthsBack = 5; // Show 6 months total (current + 5 back)
    } else if (period === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      monthsBack = 5;
    } else if (period === 'last_3_months') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      monthsBack = 5;
    } else if (period === 'year_to_date') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      monthsBack = 11; // Show 12 months for yearly view
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      monthsBack = 11;
    }

    // Query 1: Get dashboard statistics
    const statsQuery = `
      WITH income_stats AS (
        SELECT COALESCE(SUM(amount), 0) as total_income
        FROM transactions
        WHERE user_id = $1 
          AND type = 'income'
          AND date >= $2 
          AND date <= $3
      ),
      expense_stats AS (
        SELECT COALESCE(SUM(amount), 0) as total_expenses
        FROM transactions
        WHERE user_id = $1 
          AND type = 'expense'
          AND date >= $2 
          AND date <= $3
      ),
      budget_stats AS (
        SELECT 
          COALESCE(SUM(b.amount), 0) as total_budget,
          COALESCE(SUM(
            (SELECT COALESCE(SUM(t.amount), 0)
             FROM transactions t
             WHERE t.category_id = b.category_id
               AND t.type = 'expense'
               AND t.date >= b.period_start
               AND t.date <= b.period_end)
          ), 0) as budget_spent
        FROM budgets b
        WHERE b.user_id = $1
          AND b.period_start >= $2
          AND b.period_end <= $3
      ),
      assets_total AS (
        SELECT 
          COALESCE(SUM(balance), 0) + 
          COALESCE((
            SELECT SUM(
              CASE 
                WHEN inst.last_price_idr IS NOT NULL THEN inst.last_price_idr * i.quantity
                WHEN inst.last_price IS NOT NULL THEN inst.last_price * i.quantity
                ELSE i.purchase_price * i.quantity
              END
            )
            FROM investments i
            LEFT JOIN investment_instruments inst ON i.instrument_id = inst.id
            WHERE i.user_id = $1
          ), 0) +
          COALESCE((SELECT SUM(current_value) 
                    FROM assets 
                    WHERE user_id = $1 AND current_value IS NOT NULL), 0) as total_assets
        FROM accounts
        WHERE user_id = $1 
          AND type != 'credit_card'
          AND is_active = true
      ),
      liabilities_total AS (
        SELECT COALESCE(SUM(current_balance), 0) as total_liabilities
        FROM debts
        WHERE user_id = $1 
          AND status = 'active'
      )
      SELECT 
        i.total_income,
        e.total_expenses,
        (i.total_income - e.total_expenses) as net_cashflow,
        CASE 
          WHEN i.total_income > 0 
          THEN ((i.total_income - e.total_expenses) / i.total_income * 100)
          ELSE 0 
        END as saving_rate,
        b.total_budget,
        b.budget_spent,
        (b.total_budget - b.budget_spent) as budget_remaining,
        (a.total_assets - l.total_liabilities) as net_worth,
        a.total_assets,
        l.total_liabilities
      FROM income_stats i, expense_stats e, budget_stats b, 
           assets_total a, liabilities_total l
    `;

    const statsResult = await dbQuery(statsQuery, [userId, startDate, endDate]);
    const stats: DashboardStats = statsResult.rows[0];

    // Query 2: Get spending by category - FIXED: Cast to numeric
    const categoryQuery = `
      SELECT 
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        SUM(t.amount)::numeric::float as total_amount,
        COUNT(t.id)::integer as transaction_count,
        ROUND(
          (SUM(t.amount)::numeric / NULLIF(
            (SELECT SUM(amount)::numeric FROM transactions 
             WHERE user_id = $1 AND type = 'expense' 
             AND date >= $2 AND date <= $3), 0
          ) * 100)::numeric, 
          2
        )::float as percentage
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
        AND t.type = 'expense'
        AND t.date >= $2
        AND t.date <= $3
      GROUP BY c.id, c.name, c.icon, c.color
      ORDER BY total_amount DESC
      LIMIT 10
    `;

    const categoryResult = await dbQuery(categoryQuery, [userId, startDate, endDate]);
    const spendingByCategory: SpendingByCategory[] = categoryResult.rows;

    // Query 3: Get monthly trends - DYNAMIC based on period
    const trendsQuery = `
      WITH months AS (
        SELECT generate_series(
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '${monthsBack} months'),
          DATE_TRUNC('month', CURRENT_DATE),
          '1 month'::interval
        ) AS month
      )
      SELECT 
        TO_CHAR(m.month, 'Mon YYYY') as month,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::numeric::float as income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::numeric::float as expenses,
        (COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) - 
         COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0))::numeric::float as savings
      FROM months m
      LEFT JOIN transactions t ON 
        t.user_id = $1 AND
        DATE_TRUNC('month', t.date) = m.month
      GROUP BY m.month
      ORDER BY m.month
    `;

    const trendsResult = await dbQuery(trendsQuery, [userId]);
    const monthlyTrends: MonthlyTrend[] = trendsResult.rows;

    // Query 4: Get recent transactions
    const recentQuery = `
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
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 10
    `;

    const recentResult = await dbQuery(recentQuery, [userId]);
    const recentTransactions = recentResult.rows;

    // Query 5: Get accounts summary
    const accountsQuery = `
      SELECT 
        id,
        name,
        type,
        balance,
        currency,
        icon,
        color
      FROM accounts
      WHERE user_id = $1 AND is_active = true
      ORDER BY 
        CASE type
          WHEN 'bank' THEN 1
          WHEN 'e-wallet' THEN 2
          WHEN 'cash' THEN 3
          WHEN 'credit_card' THEN 4
        END,
        balance DESC
    `;

    const accountsResult = await dbQuery(accountsQuery, [userId]);
    const accounts = accountsResult.rows;

    res.status(200).json({
      stats,
      spendingByCategory,
      monthlyTrends,
      recentTransactions,
      accounts,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}

export default authMiddleware(handler);