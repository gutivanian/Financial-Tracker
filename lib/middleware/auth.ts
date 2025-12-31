import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

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
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: number;
        email: string;
        name: string;
      };

      // Attach user to request
      req.user = decoded;

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
