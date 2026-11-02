import React, { useState, useEffect } from 'react';
import { Loader2, Mail, Lock, User, AtSign, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { api } from '@/lib/api';
import { useRouter, Link } from '@/lib/router';

const inputClass =
  'w-full border border-zinc-200 rounded-xl pl-10 pr-4 py-3 text-sm bg-white text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-[#ea580c] transition-colors';

export function AuthPage({ defaultMode = 'signup' }: { defaultMode?: 'login' | 'signup' }) {
  const { user, token, setAuth } = useAuthStore();
  const { searchParams, navigate } = useRouter();
  const redirectTarget = searchParams.get('redirect') || '/checkout';

  const [view, setView] = useState<'login' | 'signup'>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setView(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    if (user && token) {
      navigate(redirectTarget);
    }
  }, [user, token, redirectTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (view === 'login') {
        const res = await api.post('/api/auth/login', { email, password });
        const loggedUser = res.data.data.user;
        setAuth(res.data.data.token, loggedUser);
        toast.success('Signed In', `Welcome back, ${loggedUser.name || loggedUser.email}`);
        navigate(redirectTarget);
      } else {
        const res = await api.post('/api/auth/signup', {
          name,
          email,
          password,
          telegramUsername: telegramUsername || undefined,
        });
        const newUser = res.data.data.user;
        setAuth(res.data.data.token, newUser);
        toast.success(
          'Account Created!',
          `Welcome ${newUser.name || newUser.email}! Proceeding to your order.`
        );
        navigate(redirectTarget);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        (view === 'login' ? 'Invalid email or password' : 'Could not create account');
      setError(msg);
      toast.error('Authentication Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="w-8 h-8 bg-[#ea580c] text-white rounded-lg flex items-center justify-center font-bold text-xs">
            PS
          </span>
          <div>
            <span className="font-bold text-sm tracking-tight text-zinc-950 block leading-none">
              PulseStore Account
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
              {redirectTarget === '/checkout' ? 'Required to Place Order' : 'Member Portal'}
            </span>
          </div>
        </div>

        {/* Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#f5f4f0] border border-zinc-200/80 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setView('signup');
              setError(null);
            }}
            className={`py-2.5 text-xs font-semibold rounded-lg transition-all ${
              view === 'signup'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setView('login');
              setError(null);
            }}
            className={`py-2.5 text-xs font-semibold rounded-lg transition-all ${
              view === 'login'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Sign In
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            {view === 'signup' ? 'Create an account to order' : 'Sign in to your account'}
          </h1>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            {view === 'signup'
              ? 'An account is required to place orders, receive Gmail confirmation receipts, and track live shipment stages.'
              : 'Sign in with your registered email and password to continue to checkout.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {view === 'signup' && (
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          </div>

          {view === 'signup' && (
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Telegram Username (Optional)
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={telegramUsername}
                  onChange={e => setTelegramUsername(e.target.value)}
                  placeholder="username"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ea580c] text-white py-3.5 rounded-xl text-xs font-semibold hover:bg-[#c2410c] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{view === 'login' ? 'Signing in...' : 'Creating account...'}</span>
              </>
            ) : (
              <>
                <span>
                  {view === 'login' ? 'Sign In & Continue' : 'Sign Up & Continue to Order'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-zinc-100 flex items-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-[#15803d] flex-shrink-0" />
          <span>Your shopping bag items are saved and waiting for checkout.</span>
        </div>
      </div>

      <div className="text-center mt-6">
        <Link
          href="/products"
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-950 transition-colors"
        >
          ← Back to Catalog
        </Link>
      </div>
    </div>
  );
}

