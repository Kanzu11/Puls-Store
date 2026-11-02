import React, { useEffect, useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Orders } from './pages/Orders';
import { Users } from './pages/Users';
import { BottomNav } from './components/BottomNav';
import { Toaster } from './components/Toaster';
import { BarChart3, Package, ShoppingBag, Users as UsersIcon, ShieldCheck } from 'lucide-react';

type Tab = 'dashboard' | 'products' | 'orders' | 'users';

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [tgUser, setTgUser] = useState<string>('admin');

  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        const username = tg.initDataUnsafe?.user?.username || tg.initDataUnsafe?.user?.first_name;
        if (username) setTgUser(username);
      }
    } catch {
      // Dev mode outside Telegram
    }
  }, []);

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Overview', icon: BarChart3 },
    { id: 'orders' as Tab, label: 'Orders', icon: ShoppingBag },
    { id: 'products' as Tab, label: 'Catalog', icon: Package },
    { id: 'users' as Tab, label: 'Users', icon: UsersIcon },
  ];

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-zinc-950 flex flex-col antialiased">
      <Toaster />
      {/* Top Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#ea580c] rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold shadow-sm">
            PS
          </div>
          <div>
            <span className="font-bold text-xs tracking-tight text-zinc-950 block leading-none">
              PulseStore Admin
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">@{tgUser}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200">
          <ShieldCheck className="w-3 h-3 text-[#15803d]" />
          <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-wider">
            DB Synced
          </span>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-xl w-full mx-auto pb-24">
        {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
        {tab === 'orders' && <Orders />}
        {tab === 'products' && <Products />}
        {tab === 'users' && <Users />}
      </main>

      {/* Navigation */}
      <BottomNav tabs={tabs} activeTab={tab} onTabChange={setTab} />
    </div>
  );
}

