import { api, fetch } from 'sdk';

import { NEON_DATABASE_URL, NEON_HTTP_URL, WEB_APP_URL } from '../lib/config.js';

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

async function ensureAndCheckAdmin(from) {
  const tgId = String(from?.id || '');
  const username = (from?.username || '').trim().toLowerCase();
  const firstName = from?.first_name || username || 'Admin';

  // Check if user exists by telegram_id or telegram_username
  const check = await queryNeon(
    `SELECT id, role FROM users WHERE telegram_id = $1 OR ($2 <> '' AND LOWER(telegram_username) = $2) LIMIT 1`,
    [tgId, username]
  );

  if (check.rows.length > 0) {
    const u = check.rows[0];
    await queryNeon(`UPDATE users SET telegram_id = $1, updated_at = NOW() WHERE id = $2`, [
      tgId,
      u.id,
    ]);
    return u.role === 'ADMIN';
  }

  // Register visitor as CUSTOMER so store admins can see and promote them in Users list!
  const newId = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const placeholderEmail = `${username || tgId}@telegram.local`;
  await queryNeon(
    `INSERT INTO users (id, email, name, role, telegram_id, telegram_username, created_at, updated_at)
     VALUES ($1, $2, $3, 'CUSTOMER', $4, $5, NOW(), NOW())
     ON CONFLICT (email) DO NOTHING`,
    [newId, placeholderEmail, firstName, tgId, username || null]
  );

  // If no admin has a telegram_id yet, allow the first operator to act as admin
  const anyAdmin = await queryNeon(`SELECT COUNT(*) AS cnt FROM users WHERE role = 'ADMIN'`);
  return Number(anyAdmin.rows[0]?.cnt ?? 0) === 0;
}

export default async function (message, _ctx) {
  const text = (message.text || '').trim();
  const chatId = message.chat.id;
  const from = message.from || {};
  const firstName = from.first_name || from.username || 'Operator';

  try {
    const isAdmin = await ensureAndCheckAdmin(from);

    if (!isAdmin) {
      await api.sendMessage({
        chat_id: chatId,
        text:
          `🔒 <b>PulseStore Admin Terminal</b>\n\n` +
          `Hello <b>${firstName}</b>, your Telegram account (<code>@${
            from.username || from.id
          }</code>) has been registered.\n\n` +
          `This bot is restricted to store administrators. Ask a store administrator to grant you Admin privileges in the Admin Mini App or via <code>/makeadmin @${
            from.username || ''
          }</code>.`,
        parse_mode: 'HTML',
      });
      return;
    }

    // /makeadmin @username or email
    if (text.startsWith('/makeadmin')) {
      const target = text.replace('/makeadmin', '').trim().replace(/^@/, '').toLowerCase();
      if (!target) {
        await api.sendMessage({
          chat_id: chatId,
          text: `Usage: <code>/makeadmin @username</code> or <code>/makeadmin user@email.com</code>`,
          parse_mode: 'HTML',
        });
        return;
      }

      const updated = await queryNeon(
        `UPDATE users SET role = 'ADMIN', updated_at = NOW() WHERE LOWER(telegram_username) = $1 OR LOWER(email) = $1 RETURNING email, telegram_username`,
        [target]
      );

      if (updated.rows.length === 0) {
        const newId = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const email = target.includes('@') ? target : `${target}@telegram.local`;
        const tgUser = target.includes('@') ? null : target;
        await queryNeon(
          `INSERT INTO users (id, email, name, role, telegram_username, created_at, updated_at)
           VALUES ($1, $2, $3, 'ADMIN', $4, NOW(), NOW())`,
          [newId, email, target, tgUser]
        );
      }

      await api.sendMessage({
        chat_id: chatId,
        text: `✅ <b>Admin Promoted!</b>\n<code>${target}</code> now has full PulseStore Admin permissions in both the Bot and Mini App.`,
        parse_mode: 'HTML',
        reply_markup: mainMenuKeyboard(),
      });
      return;
    }

    if (text.startsWith('/start') || text === '/admin') {
      try {
        await api.setChatMenuButton({
          chat_id: chatId,
          menu_button: {
            type: 'web_app',
            text: '⚡ Admin App',
            web_app: { url: WEB_APP_URL },
          },
        });
      } catch {
        // ignore if unsupported
      }

      await api.sendMessage({
        chat_id: chatId,
        text:
          `🛡 <b>PulseStore Admin Operations</b>\n` +
          `Operator: <b>${firstName}</b> ${from.username ? `(@${from.username})` : ''} · <b>ADMIN</b>\n\n` +
          `Connected live to Neon PostgreSQL & Web Storefront.\n\n` +
          `<b>Quick Commands:</b>\n` +
          `📊 <code>/stats</code> — Live revenue & order metrics\n` +
          `⏳ <code>/pending</code> — Fulfill pending customer orders\n` +
          `👥 <code>/users</code> — View users & promote/revoke Admins\n` +
          `🛡 <code>/makeadmin @user</code> — Promote user to Admin\n\n` +
          `Select an operation below or launch the synchronized Admin Mini App:`,
        parse_mode: 'HTML',
        reply_markup: mainMenuKeyboard(),
      });
      return;
    }

    if (text === '/stats') {
      const [revRes, ordRes, pendRes, userRes, todayRes] = await Promise.all([
        queryNeon(`SELECT COALESCE(SUM(total), 0) AS total_revenue FROM orders`),
        queryNeon(`SELECT COUNT(*) AS total_orders FROM orders`),
        queryNeon(`SELECT COUNT(*) AS pending_count FROM orders WHERE status = 'PENDING'`),
        queryNeon(`SELECT COUNT(*) AS user_count FROM users`),
        queryNeon(
          `SELECT COALESCE(SUM(total), 0) AS today_revenue, COUNT(*) AS today_orders FROM orders WHERE created_at >= CURRENT_DATE`
        ),
      ]);

      await api.sendMessage({
        chat_id: chatId,
        text:
          `📊 <b>PulseStore Live Telemetry</b>\n\n` +
          `💰 <b>Total Revenue:</b> $${Number(revRes.rows[0].total_revenue).toFixed(2)}\n` +
          `📦 <b>Total Orders:</b> ${ordRes.rows[0].total_orders}\n` +
          `⏳ <b>Pending Fulfillment:</b> ${pendRes.rows[0].pending_count}\n` +
          `👥 <b>Registered Users:</b> ${userRes.rows[0].user_count}\n\n` +
          `📅 <b>Today's Volume:</b> $${Number(todayRes.rows[0].today_revenue).toFixed(2)} (${
            todayRes.rows[0].today_orders
          } orders)`,
        parse_mode: 'HTML',
        reply_markup: mainMenuKeyboard(),
      });
      return;
    }

    if (text === '/pending') {
      const result = await queryNeon(
        `SELECT id, order_number, customer_name, total, status, created_at FROM orders WHERE status IN ('PENDING', 'PROCESSING') ORDER BY created_at DESC LIMIT 8`
      );

      if (result.rows.length === 0) {
        await api.sendMessage({
          chat_id: chatId,
          text: `✅ <b>All caught up!</b> Zero pending orders awaiting fulfillment.`,
          parse_mode: 'HTML',
          reply_markup: mainMenuKeyboard(),
        });
        return;
      }

      const lines = result.rows.map((o, idx) => {
        return `${idx + 1}. <code>${o.order_number}</code> [${o.status}]\n   👤 ${
          o.customer_name
        } · 💵 <b>$${Number(o.total).toFixed(2)}</b>`;
      });

      const orderButtons = result.rows.slice(0, 4).map(o => [
        {
          text: `🚚 Ship ${o.order_number}`,
          callback_data: `order_status:${o.id}:SHIPPED`,
        },
        {
          text: `✅ Deliver ${o.order_number}`,
          callback_data: `order_status:${o.id}:DELIVERED`,
        },
      ]);

      await api.sendMessage({
        chat_id: chatId,
        text: `⏳ <b>Active Fulfillment Queue (${result.rows.length})</b>\n\n${lines.join(
          '\n\n'
        )}\n\nTap a button below to update status in real time:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            ...orderButtons,
            [{ text: '⚡ Open Admin Mini App', web_app: { url: WEB_APP_URL } }],
          ],
        },
      });
      return;
    }

    if (text === '/users') {
      const usersRes = await queryNeon(
        `SELECT id, name, email, role, telegram_username FROM users ORDER BY role DESC, created_at DESC LIMIT 10`
      );

      const lines = usersRes.rows.map((u, idx) => {
        const badge = u.role === 'ADMIN' ? '🛡 ADMIN' : '👤 USER';
        const tg = u.telegram_username ? ` (@${u.telegram_username})` : '';
        return `${idx + 1}. <b>${u.name || u.email.split('@')[0]}</b>${tg} — <code>${badge}</code>\n   ✉️ ${u.email}`;
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
        text:
          `👥 <b>Registered Users & Admins (${usersRes.rows.length})</b>\n\n` +
          `${lines.join('\n\n')}\n\n` +
          `Tap below to toggle Admin access or open the Users tab in the Mini App:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            ...userButtons,
            [{ text: '⚡ Open Users in Mini App', web_app: { url: WEB_APP_URL } }],
          ],
        },
      });
      return;
    }

    // Default response with interactive buttons
    await api.sendMessage({
      chat_id: chatId,
      text: `🛡 <b>PulseStore Admin Command Center</b>\nSelect an action below:`,
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboard(),
    });
  } catch (err) {
    await api.sendMessage({
      chat_id: chatId,
      text: `❌ Error: ${err.message}`,
    });
  }
}
