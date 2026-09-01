import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export default function AjusteAporteModal({
  isOpen,
  onClose,
  tipo,
  futuroData = {},
  onSave
}) {
  if (!isOpen) return null;

  const of = futuroData?.otros_fondos || {};
  let defaultMonto = 250;
  let titulo = 'Ajustar Aportación';
  let desc = '';

  if (tipo === 'cetes') {
    defaultMonto = of.cetes?.aportado ?? 250;
    titulo = '🔒 Ahorro Involuntario (Cetesdirecto)';
    desc = 'Declara el monto invertido en tu cuenta de Cetesdirecto a 3 meses.';
  } else if (tipo === 'emergencia') {
    defaultMonto = of.emergencia?.aportado ?? 500;
    titulo = '🛡️ Fondo de Emergencia (Cajita Nu)';
    desc = 'Declara el monto resguardado para emergencias en la Cajita Turbo.';
  } else if (tipo === 'retiro') {
    defaultMonto = of.retiro?.aportado ?? 250;
    titulo = '🚀 Retiro Deducible SAT (AFORE)';
    desc = 'Declara el monto resguardado para tu aportación voluntaria deducible.';
  }

  const [monto, setMonto] = useState(defaultMonto);

  useEffect(() => {
    setMonto(defaultMonto);
  }, [tipo, defaultMonto]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(monto);
    if (isNaN(val) || val < 0) return;
    onSave(tipo, val);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel p-6 rounded-3xl max-w-sm w-full border border-purple-500/30 shadow-2xl relative space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white">{titulo}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-slate-400 font-semibold">Monto Aportado ($ MXN)</label>
            <input
              type="number"
              step="10"
              required
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1 font-bold text-base focus:border-purple-500"
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">{desc}</p>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
