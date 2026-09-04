import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:right-5 sm:top-5 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map((t) => {
        let bg = 'bg-slate-900 border-slate-700 text-white';
        let icon = <Info className="w-4 h-4 text-indigo-400" />;

        if (t.type === 'success') {
          bg = 'bg-emerald-950/95 border-emerald-800 text-emerald-100 shadow-emerald-950/50';
          icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
        } else if (t.type === 'error') {
          bg = 'bg-rose-950/95 border-rose-800 text-rose-100 shadow-rose-950/50';
          icon = <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
        } else if (t.type === 'warning') {
          bg = 'bg-amber-950/95 border-amber-800 text-amber-100 shadow-amber-950/50';
          icon = <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />;
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl border shadow-xl backdrop-blur-md text-xs font-semibold max-w-sm transition-all duration-300 ${bg}`}
          >
            <div className="flex items-center space-x-2.5">
              {icon}
              <span className="leading-snug">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-3 p-1 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
