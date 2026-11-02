import dns from 'dns';
import { prisma } from '../db/index.js';

// Force IPv4-first DNS resolution so Node fetch() to api.telegram.org never hangs on IPv6 AAAA records
dns.setDefaultResultOrder('ipv4first');

function cleanEnv(val?: string): string {
  return (val || '').trim().replace(/^['"]|['"]$/g, '');
}

const WEB_APP_URL =
  cleanEnv(process.env.NEXT_PUBLIC_TMA_URL) || 'https://app9220334330.tgcloud.ai/';

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

async function getAdminChatIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: {
      role: 'ADMIN',
      telegramId: { not: null },
    },
    select: { telegramId: true },
  });

  const chatIds = new Set<string>();
  const envChatIds = cleanEnv(process.env.ADMIN_TELEGRAM_CHAT_ID);
  if (envChatIds) {
    for (const id of envChatIds.split(',')) {
      if (id.trim()) chatIds.add(id.trim());
    }
  }
  for (const a of admins) {
    if (a.telegramId) chatIds.add(String(a.telegramId).trim());
  }
  return [...chatIds];
}

/**
 * Sends real-time push notifications to all Telegram Admins when new web orders are placed.
 */
export async function pushOrderNotification(order: OrderNotificationPayload): Promise<void> {
  const token = cleanEnv(process.env.TELEGRAM_BOT_TOKEN);

  if (!token) {
    console.log(`[Order Notification] ${order.orderNumber} placed for $${order.total} (No TELEGRAM_BOT_TOKEN set)`);
    return;
  }

  try {
    const chatIds = await getAdminChatIds();

    if (chatIds.length === 0) {
      console.log(`[Order Notification] ${order.orderNumber} placed, but no admin telegram_id found.`);
      return;
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
      chatIds.map(async chatId => {
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

/**
 * Notifies customer/admin on Telegram when an order's fulfillment status changes.
 */
export async function pushOrderStatusNotification(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
}): Promise<void> {
  const token = cleanEnv(process.env.TELEGRAM_BOT_TOKEN);
  if (!token) return;

  try {
    const customer = await prisma.user.findUnique({
      where: { email: order.customerEmail.toLowerCase() },
      select: { telegramId: true },
    });

    const chatIds = new Set<string>(await getAdminChatIds());
    if (customer?.telegramId) {
      chatIds.add(String(customer.telegramId).trim());
    }

    const statusEmoji =
      order.status === 'DELIVERED'
        ? '✅'
        : order.status === 'SHIPPED'
        ? '🚚'
        : order.status === 'PROCESSING'
        ? '⚙️'
        : '📦';

    const text =
      `${statusEmoji} <b>Order Status Update</b>\n\n` +
      `📦 <b>Order:</b> <code>${order.orderNumber}</code>\n` +
      `👤 <b>Customer:</b> ${order.customerName}\n` +
      `💵 <b>Total:</b> $${Number(order.total).toFixed(2)}\n` +
      `📍 <b>Current Stage:</b> <b>${order.status}</b>`;

    await Promise.all(
      [...chatIds].map(chatId =>
        fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
          }),
        }).catch(() => {})
      )
    );
  } catch (err) {
    console.error('Failed to send Telegram status update:', err);
  }
}

export async function notifyTelegramRoleChange(user: {
  name?: string | null;
  email: string;
  telegramId?: string | null;
  telegramUsername?: string | null;
  role: string;
}): Promise<void> {
  const token = cleanEnv(process.env.TELEGRAM_BOT_TOKEN);
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
