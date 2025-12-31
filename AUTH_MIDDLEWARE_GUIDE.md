# Menggunakan Auth Middleware di API Routes

## Import Middleware

```typescript
import { authMiddleware, AuthRequest } from '../../../lib/middleware/auth';
```

## Contoh Penggunaan

### Sebelum (Tanpa Auth):

```typescript
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handler code
}
```

### Sesudah (Dengan Auth):

```typescript
import { NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '../../../lib/middleware/auth';

async function handler(req: AuthRequest, res: NextApiResponse) {
  // Sekarang req.user tersedia!
  const userId = req.user?.userId;
  
  // Handler code dengan user context
  // Contoh: query data berdasarkan userId
  const result = await query(
    'SELECT * FROM accounts WHERE user_id = $1',
    [userId]
  );
  
  return res.status(200).json(result.rows);
}

// Wrap handler dengan authMiddleware
export default authMiddleware(handler);
```

## Akses User Data

Setelah menggunakan middleware, Anda bisa mengakses:

```typescript
req.user?.userId   // ID user (number)
req.user?.email    // Email user (string)
req.user?.name     // Nama user (string)
```

## Error Handling

Middleware akan otomatis mengembalikan:

- `401` jika token tidak ada
- `401` jika token tidak valid/expired

## Contoh Lengkap

```typescript
import { NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '../../../lib/middleware/auth';
import { query } from '../../../lib/db';

async function handler(req: AuthRequest, res: NextApiResponse) {
  const userId = req.user?.userId;

  if (req.method === 'GET') {
    try {
      // Get all accounts for current user
      const result = await query(
        'SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, type, balance } = req.body;
      
      // Create new account for current user
      const result = await query(
        'INSERT INTO accounts (user_id, name, type, balance) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, name, type, balance]
      );
      
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating account:', error);
      return res.status(500).json({ error: 'Failed to create account' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default authMiddleware(handler);
```

## Testing dengan Postman/Insomnia

Tambahkan header:

```
Authorization: Bearer <your-jwt-token>
```

Token didapat dari response `/api/auth/login`.

## Helper Function: verifyToken

Jika Anda tidak ingin menggunakan middleware (misalnya untuk optional auth):

```typescript
import { verifyToken } from '../../../lib/middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.substring(7);
    const user = verifyToken(token);
    
    if (user) {
      // User is authenticated
      console.log('Authenticated user:', user.email);
    }
  }
  
  // Continue with or without auth
}
```

## Security Notes

1. Middleware otomatis verify JWT signature
2. Check token expiration
3. Return 401 untuk unauthorized requests
4. User ID dari token, tidak bisa di-manipulate client-side

## Update Existing API Routes

Untuk protect semua API routes yang ada:

1. Import authMiddleware dan AuthRequest
2. Change NextApiRequest ke AuthRequest
3. Wrap handler dengan authMiddleware
4. Gunakan req.user?.userId untuk filter data by user

Contoh files yang perlu di-update:
- pages/api/accounts/index.ts
- pages/api/transactions/index.ts
- pages/api/budgets/index.ts
- pages/api/goals/index.ts
- pages/api/investments/index.ts
- pages/api/debts/index.ts
- pages/api/dashboard/index.ts
