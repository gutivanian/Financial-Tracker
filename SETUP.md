# Quick Setup Guide

## Langkah 1: Install Dependencies

```bash
npm install
```

## Langkah 2: Setup Database PostgreSQL

### A. Install PostgreSQL (jika belum)
- **Windows**: Download dari https://www.postgresql.org/download/windows/
- **Mac**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql`

### B. Create Database
```bash
# Login ke PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE personal_finance;

# Exit
\q
```

### C. Import Schema & Sample Data
```bash
# Dari root folder project
psql -U postgres -d personal_finance -f database/schema.sql
```

Ini akan:
- Membuat semua tables yang diperlukan
- Memasukkan sample data untuk testing
- Setup indexes untuk performa

## Langkah 3: Environment Variables

Buat file `.env.local` di root folder:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=personal_finance
DB_PASSWORD=your_password
DB_PORT=5432
```

Ganti `your_password` dengan password PostgreSQL kamu.

## Langkah 4: Run Development Server

```bash
npm run dev
```

Buka browser ke: http://localhost:3000

## 🎉 Done!

Kamu akan melihat:
- Dashboard dengan sample data
- Semua fitur sudah siap dipakai
- 6 menu utama:
  - Dashboard
  - Transaksi
  - Budget
  - Goals
  - Investasi
  - Hutang
  - Akun

## Sample Login

Demo user sudah tersedia:
- Email: demo@finance.com
- Name: Demo User

## Troubleshooting

### Error: "Cannot connect to database"
1. Pastikan PostgreSQL service running
2. Check username & password di .env.local
3. Pastikan database "personal_finance" sudah dibuat

### Error: "Module not found"
```bash
# Delete node_modules dan install ulang
rm -rf node_modules
npm install
```

### Port 3000 already in use
```bash
# Gunakan port lain
npm run dev -- -p 3001
```

## Next Steps

1. Explore semua fitur
2. Modify sample data sesuai kebutuhan
3. Customize colors di `tailwind.config.js`
4. Tambah kategori baru di database
5. Implementasi authentication (NextAuth.js, Clerk, dll)

## Database Structure

Lihat `database/schema.sql` untuk:
- Table structures
- Relationships
- Sample data
- Indexes

## API Documentation

Semua API routes ada di `pages/api/`:
- `/api/dashboard` - Dashboard data
- `/api/transactions` - CRUD transactions
- `/api/budgets` - CRUD budgets
- `/api/goals` - CRUD financial goals
- `/api/investments` - CRUD investments
- `/api/debts` - CRUD debts
- `/api/accounts` - CRUD accounts

Setiap route sudah include query examples dan sample data handling.

---

Enjoy managing your finances! 💰
