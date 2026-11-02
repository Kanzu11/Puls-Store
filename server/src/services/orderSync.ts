import { prisma } from '../db/index.js';
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from './email.js';
import { pushOrderNotification, pushOrderStatusNotification } from './telegramBot.js';

const knownOrderStatus = new Map<string, string>();
let initialized = false;

export function markOrderDispatched(orderId: string, status: string): void {
  knownOrderStatus.set(orderId, status);
}

/**
 * Watches Neon PostgreSQL for:
 * 1. Newly created orders (placed via Vercel/Render or locally)
 * 2. Order fulfillment status changes (triggered from the Telegram Mini App or Bot)
 * and dispatches Telegram alerts + Gmail emails automatically.
 */
export function startOrderNotificationWatcher(): void {
  const poll = async () => {
    try {
      const recentOrders = await prisma.order.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 15,
        include: {
          items: { include: { product: true } },
        },
      });

      if (!initialized) {
        for (const o of recentOrders) {
          knownOrderStatus.set(o.id, o.status);
        }
        initialized = true;
        return;
      }

      for (const o of recentOrders) {
        const prevStatus = knownOrderStatus.get(o.id);

        if (!prevStatus) {
          // Brand new order detected in Neon DB
          knownOrderStatus.set(o.id, o.status);
          console.log(`🔔 New order detected via DB sync: ${o.orderNumber}`);

          await Promise.allSettled([
            pushOrderNotification({
              id: o.id,
              orderNumber: o.orderNumber,
              customerName: o.customerName,
              customerEmail: o.customerEmail,
              customerPhone: o.customerPhone,
              shippingAddress: o.shippingAddress as any,
              total: Number(o.total),
              itemCount: o.items.length,
              items: o.items.map(i => ({
                name: i.product.name,
                quantity: i.quantity,
                price: Number(i.price),
              })),
            }),
            sendOrderConfirmationEmail({
              orderNumber: o.orderNumber,
              customerName: o.customerName,
              customerEmail: o.customerEmail,
              total: Number(o.total),
              items: o.items.map(i => ({
                quantity: i.quantity,
                price: Number(i.price),
                product: { name: i.product.name },
              })),
            }),
          ]);
        } else if (prevStatus !== o.status) {
          // Order status was updated (e.g. from Telegram Mini App or Bot!)
          knownOrderStatus.set(o.id, o.status);
          console.log(
            `📦 Order status change detected (${o.orderNumber}: ${prevStatus} -> ${o.status})`
          );

          await Promise.allSettled([
            sendOrderStatusEmail({
              orderNumber: o.orderNumber,
              customerName: o.customerName,
              customerEmail: o.customerEmail,
              status: o.status,
              total: Number(o.total),
            }),
            pushOrderStatusNotification({
              orderNumber: o.orderNumber,
              customerName: o.customerName,
              customerEmail: o.customerEmail,
              status: o.status,
              total: Number(o.total),
            }),
          ]);
        }
      }
    } catch (err) {
      // Ignore transient DB polling errors
    }
  };

  // Run initial check after 2s, then poll every 8s
  setTimeout(poll, 2000);
  setInterval(poll, 8000).unref();
}
