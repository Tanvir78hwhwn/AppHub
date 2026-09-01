import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, User } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'apphub-super-secret-jwt-key-2026';
const DOWNLOAD_TOKEN_SECRET = process.env.DOWNLOAD_TOKEN_SECRET || `${JWT_SECRET}-downloads`;

export interface AuthRequest extends Request {
  user?: User;
}

export function hashPassword(plainText: string): string {
  return bcrypt.hashSync(plainText, 10);
}

export function comparePassword(plainText: string, hash: string): boolean {
  return bcrypt.compareSync(plainText, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function generateDownloadToken(apkId: string, userId: string, fileName: string): string {
  return jwt.sign(
    {
      apkId,
      userId,
      fileName,
      purpose: 'apk_download'
    },
    DOWNLOAD_TOKEN_SECRET,
    { expiresIn: '2h' }
  );
}

export function verifyDownloadToken(token: string): { apkId: string; userId: string; fileName: string } | null {
  try {
    const decoded = jwt.verify(token, DOWNLOAD_TOKEN_SECRET) as any;
    if (decoded.purpose !== 'apk_download') return null;
    return {
      apkId: decoded.apkId,
      userId: decoded.userId,
      fileName: decoded.fileName
    };
  } catch (err) {
    return null;
  }
}

// Middleware: Populate req.user if token is provided
export function authenticateOptional(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.findUserById(decoded.id);
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Ignore invalid token in optional mode
  }
  next();
}

// Middleware: Require valid authenticated user
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please login first.' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User account not found or deactivated.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token. Please login again.' });
  }
}

// Middleware: Require Admin role
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admin privileges required.' });
    }
    next();
  });
}
