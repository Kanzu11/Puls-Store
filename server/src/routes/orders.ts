import { Router, Request, Response } from 'express';
import { prisma } from '../db/index.js';
import type { CheckoutPayload } from '../types/index.js';
import { pushOrderNotification } from '../services/telegramBot.js';
import { sendOrderConfirmationEmail } from '../services/email.js';
import { markOrderDispatched } from '../services/orderSync.js';
import { verifyJwtToken } from '../middleware/auth.js';
import { checkoutLimiter } from '../middleware/security.js';

export const ordersRouter = Router();

function generateOrderNumber(): string {
  return `PS-${Date.now()}`;
}

// POST /api/orders — Checkout flow (Rate-limited & JWT-protected)
ordersRouter.post('/', checkoutLimiter, async (req: Request, res: Response) => {
  try {
    const body = req.body as CheckoutPayload;

    if (!body.items || body.items.length === 0) {
      res.status(400).json({ error: 'Order must contain at least one item' });
      return;
    }

    // Require authenticated user (JWT) to place an order
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyJwtToken(authHeader.slice(7));
      if (decoded) userId = decoded.userId;
    }

    if (!userId) {
      res.status(401).json({ error: 'Please sign up or log in to place an order' });
      return;
    }

    const productIds = body.items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      res.status(400).json({ error: 'One or more products are unavailable' });
      return;
    }

    for (const item of body.items) {
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        res.status(400).json({ error: 'Invalid item quantity (must be between 1 and 99)' });
        return;
      }
      const product = products.find(p => p.id === item.productId)!;
      if (product.stock < qty) {
        res.status(400).json({ error: `Insufficient stock for "${product.name}"` });
        return;
      }
    }

    // Security: Always compute total and line-item prices from authoritative database prices
    const total = body.items.reduce((sum, i) => {
      const product = products.find(p => p.id === i.productId)!;
      return sum + Number(product.price) * Number(i.quantity);
    }, 0);

    const order = await prisma.$transaction(async tx => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerName: String(body.customerName || '').trim().slice(0, 120),
          customerEmail: String(body.customerEmail || '').trim().toLowerCase().slice(0, 254),
          customerPhone: body.customerPhone ? String(body.customerPhone).trim().slice(0, 40) : null,
          shippingAddress: body.shippingAddress as any,
          notes: body.notes ? String(body.notes).trim().slice(0, 500) : null,
          userId,
          total,
          items: {
            create: body.items.map(i => {
              const product = products.find(p => p.id === i.productId)!;
              return {
                productId: i.productId,
                quantity: Number(i.quantity),
                price: Number(product.price),
              };
            }),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });

      // Atomically decrement stock
      await Promise.all(
        body.items.map(i =>
          tx.product.update({
            where: { id: i.productId },
            data: { stock: { decrement: i.quantity } },
          })
        )
      );

      return newOrder;
    });

    markOrderDispatched(order.id, order.status);

    // Asynchronously dispatch real-time push notification to Telegram Admins
    pushOrderNotification({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: body.shippingAddress,
      total,
      itemCount: body.items.length,
      items: order.items.map(i => ({
        name: i.product.name,
        quantity: i.quantity,
        price: Number(i.price),
      })),
    }).catch(err => console.error('Telegram push notification failed:', err));

    // Asynchronously send Order Confirmation Email via Gmail Nodemailer
    sendOrderConfirmationEmail({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      total: Number(order.total),
      items: order.items.map(i => ({
        quantity: i.quantity,
        price: Number(i.price),
        product: { name: i.product.name },
      })),
    }).catch(err => console.error('Order confirmation email failed:', err));

    res.status(201).json({
      data: {
        orderNumber: order.orderNumber,
        id: order.id,
        total: Number(order.total),
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Checkout processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:orderNumber — Customer order tracking lookup
ordersRouter.get('/:orderNumber', async (req: Request, res: Response) => {
  try {
    const orderNumber = req.params.orderNumber as string;
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: { include: { category: true } },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const anyOrder = order as any;
    const serialized = {
      ...order,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: anyOrder.items.map((item: any) => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          price: Number(item.product.price),
          createdAt: item.product.createdAt.toISOString(),
          updatedAt: item.product.updatedAt.toISOString(),
          category: item.product.category
            ? {
                ...item.product.category,
                createdAt: item.product.category.createdAt.toISOString(),
                updatedAt: item.product.category.updatedAt.toISOString(),
              }
            : null,
        },
      })),
    };

    res.json({ data: serialized });
  } catch (error) {
    console.error('Error fetching order by number:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

