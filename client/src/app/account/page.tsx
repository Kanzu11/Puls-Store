import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { User, Package, LogOut, Loader2, ArrowRight } from 'lucide-react';
import { Link, useRouter } from '@/lib/router';
import type { OrderDTO } from '@/types';

export default function AccountPage() {
  const { user, token, openAuthModal, logout } = useAuthStore();
  const { navigate } = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['auth-me', token],
    queryFn: () => api.get('/api/auth/me').then(r => r.data.data),
    enabled: Boolean(token),
  });

  if (!user || !token) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <div className="w-12 h-12 rounded-2xl border border-zinc-200 bg-zinc-50 flex items-center justify-center mx-auto mb-4 text-zinc-700">
          <User className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-950 mb-2">Sign in to your account</h1>
        <p className="text-xs text-zinc-500 mb-6">
          Access your order history, saved details, and real-time shipment updates.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => openAuthModal('login')}
            className="px-6 py-3 rounded-xl bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => openAuthModal('signup')}
            className="px-6 py-3 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-900 hover:border-zinc-400 transition-colors"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  const orders: OrderDTO[] = data?.orders ?? [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-zinc-200 mb-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
            Member Profile
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
            {user.name || 'Account Overview'}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {user.email}
            {user.telegramUsername ? ` · @${user.telegramUsername}` : ''}
          </p>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:border-zinc-400 transition-colors self-start"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div>
        <h2 className="text-base font-bold text-zinc-950 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4" />
          <span>Order History</span>
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-dashed border-zinc-200 rounded-2xl p-12 text-center">
            <p className="text-sm font-semibold text-zinc-800">No orders placed yet</p>
            <p className="text-xs text-zinc-500 mt-1 mb-5">
              Orders placed with {user.email} will automatically appear here.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-zinc-950 text-white px-5 py-2.5 rounded-xl text-xs font-semibold"
            >
              Browse Catalog <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div
                key={order.id}
                className="border border-zinc-200 rounded-2xl p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-400 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-zinc-950">
                      {order.orderNumber}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-zinc-500">
                    Placed on {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item(s)
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-base text-zinc-950">
                    ${Number(order.total).toFixed(2)}
                  </span>
                  <Link
                    href={`/orders?order=${order.orderNumber}`}
                    className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-900 hover:border-zinc-950 transition-colors"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

