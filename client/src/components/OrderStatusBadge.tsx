import React from 'react';
import type { OrderStatus } from '@/types';

const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  PENDING:    { label: 'Pending',    bg: 'bg-amber-50',   text: 'text-amber-800' },
  PROCESSING: { label: 'Processing', bg: 'bg-zinc-100',   text: 'text-zinc-900' },
  SHIPPED:    { label: 'Shipped',    bg: 'bg-blue-50',    text: 'text-blue-800' },
  DELIVERED:  { label: 'Delivered',  bg: 'bg-emerald-50', text: 'text-emerald-800' },
  CANCELLED:  { label: 'Cancelled',  bg: 'bg-rose-50',    text: 'text-rose-800' },
};

export function OrderStatusBadge({
  status,
  light = false,
}: {
  status: OrderStatus;
  light?: boolean;
}) {
  const c = statusConfig[status] || statusConfig.PENDING;
  if (light) {
    return (
      <span className="inline-flex items-center text-xs font-medium text-zinc-300">
        {c.label}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
