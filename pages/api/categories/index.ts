import { NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';
import { query as dbQuery } from '@/lib/db';

async function handler(req: AuthRequest, res: NextApiResponse) {
  const userId = req.user?.userId;

  try {
    if (req.method === 'GET') {
      const { type, budget_type, is_active } = req.query;

      let query = `
        SELECT 
          id,
          user_id,
          name,
          type,
          parent_id,
          icon,
          color,
          budget_type,
          is_active,
          created_at
        FROM categories
        WHERE (user_id = $1 OR user_id IS NULL)
      `;
      
      const params: any[] = [userId];
      let paramIndex = 2;

      // Filter by type (income/expense)
      if (type) {
        query += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      // Filter by budget_type (needs/wants/savings)
      if (budget_type) {
        query += ` AND budget_type = $${paramIndex}`;
        params.push(budget_type);
        paramIndex++;
      }

      // Filter by is_active
      if (is_active !== undefined && is_active !== 'all') {
        query += ` AND is_active = $${paramIndex}`;
        params.push(is_active === 'true');
        paramIndex++;
      }

      query += ` ORDER BY 
        CASE 
          WHEN user_id IS NULL THEN 0 
          ELSE 1 
        END,
        budget_type NULLS LAST,
        name ASC
      `;

      const result = await dbQuery(query, params);

      // Group by budget_type for easier frontend handling
      const grouped = {
        needs: result.rows.filter((c: any) => c.budget_type === 'needs'),
        wants: result.rows.filter((c: any) => c.budget_type === 'wants'),
        savings: result.rows.filter((c: any) => c.budget_type === 'savings'),
        income: result.rows.filter((c: any) => c.type === 'income'),
        all: result.rows,
      };

      res.status(200).json(grouped);

    } else if (req.method === 'POST') {
      const {
        name,
        type,
        parent_id,
        icon,
        color,
        budget_type,
        is_active = true,
      } = req.body;

      if (!name || !type) {
        return res.status(400).json({ 
          message: 'Missing required fields',
          required: ['name', 'type']
        });
      }

      // Validate type
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ 
          message: 'Invalid type. Must be "income" or "expense"'
        });
      }

      // Validate budget_type if expense
      if (type === 'expense' && budget_type && !['needs', 'wants', 'savings'].includes(budget_type)) {
        return res.status(400).json({ 
          message: 'Invalid budget_type. Must be "needs", "wants", or "savings"'
        });
      }

      const query = `
        INSERT INTO categories (
          user_id, name, type, parent_id, icon, color, budget_type, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await dbQuery(query, [
        userId,
        name,
        type,
        parent_id || null,
        icon || '📊',
        color || '#6366f1',
        budget_type || null,
        is_active,
      ]);

      res.status(201).json(result.rows[0]);

    } else if (req.method === 'PUT') {
      const { id } = req.query;
      const {
        name,
        type,
        parent_id,
        icon,
        color,
        budget_type,
        is_active,
      } = req.body;

      if (!name || !type) {
        return res.status(400).json({ 
          message: 'Missing required fields',
          required: ['name', 'type']
        });
      }

      const query = `
        UPDATE categories SET
          name = $1,
          type = $2,
          parent_id = $3,
          icon = $4,
          color = $5,
          budget_type = $6,
          is_active = $7
        WHERE id = $8 AND user_id = $9
        RETURNING *
      `;

      const result = await dbQuery(query, [
        name,
        type,
        parent_id || null,
        icon || '📊',
        color || '#6366f1',
        budget_type || null,
        is_active !== undefined ? is_active : true,
        id,
        userId,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          message: 'Category not found or you do not have permission to edit it'
        });
      }

      res.status(200).json(result.rows[0]);

    } else if (req.method === 'DELETE') {
      const { id } = req.query;

      // Check if category is being used in transactions or budgets
      const checkQuery = `
        SELECT 
          (SELECT COUNT(*) FROM transactions WHERE category_id = $1) as transaction_count,
          (SELECT COUNT(*) FROM budgets WHERE category_id = $1) as budget_count
      `;
      const checkResult = await dbQuery(checkQuery, [id]);
      
      const { transaction_count, budget_count } = checkResult.rows[0];
      
      if (transaction_count > 0 || budget_count > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete category that is being used in transactions or budgets',
          details: {
            transactions: parseInt(transaction_count),
            budgets: parseInt(budget_count),
          }
        });
      }

      // Delete the category
      const result = await dbQuery(
        'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          message: 'Category not found or you do not have permission to delete it'
        });
      }

      res.status(200).json({ 
        message: 'Category deleted successfully',
        category: result.rows[0]
      });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Categories API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: String(error) 
    });
  }
}

export default authMiddleware(handler);