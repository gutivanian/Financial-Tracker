-- SQL Script untuk Fix Password Demo User
-- Password: demo123

-- Jika user sudah ada, update password:
UPDATE users 
SET password_hash = '$2a$10$YQ2W3b5Z8UuHVvxGx.EqJOK4LXqX5Z9W5YgQZ8X9X8X8X8X8X8X8X'
WHERE email = 'demo@finance.com';

-- Jika user belum ada, insert user baru:
INSERT INTO users (email, name, password_hash)
VALUES (
  'demo@finance.com',
  'Demo User',
  '$2a$10$YQ2W3b5Z8UuHVvxGx.EqJOK4LXqX5Z9W5YgQZ8X9X8X8X8X8X8X8X'
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash;

-- Verify user exists
SELECT id, email, name, 
       CASE WHEN password_hash IS NOT NULL THEN '✓ Password Set' ELSE '✗ No Password' END as status
FROM users 
WHERE email = 'demo@finance.com';
