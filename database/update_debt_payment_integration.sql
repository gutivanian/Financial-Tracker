-- Migration: Integrate Debt Payment with Transactions
-- Date: 2026-01-02
-- Purpose: Make debt payments create transactions and update account balances

-- 1. Add payment_type to debts table
ALTER TABLE debts 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'manual';

COMMENT ON COLUMN debts.payment_type IS 'Payment type: autopayment or manual';

-- 2. Add account_id and transaction_id to debt_payments
ALTER TABLE debt_payments 
ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL;

COMMENT ON COLUMN debt_payments.account_id IS 'Account used for payment';
COMMENT ON COLUMN debt_payments.transaction_id IS 'Linked transaction expense';

-- 3. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_debt_payments_account_id ON debt_payments(account_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_transaction_id ON debt_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_debts_payment_type ON debts(payment_type);
CREATE INDEX IF NOT EXISTS idx_debts_payment_due_date ON debts(payment_due_date);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);

-- 4. Create "Debt Payment" category for all existing users (if not exists)
INSERT INTO categories (user_id, name, type, icon, color, budget_type, is_active)
SELECT DISTINCT 
    u.id as user_id,
    'Debt Payment' as name,
    'expense' as type,
    'CreditCard' as icon,
    '#ef4444' as color,
    'needs' as budget_type,
    true as is_active
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM categories c 
    WHERE c.user_id = u.id 
    AND c.name = 'Debt Payment' 
    AND c.type = 'expense'
);

-- 5. Update existing debts to set default payment_type
UPDATE debts 
SET payment_type = 'manual' 
WHERE payment_type IS NULL;

COMMENT ON TABLE debts IS 'Debt tracking with auto/manual payment support';
COMMENT ON TABLE debt_payments IS 'Debt payment history linked to transactions';

-- Migration completed successfully
