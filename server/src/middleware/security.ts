import { Request, Response, NextFunction } from 'express';

/**
 * Sets strict production HTTP security headers (Helmet-equivalent).
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

/**
 * Recursively strips null bytes and prototype-pollution keys (__proto__, constructor, prototype).
 */
function cleanValue(val: any): any {
  if (typeof val === 'string') {
    return val.replace(/\0/g, '');
  }
  if (Array.isArray(val)) {
    return val.map(cleanValue);
  }
  if (val && typeof val === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      out[k] = cleanValue(v);
    }
    return out;
  }
  return val;
}

export function sanitizeInputs(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = cleanValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = cleanValue(req.query);
  }
  next();
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
  keyPrefix?: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically prune expired rate-limit buckets every 60s
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}, 60_000).unref();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Sliding-window IP rate limiter middleware with standard RFC headers.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message, keyPrefix = 'rl' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = getClientIp(req);
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, max - bucket.count);
    const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);

    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(resetSeconds));

    if (bucket.count > max) {
      res.setHeader('Retry-After', String(resetSeconds));
      res.status(429).json({
        error: message,
        retryAfterSeconds: resetSeconds,
      });
      return;
    }

    next();
  };
}

// 120 requests per minute per IP across general API routes
export const globalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  keyPrefix: 'global',
  message: 'Too many requests from this IP. Please wait a moment and try again.',
});

// 15 attempts per 15 minutes per IP on login/signup to prevent brute-force attacks
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  keyPrefix: 'auth',
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
});

// 20 orders per 15 minutes per IP on checkout
export const checkoutLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: 'checkout',
  message: 'Order rate limit reached. Please wait a few minutes before placing another order.',
});

