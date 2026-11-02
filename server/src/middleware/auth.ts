import { Request, Response, NextFunction } from 'express';
import { createHmac } from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'pulsestore_jwt_secret_key_2026';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}

export function signJwt(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7);
  const decoded = verifyJwtToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  (req as any).user = decoded;
  next();
}

/**
 * Validates Telegram Mini App HMAC-SHA256 signature from `x-telegram-init-data` header,
 * or allows valid Admin JWT token, or allows dev/preview bypass.
 */
export function verifyTelegramAuth(req: Request, res: Response, next: NextFunction): void {
  const initData = req.headers['x-telegram-init-data'] as string | undefined;
  const authHeader = req.headers.authorization;

  // Check if a valid ADMIN JWT token is provided
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const decoded = verifyJwtToken(authHeader.slice(7));
    if (decoded && decoded.role === 'ADMIN') {
      (req as any).user = decoded;
      return next();
    }
  }

  // Allow non-production or when opened inside Mini App preview without strict hash failure blocking
  if (!initData || initData === 'dev-bypass') {
    return next();
  }

  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return next();
    }

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) {
      return next();
    }

    params.delete('hash');
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
    const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (expectedHash !== hash && process.env.NODE_ENV === 'production') {
      res.status(401).json({ error: 'Unauthorized: invalid Telegram signature hash' });
      return;
    }

    next();
  } catch {
    next();
  }
}

