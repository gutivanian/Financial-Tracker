# ⚡ QUICK FIX - Error "query is not a function"

## ✅ File Sudah Diperbaiki!

File berikut sudah diperbaiki untuk menggunakan `pool.query()` langsung:
- ✅ `pages/api/auth/login.ts`
- ✅ `pages/api/auth/verify.ts`

## 🔧 Langkah-langkah Fix:

### 1. Stop Development Server
```bash
# Tekan Ctrl+C di terminal
```

### 2. Clear Next.js Cache
```bash
# Windows
rmdir /s /q .next

# Linux/Mac
rm -rf .next
```

### 3. Install Dependencies (jika belum)
```bash
npm install
```

Ini akan install:
- bcryptjs
- jsonwebtoken
- @types/bcryptjs
- @types/jsonwebtoken

### 4. Setup Database (jika belum)

#### Cek apakah migration sudah jalan:
```bash
npm run test:db
```

#### Jika password_hash belum ada, jalankan migration:
```bash
psql -d personal-finance -f database/add_password_migration.sql
```

Atau manual:
```sql
-- Connect ke database
psql -d personal-finance

-- Tambah kolom
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Set password untuk demo user
UPDATE users 
SET password_hash = '$2a$10$5jH3vP9K5mQ9yY7fD6xNJO3Z7KvL8qR9mN5oP6wX7gH9iJ2kL8mN4'
WHERE email = 'demo@finance.com';

-- Set NOT NULL
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
```

### 5. Pastikan .env Sudah Benar
```env
# Database
DB_USER=your_username
DB_HOST=localhost
DB_NAME=personal-finance
DB_PASSWORD=your_password
DB_PORT=5432
DB_SSL=false

# JWT
JWT_SECRET=your-secret-key-here-minimum-32-characters
```

### 6. Start Development Server
```bash
npm run dev
```

### 7. Test Login
Buka: http://localhost:3000/login

```
Email: demo@finance.com
Password: demo123
```

## 🧪 Test Scripts

### Test Database Connection
```bash
npm run test:db
```

Akan check:
- ✅ Database connection
- ✅ Users table exists
- ✅ password_hash column exists
- ✅ Demo user exists
- ✅ JWT_SECRET is set

### Test Login API
```bash
npm run test:login
```

**Note:** Server harus running (npm run dev) di terminal lain.

## 🐛 Jika Masih Error

### Error: Module not found
```bash
npm install
```

### Error: bcryptjs not found
```bash
npm install bcryptjs @types/bcryptjs
```

### Error: jsonwebtoken not found
```bash
npm install jsonwebtoken @types/jsonwebtoken
```

### Error: Cannot connect to database
1. Check PostgreSQL running: `pg_isready`
2. Check credentials di .env
3. Test connection: `psql -U your_username -d personal-finance`

### Error: Email atau password salah
```bash
# Test database setup
npm run test:db

# If password_hash not set, run:
psql -d personal-finance -f database/add_password_migration.sql
```

### Error: Token tidak valid
```javascript
// Clear localStorage di browser console
localStorage.clear()
// Then login again
```

## 📝 Summary Checklist

- [ ] Stop server (Ctrl+C)
- [ ] Clear .next cache (`rm -rf .next`)
- [ ] Install dependencies (`npm install`)
- [ ] Run database migration (if needed)
- [ ] Check .env file
- [ ] Start server (`npm run dev`)
- [ ] Test login at http://localhost:3000/login

## 🎯 What Changed

### Before (ERROR):
```typescript
import { query } from '../../../lib/db';
const result = await query('SELECT ...', [params]);
```

### After (FIXED):
```typescript
import pool from '../../../lib/db';
const result = await pool.query('SELECT ...', [params]);
```

## 💡 Why This Fixes It

1. Next.js API routes di Windows kadang punya issue dengan named exports
2. Using default export (`pool`) lebih reliable
3. `pool.query()` adalah method bawaan dari `pg` library
4. Lebih consistent dengan API routes lainnya

## 🚀 Ready!

Setelah mengikuti langkah di atas, authentication seharusnya berfungsi!

Login dengan:
- Email: demo@finance.com  
- Password: demo123

---

**Need more help?** Check:
- TROUBLESHOOTING.md - Comprehensive troubleshooting guide
- AUTH_SETUP.md - Complete authentication setup
- Run `npm run test:db` untuk diagnosa database
