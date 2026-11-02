import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

let listeners: ((toasts: ToastItem[]) => void)[] = [];
let memoryToasts: ToastItem[] = [];

function emit() {
  for (const l of listeners) {
    l([...memoryToasts]);
  }
}

export const toast = {
  show(title: string, description?: string, type: ToastType = 'success') {
    const id = Math.random().toString(36).slice(2, 9);
    memoryToasts = [...memoryToasts.slice(-2), { id, title, description, type }];
    emit();
    setTimeout(() => {
      memoryToasts = memoryToasts.filter(t => t.id !== id);
      emit();
    }, 3200);
  },
  success(title: string, description?: string) {
    this.show(title, description, 'success');
  },
  error(title: string, description?: string) {
    this.show(title, description, 'error');
  },
  info(title: string, description?: string) {
    this.show(title, description, 'info');
  },
  dismiss(id: string) {
    memoryToasts = memoryToasts.filter(t => t.id !== id);
    emit();
  },
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>(memoryToasts);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter(l => l !== setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-3 left-4 right-4 z-[100] flex flex-col gap-2 max-w-md mx-auto pointer-events-none">
      {toasts.map(t => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl border shadow-lg bg-white text-zinc-950 ${
              isError
                ? 'border-rose-200 border-l-4 border-l-[#c81e1e]'
                : isSuccess
                ? 'border-zinc-200 border-l-4 border-l-[#15803d]'
                : 'border-zinc-200 border-l-4 border-l-[#ea580c]'
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-[#15803d]" />
              ) : isError ? (
                <AlertCircle className="w-4 h-4 text-[#c81e1e]" />
              ) : (
                <Info className="w-4 h-4 text-[#ea580c]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-950">{t.title}</p>
              {t.description && (
                <p className="text-[11px] text-zinc-500 mt-0.5">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-zinc-400 hover:text-zinc-900 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

