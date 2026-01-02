# 🎯 Summary: PFTU Workspace & Cara Membuat User Baru

## 📁 Tentang PFTU Workspace

**PFTU** (Personal Finance App) adalah aplikasi manajemen keuangan pribadi yang comprehensive dengan fitur:

### ⚡ Tech Stack
- **Frontend:** Next.js, React, TypeScript, TailwindCSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Aiven Cloud)
- **Authentication:** JWT (JSON Web Token)
- **Password:** Bcrypt hashing

### 🎨 Fitur Utama
1. **Dashboard** - Overview keuangan real-time
2. **Transaksi** - Income, expense, transfer tracking
3. **Budget** - Category-based budgeting (50/30/20 rule)
4. **Goals** - Financial goals dengan progress tracking
5. **Investment** - Portfolio management (stocks, crypto, etc.)
6. **Debt** - Debt tracking dan repayment planning
7. **Reports** - Analisis keuangan & insights

### 🔐 Authentication
- JWT-based authentication
- Password hashing dengan bcrypt (saltRounds: 10)
- Protected routes (auto-redirect ke login)
- Token expires dalam 7 hari

---

## 🚀 3 Cara Membuat User Baru

### ✅ CARA 1: Script Node.js (PALING MUDAH)

**Interactive Mode:**
```bash
node scripts/create-user.js
```
Lalu masukkan:
- Email
- Nama
- Password

**Command Line Mode:**
```bash
node scripts/create-user.js user@email.com "Nama User" password123
```

**Contoh:**
```bash
node scripts/create-user.js alice@example.com "Alice Smith" alice123
```

**Output:**
```
📝 Creating new user...
Email: alice@example.com
Name: Alice Smith

✅ User berhasil dibuat!
ID: 5
Email: alice@example.com
Name: Alice Smith
Created: 2025-01-01 10:30:00

🔑 Login credentials:
Email: alice@example.com
Password: alice123
```

---

### 🌐 CARA 2: Web UI (Register Page)

1. Buka browser: `http://localhost:3000/register`
2. Isi form:
   - Nama Lengkap
   - Email
   - Password (min 6 karakter)
   - Konfirmasi Password
3. Klik "Daftar"
4. Auto-login setelah berhasil

**Atau dari Login Page:**
- Klik link "Daftar di sini" di bawah form login

---

### 🔧 CARA 3: API Endpoint

**Endpoint:** `POST /api/auth/register`

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe",
    "password": "password123"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User berhasil dibuat",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 5,
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

**JavaScript/Fetch Example:**
```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    name: 'John Doe',
    password: 'password123'
  })
});

const data = await response.json();
console.log(data);
```

---

## 📊 Database Structure

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Validasi
- **Email:** Harus format valid, unique
- **Name:** Required, VARCHAR(255)
- **Password:** Minimal 6 karakter, di-hash dengan bcrypt
- **Password Hash:** Bcrypt dengan salt rounds = 10

---

## 🗂️ File Structure

```
pftu/
├── pages/
│   ├── login.tsx              # Login page
│   ├── register.tsx           # Register page (BARU!)
│   └── api/
│       └── auth/
│           ├── login.ts       # Login API
│           ├── register.ts    # Register API (BARU!)
│           └── verify.ts      # JWT verification
├── scripts/
│   ├── create-user.js         # Script create user (BARU!)
│   ├── generate-password.js   # Generate bcrypt hash
│   └── check-user.js          # Verify user exists
├── database/
│   ├── schema.sql             # Database schema
│   └── fix_demo_password.sql  # Demo user password
├── contexts/
│   └── AuthContext.tsx        # Auth state management
├── lib/
│   └── db.ts                  # Database connection
└── .env                       # Environment variables
```

---

## 🔑 Demo Credentials

```
Email: demo@finance.com
Password: demo123
```

---

## ⚙️ Environment Setup

File: `.env`
```env
# Database
DB_USER=your_db_user
DB_HOST=your_db_host.aivencloud.com
DB_NAME=personal-finance
DB_PASSWORD=your_db_password_here
DB_PORT=11102
DB_SSL=true

# JWT
JWT_SECRET=your_jwt_secret_key_here_at_least_32_characters_long
```

---

## 🧪 Testing User Baru

### 1. Test Login via Web
```
http://localhost:3000/login
```

### 2. Test via API
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "alice123"
  }'
```

### 3. Check di Database
```bash
# Via script
node scripts/check-user.js alice@example.com

# Via SQL
psql -U avnadmin -h pg-30a6d2f0-fondofne-todo.g.aivencloud.com \
     -d personal-finance -p 11102 \
     -c "SELECT * FROM users WHERE email='alice@example.com';"
```

---

## 📝 Quick Workflow Example

```bash
# 1. Buat user baru
node scripts/create-user.js alice@example.com "Alice Smith" alice123

# 2. Start dev server
npm run dev

# 3. Buka browser
# http://localhost:3000/login

# 4. Login dengan user baru
# Email: alice@example.com
# Password: alice123

# ✅ Berhasil masuk ke dashboard!
```

---

## ❗ Error Handling & Troubleshooting

### "User dengan email ini sudah ada"
**Solusi:**
```sql
-- Hapus user yang lama
DELETE FROM users WHERE email = 'alice@example.com';

-- Atau gunakan email berbeda
node scripts/create-user.js alice2@example.com "Alice" password123
```

### "Cannot connect to database"
**Solusi:**
```bash
# 1. Cek internet connection
ping pg-30a6d2f0-fondofne-todo.g.aivencloud.com

# 2. Verify .env file
cat .env

# 3. Test DB connection
node scripts/test-db.js
```

### "bcryptjs not found"
**Solusi:**
```bash
npm install bcryptjs @types/bcryptjs
```

### "Password minimal 6 karakter"
Password harus >= 6 karakter untuk keamanan

### "Email sudah terdaftar" (409 Conflict)
Gunakan email lain atau hapus user lama dari database

---

## 💡 Best Practices

1. **Password Security**
   - Minimal 6 karakter (recommended: 12+)
   - Gunakan kombinasi huruf, angka, simbol
   - Jangan hardcode password di code

2. **JWT Security**
   - Ganti JWT_SECRET di production
   - Token expires dalam 7 hari (konfigurasi di login.ts)
   - Store token di localStorage (secure for SPA)

3. **Database Security**
   - SSL enabled untuk koneksi
   - Password di-hash, never plain text
   - Prepared statements untuk prevent SQL injection

4. **Email Validation**
   - Format email di-validasi
   - Unique constraint di database
   - Case-insensitive comparison

---

## 📚 File-File Penting

| File | Deskripsi |
|------|-----------|
| `scripts/create-user.js` | Script untuk membuat user via Node.js |
| `pages/api/auth/register.ts` | API endpoint untuk registrasi |
| `pages/register.tsx` | Halaman registrasi (web UI) |
| `pages/login.tsx` | Halaman login |
| `database/schema.sql` | Database schema |
| `HOW_TO_CREATE_USER.md` | Dokumentasi lengkap (English) |
| `AUTH_SETUP.md` | Setup authentication guide |

---

## 🎓 Cara Kerja Authentication Flow

### Registration Flow
```
1. User mengisi form register
   ↓
2. Frontend POST /api/auth/register
   ↓
3. API validate input (email format, password length)
   ↓
4. Check if email exists
   ↓
5. Hash password dengan bcrypt
   ↓
6. Insert user ke database
   ↓
7. Generate JWT token
   ↓
8. Return token + user data
   ↓
9. Auto-login & redirect ke dashboard
```

### Login Flow
```
1. User mengisi email & password
   ↓
2. Frontend POST /api/auth/login
   ↓
3. API query user by email
   ↓
4. Verify password dengan bcrypt.compare()
   ↓
5. Generate JWT token
   ↓
6. Return token + user data
   ↓
7. Store token di localStorage
   ↓
8. Redirect ke dashboard
```

---

## 🔗 Links & Resources

- **GitHub:** Repository ini
- **Docs:** `/HOW_TO_CREATE_USER.md` (detailed English version)
- **Auth Setup:** `/AUTH_SETUP.md`
- **Quick Start:** `/QUICK_START.md`
- **Database:** Aiven Cloud PostgreSQL

---

**Last Updated:** 2025-01-01  
**Created by:** AI Assistant  
**Version:** 1.0
