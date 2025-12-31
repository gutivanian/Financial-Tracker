# 🔧 Fix untuk Error "query is not a function"

## Masalah

```
TypeError: (0 , _lib_db__WEBPACK_IMPORTED_MODULE_0__.query) is not a function
```

## Penyebab

Ada kesalahan import di file API authentication:
- File `lib/db.ts` meng-export `query` sebagai **named export**
- Tetapi file `login.ts` dan `verify.ts` meng-import sebagai **default export** (`pool`)

## Solusi

### ❌ Yang Salah:

```typescript
// pages/api/auth/login.ts (SALAH)
import pool from '../../../lib/db';

// Kemudian menggunakan:
const result = await pool.query(...) // ERROR!
```

### ✅ Yang Benar:

```typescript
// pages/api/auth/login.ts (BENAR)
import { query } from '../../../lib/db';

// Kemudian menggunakan:
const result = await query(...) // WORKS!
```

## File yang Sudah Diperbaiki

1. ✅ `pages/api/auth/login.ts`
2. ✅ `pages/api/auth/verify.ts`

## Cara Update

### Jika Anda sudah extract ZIP sebelumnya:

**Option 1: Download ZIP baru**
- Download `PFAC_with_JWT_FIXED.zip` yang sudah diperbaiki
- Extract dan replace file lama

**Option 2: Manual fix**

Edit file `pages/api/auth/login.ts`:
```typescript
// Ubah baris ini:
import pool from '../../../lib/db';

// Menjadi:
import { query } from '../../../lib/db';

// Dan ubah semua:
pool.query(...)

// Menjadi:
query(...)
```

Edit file `pages/api/auth/verify.ts`:
```typescript
// Ubah baris ini:
import pool from '../../../lib/db';

// Menjadi:
import { query } from '../../../lib/db';

// Dan ubah semua:
pool.query(...)

// Menjadi:
query(...)
```

## Test Setelah Fix

1. Restart dev server:
```bash
# Stop server (Ctrl+C)
npm run dev
```

2. Buka browser: http://localhost:3000/login

3. Login dengan:
   - Email: `demo@finance.com`
   - Password: `demo123`

4. Seharusnya login berhasil dan redirect ke dashboard!

## Penjelasan lib/db.ts

```typescript
// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({ /* config */ });

// Named export - gunakan ini!
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

// Default export - pool langsung
export default pool;
```

**Gunakan named export `query`** karena:
- ✅ Lebih simple, langsung call `query(...)`
- ✅ Consistent dengan pattern yang umum
- ✅ Sudah include error handling di helper function

## Verifikasi

Jika sudah benar, Anda tidak akan melihat error lagi dan login akan berfungsi normal.

Happy coding! 🚀
