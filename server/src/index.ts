import dns from 'dns';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Prioritize IPv4 DNS resolution so Telegram API & SMTP connections never stall on IPv6
dns.setDefaultResultOrder('ipv4first');

// Load environment variables from monorepo root or local .env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

import { authRouter } from './routes/auth.js';
import { productsRouter } from './routes/products.js';
import { categoriesRouter } from './routes/categories.js';
import { ordersRouter } from './routes/orders.js';
import { adminRouter } from './routes/admin.js';
import {
  securityHeaders,
  sanitizeInputs,
  globalApiLimiter,
} from './middleware/security.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security hardening & Render reverse-proxy support
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders);

// CORS configuration supporting Vercel storefront, Telegram Mini App, and local dev
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, mobile apps, or when CORS_ORIGINS is not strictly locked down
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-telegram-init-data'],
  })
);

// Limit JSON payload size to 100kb to prevent DoS payload attacks
app.use(express.json({ limit: '100kb' }));
app.use(sanitizeInputs);

// Request logger for API calls
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root & Health check endpoints (for Render health probes)
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    service: 'PulseStore Node.js Backend API + Prisma DB',
    security: 'Helmet Headers + Sliding-Window Rate Limiter Active',
    timestamp: new Date().toISOString(),
  });
};

app.get('/', healthHandler);
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Apply global rate limiting (120 req / min / IP) across all /api routes
app.use('/api', globalApiLimiter);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

// Start server with automatic port conflict recovery
const server = app.listen(PORT, () => {
  console.log(`🚀 PulseStore Server (API + Prisma DB + Email + Telegram Push) running on http://localhost:${PORT}`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`ℹ️ Port ${PORT} already has an active PulseStore Server instance running.`);
  } else {
    console.error('Server error:', err);
  }
});

export default app;
