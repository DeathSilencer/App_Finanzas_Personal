import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { fmt, getTodayDate } from '../../utils/formatters';

export default function CerrarQuincenaModal({
  isOpen,
  onClose,
  resumen = {},
  onConfirm
}) {
  if (!isOpen) return null;

  const now = new Date();
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const defaultPeriodo = `${now.getDate() <= 15 ? '1ra' : '2da'} Quincena ${meses[now.getMonth()]} ${now.getFullYear()}`;

  const [periodo, setPeriodo] = useState(defaultPeriodo);
  const [fechaCierre, setFechaCierre] = useState(getTodayDate());
  const [anio, setAnio] = useState(now.getFullYear());

  const presupuesto = resumen.presupuesto_total || 2500;
  const gastoReal = resumen.gasto_total_real || 0;
  const remanente = resumen.remanente_total ?? 2500;
  const ahorroMoto = resumen.excedente_80_moto || 1400;
  const refuerzoOcio = resumen.excedente_20_salidas || 350;

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
              <h3 className="text-base font-bold text-white">Cerrar Quincena de Gastos</h3>
              <p className="text-xs text-slate-400">Archivar período y calcular ahorro moto (80%)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Card Resumen de Cierre */}
          <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300">Presupuesto Asignado:</span>
              <span className="font-bold text-white">{fmt(presupuesto)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Gasto Real Ejecutado:</span>
              <span className="font-bold text-rose-400">{fmt(gastoReal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Remanente no consumido:</span>
              <span className="font-bold text-emerald-400">{fmt(remanente)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-emerald-800/40">
              <span className="text-purple-300 font-bold">Abono Seguro a la Moto (80%):</span>
              <span className="font-black text-purple-300 text-sm">{fmt(ahorroMoto)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-300 font-medium">Refuerzo Salidas (20%):</span>
              <span className="font-bold text-amber-300">{fmt(refuerzoOcio)}</span>
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
            💡 Al cerrar, tu abono a la moto se suma al ahorro acumulado y la bitácora de gastos diarios se reinicia limpia para la siguiente quincena.
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
