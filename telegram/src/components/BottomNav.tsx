import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: any) => void;
}

export function BottomNav({ tabs, activeTab, onTabChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 flex z-30 pb-[env(safe-area-inset-bottom)]">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-1 text-[11px] font-semibold transition-all ${
              isActive ? 'text-zinc-950 scale-105' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.2px]' : 'stroke-[1.6px]'}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

