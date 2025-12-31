-- Migration script untuk menambahkan password_hash ke users table
-- 
-- PENTING: Sebelum menjalankan migration ini, generate password hash yang benar!
-- Jalankan: node scripts/generate-hash.js
-- 
-- Password untuk demo@finance.com: demo123
-- Hash akan di-generate oleh script

-- Add password_hash column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Update existing demo user dengan password hashed
-- GANTI HASH INI dengan output dari: node scripts/generate-hash.js
-- 
-- Contoh hash (JANGAN GUNAKAN INI, GENERATE SENDIRI!):
-- UPDATE users 
-- SET password_hash = '$2a$10$YourGeneratedHashHere'
-- WHERE email = 'demo@finance.com';
--
-- Untuk generate hash yang benar:
-- 1. npm install (pastikan bcryptjs terinstall)
-- 2. node scripts/generate-hash.js
-- 3. Copy SQL UPDATE dari output
-- 4. Paste dan jalankan di sini

-- Make password_hash NOT NULL after updating existing records
-- (Uncomment setelah password_hash terisi)
-- ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;

