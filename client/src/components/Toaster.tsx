import React from 'react';
import { useToastStore } from '@/store/toast';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map(t => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-200 ${
              isError
                ? 'bg-white border-rose-200 border-l-4 border-l-[#c81e1e] text-zinc-950'
                : isSuccess
                ? 'bg-white border-zinc-200 border-l-4 border-l-[#15803d] text-zinc-950'
                : 'bg-white border-zinc-200 border-l-4 border-l-[#ea580c] text-zinc-950'
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
              <p className="text-xs font-bold text-zinc-950 leading-snug">{t.title}</p>
              {t.description && (
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{t.description}</p>
              )}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-zinc-400 hover:text-zinc-900 transition-colors p-0.5"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
