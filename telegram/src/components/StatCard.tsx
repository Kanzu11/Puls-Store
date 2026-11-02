import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  icon: LucideIcon;
  sub?: string;
}

export function StatCard({ label, value, icon: Icon, sub }: Props) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{label}</p>
        <div className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-700">
          <Icon className="w-3.5 h-3.5 stroke-[1.8px]" />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight text-zinc-950 font-mono">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

