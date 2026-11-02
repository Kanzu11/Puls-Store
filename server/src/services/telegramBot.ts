import dns from 'dns';
import { prisma } from '../db/index.js';

// Force IPv4-first DNS resolution so Node fetch() to api.telegram.org never hangs on IPv6 AAAA records
dns.setDefaultResultOrder('ipv4first');

const WEB_APP_URL = process.env.NEXT_PUBLIC_TMA_URL || '';
const DEFAULT_ADMIN_CHAT_ID = process.env.ADMIN_TELEGRAM_CHAT_ID || '';

export interface OrderNotificationPayload {
  id?: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string | null;
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  total: number | string;
  itemCount: number;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

/**
 * Sends real-time push notifications to all Telegram Admins when new web orders are placed.
 */
export async function pushOrderNotification(order: OrderNotificationPayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.log(`[Order Notification] ${order.orderNumber} placed for $${order.total}`);
    return;
  }

  try {
    // Find all admins in Neon PostgreSQL who have a linked telegramId
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        telegramId: { not: null },
      },
      select: { telegramId: true },
    });

    const chatIds = new Set<string>();
    if (DEFAULT_ADMIN_CHAT_ID) {
      for (const id of DEFAULT_ADMIN_CHAT_ID.split(',')) {
        if (id.trim()) chatIds.add(id.trim());
      }
    }

    for (const a of admins) {
      if (a.telegramId) chatIds.add(String(a.telegramId).trim());
    }

    const itemLines =
      order.items && order.items.length > 0
        ? '\n<b>Items Ordered:</b>\n' +
          order.items
            .map(i => `• ${i.quantity}× ${i.name} — <b>$${(i.price * i.quantity).toFixed(2)}</b>`)
            .join('\n') +
          '\n'
        : `🛍️ <b>Items:</b> ${order.itemCount}\n`;

    const addressLine = order.shippingAddress
      ? `📍 <b>Ship To:</b> ${[
          order.shippingAddress.street,
          order.shippingAddress.city,
          order.shippingAddress.country,
        ]
          .filter(Boolean)
          .join(', ')}\n`
      : '';

    const text =
      `🔔 <b>New Order Received!</b>\n\n` +
      `📦 <b>Order ID:</b> <code>${order.orderNumber}</code>\n` +
      `👤 <b>Customer:</b> ${order.customerName}${
        order.customerEmail ? ` (${order.customerEmail})` : ''
      }\n` +
      addressLine +
      itemLines +
      `\n💵 <b>Total Paid:</b> <b>$${Number(order.total).toFixed(2)}</b>\n\n` +
      `Update order status directly below or open the Admin Mini App:`;

    const inlineKeyboard = order.id
      ? [
          [
            { text: '⚙️ Processing', callback_data: `order_status:${order.id}:PROCESSING` },
            { text: '🚚 Shipped', callback_data: `order_status:${order.id}:SHIPPED` },
          ],
          [
            { text: '✅ Delivered', callback_data: `order_status:${order.id}:DELIVERED` },
            { text: '⚡ Open Mini App', web_app: { url: WEB_APP_URL } },
          ],
        ]
      : [[{ text: '⚡ Open Admin Mini App', web_app: { url: WEB_APP_URL } }]];

    await Promise.all(
      [...chatIds].map(async chatId => {
        try {
          const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text,
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: inlineKeyboard },
            }),
          });
          if (!response.ok) {
            const errBody = await response.text();
            console.error(`Telegram API returned ${response.status} for chat ${chatId}:`, errBody);
          } else {
            console.log(`✅ Telegram order alert (${order.orderNumber}) delivered to admin ${chatId}`);
          }
        } catch (e) {
          console.error(`Failed to send Telegram alert to ${chatId}:`, e);
        }
      })
    );
  } catch (err) {
    console.error('Failed to dispatch Telegram push notification:', err);
  }
}

export async function notifyTelegramRoleChange(user: {
  name?: string | null;
  email: string;
  telegramId?: string | null;
  telegramUsername?: string | null;
  role: string;
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !user.telegramId) return;

  try {
    const text =
      user.role === 'ADMIN'
        ? `🛡 <b>Admin Access Granted!</b>\n\nYour account (<b>${user.name || user.email}</b>) has been promoted to <b>ADMIN</b> on PulseStore.\n\nUse /start or tap below to launch the Admin Mini App.`
        : `ℹ️ Your PulseStore account role has been updated to <b>${user.role}</b>.`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: user.telegramId,
        text,
        parse_mode: 'HTML',
        reply_markup:
          user.role === 'ADMIN'
            ? {
                inline_keyboard: [
                  [{ text: '⚡ Open Admin Mini App', web_app: { url: WEB_APP_URL } }],
                ],
              }
            : undefined,
      }),
    });
  } catch (err) {
    console.error('Failed to notify Telegram role change:', err);
  }
}
