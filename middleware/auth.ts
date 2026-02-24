import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose'
import { sql } from '@vercel/postgres'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET
)

export async function authMiddleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Verify JWT dari SSO
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    const ssoUserId = payload.userId as string  // UUID dari SSO

    // 2. Lookup SERIAL id lokal berdasarkan UUID
    const result = await sql`
      SELECT id, email, name 
      FROM users 
      WHERE sso_user_id = ${ssoUserId}::uuid
    `

    if (result.rows.length === 0) {
      // 3. Kalau belum ada, sync dulu dari SSO
      const ssoUrl = process.env.NEXT_PUBLIC_SSO_URL || 'http://localhost:3001'
      const ssoResponse = await fetch(`${ssoUrl}/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const ssoUser = await ssoResponse.json()

      // Insert ke local database, dapat SERIAL id baru
      const insertResult = await sql`
        INSERT INTO users (sso_user_id, email, name, created_at)
        VALUES (
          ${ssoUser.id}::uuid,
          ${ssoUser.email},
          ${ssoUser.name},
          NOW()
        )
        RETURNING id, email, name
      `
      
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
