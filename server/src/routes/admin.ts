import { Router, Request, Response } from 'express';
import { prisma } from '../db/index.js';
import { verifyTelegramAuth } from '../middleware/auth.js';
import { sendOrderStatusEmail, sendRoleUpdatedEmail } from '../services/email.js';
import {
  notifyTelegramRoleChange,
  pushOrderStatusNotification,
} from '../services/telegramBot.js';
import { markOrderDispatched } from '../services/orderSync.js';

export const adminRouter = Router();

// Apply Telegram HMAC-SHA256 verification
adminRouter.use(verifyTelegramAuth);

// GET /api/admin/stats — Store metrics & 7-day revenue
adminRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      pendingOrders,
      totalProducts,
      totalUsers,
      recentOrders,
      allOrders,
      todayRevenue,
      todayOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { items: { include: { product: true } } },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, total: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { createdAt: { gte: todayStart } },
      }),
    ]);

    const totalRevenue = await prisma.order.aggregate({
      _sum: { total: true },
    });

    const dailyMap: Record<string, { revenue: number; orders: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      dailyMap[d.toISOString().split('T')[0]] = { revenue: 0, orders: 0 };
    }

    for (const o of allOrders) {
      const key = o.createdAt.toISOString().split('T')[0];
      if (dailyMap[key]) {
        dailyMap[key].revenue += Number(o.total);
        dailyMap[key].orders += 1;
      }
    }

    const dailyRevenue = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }));

    const serializedRecent = recentOrders.map(o => ({
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
        totalRevenue: Number(totalRevenue._sum.total ?? 0),
        totalOrders,
        pendingOrders,
        totalProducts,
        totalUsers,
        revenueToday: Number(todayRevenue._sum.total ?? 0),
        ordersToday: todayOrders,
        recentOrders: serializedRecent,
        dailyRevenue,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/products
adminRouter.get('/products', async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    const serialized = products.map(p => ({
      ...p,
      price: Number(p.price),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      category: p.category
        ? {
            ...p.category,
            createdAt: p.category.createdAt.toISOString(),
            updatedAt: p.category.updatedAt.toISOString(),
          }
        : null,
    }));

    res.json({ data: serialized });
  } catch (error) {
    console.error('Admin get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/products — Create product
adminRouter.post('/products', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const slug =
      body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug,
        description: body.description || null,
        price: body.price,
        stock: body.stock ?? 0,
        imageUrl: body.imageUrl || null,
        images: body.images ?? (body.imageUrl ? [body.imageUrl] : []),
        categoryId: body.categoryId || null,
        isActive: body.isActive ?? true,
      },
      include: { category: true },
    });

    res.status(201).json({
      data: {
        ...product,
        price: Number(product.price),
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/products/:id — Edit product / update inventory
adminRouter.patch('/products/:id', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const id = req.params.id as string;
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        description: body.description !== undefined ? body.description : undefined,
        price: body.price !== undefined ? body.price : undefined,
        stock: body.stock !== undefined ? body.stock : undefined,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        categoryId: body.categoryId !== undefined ? body.categoryId : undefined,
      },
      include: { category: true },
    });

    res.json({
      data: {
        ...product,
        price: Number(product.price),
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/products/:id
adminRouter.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ data: { success: true } });
  } catch (error) {
    console.error('Admin delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/orders
adminRouter.get('/orders', async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) || '';
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const perPage = 25;

    const where = status ? { status: status as any } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.order.count({ where }),
    ]);

    const serialized = orders.map(o => ({
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
        items: serialized,
        meta: {
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
      },
    });
  } catch (error) {
    console.error('Admin get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/orders/:id — Update fulfillment stage
adminRouter.patch('/orders/:id', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const id = req.params.id as string;
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    markOrderDispatched(order.id, order.status);

    sendOrderStatusEmail({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      status: order.status,
      total: Number(order.total),
    }).catch(err => console.error('Order status email error:', err));

    pushOrderStatusNotification({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      status: order.status,
      total: Number(order.total),
    }).catch(err => console.error('Telegram status notification error:', err));

    res.json({
      data: {
        ...order,
        total: Number(order.total),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin update order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users — List all registered users & admins
adminRouter.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: [{ role: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { orders: true } },
      },
    });

    const serialized = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      telegramId: u.telegramId,
      telegramUsername: u.telegramUsername,
      orderCount: u._count.orders,
      createdAt: u.createdAt.toISOString(),
    }));

    res.json({ data: serialized });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/users/:id/role — Promote or demote user role (ADMIN / CUSTOMER)
adminRouter.patch('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { role, telegramUsername } = req.body;

    if (role !== 'ADMIN' && role !== 'CUSTOMER') {
      res.status(400).json({ error: 'Role must be ADMIN or CUSTOMER' });
      return;
    }

    const cleanTg =
      telegramUsername !== undefined
        ? telegramUsername
          ? String(telegramUsername).trim().replace(/^@/, '').toLowerCase()
          : null
        : undefined;

    const user = await prisma.user.update({
      where: { id },
      data: {
        role,
        ...(cleanTg !== undefined ? { telegramUsername: cleanTg } : {}),
      },
      include: {
        _count: { select: { orders: true } },
      },
    });

    sendRoleUpdatedEmail(user).catch(e => console.error('Role email error:', e));
    notifyTelegramRoleChange(user).catch(e => console.error('Telegram role notify error:', e));

    res.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        telegramId: user.telegramId,
        telegramUsername: user.telegramUsername,
        orderCount: user._count.orders,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/users — Add or pre-authorize a user/admin by email or @telegramUsername
adminRouter.post('/users', async (req: Request, res: Response) => {
  try {
    const { name, email, telegramUsername, role = 'ADMIN' } = req.body;
    const cleanTg = telegramUsername
      ? String(telegramUsername).trim().replace(/^@/, '').toLowerCase()
      : null;
    const cleanEmail = email
      ? String(email).trim().toLowerCase()
      : cleanTg
      ? `${cleanTg}@telegram.local`
      : null;

    if (!cleanEmail) {
      res.status(400).json({ error: 'Provide an email or Telegram @username' });
      return;
    }

    const user = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: {
        name: name || undefined,
        role: role === 'CUSTOMER' ? 'CUSTOMER' : 'ADMIN',
        ...(cleanTg ? { telegramUsername: cleanTg } : {}),
      },
      create: {
        email: cleanEmail,
        name: name || cleanTg || cleanEmail.split('@')[0],
        role: role === 'CUSTOMER' ? 'CUSTOMER' : 'ADMIN',
        telegramUsername: cleanTg,
      },
      include: {
        _count: { select: { orders: true } },
      },
    });

    res.status(201).json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        telegramId: user.telegramId,
        telegramUsername: user.telegramUsername,
        orderCount: user._count.orders,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

