# 📖 Cara Membuat User Baru di PFTU

Aplikasi Personal Finance (PFTU) memiliki beberapa cara untuk membuat user baru:

## 📋 Ringkasan Workspace PFTU

**PFTU** adalah aplikasi Personal Finance Management berbasis Next.js dengan fitur:
- 🔐 JWT Authentication
- 💰 Transaction Management
- 📊 Budget & Goals
- 📈 Investment Portfolio
- 💳 Debt Tracking
- 🗄️ PostgreSQL Database

## 🎯 3 Cara Membuat User Baru

### 1. ✅ Menggunakan Script Node.js (RECOMMENDED)

Script ini langsung terhubung ke database dan membuat user baru.

#### Mode Interactive (Input Manual):
```bash
node scripts/create-user.js
```
Kemudian ikuti prompt untuk memasukkan:
- Email
- Name
- Password

#### Mode Command Line (Langsung):
```bash
node scripts/create-user.js user@email.com "Nama User" password123
```

**Contoh:**
```bash
node scripts/create-user.js john@example.com "John Doe" mypassword123
```

Script akan:
- ✅ Hash password dengan bcrypt
- ✅ Cek apakah email sudah terdaftar
- ✅ Insert user baru ke database
- ✅ Tampilkan detail user yang dibuat

---

### 2. 🌐 Menggunakan API Register (Web)

API endpoint untuk registrasi via web/frontend.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "Nama User",
  "password": "password123"
}
```

**Contoh menggunakan curl:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe",
    "password": "mypassword123"
  }'
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "User berhasil dibuat",
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

**Validasi:**
- Email harus format valid
- Password minimal 6 karakter
- Email tidak boleh duplikat

---

### 3. 🗄️ Langsung via SQL Database

Jika Anda ingin langsung insert ke database menggunakan SQL.

#### Langkah 1: Generate Password Hash

```bash
node scripts/generate-password.js
```

Atau generate custom password:
```javascript
// Buat file temp generate-hash.js
const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'your-password-here';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash:', hash);
}

generateHash();
```

#### Langkah 2: Insert User dengan SQL

```sql
-- Koneksi ke database
psql -U avnadmin -h pg-30a6d2f0-fondofne-todo.g.aivencloud.com -d personal-finance -p 11102

-- Insert user baru
INSERT INTO users (email, name, password_hash, created_at, updated_at)
VALUES (
  'user@example.com',
  'Nama User',
  '$2a$10$hashedPasswordHere', -- Ganti dengan hash yang di-generate
  NOW(),
  NOW()
);

-- Verify user berhasil dibuat
SELECT id, email, name, created_at FROM users WHERE email = 'user@example.com';
```

---

## 🔒 Database Schema - Users Table

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

**Kolom:**
- `id`: Auto-increment primary key
- `email`: Unique, untuk login
- `name`: Nama lengkap user
- `password_hash`: Password yang sudah di-hash dengan bcrypt
- `created_at`: Timestamp pembuatan
- `updated_at`: Timestamp update terakhir

---

## 🔑 Credential yang Sudah Ada

**Demo User:**
```
Email: demo@finance.com
Password: demo123
```

---

## ⚙️ Environment Variables

Pastikan file `.env` sudah dikonfigurasi:

```env
DB_USER=your_db_user
DB_HOST=your_db_host.aivencloud.com
DB_NAME=personal-finance
DB_PASSWORD=your_db_password_here
DB_PORT=11102
DB_SSL=true
JWT_SECRET=your_jwt_secret_key_here_at_least_32_characters_long
```

---

## 🧪 Testing User Baru

Setelah membuat user baru, test dengan:

### 1. Login via Web
```
http://localhost:3000/login
```

### 2. Test via API
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-new-user@example.com",
    "password": "your-password"
  }'
```

### 3. Check Database
```bash
node scripts/check-user.js your-new-user@example.com
```

---

## 🚀 Quick Example

Buat user baru langsung dengan 1 command:

```bash
# 1. Buat user
node scripts/create-user.js alice@example.com "Alice Smith" alice123

# 2. Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "alice123"}'

# 3. Verify di database
node scripts/check-user.js alice@example.com
```

---

## ❗ Troubleshooting

### Error: "User dengan email ini sudah ada"
Solusi: Gunakan email lain atau hapus user yang lama
```sql
DELETE FROM users WHERE email = 'email@example.com';
```

### Error: "Cannot connect to database"
Solusi: 
- Cek koneksi internet
- Verify environment variables di `.env`
- Test koneksi: `node scripts/test-db.js`

### Error: "bcrypt not found"
Solusi: Install dependencies
```bash
npm install bcryptjs
```

---

## 📚 File Terkait

- **Script:** `scripts/create-user.js` - Buat user via script
- **API:** `pages/api/auth/register.ts` - API endpoint registrasi
- **Schema:** `database/schema.sql` - Database schema
- **Auth:** `pages/api/auth/login.ts` - API login
- **Docs:** `AUTH_SETUP.md` - Auth setup guide

---

## 💡 Tips

1. **Password Hashing**: Selalu gunakan bcrypt, jangan simpan plain text password
2. **Email Validation**: API register sudah include validasi format email
3. **Security**: JWT_SECRET harus di-ganti di production dengan string random yang kuat
4. **Database**: Pastikan koneksi SSL enabled untuk keamanan

---

**Created:** 2025-01-01
**Last Updated:** 2025-01-01
