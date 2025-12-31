# Setup Authentication

Aplikasi ini sudah dilengkapi dengan sistem autentikasi menggunakan JWT (JSON Web Token).

## Fitur Authentication

- ✅ Login dengan email dan password
- ✅ JWT token storage di localStorage
- ✅ Password hashing dengan bcrypt
- ✅ Protected routes
- ✅ Auto redirect ke login jika belum authenticated
- ✅ Logout functionality
- ✅ Responsive design untuk mobile dan desktop

## Setup Database

### 1. Jalankan Migration

Untuk menambahkan kolom `password_hash` ke tabel users yang sudah ada:

```bash
psql -U your_username -d personal-finance -f database/add_password_migration.sql
```

Atau manual dengan SQL:

```sql
-- Tambahkan kolom password_hash
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Update password untuk demo user (password: demo123)
UPDATE users 
SET password_hash = '$2a$10$5jH3vP9K5mQ9yY7fD6xNJO3Z7KvL8qR9mN5oP6wX7gH9iJ2kL8mN4'
WHERE email = 'demo@finance.com';

-- Set password_hash sebagai NOT NULL
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
```

### 2. Generate Password Hash Baru (Optional)

Jika Anda ingin membuat password hash baru:

```bash
npm install
node scripts/generate-password.js
```

## Environment Variables

Pastikan file `.env` Anda memiliki JWT_SECRET:

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production-to-random-string
```

**PENTING**: Ganti JWT_SECRET dengan string random yang kuat di production!

## Install Dependencies

```bash
npm install
```

Dependencies baru yang ditambahkan:
- `jsonwebtoken` - untuk JWT token generation dan verification
- `bcryptjs` - untuk password hashing
- `@types/jsonwebtoken` - TypeScript types untuk JWT
- `@types/bcryptjs` - TypeScript types untuk bcrypt

## Demo Credentials

```
Email: demo@finance.com
Password: demo123
```

## Cara Kerja Authentication

### 1. Login Flow

1. User mengisi email dan password di halaman `/login`
2. API `/api/auth/login` memverifikasi credentials
3. Jika valid, server generate JWT token
4. Token disimpan di localStorage
5. User diarahkan ke dashboard

### 2. Protected Routes

Semua halaman kecuali `/login` memerlukan authentication:
- AuthGuard di `_app.tsx` memeriksa token di localStorage
- Jika tidak ada token, redirect ke `/login`
- Token diverifikasi dengan API `/api/auth/verify`

### 3. Logout Flow

1. User klik tombol "Keluar" di sidebar
2. Token dihapus dari localStorage
3. User diarahkan ke `/login`

## File-file Baru

### API Endpoints

- `pages/api/auth/login.ts` - Login endpoint
- `pages/api/auth/verify.ts` - Token verification endpoint

### Components & Contexts

- `contexts/AuthContext.tsx` - Auth state management
- `pages/login.tsx` - Login page dengan responsive design

### Database

- `database/add_password_migration.sql` - Migration script
- `scripts/generate-password.js` - Password hash generator

### Updates

- `components/Layout.tsx` - Ditambahkan logout button dan responsive sidebar
- `pages/_app.tsx` - Ditambahkan AuthProvider dan AuthGuard
- `package.json` - Ditambahkan JWT dan bcrypt dependencies

## Responsive Design

Aplikasi sudah responsive untuk berbagai ukuran layar:

- **Desktop (≥1024px)**: Sidebar fixed di kiri
- **Tablet & Mobile (<1024px)**: 
  - Sidebar tersembunyi, muncul dengan overlay
  - Menu button di kiri atas
  - Touch-friendly button sizes
  - Optimized padding dan spacing

## Security Best Practices

✅ **Sudah Diterapkan:**
- Password hashing dengan bcrypt (salt rounds: 10)
- JWT dengan expiry (7 hari)
- HTTP-only best practices
- Input validation
- SQL injection protection (parameterized queries)

⚠️ **Untuk Production:**
- Ganti JWT_SECRET dengan string random yang kuat
- Gunakan HTTPS
- Implement refresh token
- Add rate limiting
- Add CSRF protection
- Set secure cookie flags

## Troubleshooting

### Token tidak valid setelah restart server

Ini normal karena JWT_SECRET berbeda. User perlu login ulang.

### Password tidak cocok

Pastikan password_hash di database benar. Jalankan migration atau generate ulang dengan script.

### Tidak bisa login

1. Cek database connection
2. Pastikan tabel users memiliki kolom password_hash
3. Cek console browser untuk error
4. Cek console server untuk error API

## Development

```bash
npm run dev
```

Buka [http://localhost:3000/login](http://localhost:3000/login)

## Production Build

```bash
npm run build
npm start
```

---

Dibuat dengan ❤️ menggunakan Next.js, TypeScript, dan Tailwind CSS
