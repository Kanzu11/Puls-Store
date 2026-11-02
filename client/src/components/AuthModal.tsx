import React, { useState, useEffect } from 'react';
import { X, Loader2, Mail, Lock, User, AtSign, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { api } from '@/lib/api';

const inputClass =
  'w-full border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-[#ea580c] transition-colors';

export function AuthModal() {
  const { authModalOpen, authModalView, closeAuthModal, setAuth } = useAuthStore();
  const [view, setView] = useState<'login' | 'signup'>(authModalView);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setView(authModalView);
    setError(null);
  }, [authModalView, authModalOpen]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (view === 'login') {
        const res = await api.post('/api/auth/login', { email, password });
        const user = res.data.data.user;
        setAuth(res.data.data.token, user);
        toast.success('Welcome back!', `Signed in as ${user.name || user.email}`);
      } else {
        const res = await api.post('/api/auth/signup', {
          name,
          email,
          password,
          telegramUsername: telegramUsername || undefined,
        });
        const user = res.data.data.user;
        setAuth(res.data.data.token, user);
        toast.success(
          'Account Created!',
          `Welcome to PulseStore, ${user.name || user.email}. Confirmation email sent.`
        );
      }
      setName('');
      setEmail('');
      setPassword('');
      setTelegramUsername('');
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        (view === 'login' ? 'Invalid email or password' : 'Could not create account');
      setError(msg);
      toast.error('Authentication Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
        onClick={closeAuthModal}
      />

      <div className="relative bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-[#ea580c] text-white rounded-lg flex items-center justify-center font-bold text-xs">
              PS
            </span>
            <span className="font-bold text-sm tracking-tight text-zinc-950">PulseStore</span>
          </div>
          <button
            onClick={closeAuthModal}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#f5f4f0] border border-zinc-200/80 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setView('login');
              setError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              view === 'login'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setView('signup');
              setError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              view === 'signup'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="mb-5">
          <h2 className="text-xl font-bold tracking-tight text-zinc-950">
            {view === 'login' ? 'Welcome back' : 'Create your PulseStore account'}
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            {view === 'login'
              ? 'Sign in with your email and password to view orders and faster checkout.'
              : 'Register with your email to receive instant order confirmations and tracking.'}
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
                <span>{view === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
