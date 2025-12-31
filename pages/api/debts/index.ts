import { NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';
import { query as dbQuery } from '@/lib/db';

async function handler(req: AuthRequest, res: NextApiResponse) {
  const userId = req.user?.userId;

  try {
    if (req.method === 'GET') {
      const query = `
        SELECT 
          *,
          (original_amount - current_balance) as paid_amount,
          CASE 
            WHEN maturity_date IS NOT NULL AND minimum_payment > 0 THEN
              CEIL(current_balance / minimum_payment)
            ELSE NULL
          END as remaining_months
        FROM debts
        WHERE user_id = $1
        ORDER BY 
          CASE status WHEN 'active' THEN 1 ELSE 2 END,
          current_balance DESC
      `;

      const result = await dbQuery(query, [userId]);

      // Calculate summary
      const summary = {
        total_debt: 0,
        total_paid: 0,
        monthly_minimum: 0,
        active_debts: 0,
        paid_off_debts: 0,
      };

      result.rows.forEach((debt: any) => {
        if (debt.status === 'active') {
          summary.total_debt += parseFloat(debt.current_balance) || 0;
          summary.monthly_minimum += parseFloat(debt.minimum_payment) || 0;
          summary.active_debts += 1;
        } else {
          summary.paid_off_debts += 1;
        }
        summary.total_paid += parseFloat(debt.paid_amount) || 0;
      });

      res.status(200).json({
        debts: result.rows,
        summary,
      });

    } else if (req.method === 'POST') {
      const {
        debt_type,
        creditor,
        creditor_name,
        original_amount,
        principal_amount,
        current_balance,
        interest_rate,
        minimum_payment,
        payment_due_date,
        due_date,
        start_date,
        maturity_date,
        notes,
      } = req.body;

      // Support both field naming conventions
      const actualCreditor = creditor || creditor_name;
      const actualOriginalAmount = original_amount || principal_amount;
      let actualDueDate = payment_due_date || due_date;

      // Parse due_date if it's a string like "30th" -> 30 or just a number string
      if (actualDueDate && typeof actualDueDate === 'string') {
        const parsed = parseInt(actualDueDate.replace(/\D/g, ''));
        actualDueDate = isNaN(parsed) ? null : parsed;
      } else if (actualDueDate && typeof actualDueDate === 'number') {
        actualDueDate = actualDueDate;
      } else {
        actualDueDate = null;
      }

      if (!debt_type || !actualCreditor || !actualOriginalAmount || !current_balance) {
        return res.status(400).json({ 
          message: 'Missing required fields',
          required: ['debt_type', 'creditor (or creditor_name)', 'original_amount (or principal_amount)', 'current_balance']
        });
      }

      // Validate current_balance doesn't exceed original_amount
      if (parseFloat(current_balance) > parseFloat(actualOriginalAmount)) {
        return res.status(400).json({
          message: 'Current balance cannot exceed original amount',
          current_balance: parseFloat(current_balance),
          original_amount: parseFloat(actualOriginalAmount)
        });
      }

      const query = `
        INSERT INTO debts (
          user_id, debt_type, creditor, original_amount, current_balance,
          interest_rate, minimum_payment, payment_due_date, start_date, maturity_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await dbQuery(query, [
        userId,
        debt_type,
        actualCreditor,
        actualOriginalAmount,
        current_balance,
        interest_rate || null,
        minimum_payment || null,
        actualDueDate,
        start_date || null,
        maturity_date || null,
      ]);

      res.status(201).json(result.rows[0]);

    } else if (req.method === 'PUT') {
      const { id } = req.query;
      const {
        creditor,
        creditor_name,
        debt_type,
        original_amount,
        current_balance,
        interest_rate,
        minimum_payment,
        payment_due_date,
        due_date,
        start_date,
        maturity_date,
        status,
      } = req.body;

      // Support both field naming conventions
      const actualCreditor = creditor || creditor_name;
      let actualDueDate = payment_due_date || due_date;

      // Parse due_date if it's a string
      if (actualDueDate && typeof actualDueDate === 'string') {
        const parsed = parseInt(actualDueDate.replace(/\D/g, ''));
        actualDueDate = isNaN(parsed) ? null : parsed;
      } else if (actualDueDate && typeof actualDueDate === 'number') {
        actualDueDate = actualDueDate;
      }

      // Validate current_balance doesn't exceed original_amount if both are provided
      if (original_amount && current_balance) {
        if (parseFloat(current_balance) > parseFloat(original_amount)) {
          return res.status(400).json({
            message: 'Current balance cannot exceed original amount',
            current_balance: parseFloat(current_balance),
            original_amount: parseFloat(original_amount)
          });
        }
      }

      const query = `
        UPDATE debts SET
          creditor = COALESCE($1, creditor),
          debt_type = COALESCE($2, debt_type),
          original_amount = COALESCE($3, original_amount),
          current_balance = COALESCE($4, current_balance),
          interest_rate = COALESCE($5, interest_rate),
          minimum_payment = COALESCE($6, minimum_payment),
          payment_due_date = COALESCE($7, payment_due_date),
          start_date = COALESCE($8, start_date),
          maturity_date = COALESCE($9, maturity_date),
          status = COALESCE($10, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $11 AND user_id = $12
        RETURNING *
      `;

      const result = await dbQuery(query, [
        actualCreditor,
        debt_type,
        original_amount,
        current_balance,
        interest_rate,
        minimum_payment,
        actualDueDate,
        start_date,
        maturity_date,
        status,
        id,
        userId,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Debt not found' });
      }

      res.status(200).json(result.rows[0]);

    } else if (req.method === 'DELETE') {
      const { id } = req.query;

      // Check if debt exists and belongs to user
      const checkResult = await dbQuery(
        'SELECT * FROM debts WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Debt not found' });
      }

      // Delete debt (this will cascade delete payments)
      await dbQuery(
        'DELETE FROM debts WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      res.status(200).json({ 
        message: 'Debt deleted successfully',
        deleted_debt: checkResult.rows[0]
      });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Debts API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: String(error) 
    });
  }
}

export default authMiddleware(handler);