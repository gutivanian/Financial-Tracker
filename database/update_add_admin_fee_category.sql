-- Migration: Add Admin Fee category for all users
-- Purpose: Ensure all users have an "Admin Fee" category for transfer fees
-- Created: 2026-01-02

-- Add Admin Fee category for existing users who don't have it
INSERT INTO categories (user_id, name, type, parent_id, icon, color, budget_type, is_active, created_at)
SELECT 
    u.id as user_id,
    'Admin Fee' as name,
    'expense' as type,
    NULL as parent_id,
    'DollarSign' as icon,
    '#ef4444' as color,
    'needs' as budget_type,
    true as is_active,
    CURRENT_TIMESTAMP as created_at
FROM users u
WHERE NOT EXISTS (
    SELECT 1 
    FROM categories c 
    WHERE c.user_id = u.id 
    AND c.name = 'Admin Fee' 
    AND c.type = 'expense'
)
ON CONFLICT DO NOTHING;

-- Add to_account_id column to transactions table for transfer tracking
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'to_account_id'
    ) THEN
        ALTER TABLE transactions 
        ADD COLUMN to_account_id INTEGER,
        ADD CONSTRAINT fk_to_account 
            FOREIGN KEY (to_account_id) 
            REFERENCES accounts(id) 
            ON DELETE SET NULL;
    END IF;
END $$;

-- Add admin_fee column to transactions table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'admin_fee'
    ) THEN
        ALTER TABLE transactions 
        ADD COLUMN admin_fee NUMERIC(15, 2) DEFAULT 0;
    END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_to_account_id 
    ON transactions(to_account_id);

-- Add index for transfer type queries
CREATE INDEX IF NOT EXISTS idx_transactions_type 
    ON transactions(type);

-- Verification: Show all users with Admin Fee category
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email,
    c.id as category_id,
    c.name as category_name,
    c.type as category_type,
    c.is_active
FROM users u
LEFT JOIN categories c ON c.user_id = u.id AND c.name = 'Admin Fee'
ORDER BY u.id;

-- Show updated transactions table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'transactions'
ORDER BY ordinal_position;
