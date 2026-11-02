# PulseStore

Full-stack e-commerce storefront and real-time Telegram operations suite built with **React**, **TypeScript**, **Node.js**, **Express**, **Prisma**, **PostgreSQL**, and **Telegram Mini Apps**.

---

## Interface Preview

### Web Storefront

| Landing Experience | Product Catalog |
| :---: | :---: |
| ![Web Storefront Landing Page](docs/screenshots/web-landing.png) | ![Web Storefront Catalog](docs/screenshots/web-catalog.png) |

### Telegram Admin Mini App & Bot

| Store Telemetry & Analytics | Inventory & Catalog Control | Telegram Bot Command Center |
| :---: | :---: | :---: |
| ![Telegram Mini App Overview](docs/screenshots/tma-overview.jpg) | ![Telegram Mini App Catalog](docs/screenshots/tma-catalog.jpg) | ![Telegram Bot Live Telemetry](docs/screenshots/telegram-bot.jpg) |

---

## System Architecture

The repository is structured as three decoupled workspaces:

```text
pulse-store/
├── client/                     # Customer Web Storefront (React 18, TypeScript, Vite, Tailwind CSS)
│   ├── src/
│   │   ├── app/                # Storefront routes: Landing, Catalog, Product Detail, Checkout, Orders, Account
│   │   ├── components/         # Navbar, CartDrawer, AuthModal, Toaster, ProductCard, Footer
│   │   ├── store/              # Zustand state management (Auth, Cart, Notifications)
│   │   └── lib/                # Axios HTTP client & SPA router
│   └── vercel.json             # SPA routing configuration
│
├── server/                     # REST API, Database ORM, Transactional Email & Telegram Dispatch
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL schema (User, Category, Product, Order, OrderItem)
│   │   └── seed.ts             # Database seeder
│   └── src/
│       ├── index.ts            # Express application entry point & middleware pipeline
│       ├── middleware/
│       │   ├── auth.ts         # JWT authentication & Telegram WebApp HMAC-SHA256 validation
│       │   └── security.ts     # Sliding-window rate limiters, HTTP security headers & input sanitization
│       ├── routes/             # /api/auth, /api/products, /api/categories, /api/orders, /api/admin
│       └── services/
│           ├── email.ts        # Nodemailer SMTP service (welcome, order confirmation, fulfillment updates)
│           └── telegramBot.ts  # Real-time Telegram order notifications & inline fulfillment actions
│
└── telegram/                   # Telegram Serverless Bot & Admin Mini App
    ├── tgcloud/handlers/       # Bot command & callback query handlers (message.js, callback_query.js)
    └── src/                    # Admin Mini App UI (Overview, Orders, Catalog, Role Management)
```

---

## Core Capabilities

- **Customer Storefront (`client/`)**
  - Responsive industrial UI with instant product search, category filtering, sorting, and slide-over shopping bag.
  - JWT authentication (`bcryptjs` + `jsonwebtoken`) with protected checkout flow and automatic session redirection.
  - Real-time order tracking by order reference (`#PS-...`) and customer order history dashboard.

- **Telegram Admin Mini App & Bot (`telegram/`)**
  - **Live Telemetry**: Real-time revenue, order volume, pending fulfillment queue, registered user metrics, and 7-day revenue charts.
  - **Order Fulfillment**: Filter orders by status and transition orders through `PENDING`, `PROCESSING`, `SHIPPED`, and `DELIVERED` from either the Mini App or inline Telegram bot buttons.
  - **Catalog & Stock Control**: Create products, edit pricing and descriptions, toggle catalog visibility, and adjust stock levels in real time.
  - **Role-Based Access Control**: View registered users and promote or revoke `ADMIN` privileges across the platform.

- **Security & Reliability (`server/`)**
  - **Sliding-Window IP Rate Limiting**: Dedicated rate limiters for global API traffic (`120 req/min`), authentication endpoints (`15 req/15m`), and order creation (`20 req/15m`) with standard `RateLimit-*` headers.
  - **Server-Side Price Integrity**: Checkout totals and line items are computed strictly from authoritative PostgreSQL product records inside atomic Prisma transactions (`$transaction`) with automatic stock decrementing.
  - **HTTP Hardening**: Enforces `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, payload size caps (`100kb`), and recursive prototype-pollution sanitization.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend (`client/`)** | React 18, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, Lucide Icons |
| **Backend (`server/`)** | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (Neon), JSON Web Tokens, Nodemailer |
| **Telegram (`telegram/`)** | Telegram Mini Apps SDK, React 18, Recharts, Telegram Serverless (`@tgcloud/cli`) |

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://user:password@hostname/dbname?sslmode=require"
PORT=5000
JWT_SECRET="your_jwt_secret"

TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
ADMIN_TELEGRAM_CHAT_ID="your_telegram_chat_id"
NEXT_PUBLIC_TMA_URL="https://your-mini-app.tgcloud.ai/"

EMAIL_SERVICE="gmail"
EMAIL_USER="your_email@example.com"
EMAIL_PASS="your_smtp_app_password"
```

### 3. Initialize Database

```bash
npm run db:push
npm run db:seed
```

### 4. Start Development Servers

```bash
npm run dev
```

- **Web Storefront**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Run `server` and `client` concurrently in development mode |
| `npm run build` | Build production bundles for `server`, `client`, and `telegram` |
| `npm run db:push` | Sync Prisma schema with PostgreSQL |
| `npm run db:seed` | Seed initial categories, products, and sample records |
| `npm run telegram:deploy` | Build and deploy the Telegram Bot and Mini App |
