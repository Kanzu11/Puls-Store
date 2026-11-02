import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/index.js';
import { signJwt, requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import { sendWelcomeEmail } from '../services/email.js';

export const authRouter = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function serializeUser(u: any) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    telegramId: u.telegramId,
    telegramUsername: u.telegramUsername,
    createdAt: u.createdAt.toISOString(),
  };
}

// POST /api/auth/signup
authRouter.post('/signup', authLimiter, async (req: Request, res: Response) => {
  try {
    const { name, email, password, telegramUsername } = req.body;

    if (
      !email ||
      typeof email !== 'string' ||
      email.length > 254 ||
      !EMAIL_REGEX.test(email.trim()) ||
      !password ||
      typeof password !== 'string' ||
      password.length < 6 ||
      password.length > 128
    ) {
      res.status(400).json({ error: 'Valid email and password (6–128 chars) are required' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanTgUsername = telegramUsername
      ? String(telegramUsername).trim().replace(/^@/, '').toLowerCase()
      : null;

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing && existing.passwordHash) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const configuredAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const configuredAdminTg = (process.env.ADMIN_TELEGRAM_USERNAME || '')
      .trim()
      .replace(/^@/, '')
      .toLowerCase();
    const isAutoAdmin =
      (configuredAdminEmail !== '' && cleanEmail === configuredAdminEmail) ||
      (configuredAdminTg !== '' && cleanTgUsername === configuredAdminTg);

    let user;
    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: name || existing.name,
          passwordHash,
          telegramUsername: cleanTgUsername || existing.telegramUsername,
          role: isAutoAdmin ? 'ADMIN' : existing.role,
        },
      });
    } else if (cleanTgUsername) {
      const existingByTg = await prisma.user.findUnique({
        where: { telegramUsername: cleanTgUsername },
      });
      if (existingByTg) {
        user = await prisma.user.update({
          where: { id: existingByTg.id },
          data: {
            email: cleanEmail,
            name: name || existingByTg.name,
            passwordHash,
            role: isAutoAdmin ? 'ADMIN' : existingByTg.role,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: name || cleanEmail.split('@')[0],
            passwordHash,
            telegramUsername: cleanTgUsername,
            role: isAutoAdmin ? 'ADMIN' : 'CUSTOMER',
          },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: name || cleanEmail.split('@')[0],
          passwordHash,
          role: isAutoAdmin ? 'ADMIN' : 'CUSTOMER',
        },
      });
    }

    // Link any previous guest orders matching this email
    await prisma.order.updateMany({
      where: { customerEmail: cleanEmail, userId: null },
      data: { userId: user.id },
    });

    // Send Welcome Email asynchronously
    sendWelcomeEmail(user.email, user.name || 'Shopper').catch(err =>
      console.error('Welcome email error:', err)
    );

    const token = signJwt({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      data: {
        token,
        user: serializeUser(user),
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /api/auth/login
authRouter.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (
      !email ||
      typeof email !== 'string' ||
      email.length > 254 ||
      !password ||
      typeof password !== 'string' ||
      password.length > 128
    ) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signJwt({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      data: {
        token,
        user: serializeUser(user),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userOrders = await prisma.order.findMany({
      where: {
        OR: [{ userId: user.id }, { customerEmail: user.email.toLowerCase() }],
      },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    });

    const orders = userOrders.map(o => ({
      ...o,
      total: Number(o.total),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      items: o.items.map(i => ({
        ...i,
        price: Number(i.price),
        product: {
          ...i.product,
          price: Number(i.product.price),
          createdAt: i.product.createdAt.toISOString(),
          updatedAt: i.product.updatedAt.toISOString(),
        },
      })),
    }));

    res.json({
      data: {
        user: serializeUser(user),
        orders,
      },
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

