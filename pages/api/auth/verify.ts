import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { query } from '../../../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

interface JWTPayload {
  userId?: string | number; // Could be UUID (SSO) or INTEGER (local) - PFTU format
  id?: string | number;     // SSO uses 'id' instead of 'userId'
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (isDev) console.log('[Verify] Request received');
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Verify] No authorization header or invalid format');
      return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    const token = authHeader.substring(7);
    if (isDev) {
      console.log('[Verify] Token extracted, length:', token.length);
      console.log('[Verify] Token preview:', token.substring(0, 30) + '...');
    }

    // Verify token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      if (isDev) {
        console.log('[Verify] Token decoded successfully');
        console.log('[Verify] UserId:', decoded.userId);
        console.log('[Verify] Email:', decoded.email);
        console.log('[Verify] Name:', decoded.name);
      }
    } catch (error) {
      console.error('[Verify] Token verification failed:', error);
      console.error('[Verify] JWT_SECRET length:', JWT_SECRET.length);
      return res.status(401).json({ error: 'Token tidak valid' });
    }

    // SSO uses 'id', PFTU local uses 'userId'
    const userId = decoded.userId || decoded.id;
    const { email, name } = decoded;

    console.log('[Verify API] === STEP 3: Extracted user data ===');
    console.log('[Verify API] userId:', userId);
    console.log('[Verify API] email:', email);
    console.log('[Verify API] name:', name);

    if (!userId) {
      console.error('[Verify API] ❌ No userId or id found in token payload');
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Check if this is SSO token (UUID) or local token (INTEGER)
    const isSSO = typeof userId === 'string' && userId.includes('-');
    console.log('[Verify API] Token type:', isSSO ? 'SSO (UUID)' : 'Local (INTEGER)');

    let user;

    if (isSSO) {
      // SSO Token - userId is UUID (sso_user_id)
      console.log('[Verify] SSO token detected (UUID format)');
      if (isDev) console.log('[Verify] Syncing user with UUID:', userId);

      // Step 1: Check if user exists by sso_user_id (already linked)
      if (isDev) console.log('[Verify] Step 1: Checking if already linked by sso_user_id...');
      const linkedUser = await query(
        'SELECT id, email, name, sso_user_id FROM users WHERE sso_user_id = $1',
        [userId]
      );

      if (linkedUser.rows.length > 0) {
        // User already linked to SSO
        user = linkedUser.rows[0];
        console.log('[Verify] User already linked to SSO');
        if (isDev) console.log('[Verify] User details:', { id: user.id, email: user.email });

        // Update user info if changed
        if (user.email !== email || user.name !== name) {
          await query(
            'UPDATE users SET email = $1, name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
            [email, name, user.id]
          );
          user.email = email;
          user.name = name;
          console.log('[Verify] User info updated');
        }
      } else {
        // Step 2: Check if user exists by email (not yet linked to SSO)
        if (isDev) console.log('[Verify] Step 2: Checking existing user by email...');
        const existingUserByEmail = await query(
          'SELECT id, email, name, sso_user_id FROM users WHERE email = $1',
          [email]
        );

        if (existingUserByEmail.rows.length > 0) {
          // User exists but not linked to SSO - link them now
          user = existingUserByEmail.rows[0];
          console.log('[Verify] Found existing user by email, linking to SSO...');
          if (isDev) console.log('[Verify] Existing user ID:', user.id, 'Email:', user.email);

          // Link this user to SSO by updating sso_user_id
          await query(
            'UPDATE users SET sso_user_id = $1, name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
            [userId, name, user.id]
          );
          user.sso_user_id = userId;
          user.name = name;
          console.log('[Verify] User successfully linked to SSO');
          if (isDev) console.log('[Verify] Updated sso_user_id:', userId);
          } else {
          // Step 3: User doesn't exist at all - create new user from SSO
          console.log('[Verify] User not found, creating new user...');
          if (isDev) console.log('[Verify] New user email:', email);

          // Generate temporary password hash (won't be used for SSO login)
          const tempPassword = Math.random().toString(36).substring(2, 15);
          const hashedPassword = await bcryptjs.hash(tempPassword, 10);
          if (isDev) console.log('[Verify] Temporary password hash generated');

          if (isDev) console.log('[Verify] Inserting user into database...');
          const insertResult = await query(
            `INSERT INTO users (email, name, password_hash, sso_user_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING id, email, name, sso_user_id`,
            [email, name, hashedPassword, userId]
          );

          user = insertResult.rows[0];
          console.log('[Verify] New user created successfully');
          if (isDev) console.log('[Verify] User ID:', user.id, 'Email:', user.email);

          // Create default categories for new user
          const defaultCategories = [
            { name: 'Gaji', type: 'income', icon: '💰', color: '#10b981' },
            { name: 'Freelance', type: 'income', icon: '💼', color: '#3b82f6' },
            { name: 'Makanan', type: 'expense', icon: '🍔', color: '#ef4444' },
            { name: 'Transport', type: 'expense', icon: '🚗', color: '#f59e0b' },
            { name: 'Belanja', type: 'expense', icon: '🛒', color: '#8b5cf6' },
            { name: 'Hiburan', type: 'expense', icon: '🎬', color: '#ec4899' },
            { name: 'Admin Fee', type: 'expense', icon: '🏦', color: '#6b7280' },
          ];

          for (const category of defaultCategories) {
            await query(
              `INSERT INTO categories (user_id, name, type, icon, color)
               VALUES ($1, $2, $3, $4, $5)`,
              [user.id, category.name, category.type, category.icon, category.color]
            );
          }

          console.log('[Verify] Default categories created');
        }
      }
    } else {
      // Local Token - userId is INTEGER (local PFTU id)
      console.log('[Verify] Local token detected');

      const result = await query(
        'SELECT id, email, name, sso_user_id FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'User tidak ditemukan' });
      }

      user = result.rows[0];
    }

    // Return user info with INTEGER id for PFTU operations
    return res.status(200).json({
      success: true,
      user: {
        id: user.id, // INTEGER for local operations
        email: user.email,
        name: user.name,
        ssoUserId: user.sso_user_id, // UUID if from SSO
      },
    });
  } catch (error) {
    console.error('[Verify] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
