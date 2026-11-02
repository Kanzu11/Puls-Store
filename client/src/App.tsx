import React from 'react';
import { Shield } from 'lucide-react';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';
import { CartDrawer } from '@/components/CartDrawer';
import { AuthModal } from '@/components/AuthModal';
import { Toaster } from '@/components/Toaster';
import { RouterProvider, useRouter, Link } from '@/lib/router';
import HomePage from '@/app/page';
import ProductsPage from '@/app/products/page';
import ProductPage from '@/app/products/[slug]/page';
import CheckoutPage from '@/app/checkout/page';
import OrdersPage from '@/app/orders/page';
import AccountPage from '@/app/account/page';
import { AuthPage } from '@/app/signup/page';

function PageView() {
  const { pathname } = useRouter();

  if (pathname === '/' || pathname === '') {
    return <HomePage />;
  }
  if (pathname === '/signup') {
    return <AuthPage defaultMode="signup" />;
  }
  if (pathname === '/login') {
    return <AuthPage defaultMode="login" />;
  }
  if (pathname === '/products') {
    return <ProductsPage />;
  }
  if (pathname.startsWith('/products/')) {
    const slug = pathname.replace('/products/', '').split('/')[0];
    return <ProductPage params={{ slug }} />;
  }
  if (pathname === '/checkout') {
    return <CheckoutPage />;
  }
  if (pathname === '/orders') {
    return <OrdersPage />;
  }
  if (pathname === '/account') {
    return <AccountPage />;
  }

  return <HomePage />;
}

export default function App() {
  return (
    <RouterProvider>
      <Providers>
        <div className="min-h-screen flex flex-col bg-white text-zinc-950 antialiased selection:bg-[#ea580c] selection:text-white">
          <Navbar />
          <CartDrawer />
          <AuthModal />
          <Toaster />
          <main className="flex-1">
            <PageView />
          </main>

          <footer className="border-t border-zinc-200 bg-[#f7f6f2] mt-20">
            <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-7 h-7 bg-[#ea580c] text-white rounded-lg flex items-center justify-center font-bold text-xs">
                    PS
                  </span>
                  <span className="font-bold text-base tracking-tight text-zinc-950">
                    PulseStore
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed max-w-sm">
                  Precision hardware, studio audio equipment, and workspace essentials designed for longevity, repairability, and tactile clarity.
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#ea580c] mb-4">
                  Shop
                </p>
                <ul className="space-y-2.5 text-xs font-medium text-zinc-700">
                  <li>
                    <Link href="/products" className="hover:text-[#ea580c] transition-colors">
                      All Products
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?category=hardware" className="hover:text-[#ea580c] transition-colors">
                      Hardware & Keyboards
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?category=audio" className="hover:text-[#ea580c] transition-colors">
                      Studio Audio
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?category=workspace" className="hover:text-[#ea580c] transition-colors">
                      Workspace Goods
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#ea580c] mb-4">
                  Customer Care
                </p>
                <ul className="space-y-2.5 text-xs font-medium text-zinc-700">
                  <li>
                    <Link href="/orders" className="hover:text-[#ea580c] transition-colors">
                      Track Your Order
                    </Link>
                  </li>
                  <li>
                    <Link href="/account" className="hover:text-[#ea580c] transition-colors">
                      My Account & History
                    </Link>
                  </li>
                  <li>
                    <Link href="/checkout" className="hover:text-[#ea580c] transition-colors">
                      Shopping Bag & Checkout
                    </Link>
                  </li>
                  <li>
                    <span className="text-[#15803d] font-semibold">2-Year Hardware Warranty</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-zinc-200 max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
              <p>© {new Date().getFullYear()} PulseStore Inc. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <span>Privacy Policy</span>
                <span>•</span>
                <span>Terms of Sale</span>
                <span>•</span>
                <span>Shipping & Returns</span>
                <a
                  href="https://t.me/pulsestorbot"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Admin Telegram Bot"
                  aria-label="Open PulseStore Admin Telegram Bot"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:text-[#ea580c] hover:border-[#ea580c] transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">Admin</span>
                </a>
              </div>
            </div>
          </footer>
        </div>
      </Providers>
    </RouterProvider>
  );
}
