import React from 'react';
import { CreditCard, X, ExternalLink } from 'lucide-react';
import { fmt } from '../../utils/formatters';

export default function TDCSideReminder({ isOpen, onClose, tdcData, onGoToTDC }) {
  if (!isOpen) return null;

  const deuda = tdcData?.deuda_actual || 0;
  const limite = tdcData?.limite_credito || 4000;
  const disponible = tdcData?.saldo_disponible || limite;
  const usoPct = tdcData?.pct_uso || 0;
  const corte = tdcData?.proximo_corte || "Día 23";
  const pago = tdcData?.proximo_pago || "Día 3";
  const diasRestantes = tdcData?.dias_restantes_corte ?? 23;

  return (
    <div className="fixed bottom-6 left-6 z-50 transition-all duration-500 max-w-sm w-full pointer-events-auto">
      <div className="glass-panel p-5 rounded-3xl border border-purple-500/40 shadow-2xl shadow-purple-950/80 bg-gradient-to-b from-slate-900/95 via-purple-950/50 to-slate-950/95 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center shadow-lg">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide flex items-center space-x-1.5">
                <span>Tarjeta de Crédito Nu</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  TOTALERO
                </span>
              </h4>
              <p className="text-[10px] text-slate-400">Recordatorio inteligente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
            title="Minimizar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <p className="text-[10px] text-slate-400 font-semibold">💳 Llevas Gastado / Deuda:</p>
              <p className="text-base font-black text-rose-400 mt-0.5">{fmt(deuda)}</p>
              <p className="text-[9px] text-slate-500">{usoPct}% de tu límite</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <p className="text-[10px] text-slate-400 font-semibold">🟢 Saldo Disponible:</p>
              <p className="text-base font-black text-emerald-400 mt-0.5">{fmt(disponible)}</p>
              <p className="text-[9px] text-slate-500">Límite: {fmt(limite)}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/30 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-200">Monto para no pagar intereses:</span>
              <span className="text-sm font-black text-white">{fmt(deuda)}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-purple-500/20 grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-slate-400 font-medium">✂️ Próximo Corte:</span>
                <p className="font-bold text-slate-200">{corte}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">⏰ Fecha Límite Pago:</span>
                <p className="font-bold text-amber-300">{pago}</p>
              </div>
            </div>
            <p className="text-[10px] text-purple-300 mt-2 font-medium">
              ⏳ ¡Estás a tiempo! ({diasRestantes} días para el corte). Paga antes de la fecha límite para pagar $0.00 de intereses.
            </p>
          </div>
        </div>

        <div className="mt-3.5 flex items-center space-x-2">
          <button
            onClick={() => {
              onClose();
              if (onGoToTDC) onGoToTDC();
            }}
            className="flex-1 py-1.5 text-center bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-1.5"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Ir a Control TDC</span>
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
