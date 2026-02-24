import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '../lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'

export async function authMiddleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Verify JWT dari SSO
    const payload = jwt.verify(token, JWT_SECRET) as any
    const ssoUserId = payload.userId as string  // UUID dari SSO

    // 2. Lookup SERIAL id lokal berdasarkan UUID
    const result = await query(
      'SELECT id, email, name FROM users WHERE sso_user_id = $1',
      [ssoUserId]
    )

    if (result.rows.length === 0) {
      // 3. Kalau belum ada, sync dulu dari SSO
      const ssoUrl = process.env.NEXT_PUBLIC_SSO_URL
      if (!ssoUrl) {
        throw new Error('NEXT_PUBLIC_SSO_URL is not configured')
      }
      const ssoResponse = await fetch(`${ssoUrl}/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const ssoUser = await ssoResponse.json()

      // Insert ke local database, dapat SERIAL id baru
      const insertResult = await query(
        `INSERT INTO users (sso_user_id, email, name, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, email, name`,
        [ssoUser.id, ssoUser.email, ssoUser.name]
      )
      
      const localUser = insertResult.rows[0]
      
      // 4. Return SERIAL id lokal
      return {
        userId: localUser.id,        // INTEGER SERIAL untuk database operations
        ssoUserId: ssoUser.id,       // UUID untuk reference (jarang dipakai)
        email: localUser.email,
        name: localUser.name
      }
    }

    const localUser = result.rows[0]

    // 4. Return SERIAL id lokal
    return {
      userId: localUser.id,          // INTEGER SERIAL - INI YANG DIPAKAI
      ssoUserId: ssoUserId,          // UUID dari SSO
      email: localUser.email,
      name: localUser.name
    }

  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

// Helper function untuk route handlers
export async function getUserFromRequest(req: NextRequest) {
  const user = await authMiddleware(req)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  return user
}
