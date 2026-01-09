-- Migration: Add Transaction Splits Feature
-- Date: 2026-01-09
-- Description: Enable split payment feature - pay one transaction with multiple accounts

-- 1. Add new columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS is_split_payment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS split_count INTEGER DEFAULT 1;

COMMENT ON COLUMN transactions.is_split_payment IS 'True if this transaction uses multiple payment methods';
COMMENT ON COLUMN transactions.split_count IS 'Number of accounts used for payment';

-- 2. Create transaction_splits table
CREATE TABLE IF NOT EXISTS public.transaction_splits (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    amount NUMERIC(15,2) NOT NULL,
    percentage NUMERIC(5,2),  -- Percentage of total transaction amount
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT valid_percentage CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100))
);

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transaction_splits_transaction_id ON transaction_splits(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_splits_account_id ON transaction_splits(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_split_payment ON transactions(is_split_payment) WHERE is_split_payment = true;

-- 4. Create function to validate transaction splits
CREATE OR REPLACE FUNCTION validate_transaction_splits()
RETURNS TRIGGER AS $$
DECLARE
    total_splits NUMERIC(15,2);
    transaction_amount NUMERIC(15,2);
    split_payment_flag BOOLEAN;
BEGIN
    -- Get transaction details
    SELECT amount, is_split_payment INTO transaction_amount, split_payment_flag
    FROM transactions
    WHERE id = NEW.transaction_id;
    
    -- Only validate if transaction is marked as split payment
    IF split_payment_flag = true THEN
        -- Calculate sum of splits
        SELECT COALESCE(SUM(amount), 0) INTO total_splits
        FROM transaction_splits
        WHERE transaction_id = NEW.transaction_id;
        
        -- Validate: total splits should not exceed transaction amount
        IF total_splits > transaction_amount + 0.01 THEN  -- Allow 0.01 tolerance for floating point
            RAISE EXCEPTION 'Total splits (%) exceeds transaction amount (%)', 
                total_splits, transaction_amount;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to validate splits
DROP TRIGGER IF EXISTS check_split_amount ON transaction_splits;
CREATE TRIGGER check_split_amount
    AFTER INSERT OR UPDATE ON transaction_splits
    FOR EACH ROW
    EXECUTE FUNCTION validate_transaction_splits();

-- 6. Create function to update split count
CREATE OR REPLACE FUNCTION update_split_count()
RETURNS TRIGGER AS $$
DECLARE
    split_cnt INTEGER;
BEGIN
    -- Count splits for the transaction
    SELECT COUNT(*) INTO split_cnt
    FROM transaction_splits
    WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id);
    
    -- Update split_count in transactions table
    UPDATE transactions
    SET split_count = GREATEST(split_cnt, 1)
    WHERE id = COALESCE(NEW.transaction_id, OLD.transaction_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to auto-update split count
DROP TRIGGER IF EXISTS auto_update_split_count ON transaction_splits;
CREATE TRIGGER auto_update_split_count
    AFTER INSERT OR DELETE ON transaction_splits
    FOR EACH ROW
    EXECUTE FUNCTION update_split_count();

-- 8. Create view for easy querying of transactions with splits
CREATE OR REPLACE VIEW v_transactions_with_splits AS
SELECT 
    t.id,
    t.user_id,
    t.account_id,
    t.category_id,
    t.type,
    t.amount,
    t.date,
    t.description,
    t.notes,
    t.merchant,
    t.tags,
    t.is_recurring,
    t.recurring_id,
    t.receipt_url,
    t.is_split_payment,
    t.split_count,
    t.created_at,
    t.updated_at,
    c.name as category_name,
    c.icon as category_icon,
    c.color as category_color,
    
    -- For non-split payments, use account_id from transactions table
    CASE 
        WHEN t.is_split_payment = false OR t.is_split_payment IS NULL THEN
            json_build_array(
                json_build_object(
                    'account_id', a_single.id,
                    'account_name', a_single.name,
                    'account_type', a_single.type,
                    'amount', t.amount,
                    'percentage', 100::numeric
                )
            )
        ELSE
            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'account_id', ts.account_id,
                            'account_name', a.name,
                            'account_type', a.type,
                            'amount', ts.amount,
                            'percentage', ts.percentage
                        ) ORDER BY ts.id
                    )
                    FROM transaction_splits ts
                    LEFT JOIN accounts a ON ts.account_id = a.id
                    WHERE ts.transaction_id = t.id
                ),
                '[]'::json
            )
    END as payment_details
    
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN accounts a_single ON t.account_id = a_single.id;

COMMENT ON VIEW v_transactions_with_splits IS 'View that combines transactions with their split payment details';

-- 9. Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON transaction_splits TO your_app_user;
-- GRANT USAGE ON SEQUENCE transaction_splits_id_seq TO your_app_user;
-- GRANT SELECT ON v_transactions_with_splits TO your_app_user;

-- Migration complete
-- Now you can use split payment feature!
