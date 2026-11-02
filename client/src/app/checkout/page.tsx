import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { api } from '@/lib/api';
import { CheckCircle2, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link, useRouter } from '@/lib/router';

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
        {label} {required && <span className="text-zinc-950">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyles =
  'w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm bg-white text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 transition-colors';

export default function CheckoutPage() {
  const { items, clearCart, total } = useCartStore();
  const { user, token } = useAuthStore();
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) {
      toast.info('Sign Up Required', 'Please create an account or sign in to complete your order.');
      navigate('/signup?redirect=/checkout');
    }
  }, [user, token]);

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        customerName: prev.customerName || user.name || '',
        customerEmail: prev.customerEmail || user.email || '',
      }));
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone || undefined,
        userId: user?.id,
        shippingAddress: {
          street: form.street,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          country: form.country,
        },
        notes: form.notes || undefined,
        items: items.map(i => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: Number(i.product.price),
        })),
      };

      const { data } = await api.post('/api/orders', payload);
      clearCart();
      setSuccess(data.data.orderNumber);
      toast.success(
        'Order Confirmed!',
        `Order ${data.data.orderNumber} placed. Confirmation email sent to ${form.customerEmail}.`
      );
    } catch (err: any) {
      const msg =
        err.response?.data?.error || 'Failed to place your order. Please check the information provided.';
      setErrorMsg(msg);
      toast.error('Checkout Error', msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <div className="w-14 h-14 bg-zinc-950 text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 mb-2">Order Confirmed</h1>
        <p className="text-sm text-zinc-500 mb-6">
          We have sent an order confirmation email to <strong>{form.customerEmail}</strong>.
        </p>

        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 mb-8 max-w-sm mx-auto">
          <p className="text-xs uppercase tracking-widest text-zinc-400 font-semibold mb-1">
            Order Reference Number
          </p>
          <p className="text-xl font-mono font-bold text-zinc-950 select-all">{success}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/orders?order=${success}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-950 text-white px-6 py-3 rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-colors"
          >
            Track Order Status <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center border border-zinc-200 bg-white text-zinc-800 px-6 py-3 rounded-xl text-xs font-semibold hover:border-zinc-400 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <div className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 font-mono text-sm mx-auto mb-4">
          0
        </div>
        <h1 className="text-2xl font-bold text-zinc-950 mb-2">Your bag is empty</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Add some products before proceeding to checkout.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-zinc-950 text-white px-6 py-3 rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-colors"
        >
          Explore Catalog <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
          Checkout
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
          Delivery & Confirmation
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8">
          {errorMsg && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider pb-3 border-b border-zinc-100">
              1. Customer Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name" required>
                <input
                  name="customerName"
                  required
                  value={form.customerName}
                  onChange={handleChange}
                  placeholder="Alex Rivera"
                  className={inputStyles}
                />
              </FormField>
              <FormField label="Email Address" required>
                <input
                  name="customerEmail"
                  type="email"
                  required
                  value={form.customerEmail}
                  onChange={handleChange}
                  placeholder="alex@example.com"
                  className={inputStyles}
                />
              </FormField>
            </div>

            <FormField label="Contact Phone">
              <input
                name="customerPhone"
                type="tel"
                value={form.customerPhone}
                onChange={handleChange}
                placeholder="+1 (555) 019-2834"
                className={inputStyles}
              />
            </FormField>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider pb-3 border-b border-zinc-100">
              2. Shipping Destination
            </h2>

            <FormField label="Street Address" required>
              <input
                name="street"
                required
                value={form.street}
                onChange={handleChange}
                placeholder="742 Evergreen Terrace"
                className={inputStyles}
              />
            </FormField>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <FormField label="City" required>
                <input
                  name="city"
                  required
                  value={form.city}
                  onChange={handleChange}
                  placeholder="San Francisco"
                  className={inputStyles}
                />
              </FormField>
              <FormField label="State / Province" required>
                <input
                  name="state"
                  required
                  value={form.state}
                  onChange={handleChange}
                  placeholder="CA"
                  className={inputStyles}
                />
              </FormField>
              <FormField label="Postal Code" required>
                <input
                  name="zipCode"
                  required
                  value={form.zipCode}
                  onChange={handleChange}
                  placeholder="94108"
                  className={inputStyles}
                />
              </FormField>
            </div>

            <FormField label="Delivery Instructions">
              <textarea
                name="notes"
                rows={2}
                value={form.notes}
                onChange={handleChange}
                placeholder="Gate code, building reception notes..."
                className={`${inputStyles} resize-none`}
              />
            </FormField>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ea580c] text-white py-4 rounded-xl font-semibold text-sm hover:bg-[#c2410c] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <span>Complete Purchase — ${total().toFixed(2)}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="lg:col-span-5">
          <div className="border border-zinc-200 rounded-2xl bg-zinc-50/60 p-6 sticky top-24 space-y-6">
            <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider pb-3 border-b border-zinc-200">
              Order Summary
            </h2>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {items.map(item => (
                <div key={item.product.id} className="flex gap-3">
                  <div className="w-14 h-14 bg-white border border-zinc-200 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300 font-mono text-[10px]">
                        ITEM
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-xs font-semibold text-zinc-900 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Qty: {item.quantity} × ${Number(item.product.price).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-bold text-zinc-950 font-mono">
                    ${(Number(item.product.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-200 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>
                <span className="font-mono text-zinc-900">${total().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Express Shipping</span>
                <span className="text-emerald-700 font-medium">Complimentary</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-zinc-950 pt-2 border-t border-zinc-200">
                <span>Total Due</span>
                <span className="font-mono">${total().toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-zinc-200 pt-4 flex items-center gap-2 text-[11px] text-zinc-500">
              <ShieldCheck className="w-4 h-4 text-zinc-700 flex-shrink-0" />
              <span>Instant email confirmation & 30-day return guarantee.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

