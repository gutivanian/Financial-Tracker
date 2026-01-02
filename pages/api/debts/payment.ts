import { NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';
import { query as dbQuery } from '@/lib/db';

async function handler(req: AuthRequest, res: NextApiResponse) {
  const userId = req.user?.userId;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { debt_id, account_id, amount, payment_date, notes } = req.body;

    // Required fields validation
    if (!debt_id || !account_id || !amount || !payment_date) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['debt_id', 'account_id', 'amount', 'payment_date']
      });
    }

    // Verify debt belongs to user
    const debtCheck = await dbQuery(
      'SELECT * FROM debts WHERE id = $1 AND user_id = $2',
      [debt_id, userId]
    );

    if (debtCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Debt not found' });
    }

    // Verify account belongs to user
    const accountCheck = await dbQuery(
      'SELECT * FROM accounts WHERE id = $1 AND user_id = $2 AND is_active = true',
      [account_id, userId]
    );

    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found or inactive' });
    }

    const debt = debtCheck.rows[0];
    const account = accountCheck.rows[0];
    const paymentAmount = parseFloat(amount);
    const currentBalance = parseFloat(debt.current_balance);
    const accountBalance = parseFloat(account.balance);
    const interestRate = parseFloat(debt.interest_rate) || 0;

    // ============================================
    // VALIDATIONS
    // ============================================

    // Validation 1: Check if debt is already paid off
    if (debt.status === 'paid_off' || currentBalance <= 0) {
      return res.status(400).json({ 
        error: 'DEBT_ALREADY_PAID',
        message: '❌ This debt is already paid off',
        details: {
          debt_name: debt.creditor,
          current_balance: currentBalance,
          status: debt.status
        }
      });
    }

    // Validation 2: Payment amount must be positive
    if (paymentAmount <= 0) {
      return res.status(400).json({ 
        error: 'INVALID_AMOUNT',
        message: 'Payment amount must be greater than 0',
        payment_amount: paymentAmount
      });
    }

    // Validation 3: Check if payment exceeds current balance
    if (paymentAmount > currentBalance) {
      return res.status(400).json({ 
        error: 'OVERPAYMENT',
        message: '⚠️ Payment amount cannot exceed current balance',
        details: {
          payment_amount: paymentAmount,
          current_balance: currentBalance,
          excess_amount: paymentAmount - currentBalance,
          maximum_payment: currentBalance
        },
        suggestion: `Please reduce your payment to ${currentBalance.toLocaleString('id-ID')} or less`
      });
    }

    // ============================================
    // CALCULATE PAYMENT BREAKDOWN
    // ============================================

    // Calculate monthly interest: interest = balance * (rate/100) / 12
    const monthlyInterestAmount = (currentBalance * (interestRate / 100)) / 12;
    
    // Determine how payment is split between interest and principal
    let interestAmount = 0;
    let principalAmount = 0;

    if (paymentAmount <= monthlyInterestAmount) {
      // Payment only covers partial/full interest
      interestAmount = paymentAmount;
      principalAmount = 0;
    } else {
      // Payment covers full interest + some principal
      interestAmount = monthlyInterestAmount;
      principalAmount = paymentAmount - monthlyInterestAmount;
    }

    // Calculate new balance (cannot go below 0)
    const newBalance = Math.max(0, currentBalance - principalAmount);
    
    // Determine new status
    const newStatus = newBalance === 0 ? 'paid_off' : 'active';

    // ============================================
    // RECORD PAYMENT (Database Transaction)
    // ============================================

    await dbQuery('BEGIN');

    try {
      // 1. Get "Debt Payment" category ID
      const categoryResult = await dbQuery(
        `SELECT id FROM categories WHERE user_id = $1 AND name = 'Debt Payment' LIMIT 1`,
        [userId]
      );

      if (categoryResult.rows.length === 0) {
        await dbQuery('ROLLBACK');
        return res.status(500).json({ 
          message: 'Debt Payment category not found. Please contact support.' 
        });
      }

      const debtPaymentCategoryId = categoryResult.rows[0].id;

      // 2. Create transaction expense
      const transactionResult = await dbQuery(
        `INSERT INTO transactions (
          user_id, account_id, category_id, type, amount, date, notes
        ) VALUES ($1, $2, $3, 'expense', $4, $5, $6)
        RETURNING id`,
        [
          userId, 
          account_id, 
          debtPaymentCategoryId, 
          paymentAmount, 
          payment_date, 
          notes || `Debt payment for ${debt.creditor}`
        ]
      );

      const transactionId = transactionResult.rows[0].id;

      // 3. Update account balance
      const newAccountBalance = accountBalance - paymentAmount;
      await dbQuery(
        `UPDATE accounts SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newAccountBalance, account_id]
      );

      // 4. Insert payment record with transaction link
      const paymentResult = await dbQuery(
        `INSERT INTO debt_payments (
          debt_id, account_id, transaction_id, amount, payment_date, principal_amount, interest_amount, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [debt_id, account_id, transactionId, paymentAmount, payment_date, principalAmount, interestAmount, notes || null]
      );

      // 5. Update debt balance and status
      await dbQuery(
        `UPDATE debts SET 
          current_balance = $1,
          status = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3`,
        [newBalance, newStatus, debt_id]
      );

      // Commit transaction
      await dbQuery('COMMIT');

      // ============================================
      // SUCCESS RESPONSE
      // ============================================

      res.status(200).json({ 
        success: true,
        message: newStatus === 'paid_off' 
          ? '🎉 Congratulations! Debt fully paid off!' 
          : '✅ Payment recorded successfully',
        payment: {
          id: paymentResult.rows[0].id,
          transaction_id: transactionId,
          account_id: account_id,
          amount: paymentAmount,
          principal_amount: principalAmount,
          interest_amount: interestAmount,
          payment_date: payment_date,
          notes: notes || null
        },
        debt_update: {
          debt_name: debt.creditor,
          previous_balance: currentBalance,
          new_balance: newBalance,
          amount_reduced: principalAmount,
          remaining: newBalance,
          status: newStatus,
          is_paid_off: newStatus === 'paid_off'
        },
        breakdown: {
          total_payment: paymentAmount,
          to_interest: interestAmount,
          to_principal: principalAmount,
          interest_rate_monthly: `${((interestRate / 12) || 0).toFixed(2)}%`
        }
      });

    } catch (error) {
      // Rollback on error
      await dbQuery('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Payment API error:', error);
    res.status(500).json({ 
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to record payment', 
      details: String(error) 
    });
  }
}

export default authMiddleware(handler);