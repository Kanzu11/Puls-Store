import React from 'react';
import type { OrderStatus } from '../types';

const config: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  PENDING:    { label: 'Pending',    bg: 'bg-amber-50',   text: 'text-amber-800' },
  PROCESSING: { label: 'Processing', bg: 'bg-zinc-100',   text: 'text-zinc-900' },
  SHIPPED:    { label: 'Shipped',    bg: 'bg-blue-50',    text: 'text-blue-800' },
  DELIVERED:  { label: 'Delivered',  bg: 'bg-emerald-50', text: 'text-emerald-800' },
  CANCELLED:  { label: 'Cancelled',  bg: 'bg-rose-50',    text: 'text-rose-800' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const c = config[status] || config.PENDING;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}>
      <span>{c.label}</span>
    </span>
  );
}
