import React from 'react';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useRouter } from '@/lib/router';

export function CartDrawer() {
  const { items, isOpen, toggleCart, updateQuantity, removeItem, total } = useCartStore();
  const { user, token } = useAuthStore();
  const { navigate } = useRouter();

  const handleProceedToCheckout = () => {
    toggleCart();
    if (!user || !token) {
      toast.info('Account Required', 'Please sign up or log in to place your order.');
      navigate('/signup?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-zinc-950/20 z-50 backdrop-blur-[2px] transition-opacity"
          onClick={toggleCart}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div>
            <h2 className="font-semibold text-base tracking-tight text-zinc-950">Your Bag</h2>
            {items.length > 0 && (
              <p className="text-xs text-zinc-400 mt-0.5">
                {items.reduce((s, i) => s + i.quantity, 0)} item(s)
              </p>
            )}
          </div>
          <button
            onClick={toggleCart}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 font-mono text-sm">
              0
            </div>
            <p className="font-semibold text-sm text-zinc-900">Your bag is empty</p>
            <p className="text-xs text-zinc-500 max-w-[220px]">
              Explore our catalog to find items you love.
            </p>
            <button
              onClick={toggleCart}
              className="mt-2 text-xs font-semibold text-zinc-900 underline underline-offset-4 hover:text-zinc-600 transition-colors"
            >
              Continue browsing
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-zinc-100">
              {items.map(item => (
                <div key={item.product.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                  <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300 font-mono text-xs">
                        IMG
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                        ${Number(item.product.price).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-zinc-200 rounded-md">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-zinc-50 transition-colors"
                        >
                          <Minus className="w-3 h-3 text-zinc-600" />
                        </button>
                        <span className="text-xs font-medium w-6 text-center text-zinc-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= (item.product.stock || 99)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-zinc-50 transition-colors disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3 text-zinc-600" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-zinc-400 hover:text-rose-600 transition-colors ml-auto p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-100 px-6 py-5 space-y-4 bg-zinc-50/50">
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs text-zinc-500">
                  <span>Shipping</span>
                  <span className="text-zinc-700">Complimentary</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-sm font-medium text-zinc-900">Total</span>
                  <span className="text-lg font-bold tracking-tight text-zinc-950 font-mono">
                    ${total().toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="flex items-center justify-center gap-2 w-full bg-[#ea580c] text-white py-3.5 rounded-xl text-xs font-semibold hover:bg-[#c2410c] transition-colors shadow-sm"
              >
                <span>{user && token ? 'Proceed to Checkout' : 'Sign Up to Order'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

