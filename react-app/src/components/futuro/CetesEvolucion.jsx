import React from 'react';
import { Lock, TrendingUp } from 'lucide-react';
import { fmt } from '../../utils/formatters';

export default function CetesEvolucion({ futuroData = {} }) {
  const cetes = futuroData?.cetes || {};
  const tasa = (cetes.tasa_anual || 0.0645) * 100;
  const aporteAnual = cetes.aporte_anual || 6000;
  const tabla = cetes.tabla || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-blue-950/50 via-slate-900 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-black uppercase">
            Paso 1 • Interés Compuesto
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
            🔒 Cetesdirecto a 25 Años
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Aportando <b className="text-blue-300">$250 quincenal</b> ({fmt(aporteAnual)} al año) reinvertido a una tasa estimada del <b className="text-emerald-400">{tasa.toFixed(2)}% anual</b>.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 text-right">
          <span className="text-[10px] text-slate-400 uppercase font-extrabold">Saldo al Año 25</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-0.5">
            {fmt(tabla[tabla.length - 1]?.saldo_total || 370000)}
          </h3>
        </div>
      </div>

      {/* Tabla a 25 años */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl">
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900/90 sticky top-0 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Plazo / Año</th>
                <th className="p-3.5 text-right">Ahorro en Bolsa (Puesto de tu bolsa)</th>
                <th className="p-3.5 text-right">Interés Compuesto Generado</th>
                <th className="p-3.5 text-right font-black text-emerald-400">Saldo Total Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tabla.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5 font-bold text-white">{row.anio}</td>
                  <td className="p-3.5 text-right text-slate-300">{fmt(row.ahorro_bolsa)}</td>
                  <td className="p-3.5 text-right font-bold text-blue-400">+{fmt(row.interes_acumulado)}</td>
                  <td className="p-3.5 text-right font-black text-emerald-400">{fmt(row.saldo_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
