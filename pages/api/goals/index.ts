// pages\api\goals\index.ts
import { NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';
import { query as dbQuery } from '@/lib/db';

async function handler(
  req: AuthRequest,
  res: NextApiResponse
) {
  const userId = req.user?.userId;

  try {
    if (req.method === 'GET') {
      const query = `
        SELECT 
          g.*,
          a.name as account_name,
          (g.current_amount / NULLIF(g.target_amount, 0) * 100) as progress_percentage,
          (g.target_amount - g.current_amount) as remaining_amount,
          CASE 
            WHEN g.target_date IS NOT NULL 
            THEN (g.target_date - CURRENT_DATE)
            ELSE NULL
          END as days_remaining,
          CASE 
            WHEN g.target_date IS NOT NULL AND g.target_date > CURRENT_DATE
            THEN (g.target_amount - g.current_amount) / 
                 NULLIF(EXTRACT(MONTH FROM AGE(g.target_date, CURRENT_DATE)) + 
                 EXTRACT(DAY FROM AGE(g.target_date, CURRENT_DATE)) / 30, 0)
            ELSE NULL
          END as monthly_required
        FROM financial_goals g
        LEFT JOIN accounts a ON g.account_id = a.id
        WHERE g.user_id = $1
        ORDER BY 
          CASE g.priority
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
          END,
          g.target_date ASC NULLS LAST
      `;

      const result = await dbQuery(query, [userId]);

      // Get recent contributions for each goal
      for (const goal of result.rows) {
        const contribQuery = `
          SELECT * FROM goal_contributions
          WHERE goal_id = $1
          ORDER BY date DESC
          LIMIT 5
        `;
        const contribResult = await dbQuery(contribQuery, [goal.id]);
        goal.recent_contributions = contribResult.rows;
      }

      res.status(200).json(result.rows);

    } else if (req.method === 'POST') {
      const {
        account_id,
        name,
        description,
        target_amount,
        current_amount,
        target_date,
        priority,
        goal_type,
        auto_save_amount,
      } = req.body;

      if (!name || !target_amount) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const query = `
        INSERT INTO financial_goals (
          user_id, account_id, name, description, target_amount,
          current_amount, target_date, priority, goal_type, auto_save_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await dbQuery(query, [
        userId,
        account_id || null,
        name,
        description || null,
        target_amount,
        current_amount || 0,
        target_date || null,
        priority || 'medium',
        goal_type || null,
        auto_save_amount || 0,
      ]);

      res.status(201).json(result.rows[0]);

    } else if (req.method === 'PUT') {
      const { id } = req.query;
      const {
        name,
        description,
        target_amount,
        current_amount,
        target_date,
        priority,
        goal_type,
        auto_save_amount,
        status,
      } = req.body;

      const query = `
        UPDATE financial_goals SET
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          target_amount = COALESCE($3, target_amount),
          current_amount = COALESCE($4, current_amount),
          target_date = COALESCE($5, target_date),
          priority = COALESCE($6, priority),
          goal_type = COALESCE($7, goal_type),
          auto_save_amount = COALESCE($8, auto_save_amount),
          status = COALESCE($9, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $10 AND user_id = $11
        RETURNING *
      `;

      const result = await dbQuery(query, [
        name,
        description,
        target_amount,
        current_amount,
        target_date,
        priority,
        goal_type,
        auto_save_amount,
        status,
        id,
        userId,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Goal not found' });
      }

      res.status(200).json(result.rows[0]);

    } else if (req.method === 'DELETE') {
      const { id } = req.query;

      await dbQuery(
        'DELETE FROM financial_goals WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      res.status(200).json({ message: 'Goal deleted' });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Goals API error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}

export default authMiddleware(handler);
