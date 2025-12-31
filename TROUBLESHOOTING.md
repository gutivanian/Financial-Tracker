# 🔧 Troubleshooting Guide

## Error: query is not a function

✅ **SUDAH DIPERBAIKI** - File `pages/api/auth/login.ts` dan `pages/api/auth/verify.ts` sudah diupdate untuk menggunakan `pool.query()` langsung.

### Jika masih error:

1. **Restart development server**
```bash
# Stop server (Ctrl+C)
npm run dev
```

2. **Clear Next.js cache**
```bash
rm -rf .next
npm run dev
```

3. **Reinstall dependencies**
```bash
rm -rf node_modules
npm install
npm run dev
```

## Error: bcrypt/bcryptjs not found

```bash
npm install bcryptjs @types/bcryptjs
```

## Error: jsonwebtoken not found

```bash
npm install jsonwebtoken @types/jsonwebtoken
```

## Error: Cannot connect to database

1. **Cek .env file**
```env
DB_USER=your_username
DB_HOST=localhost
DB_NAME=personal-finance
DB_PASSWORD=your_password
DB_PORT=5432
DB_SSL=false  # Untuk local development
```

2. **Test database connection**
```bash
psql -U your_username -d personal-finance -c "SELECT 1"
```

3. **Cek apakah tabel users ada**
```bash
psql -U your_username -d personal-finance -c "\dt users"
```

4. **Cek apakah kolom password_hash ada**
```bash
psql -U your_username -d personal-finance -c "\d users"
```

## Error: Email atau password salah

### Pastikan password_hash sudah diset:

```sql
-- Cek user ada dan punya password_hash
SELECT id, email, name, 
       CASE WHEN password_hash IS NULL THEN 'NULL' ELSE 'SET' END as password_status
FROM users 
WHERE email = 'demo@finance.com';
```

### Jika password_hash NULL atau salah:

**Opsi 1: Jalankan migration**
```bash
psql -d personal-finance -f database/add_password_migration.sql
```

**Opsi 2: Manual update dengan script**
```bash
node scripts/generate-password.js
# Copy hash yang dihasilkan, lalu:
```

```sql
UPDATE users 
SET password_hash = '$2a$10$...(hash dari script)...'
WHERE email = 'demo@finance.com';
```

**Opsi 3: Gunakan hash yang sudah di-generate**
```sql
UPDATE users 
SET password_hash = '$2a$10$5jH3vP9K5mQ9yY7fD6xNJO3Z7KvL8qR9mN5oP6wX7gH9iJ2kL8mN4'
WHERE email = 'demo@finance.com';
```
Password: `demo123`

## Error: JWT_SECRET not set

Tambahkan ke file `.env`:

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-chars
```

Generate random JWT secret:
```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Atau gunakan string random apapun minimal 32 karakter
```

## Error: Module not found

### @/lib/db
Path alias `@` sudah dikonfigurasi di `tsconfig.json`. Jika error:

1. Restart TypeScript server (VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server")
2. Restart dev server
3. Clear cache dan reinstall

### bcryptjs atau jsonwebtoken
```bash
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

## Error: Token tidak valid

1. **Clear localStorage browser**
```javascript
// Di browser console
localStorage.clear()
```

2. **Login ulang**
Go to http://localhost:3000/login

3. **Cek JWT_SECRET**
Pastikan JWT_SECRET di .env sama setiap kali restart server.

## Error: CORS atau fetch failed

### Untuk production dengan separate frontend/backend:

Update `next.config.js`:
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'your-frontend-domain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

## Error: Window is not defined (SSR)

### Jika ada error dengan localStorage di SSR:

`AuthContext.tsx` sudah handle ini dengan `useEffect`. Pastikan:

1. localStorage hanya diakses di `useEffect` atau client-side
2. Tidak ada import browser-only modules di top level

## Error: Cannot read property of undefined

### req.user is undefined

Pastikan:
1. Menggunakan `authMiddleware` wrapper
2. Request memiliki header `Authorization: Bearer <token>`
3. Token valid dan belum expired

Example:
```typescript
import { authMiddleware, AuthRequest } from '@/lib/middleware/auth';

async function handler(req: AuthRequest, res: NextApiResponse) {
  const userId = req.user?.userId; // Use optional chaining
  // ...
}

export default authMiddleware(handler);
```

## Database Migration Issues

### Migration belum jalan

```bash
# Check if password_hash column exists
psql -d personal-finance -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash';"
```

Jika tidak ada output, jalankan:
```bash
psql -d personal-finance -f database/add_password_migration.sql
```

### User tidak punya password_hash

```sql
-- List users without password
SELECT id, email, name FROM users WHERE password_hash IS NULL;

-- Set password for specific user
UPDATE users 
SET password_hash = '$2a$10$5jH3vP9K5mQ9yY7fD6xNJO3Z7KvL8qR9mN5oP6wX7gH9iJ2kL8mN4'
WHERE email = 'demo@finance.com';
```

## Development Tips

### Hot reload tidak jalan

```bash
rm -rf .next
npm run dev
```

### Environment variables tidak kebaca

1. Restart dev server (environment variables hanya dibaca saat startup)
2. Pastikan nama variable benar (case-sensitive)
3. Untuk client-side, gunakan prefix `NEXT_PUBLIC_`

### TypeScript errors

```bash
# Check types
npx tsc --noEmit

# Fix common issues
npm install --save-dev @types/node @types/react @types/react-dom
```

## Still Having Issues?

1. Check browser console for client-side errors
2. Check terminal/server console for server-side errors
3. Enable verbose logging in API routes:
```typescript
console.log('Request:', { method: req.method, body: req.body, headers: req.headers });
```

4. Test API endpoints directly with curl:
```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@finance.com","password":"demo123"}'
```

## Common Solutions Summary

| Issue | Solution |
|-------|----------|
| query is not a function | Restart server, clear .next cache |
| Module not found | npm install, restart TS server |
| Database connection | Check .env, test psql connection |
| Wrong password | Run migration, update password_hash |
| Token invalid | Clear localStorage, login again |
| SSR errors | Check useEffect, client-only code |

---

**Last Updated:** December 2024
