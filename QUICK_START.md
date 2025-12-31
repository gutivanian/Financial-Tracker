# 🚀 Quick Start Guide - Personal Finance App dengan JWT Authentication

## ✅ Apa yang Sudah Dibuat

### 🔐 Sistem Authentication
- ✅ Login page dengan JWT authentication
- ✅ Password hashing menggunakan bcrypt
- ✅ Protected routes (auto redirect ke /login jika belum login)
- ✅ Logout functionality dengan konfirmasi
- ✅ Token storage di localStorage
- ✅ Auth context untuk state management
- ✅ Responsive design untuk mobile & desktop

### 🎨 UI/UX
- ✅ Login page dengan style yang sama persis dengan aplikasi utama
- ✅ Responsive sidebar dengan hamburger menu
- ✅ Logout button di sidebar
- ✅ Loading states
- ✅ Error handling dengan pesan user-friendly
- ✅ Show/hide password toggle
- ✅ Demo credentials info di login page

### 🗄️ Database
- ✅ Migration script untuk menambahkan password_hash ke users table
- ✅ Password hash untuk demo@finance.com: demo123

### 🔧 Technical
- ✅ JWT token generation & verification
- ✅ Auth middleware untuk protect API routes
- ✅ TypeScript types untuk auth
- ✅ Environment variables untuk JWT secret

## 📦 File Structure

```
PFAC_with_JWT.zip
├── pages/
│   ├── login.tsx              # ✨ Login page (BARU)
│   ├── _app.tsx               # 🔄 Updated dengan AuthProvider
│   └── api/
│       └── auth/              # ✨ Auth endpoints (BARU)
│           ├── login.ts
│           └── verify.ts
├── components/
│   └── Layout.tsx             # 🔄 Updated dengan logout & responsive
├── contexts/
│   └── AuthContext.tsx        # ✨ Auth state management (BARU)
├── lib/
│   └── middleware/
│       └── auth.ts            # ✨ Auth middleware (BARU)
├── database/
│   ├── schema.sql             # 🔄 Updated dengan password_hash
│   └── add_password_migration.sql  # ✨ Migration script (BARU)
├── scripts/
│   └── generate-password.js   # ✨ Password generator (BARU)
├── AUTH_SETUP.md              # ✨ Setup guide lengkap (BARU)
├── AUTH_MIDDLEWARE_GUIDE.md   # ✨ Middleware usage guide (BARU)
├── README_NEW.md              # ✨ Updated README (BARU)
├── .env.example               # 🔄 Updated dengan JWT_SECRET
└── package.json               # 🔄 Updated dengan JWT & bcrypt deps
```

## 🏃‍♂️ Cara Install & Run

### 1. Extract ZIP

```bash
unzip PFAC_with_JWT.zip
cd PFAC_with_JWT
```

### 2. Install Dependencies

```bash
npm install
```

Dependencies baru yang akan terinstall:
- jsonwebtoken (JWT generation & verification)
- bcryptjs (Password hashing)
- @types/jsonwebtoken
- @types/bcryptjs

### 3. Setup Database

#### Opsi A: Database Baru

```bash
# Buat database
createdb personal-finance

# Import schema (sudah include password_hash)
psql -d personal-finance -f database/schema.sql
```

#### Opsi B: Database Existing (Alter Table)

```bash
# Jalankan migration untuk menambahkan password_hash
psql -d personal-finance -f database/add_password_migration.sql
```

Migration akan:
- ✅ Menambahkan kolom `password_hash` ke tabel `users`
- ✅ Set password untuk demo@finance.com = `demo123`
- ✅ Set kolom `password_hash` sebagai NOT NULL

### 4. Setup Environment

Copy dan edit `.env`:

```bash
cp .env.example .env
```

**PENTING**: Edit `.env` dan set JWT_SECRET:

```env
JWT_SECRET=ganti-dengan-string-random-minimal-32-karakter
```

Generate random string (Linux/Mac):
```bash
openssl rand -base64 32
```

### 5. Run Development Server

```bash
npm run dev
```

Buka: http://localhost:3000/login

### 6. Login

```
📧 Email: demo@finance.com
🔑 Password: demo123
```

## 🎯 Fitur Authentication

### Login Flow
1. User buka `/login`
2. Input email & password
3. Klik "Masuk"
4. Server verify credentials
5. Generate JWT token (expires in 7 days)
6. Token disimpan di localStorage
7. Redirect ke dashboard

### Protected Routes
- Semua halaman KECUALI `/login` memerlukan authentication
- Jika token tidak ada → redirect ke `/login`
- Jika token invalid/expired → redirect ke `/login`
- Token diverify setiap page load

### Logout
1. Klik tombol "Keluar" di sidebar (bawah)
2. Konfirmasi logout
3. Token dihapus dari localStorage
4. Redirect ke `/login`

## 📱 Responsive Features

### Desktop (≥1024px)
- Sidebar fixed di kiri
- Full layout view

### Tablet & Mobile (<1024px)
- Sidebar tersembunyi default
- Hamburger menu di kiri atas
- Sidebar slide-in dengan overlay
- Touch-friendly button sizes

## 🔒 Security

✅ **Yang Sudah Diterapkan:**
- Password hashing dengan bcrypt (10 rounds)
- JWT dengan expiration (7 hari)
- Protected routes
- Token verification
- Input validation
- SQL parameterized queries

⚠️ **Untuk Production:**
- GANTI `JWT_SECRET` dengan string random kuat
- Gunakan HTTPS
- Implement refresh token
- Add rate limiting
- Add CSRF protection

## 🧪 Testing

### Test Login
```bash
# Start server
npm run dev

# Buka browser
http://localhost:3000/login

# Login dengan:
Email: demo@finance.com
Password: demo123
```

### Test Protected Routes
```bash
# Tanpa login, akses:
http://localhost:3000/

# Harus redirect ke /login
```

### Test Logout
```bash
# Setelah login, klik tombol "Keluar" di sidebar
# Konfirmasi
# Harus redirect ke /login
```

## 🐛 Troubleshooting

### "Token tidak valid"
- Clear localStorage browser
- Login ulang
- Check JWT_SECRET di .env

### "Email atau password salah"
- Pastikan database migration sudah dijalankan
- Check password hash di database
- Coba generate password baru dengan script

### Sidebar tidak responsive
- Clear browser cache
- Hard reload (Ctrl+Shift+R)

### API Error 500
- Check database connection di .env
- Check console log untuk error detail
- Pastikan semua migrations sudah dijalankan

## 📚 Documentation

- `AUTH_SETUP.md` - Setup authentication lengkap
- `AUTH_MIDDLEWARE_GUIDE.md` - Guide protect API routes
- `README_NEW.md` - Documentation lengkap aplikasi

## 🎨 Customization

### Ubah Password Demo User

```javascript
// Jalankan scripts/generate-password.js
node scripts/generate-password.js

// Atau manual:
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('password-baru', 10);
console.log(hash);

// Update di database:
UPDATE users 
SET password_hash = 'hash-dari-script'
WHERE email = 'demo@finance.com';
```

### Ubah Token Expiry

Edit `pages/api/auth/login.ts`:

```typescript
const token = jwt.sign(
  { userId: user.id, email: user.email, name: user.name },
  JWT_SECRET,
  { expiresIn: '30d' } // Ganti dari 7d ke 30d
);
```

### Tambah User Baru

```sql
-- Generate hash dulu dengan script
-- Kemudian insert:
INSERT INTO users (email, name, password_hash)
VALUES (
  'user@example.com',
  'User Name',
  '$2a$10$hash-dari-script'
);
```

## ✅ Checklist Deploy

- [ ] Install dependencies (`npm install`)
- [ ] Setup database schema
- [ ] Run migration untuk password
- [ ] Set JWT_SECRET yang kuat
- [ ] Update database credentials di .env
- [ ] Test login functionality
- [ ] Test logout functionality
- [ ] Test responsive design
- [ ] Build production (`npm run build`)
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS

## 🎉 Done!

Aplikasi Personal Finance dengan JWT Authentication sudah siap!

Password untuk demo@finance.com adalah: **demo123**

Enjoy! 🚀💰

---

Need help? Check documentation files:
- AUTH_SETUP.md
- AUTH_MIDDLEWARE_GUIDE.md  
- README_NEW.md
