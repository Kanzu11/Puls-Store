import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminStats } from '../lib/api';
import { StatCard } from '../components/StatCard';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { DollarSign, ShoppingBag, Clock, Package, Loader2, Users, RefreshCw } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { OrderDTO } from '../types';

export function Dashboard({ onNavigate }: { onNavigate: (tab: any) => void }) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
    refetchInterval: 12_000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <span className="text-xs text-zinc-400">Syncing store telemetry...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 pt-6">
        <div className="bg-white border border-rose-200 text-rose-800 rounded-2xl p-5 text-xs shadow-sm">
          <p className="font-semibold mb-1">Failed to load statistics</p>
          <p className="text-zinc-500 mb-3">
            Could not reach database. Tap below to retry synchronization.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-zinc-950 text-white font-semibold"
          >
            Retry Sync
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Quick Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Command Center
          </p>
          <h2 className="text-sm font-bold text-zinc-950">Store Telemetry</h2>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:border-zinc-400 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Revenue"
          value={`$${Number(data.totalRevenue).toFixed(0)}`}
          icon={DollarSign}
          sub={`+$${Number(data.revenueToday).toFixed(2)} today`}
        />
        <StatCard
          label="Total Orders"
          value={String(data.totalOrders)}
          icon={ShoppingBag}
          sub={`+${data.ordersToday} today`}
        />
        <StatCard
          label="Pending Action"
          value={String(data.pendingOrders)}
          icon={Clock}
          sub={data.pendingOrders > 0 ? 'Requires fulfillment' : 'All clear'}
        />
        <StatCard
          label="Registered Users"
          value={String(data.totalUsers ?? 0)}
          icon={Users}
          sub={`${data.totalProducts} active SKUs`}
        />
      </div>

      {/* Quick Admin Navigation Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onNavigate('orders')}
          className="py-2.5 px-3 rounded-xl bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
        >
          Fulfill Orders
        </button>
        <button
          onClick={() => onNavigate('products')}
          className="py-2.5 px-3 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs font-semibold hover:border-zinc-400 transition-colors"
        >
          Add / Edit Stock
        </button>
        <button
          onClick={() => onNavigate('users')}
          className="py-2.5 px-3 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs font-semibold hover:border-zinc-400 transition-colors"
        >
          Manage Admins
        </button>
      </div>

      {/* Revenue 7-Day Chart */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Revenue Dynamics
            </p>
            <h3 className="text-sm font-bold text-zinc-950 mt-0.5">Past 7 Days</h3>
          </div>
          <span className="text-xs font-mono font-bold text-zinc-950">
            ${data.dailyRevenue.reduce((s, d) => s + d.revenue, 0).toFixed(2)}
          </span>
        </div>

        <div className="h-36 w-full -ml-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: '#71717a' }}
                tickFormatter={d => {
                  const parts = d.split('-');
                  return `${parts[1]}/${parts[2]}`;
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  borderRadius: '10px',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '11px',
                  padding: '6px 10px',
                }}
                formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#09090b"
                strokeWidth={2}
                fill="#f4f4f5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Recent Orders
          </p>
          <button
            onClick={() => onNavigate('orders')}
            className="text-[11px] font-semibold text-zinc-950 underline underline-offset-2"
          >
            View All
          </button>
        </div>

        {data.recentOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">No orders recorded yet.</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {data.recentOrders.map((order: OrderDTO) => (
              <div
                key={order.id}
                onClick={() => onNavigate('orders')}
                className="p-4 flex items-center justify-between hover:bg-zinc-50/60 transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-950">
                      {order.orderNumber}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {order.customerName} · {order.customerEmail}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono text-zinc-950">
                    ${Number(order.total).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

