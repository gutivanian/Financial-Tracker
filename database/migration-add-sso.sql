-- ============================================
-- MIGRATION SCRIPT untuk PFTU yang sudah punya users
-- Menambahkan kolom sso_user_id dan migrate existing users
-- ============================================

-- Step 1: Backup existing users table
CREATE TABLE users_backup AS SELECT * FROM users;

-- Step 2: Add sso_user_id column (nullable dulu untuk existing users)
ALTER TABLE users ADD COLUMN sso_user_id UUID;

-- Step 3: Create unique index
CREATE UNIQUE INDEX idx_users_sso_user_id_unique ON users(sso_user_id) WHERE sso_user_id IS NOT NULL;

-- Step 4: Update existing users dengan UUID
-- PENTING: Ini harus di-run setelah merge users ke SSO database
-- atau gunakan script untuk generate UUID dan register ke SSO

-- Contoh untuk generate UUID untuk existing users:
UPDATE users SET sso_user_id = uuid_generate_v4() WHERE sso_user_id IS NULL;

-- Step 5: Setelah semua users punya sso_user_id, set sebagai NOT NULL
-- ALTER TABLE users ALTER COLUMN sso_user_id SET NOT NULL;

-- ============================================
-- OPSI 2: Jika ingin fresh start dengan SSO
-- ============================================

-- Drop foreign key constraints yang reference users.id
-- ALTER TABLE transactions DROP CONSTRAINT transactions_user_id_fkey;
-- ALTER TABLE accounts DROP CONSTRAINT accounts_user_id_fkey;
-- ALTER TABLE categories DROP CONSTRAINT categories_user_id_fkey;
-- ALTER TABLE budgets DROP CONSTRAINT budgets_user_id_fkey;

-- Truncate users table
-- TRUNCATE TABLE users CASCADE;

-- Alter users table structure
-- ALTER TABLE users DROP CONSTRAINT users_pkey;
-- ALTER TABLE users DROP COLUMN id;
-- ALTER TABLE users ADD COLUMN id SERIAL PRIMARY KEY;
-- ALTER TABLE users ADD COLUMN sso_user_id UUID UNIQUE NOT NULL;

-- Recreate foreign keys
-- ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE accounts ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE categories ADD CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE budgets ADD CONSTRAINT budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check users tanpa sso_user_id
SELECT id, email, name FROM users WHERE sso_user_id IS NULL;

-- Count total users
SELECT COUNT(*) as total_users FROM users;

-- Check for duplicate SSO user IDs (should be 0)
SELECT sso_user_id, COUNT(*) 
FROM users 
WHERE sso_user_id IS NOT NULL 
GROUP BY sso_user_id 
HAVING COUNT(*) > 1;
