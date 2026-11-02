import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdminOrders, updateAdminOrderStatus } from '../lib/api';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { toast } from '../components/Toaster';
import { Loader2, X, ChevronRight, Check } from 'lucide-react';
import type { OrderDTO, OrderStatus } from '../types';

const STATUS_FILTERS: (OrderStatus | '')[] = [
  '',
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

export function Orders() {
  const qc = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | ''>('');
  const [activeOrder, setActiveOrder] = useState<OrderDTO | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', selectedFilter],
    queryFn: () => fetchAdminOrders(selectedFilter),
    refetchInterval: 12_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateAdminOrderStatus(id, status),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Order Stage Updated', `Marked as ${variables.status}`);
      if (activeOrder) {
        setActiveOrder(prev => (prev ? { ...prev, status: variables.status } : null));
      }
    },
  });

  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          Fulfillment Pipeline
        </p>
        <h2 className="text-sm font-bold text-zinc-950">Customer Orders ({orders.length})</h2>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        {STATUS_FILTERS.map(st => {
          const isActive = selectedFilter === st;
          return (
            <button
              key={st || 'all'}
              onClick={() => setSelectedFilter(st)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400'
              }`}
            >
              {st === '' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          );
        })}
      </div>

      {/* Order List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-dashed border-zinc-200 rounded-2xl p-12 text-center text-xs text-zinc-400">
          No orders match the selected filter.
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden divide-y divide-zinc-100 shadow-sm">
          {orders.map(order => (
            <div key={order.id} className="p-4 space-y-3 hover:bg-zinc-50/50 transition-colors">
              <button
                onClick={() => setActiveOrder(order)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-xs text-zinc-950">
                      {order.orderNumber}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-xs font-medium text-zinc-800 truncate">{order.customerName}</p>
                  <p className="text-[11px] text-zinc-400">
                    {order.customerEmail} · {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono font-bold text-sm text-zinc-950">
                    ${Number(order.total).toFixed(2)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </div>
              </button>

              {/* Quick Inline Stage Buttons */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-100">
                {(['PROCESSING', 'SHIPPED', 'DELIVERED'] as OrderStatus[]).map(st => {
                  const isCurrent = order.status === st;
                  return (
                    <button
                      key={st}
                      disabled={isCurrent || statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: order.id, status: st })}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
                        isCurrent
                          ? 'bg-zinc-950 text-white'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      {st.charAt(0) + st.slice(1).toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-Up Detail Sheet */}
      {activeOrder && (
        <div className="fixed inset-0 bg-zinc-950/40 z-50 flex items-end justify-center backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 sticky top-0 bg-white z-10">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  Order Details
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-sm text-zinc-950">
                    {activeOrder.orderNumber}
                  </span>
                  <OrderStatusBadge status={activeOrder.status} />
                </div>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Set Fulfillment Stage
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map(
                    st => {
                      const isCurrent = activeOrder.status === st;
                      return (
                        <button
                          key={st}
                          onClick={() => statusMutation.mutate({ id: activeOrder.id, status: st })}
                          disabled={isCurrent || statusMutation.isPending}
                          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                            isCurrent
                              ? 'bg-zinc-950 text-white shadow-sm'
                              : 'bg-zinc-50 border border-zinc-200 text-zinc-700 hover:border-zinc-400'
                          } disabled:opacity-60`}
                        >
                          {isCurrent && <Check className="w-3.5 h-3.5" />}
                          <span>{st.charAt(0) + st.slice(1).toLowerCase()}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 text-xs space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Recipient
                </p>
                <p className="font-bold text-zinc-950">{activeOrder.customerName}</p>
                <p className="text-zinc-600">{activeOrder.customerEmail}</p>
                {activeOrder.customerPhone && (
                  <p className="text-zinc-600">{activeOrder.customerPhone}</p>
                )}
                {activeOrder.shippingAddress && (
                  <div className="pt-2 border-t border-zinc-200/60 mt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">
                      Shipping Address
                    </p>
                    <p className="text-zinc-700 leading-relaxed">
                      {activeOrder.shippingAddress.street}, {activeOrder.shippingAddress.city},{' '}
                      {activeOrder.shippingAddress.state} {activeOrder.shippingAddress.zipCode}
                    </p>
                  </div>
                )}
              </div>

              {activeOrder.items && activeOrder.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Ordered Line Items
                  </p>
                  <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                    {activeOrder.items.map(item => (
                      <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-zinc-950">{item.product.name}</p>
                          <p className="text-zinc-400">
                            Qty: {item.quantity} × ${Number(item.price).toFixed(2)}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-zinc-950">
                          ${(Number(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="p-3 bg-zinc-50/50 flex items-center justify-between text-xs font-bold text-zinc-950">
                      <span>Total</span>
                      <span className="font-mono text-sm">
                        ${Number(activeOrder.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

