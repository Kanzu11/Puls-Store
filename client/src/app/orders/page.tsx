import React, { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, AlertCircle, Package, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import { useAuthStore } from '@/store/auth';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import type { OrderDTO } from '@/types';
import { useRouter, Link } from '@/lib/router';

function OrderCard({ order }: { order: OrderDTO }) {
  return (
    <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="bg-zinc-950 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
            Order Reference
          </p>
          <p className="text-base font-mono font-bold tracking-tight">{order.orderNumber}</p>
        </div>
        <OrderStatusBadge status={order.status} light />
      </div>

      <div className="p-6 space-y-5 divide-y divide-zinc-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
          <div>
            <p className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
              Recipient
            </p>
            <p className="font-semibold text-zinc-900 text-sm">{order.customerName}</p>
            <p className="text-zinc-500 mt-0.5">{order.customerEmail}</p>
            {order.customerPhone && <p className="text-zinc-500">{order.customerPhone}</p>}
          </div>

          {order.shippingAddress && (
            <div>
              <p className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Shipping Address
              </p>
              <p className="text-zinc-700 leading-relaxed">
                {(order.shippingAddress as any).street}
                <br />
                {(order.shippingAddress as any).city}
                {(order.shippingAddress as any).state
                  ? `, ${(order.shippingAddress as any).state}`
                  : ''}{' '}
                {(order.shippingAddress as any).zipCode}
              </p>
            </div>
          )}
        </div>

        {order.items && order.items.length > 0 && (
          <div className="pt-5 space-y-2.5">
            <p className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
              Ordered Items
            </p>
            <div className="space-y-2">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-400">×{item.quantity}</span>
                    <span className="font-medium text-zinc-900">
                      {item.product?.name || 'Product'}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-zinc-900">
                    ${(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-5 flex items-center justify-between text-sm">
          <div>
            <span className="text-xs text-zinc-400">Date Placed: </span>
            <span className="text-xs text-zinc-600">
              {new Date(order.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-zinc-400">Total:</span>
            <span className="text-base font-bold font-mono text-zinc-950">
              ${Number(order.total).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderTracker() {
  const { searchParams } = useRouter();
  const { user, token } = useAuthStore();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') ?? '');
  const [query, setQuery] = useState(searchParams.get('order') ?? '');

  // Fetch specific order if searched by reference number
  const { data, isLoading, error } = useQuery({
    queryKey: ['order', query],
    queryFn: async () => {
      if (!query) return null;
      try {
        const res = await api.get(`/api/orders/${encodeURIComponent(query)}`);
        toast.success('Order Found', `Loaded status for ${query}`);
        return res.data;
      } catch (err) {
        toast.error('Order Not Found', `No order matching "${query}" was found.`);
        throw err;
      }
    },
    enabled: Boolean(query),
    refetchInterval: 8000,
    retry: false,
  });

  // Automatically fetch all orders for the signed-in user (live-synced every 8s)
  const { data: myAccountData, isLoading: loadingMyOrders } = useQuery({
    queryKey: ['my-orders-live', token],
    queryFn: () => api.get('/api/auth/me').then(r => r.data.data),
    enabled: Boolean(token),
    refetchInterval: 8000,
  });

  const searchedOrder: OrderDTO | undefined = data?.data;
  const myOrders: OrderDTO[] = myAccountData?.orders ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim()) {
      setQuery(orderNumber.trim());
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#ea580c] mb-1">
          Order Fulfillment & Live Status
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
          Track Your Orders
        </h1>
        <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
          View your live order status below or look up any order by its reference number.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-10">
        <div className="relative flex-1">
          <input
            type="text"
            value={orderNumber}
            onChange={e => setOrderNumber(e.target.value)}
            placeholder="Lookup by Order ID (e.g. PS-1793642513103)"
            className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono bg-white text-zinc-950 placeholder:text-zinc-400 placeholder:font-sans focus:outline-none focus:border-zinc-950 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={!orderNumber.trim() || isLoading}
          className="bg-[#ea580c] text-white px-6 py-3 rounded-xl text-xs font-semibold hover:bg-[#c2410c] transition-colors disabled:opacity-40 flex items-center gap-2 shadow-sm"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span>Lookup</span>
        </button>
      </form>

      {error && (
        <div className="border border-zinc-200 bg-zinc-50 rounded-2xl p-6 text-center space-y-2 mb-8">
          <AlertCircle className="w-6 h-6 text-zinc-400 mx-auto" />
          <p className="text-sm font-semibold text-zinc-900">Order not found</p>
          <p className="text-xs text-zinc-500">
            Please verify the order reference number (e.g. PS-...).
          </p>
        </div>
      )}

      {searchedOrder && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Search Result
            </h2>
            <button
              onClick={() => {
                setQuery('');
                setOrderNumber('');
              }}
              className="text-xs font-semibold text-[#ea580c] hover:underline"
            >
              Clear Search
            </button>
          </div>
          <OrderCard order={searchedOrder} />
        </div>
      )}

      {/* Automatically show signed-in user's orders */}
      {user && token && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#ea580c]" />
              <span>Your Orders ({myOrders.length})</span>
            </h2>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Live Sync Active
            </span>
          </div>

          {loadingMyOrders ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            </div>
          ) : myOrders.length === 0 ? (
            <div className="border border-dashed border-zinc-200 rounded-2xl p-10 text-center">
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
            <div className="space-y-5">
              {myOrders.map(o => (
                <OrderCard key={o.id} order={o} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      }
    >
      <OrderTracker />
    </Suspense>
  );
}
