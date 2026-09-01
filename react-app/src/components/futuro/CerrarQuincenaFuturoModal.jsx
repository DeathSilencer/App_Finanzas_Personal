import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { fmt, getTodayDate } from '../../utils/formatters';

export default function CerrarQuincenaFuturoModal({
  isOpen,
  onClose,
  futuroData = {},
  onConfirm
}) {
  if (!isOpen) return null;

  const of = futuroData?.otros_fondos || {};
  const ocio = of.ocio || {};
  const cajita = of.cajita_turbo || {};

  const now = new Date();
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const defaultPeriodo = `${now.getDate() <= 15 ? '1ra' : '2da'} Quincena ${meses[now.getMonth()]} ${now.getFullYear()}`;

  const [periodo, setPeriodo] = useState(defaultPeriodo);
  const [fechaCierre, setFechaCierre] = useState(getTodayDate());
  const [anio, setAnio] = useState(now.getFullYear());

  const gastoOcio = ocio.gasto_real || 0;
  const remanenteOcio = ocio.remanente ?? 1500;
  const totalCajita = cajita.gran_total || 2000;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      periodo: periodo.trim() || defaultPeriodo,
      fecha_cierre: fechaCierre,
      anio: parseInt(anio)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel p-6 sm:p-7 rounded-3xl max-w-md w-full border border-emerald-500/30 shadow-2xl relative space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cerrar Quincena en Futuro</h3>
              <p className="text-xs text-slate-400">Archivar ocio y resguardar en Cajita Nu</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Card Resumen */}
          <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300">Presupuesto Ocio (30%):</span>
              <span className="font-bold text-white">{fmt(ocio.presupuesto || 1500)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Gasto Real Ejecutado:</span>
              <span className="font-bold text-rose-400">{fmt(gastoOcio)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-emerald-800/40">
              <span className="text-emerald-300 font-bold">Remanente Ocio Resguardado:</span>
              <span className="font-black text-emerald-400 text-sm">{fmt(remanenteOcio)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-emerald-800/40">
              <span className="text-purple-300 font-bold">Total Resguardado en Cajita Nu:</span>
              <span className="font-black text-purple-300 text-sm">{fmt(totalCajita)}</span>
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-semibold">Nombre del Período / Quincena</label>
            <input
              type="text"
              required
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1 font-bold focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 font-semibold">Fecha de Cierre</label>
              <input
                type="date"
                required
                value={fechaCierre}
                onChange={(e) => setFechaCierre(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400 font-semibold">Año</label>
              <input
                type="number"
                required
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            💡 Al cerrar, el remanente de ocio se resguarda en tu Cajita Nu y la bitácora de ocio se reinicia en limpio para el siguiente período.
          </p>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-600/30"
            >
              Archivar Quincena
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
