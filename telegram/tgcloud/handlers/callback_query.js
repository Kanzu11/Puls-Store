import { api, fetch } from 'sdk';

const NEON_DATABASE_URL = globalThis.process?.env?.DATABASE_URL || '';
const NEON_HTTP_URL = globalThis.process?.env?.NEON_HTTP_URL || '';
const WEB_APP_URL = globalThis.process?.env?.NEXT_PUBLIC_TMA_URL || '';

async function queryNeon(sql, params = []) {
  const res = await fetch(NEON_HTTP_URL, {
    method: 'POST',
    headers: {
      'Neon-Connection-String': NEON_DATABASE_URL,
    },
    body: JSON.stringify({ query: sql, params }),
  });
  if (!res.ok) throw new Error(`Neon DB error: ${await res.text()}`);
  return res.json();
}

function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '⚡ Open Admin Mini App', web_app: { url: WEB_APP_URL } }],
      [
        { text: '📊 Store Stats', callback_data: 'menu:stats' },
        { text: '⏳ Pending Orders', callback_data: 'menu:pending' },
      ],
      [
        { text: '👥 Manage Users & Admins', callback_data: 'menu:users' },
        { text: '📦 Inventory Stock', callback_data: 'menu:products' },
      ],
    ],
  };
}

export default async function (callbackQuery, _ctx) {
  const data = callbackQuery.data || '';
  const chatId = callbackQuery.message?.chat?.id;
  const queryId = callbackQuery.id;

  try {
    // 1. Handle user role promotion / demotion button click
    if (data.startsWith('user_role:')) {
      const [, userId, newRole] = data.split(':');
      const updated = await queryNeon(
        `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING name, email, role, telegram_username`,
        [newRole, userId]
      );

      const u = updated.rows[0];
      await api.answerCallbackQuery({
        callback_query_id: queryId,
        text: u ? `${u.name || u.email} is now ${u.role}` : 'Role updated!',
      });

      if (chatId && u) {
        await api.sendMessage({
          chat_id: chatId,
          text:
            `✅ <b>User Role Updated</b>\n` +
            `👤 <b>${u.name || u.email}</b> ${
              u.telegram_username ? `(@${u.telegram_username})` : ''
            }\n` +
            `🛡 New Role: <code>${u.role}</code>`,
          parse_mode: 'HTML',
          reply_markup: mainMenuKeyboard(),
        });
      }
      return;
    }

    // 2. Handle order fulfillment status button click
    if (data.startsWith('order_status:')) {
      const [, orderId, newStatus] = data.split(':');
      const updated = await queryNeon(
        `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING order_number, customer_name, status, total`,
        [newStatus, orderId]
      );

      const o = updated.rows[0];
      await api.answerCallbackQuery({
        callback_query_id: queryId,
        text: o ? `Order ${o.order_number} -> ${o.status}` : 'Order updated!',
      });

      if (chatId && o) {
        await api.sendMessage({
          chat_id: chatId,
          text:
            `📦 <b>Order Status Updated</b>\n` +
            `Order: <code>${o.order_number}</code>\n` +
            `Customer: ${o.customer_name}\n` +
            `New Stage: <b>${o.status}</b>`,
          parse_mode: 'HTML',
          reply_markup: mainMenuKeyboard(),
        });
      }
      return;
    }

    // 3. Handle Menu navigation callbacks
    if (data === 'menu:stats' && chatId) {
      await api.answerCallbackQuery({ callback_query_id: queryId });
      const [revRes, ordRes, pendRes, userRes] = await Promise.all([
        queryNeon(`SELECT COALESCE(SUM(total), 0) AS total_revenue FROM orders`),
        queryNeon(`SELECT COUNT(*) AS total_orders FROM orders`),
        queryNeon(`SELECT COUNT(*) AS pending_count FROM orders WHERE status = 'PENDING'`),
        queryNeon(`SELECT COUNT(*) AS user_count FROM users`),
      ]);

      await api.sendMessage({
        chat_id: chatId,
        text:
          `📊 <b>PulseStore Live Telemetry</b>\n\n` +
          `💰 <b>Total Revenue:</b> $${Number(revRes.rows[0].total_revenue).toFixed(2)}\n` +
          `📦 <b>Total Orders:</b> ${ordRes.rows[0].total_orders}\n` +
          `⏳ <b>Pending Orders:</b> ${pendRes.rows[0].pending_count}\n` +
          `👥 <b>Registered Users:</b> ${userRes.rows[0].user_count}`,
        parse_mode: 'HTML',
        reply_markup: mainMenuKeyboard(),
      });
      return;
    }

    if (data === 'menu:pending' && chatId) {
      await api.answerCallbackQuery({ callback_query_id: queryId });
      const result = await queryNeon(
        `SELECT id, order_number, customer_name, total, status FROM orders WHERE status IN ('PENDING', 'PROCESSING') ORDER BY created_at DESC LIMIT 6`
      );

      if (result.rows.length === 0) {
        await api.sendMessage({
          chat_id: chatId,
          text: `✅ <b>All caught up!</b> No pending orders require action.`,
          parse_mode: 'HTML',
          reply_markup: mainMenuKeyboard(),
        });
        return;
      }

      const lines = result.rows.map(
        (o, idx) =>
          `${idx + 1}. <code>${o.order_number}</code> [${o.status}] — ${
            o.customer_name
          } ($${Number(o.total).toFixed(2)})`
      );

      const buttons = result.rows.slice(0, 4).map(o => [
        { text: `🚚 Ship ${o.order_number}`, callback_data: `order_status:${o.id}:SHIPPED` },
        { text: `✅ Deliver ${o.order_number}`, callback_data: `order_status:${o.id}:DELIVERED` },
      ]);

      await api.sendMessage({
        chat_id: chatId,
        text: `⏳ <b>Fulfillment Queue</b>\n\n${lines.join('\n')}`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            ...buttons,
            [{ text: '⚡ Open Mini App', web_app: { url: WEB_APP_URL } }],
          ],
        },
      });
      return;
    }

    if (data === 'menu:users' && chatId) {
      await api.answerCallbackQuery({ callback_query_id: queryId });
      const usersRes = await queryNeon(
        `SELECT id, name, email, role, telegram_username FROM users ORDER BY role DESC, created_at DESC LIMIT 10`
      );

      const lines = usersRes.rows.map((u, idx) => {
        const badge = u.role === 'ADMIN' ? '🛡 ADMIN' : '👤 USER';
        const tg = u.telegram_username ? ` (@${u.telegram_username})` : '';
        return `${idx + 1}. <b>${u.name || u.email.split('@')[0]}</b>${tg} — <code>${badge}</code>`;
      });

      const userButtons = usersRes.rows
        .slice(0, 5)
        .map(u => [
          {
            text:
              u.role === 'ADMIN'
                ? `Revoke Admin: ${u.name || u.email.split('@')[0]}`
                : `🛡 Make Admin: ${u.name || u.email.split('@')[0]}`,
            callback_data:
              u.role === 'ADMIN' ? `user_role:${u.id}:CUSTOMER` : `user_role:${u.id}:ADMIN`,
          },
        ]);

      await api.sendMessage({
        chat_id: chatId,
        text: `👥 <b>Registered Users & Admins</b>\n\n${lines.join('\n')}\n\nTap a user below to toggle Admin privileges:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            ...userButtons,
            [{ text: '⚡ Manage Users in Mini App', web_app: { url: WEB_APP_URL } }],
          ],
        },
      });
      return;
    }

    if (data === 'menu:products' && chatId) {
      await api.answerCallbackQuery({ callback_query_id: queryId });
      const prodRes = await queryNeon(
        `SELECT name, price, stock, is_active FROM products ORDER BY created_at DESC LIMIT 10`
      );

      const lines = prodRes.rows.map(
        (p, idx) =>
          `${idx + 1}. <b>${p.name}</b> — $${Number(p.price).toFixed(2)} · <code>${
            p.stock
          } in stock</code> ${p.is_active ? '🟢' : '⚪'}`
      );

      await api.sendMessage({
        chat_id: chatId,
        text: `📦 <b>Catalog Inventory</b>\n\n${lines.join('\n')}`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⚡ Edit Stock & Add Products in Mini App', web_app: { url: WEB_APP_URL } }],
          ],
        },
      });
      return;
    }

    await api.answerCallbackQuery({ callback_query_id: queryId });
  } catch (err) {
    await api.answerCallbackQuery({
      callback_query_id: queryId,
      text: `Error: ${err.message}`,
    });
  }
}
