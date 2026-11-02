import type { StatsDTO, ProductDTO, OrderDTO, UserDTO, OrderStatus, Role } from '../types';

const NEON_DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL || '';
const NEON_HTTP_URL = import.meta.env.VITE_NEON_HTTP_URL || '';

/**
 * Executes parameterized SQL directly against Neon's HTTPS SQL driver.
 * IMPORTANT: Do NOT include 'Content-Type: application/json' because Neon's CORS
 * Access-Control-Allow-Headers only permits 'Neon-Connection-String' and 'Authorization'.
 * Omitting Content-Type uses 'text/plain;charset=UTF-8' which is a CORS-safelisted header!
 */
async function queryNeon(sql: string, params: any[] = []): Promise<any[]> {
  const res = await fetch(NEON_HTTP_URL, {
    method: 'POST',
    headers: {
      'Neon-Connection-String': NEON_DATABASE_URL,
    },
    body: JSON.stringify({ query: sql, params }),
  });
  if (!res.ok) {
    throw new Error(`Neon SQL Error: ${await res.text()}`);
  }
  const json = await res.json();
  return json.rows || [];
}

function generateId(): string {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ─── Unified Admin API Functions (Connected directly to Neon PostgreSQL) ─────

export async function fetchAdminStats(): Promise<StatsDTO> {
  const [revRows, ordRows, pendRows, prodRows, userRows, todayRows, recentRows, sevenDayRows] =
    await Promise.all([
      queryNeon(`SELECT COALESCE(SUM(total), 0) AS total_revenue FROM orders`),
      queryNeon(`SELECT COUNT(*) AS total_orders FROM orders`),
      queryNeon(`SELECT COUNT(*) AS pending_orders FROM orders WHERE status = 'PENDING'`),
      queryNeon(`SELECT COUNT(*) AS total_products FROM products WHERE is_active = true`),
      queryNeon(`SELECT COUNT(*) AS total_users FROM users`),
      queryNeon(
        `SELECT COALESCE(SUM(total), 0) AS revenue_today, COUNT(*) AS orders_today FROM orders WHERE created_at >= CURRENT_DATE`
      ),
      queryNeon(
        `SELECT id, order_number, status, total, customer_name, customer_email, customer_phone, shipping_address, notes, created_at, updated_at FROM orders ORDER BY created_at DESC LIMIT 5`
      ),
      queryNeon(
        `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS day, COALESCE(SUM(total), 0) AS rev, COUNT(*) AS cnt FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '6 days' GROUP BY day ORDER BY day ASC`
      ),
    ]);

  const now = new Date();
  const dailyMap: Record<string, { revenue: number; orders: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dailyMap[d.toISOString().split('T')[0]] = { revenue: 0, orders: 0 };
  }
  for (const r of sevenDayRows) {
    if (dailyMap[r.day]) {
      dailyMap[r.day] = { revenue: Number(r.rev), orders: Number(r.cnt) };
    }
  }

  const recentOrders: OrderDTO[] = recentRows.map(o => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    total: Number(o.total),
    customerName: o.customer_name,
    customerEmail: o.customer_email,
    customerPhone: o.customer_phone,
    shippingAddress:
      typeof o.shipping_address === 'string'
        ? JSON.parse(o.shipping_address)
        : o.shipping_address,
    notes: o.notes,
    items: [],
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  }));

  return {
    totalRevenue: Number(revRows[0]?.total_revenue ?? 0),
    totalOrders: Number(ordRows[0]?.total_orders ?? 0),
    pendingOrders: Number(pendRows[0]?.pending_orders ?? 0),
    totalProducts: Number(prodRows[0]?.total_products ?? 0),
    totalUsers: Number(userRows[0]?.total_users ?? 0),
    revenueToday: Number(todayRows[0]?.revenue_today ?? 0),
    ordersToday: Number(todayRows[0]?.orders_today ?? 0),
    recentOrders,
    dailyRevenue: Object.entries(dailyMap).map(([date, v]) => ({ date, ...v })),
  };
}

export async function fetchAdminProducts(): Promise<ProductDTO[]> {
  const rows = await queryNeon(
    `SELECT id, name, slug, description, price, stock, image_url, is_active, category_id, created_at, updated_at FROM products ORDER BY created_at DESC`
  );
  return rows.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: Number(p.price),
    stock: Number(p.stock),
    imageUrl: p.image_url,
    images: p.image_url ? [p.image_url] : [],
    isActive: Boolean(p.is_active),
    categoryId: p.category_id,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));
}

export async function createAdminProduct(payload: {
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  categoryId?: string | null;
}): Promise<void> {
  const id = generateId();
  const slug =
    payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  await queryNeon(
    `INSERT INTO products (id, name, slug, description, price, stock, image_url, images, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, ARRAY[$7]::text[], $8, NOW(), NOW())`,
    [
      id,
      payload.name,
      slug,
      payload.description,
      payload.price,
      payload.stock,
      payload.imageUrl || '',
      payload.isActive,
    ]
  );
}

export async function updateAdminProduct(
  id: string,
  payload: Partial<{
    name: string;
    description: string | null;
    price: number;
    stock: number;
    imageUrl: string | null;
    isActive: boolean;
  }>
): Promise<void> {
  if (Object.keys(payload).length === 1 && payload.isActive !== undefined) {
    await queryNeon(`UPDATE products SET is_active = $1, updated_at = NOW() WHERE id = $2`, [
      payload.isActive,
      id,
    ]);
    return;
  }

  await queryNeon(
    `UPDATE products SET name = COALESCE($1, name), description = $2, price = COALESCE($3, price), stock = COALESCE($4, stock), image_url = $5, is_active = COALESCE($6, is_active), updated_at = NOW() WHERE id = $7`,
    [
      payload.name,
      payload.description ?? null,
      payload.price,
      payload.stock,
      payload.imageUrl ?? null,
      payload.isActive,
      id,
    ]
  );
}

export async function fetchAdminOrders(statusFilter = ''): Promise<OrderDTO[]> {
  const orderRows = statusFilter
    ? await queryNeon(
        `SELECT id, order_number, status, total, customer_name, customer_email, customer_phone, shipping_address, notes, created_at, updated_at FROM orders WHERE status = $1 ORDER BY created_at DESC LIMIT 30`,
        [statusFilter]
      )
    : await queryNeon(
        `SELECT id, order_number, status, total, customer_name, customer_email, customer_phone, shipping_address, notes, created_at, updated_at FROM orders ORDER BY created_at DESC LIMIT 30`
      );

  const itemRows = await queryNeon(
    `SELECT oi.id, oi.order_id, oi.quantity, oi.price, p.id AS prod_id, p.name AS prod_name, p.image_url AS prod_img
     FROM order_items oi JOIN products p ON p.id = oi.product_id`
  );

  return orderRows.map(o => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status as OrderStatus,
    total: Number(o.total),
    customerName: o.customer_name,
    customerEmail: o.customer_email,
    customerPhone: o.customer_phone,
    shippingAddress:
      typeof o.shipping_address === 'string'
        ? JSON.parse(o.shipping_address)
        : o.shipping_address,
    notes: o.notes,
    items: itemRows
      .filter(i => i.order_id === o.id)
      .map(i => ({
        id: i.id,
        quantity: Number(i.quantity),
        price: Number(i.price),
        product: {
          id: i.prod_id,
          name: i.prod_name,
          price: Number(i.price),
          imageUrl: i.prod_img,
        },
      })),
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  }));
}

export async function updateAdminOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await queryNeon(`UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id]);
  // Also notify backend API to dispatch customer email & Telegram status alerts
  fetch(`https://puls-store.onrender.com/api/admin/orders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': 'dev-bypass',
    },
    body: JSON.stringify({ status }),
  }).catch(() => {});
}

export async function fetchAdminUsers(): Promise<UserDTO[]> {
  const rows = await queryNeon(
    `SELECT u.id, u.email, u.name, u.role, u.telegram_id, u.telegram_username, u.created_at,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id OR o.customer_email = u.email) AS order_count
     FROM users u
     ORDER BY u.role DESC, u.created_at DESC`
  );

  return rows.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as Role,
    telegramId: u.telegram_id,
    telegramUsername: u.telegram_username,
    orderCount: Number(u.order_count ?? 0),
    createdAt: u.created_at,
  }));
}

export async function updateAdminUserRole(
  id: string,
  role: Role,
  telegramUsername?: string
): Promise<void> {
  if (telegramUsername !== undefined) {
    const cleanTg = telegramUsername.trim().replace(/^@/, '').toLowerCase() || null;
    await queryNeon(
      `UPDATE users SET role = $1, telegram_username = $2, updated_at = NOW() WHERE id = $3`,
      [role, cleanTg, id]
    );
  } else {
    await queryNeon(`UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2`, [role, id]);
  }
}

export async function createOrPromoteAdminUser(payload: {
  name?: string;
  email?: string;
  telegramUsername?: string;
  role: Role;
}): Promise<void> {
  const cleanTg = payload.telegramUsername
    ? payload.telegramUsername.trim().replace(/^@/, '').toLowerCase()
    : null;
  const cleanEmail = payload.email
    ? payload.email.trim().toLowerCase()
    : cleanTg
    ? `${cleanTg}@telegram.local`
    : null;

  if (!cleanEmail) throw new Error('Email or Telegram username required');

  const id = generateId();
  await queryNeon(
    `INSERT INTO users (id, email, name, role, telegram_username, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET
       role = EXCLUDED.role,
       telegram_username = COALESCE(EXCLUDED.telegram_username, users.telegram_username),
       name = COALESCE(EXCLUDED.name, users.name),
       updated_at = NOW()`,
    [id, cleanEmail, payload.name || cleanTg || cleanEmail.split('@')[0], payload.role, cleanTg]
  );
}
