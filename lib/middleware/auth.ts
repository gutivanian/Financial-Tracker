import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

export interface AuthRequest extends NextApiRequest {
  user?: {
    userId: number;
    email: string;
    name: string;
  };
}

export const authMiddleware = (
  handler: (req: AuthRequest, res: NextApiResponse) => Promise<void>
) => {
  return async (req: AuthRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token tidak ditemukan' });
      }

      const token = authHeader.substring(7);

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // SSO token uses 'id' (UUID), local token uses 'userId' (INTEGER)
      const tokenUserId = decoded.userId || decoded.id;
      const isSSO = typeof tokenUserId === 'string' && tokenUserId.includes('-');

      console.log('[Auth Middleware] Token type:', isSSO ? 'SSO (UUID)' : 'Local (INTEGER)');
      console.log('[Auth Middleware] Token userId:', tokenUserId);

      let localUserId: number;
      let email: string = decoded.email;
      let name: string = decoded.name;

      if (isSSO) {
        // SSO token - lookup local INTEGER id by sso_user_id
        console.log('[Auth Middleware] Looking up local user by sso_user_id:', tokenUserId);
        const result = await query(
          'SELECT id, email, name FROM users WHERE sso_user_id = $1',
          [tokenUserId]
        );

        if (result.rows.length === 0) {
          console.error('[Auth Middleware] User not found for sso_user_id:', tokenUserId);
          return res.status(401).json({ error: 'User tidak ditemukan di database lokal' });
        }

        const localUser = result.rows[0];
        localUserId = localUser.id;
        email = localUser.email;
        name = localUser.name;
        
        console.log('[Auth Middleware] Found local user id:', localUserId);
      } else {
        // Local token - userId is already INTEGER
        localUserId = tokenUserId;
      }

      // Attach user to request with INTEGER id
      req.user = {
        userId: localUserId,  // Always INTEGER for database queries
        email,
        name,
      };

      console.log('[Auth Middleware] req.user set to:', req.user);

      // Call the actual handler
      return await handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ error: 'Token tidak valid atau expired' });
    }
  };
};

// Helper function untuk extract user dari token tanpa middleware
export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      name: string;
    };
    return decoded;
  } catch (error) {
    return null;
  }
};
