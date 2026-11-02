import React, { useState, useEffect } from 'react';
import { Link, useRouter } from '@/lib/router';
import { ShoppingBag, Menu, X, User, LogOut, Package } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';

export function Navbar() {
  const { itemCount, toggleCart } = useCartStore();
  const { user, openAuthModal, logout } = useAuthStore();
  const { pathname, navigate } = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = mounted ? itemCount() : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand + Links */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-8 h-8 bg-[#ea580c] text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
              PS
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-zinc-950 leading-none">
                PulseStore
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 mt-0.5">
                Industrial Goods
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7">
            <Link
              href="/"
              className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                pathname === '/' ? 'text-[#ea580c]' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Home
            </Link>
            <Link
              href="/products"
              className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                pathname.startsWith('/products')
                  ? 'text-[#ea580c]'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Shop Catalog
            </Link>
            <Link
              href="/orders"
              className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                pathname === '/orders' ? 'text-[#ea580c]' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Track Order
            </Link>
          </nav>
        </div>

        {/* Right Side: Login / Sign Up + Cart */}
        <div className="flex items-center gap-2.5">
          {mounted && user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/account"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f5f4f0] border border-zinc-200 hover:border-zinc-400 text-xs font-semibold text-zinc-900 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-zinc-700" />
                <span className="max-w-[120px] truncate">{user.name || user.email}</span>
              </Link>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2 rounded-full border border-zinc-200 text-zinc-500 hover:text-rose-600 hover:border-rose-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-800 border border-zinc-200 hover:border-zinc-950 transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-4 py-2 rounded-full bg-[#ea580c] text-white text-xs font-semibold hover:bg-[#c2410c] transition-colors shadow-sm"
              >
                Sign up
              </button>
            </div>
          )}

          {/* Cart Button */}
          <button
            onClick={toggleCart}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-950 text-white hover:bg-zinc-800 transition-all text-xs font-semibold"
            aria-label="Cart"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Bag</span>
            {count > 0 && (
              <span className="bg-[#ea580c] text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-100 bg-white px-6 py-5 space-y-4">
          <div className="space-y-2.5">
            <Link
              href="/"
              className="block text-sm font-semibold text-zinc-800 hover:text-[#ea580c]"
              onClick={() => setMobileOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/products"
              className="block text-sm font-semibold text-zinc-800 hover:text-[#ea580c]"
              onClick={() => setMobileOpen(false)}
            >
              Shop Catalog
            </Link>
            <Link
              href="/orders"
              className="block text-sm font-semibold text-zinc-800 hover:text-[#ea580c]"
              onClick={() => setMobileOpen(false)}
            >
              Track Order
            </Link>
          </div>

          <div className="pt-3 border-t border-zinc-100">
            {mounted && user ? (
              <div className="space-y-2">
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm font-semibold text-zinc-900"
                >
                  <Package className="w-4 h-4 text-[#ea580c]" />
                  <span>My Account & Orders ({user.name || user.email})</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="text-xs font-semibold text-rose-600"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    openAuthModal('login');
                  }}
                  className="py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-900"
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    openAuthModal('signup');
                  }}
                  className="py-2.5 rounded-xl bg-[#ea580c] text-white text-xs font-semibold"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
