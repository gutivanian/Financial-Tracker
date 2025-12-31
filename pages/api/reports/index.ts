// pages/api/reports/index.ts
import { NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';
import { query as dbQuery } from '@/lib/db';

async function handler(
  req: AuthRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userId = req.user?.userId;
    const { period = 'current_month', compare_with = 'last_month' } = req.query;

    // Helper function to get date range
    const getDateRange = (periodType: string) => {
      const now = new Date();
      let startDate, endDate;

      switch (periodType) {
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'last_3_months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'last_6_months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'year_to_date':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      return { startDate, endDate };
    };

    const currentPeriod = getDateRange(period as string);
    const comparisonPeriod = getDateRange(compare_with as string);

    // Query 1: Income & Expense Comparison
    const incomeExpenseQuery = `
      WITH current_period AS (
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
          COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
          COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count
        FROM transactions
        WHERE user_id = $1 
          AND date >= $2 
          AND date <= $3
      ),
      comparison_period AS (
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
          COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
          COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count
        FROM transactions
        WHERE user_id = $1 
          AND date >= $4 
          AND date <= $5
      )
      SELECT 
        c.income as current_income,
        c.expense as current_expense,
        (c.income - c.expense) as current_net,
        c.income_count as current_income_count,
        c.expense_count as current_expense_count,
        p.income as comparison_income,
        p.expense as comparison_expense,
        (p.income - p.expense) as comparison_net,
        p.income_count as comparison_income_count,
        p.expense_count as comparison_expense_count,
        CASE 
          WHEN p.income > 0 THEN ((c.income - p.income) / p.income * 100)
          ELSE 0 
        END as income_change_percent,
        CASE 
          WHEN p.expense > 0 THEN ((c.expense - p.expense) / p.expense * 100)
          ELSE 0 
        END as expense_change_percent
      FROM current_period c, comparison_period p
    `;

    const incomeExpenseResult = await dbQuery(incomeExpenseQuery, [
      userId, 
      currentPeriod.startDate, 
      currentPeriod.endDate,
      userId,
      comparisonPeriod.startDate,
      comparisonPeriod.endDate
    ]);

    // Query 2: Category-wise Spending Analysis
    const categoryAnalysisQuery = `
      WITH current_spending AS (
        SELECT 
          c.id as category_id,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color,
          c.budget_type,
          COALESCE(SUM(t.amount), 0) as amount,
          COUNT(t.id) as transaction_count
        FROM categories c
        LEFT JOIN transactions t ON t.category_id = c.id 
          AND t.user_id = $1
          AND t.type = 'expense'
          AND t.date >= $2
          AND t.date <= $3
        WHERE c.user_id = $1 AND c.type = 'expense'
        GROUP BY c.id, c.name, c.icon, c.color, c.budget_type
      ),
      comparison_spending AS (
        SELECT 
          c.id as category_id,
          COALESCE(SUM(t.amount), 0) as amount
        FROM categories c
        LEFT JOIN transactions t ON t.category_id = c.id 
          AND t.user_id = $1
          AND t.type = 'expense'
          AND t.date >= $4
          AND t.date <= $5
        WHERE c.user_id = $1 AND c.type = 'expense'
        GROUP BY c.id
      ),
      budget_info AS (
        SELECT 
          b.category_id,
          b.amount as budget_amount
        FROM budgets b
        WHERE b.user_id = $1
          AND b.period_start <= $3
          AND b.period_end >= $2
      )
      SELECT 
        cs.category_id,
        cs.category_name,
        cs.category_icon,
        cs.category_color,
        cs.budget_type,
        cs.amount as current_amount,
        cs.transaction_count,
        COALESCE(cmp.amount, 0) as comparison_amount,
        COALESCE(b.budget_amount, 0) as budget_amount,
        CASE 
          WHEN cmp.amount > 0 THEN ((cs.amount - cmp.amount) / cmp.amount * 100)
          ELSE 0 
        END as change_percent,
        CASE 
          WHEN b.budget_amount > 0 THEN (cs.amount / b.budget_amount * 100)
          ELSE 0 
        END as budget_usage_percent
      FROM current_spending cs
      LEFT JOIN comparison_spending cmp ON cs.category_id = cmp.category_id
      LEFT JOIN budget_info b ON cs.category_id = b.category_id
      WHERE cs.amount > 0 OR cmp.amount > 0
      ORDER BY cs.amount DESC
    `;

    const categoryResult = await dbQuery(categoryAnalysisQuery, [
      userId, 
      currentPeriod.startDate, 
      currentPeriod.endDate,
      userId,
      comparisonPeriod.startDate,
      comparisonPeriod.endDate,
      userId,
      currentPeriod.endDate,
      currentPeriod.startDate
    ]);

    // Query 3: Monthly Trends (Last 6 Months)
    const monthlyTrendsQuery = `
      WITH months AS (
        SELECT generate_series(
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'),
          DATE_TRUNC('month', CURRENT_DATE),
          '1 month'::interval
        ) AS month
      )
      SELECT 
        TO_CHAR(m.month, 'Mon YY') as month_label,
        EXTRACT(YEAR FROM m.month) as year,
        EXTRACT(MONTH FROM m.month) as month,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::numeric::float as income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::numeric::float as expense,
        (COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) - 
         COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0))::numeric::float as net,
        COUNT(CASE WHEN t.type = 'income' THEN 1 END) as income_count,
        COUNT(CASE WHEN t.type = 'expense' THEN 1 END) as expense_count
      FROM months m
      LEFT JOIN transactions t ON 
        t.user_id = $1 AND
        DATE_TRUNC('month', t.date) = m.month
      GROUP BY m.month
      ORDER BY m.month
    `;

    const trendsResult = await dbQuery(monthlyTrendsQuery, [userId]);

    // Query 4: Budget Performance Summary
    const budgetPerformanceQuery = `
      SELECT 
        b.id,
        b.amount as budget_amount,
        b.period_start,
        b.period_end,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        c.budget_type,
        COALESCE(SUM(t.amount), 0) as spent_amount,
        (b.amount - COALESCE(SUM(t.amount), 0)) as remaining,
        CASE 
          WHEN b.amount > 0 THEN (COALESCE(SUM(t.amount), 0) / b.amount * 100)
          ELSE 0 
        END as usage_percent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN transactions t ON 
        t.category_id = b.category_id 
        AND t.type = 'expense'
        AND t.date >= b.period_start
        AND t.date <= b.period_end
      WHERE b.user_id = $1
        AND b.period_start >= $2
        AND b.period_end <= $3
      GROUP BY b.id, b.amount, b.period_start, b.period_end, c.name, c.icon, c.color, c.budget_type
      ORDER BY usage_percent DESC
    `;

    const budgetResult = await dbQuery(budgetPerformanceQuery, [
      userId,
      currentPeriod.startDate,
      currentPeriod.endDate
    ]);

    // Query 5: Top Merchants
    const topMerchantsQuery = `
      SELECT 
        merchant,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount
      FROM transactions
      WHERE user_id = $1
        AND type = 'expense'
        AND merchant IS NOT NULL
        AND merchant != ''
        AND date >= $2
        AND date <= $3
      GROUP BY merchant
      ORDER BY total_amount DESC
      LIMIT 10
    `;

    const merchantsResult = await dbQuery(topMerchantsQuery, [
      userId,
      currentPeriod.startDate,
      currentPeriod.endDate
    ]);

    // Query 6: Daily Spending Pattern
    const dailyPatternQuery = `
      SELECT 
        EXTRACT(DOW FROM date) as day_of_week,
        TO_CHAR(date, 'Day') as day_name,
        COUNT(*) as transaction_count,
        AVG(amount) as average_amount,
        SUM(amount) as total_amount
      FROM transactions
      WHERE user_id = $1
        AND type = 'expense'
        AND date >= $2
        AND date <= $3
      GROUP BY EXTRACT(DOW FROM date), TO_CHAR(date, 'Day')
      ORDER BY day_of_week
    `;

    const dailyPatternResult = await dbQuery(dailyPatternQuery, [
      userId,
      currentPeriod.startDate,
      currentPeriod.endDate
    ]);

    res.status(200).json({
      summary: incomeExpenseResult.rows[0],
      categoryAnalysis: categoryResult.rows,
      monthlyTrends: trendsResult.rows,
      budgetPerformance: budgetResult.rows,
      topMerchants: merchantsResult.rows,
      dailyPattern: dailyPatternResult.rows,
      periods: {
        current: {
          start: currentPeriod.startDate,
          end: currentPeriod.endDate,
          label: period
        },
        comparison: {
          start: comparisonPeriod.startDate,
          end: comparisonPeriod.endDate,
          label: compare_with
        }
      }
    });
  } catch (error) {
    console.error('Reports API error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}

export default authMiddleware(handler);
