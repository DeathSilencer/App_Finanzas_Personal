import React from 'react';
import { Award, TrendingUp } from 'lucide-react';
import { fmt } from '../../utils/formatters';

export default function RetiroSAT({ futuroData = {} }) {
  const sat = futuroData?.retiro_sat || {};
  const tasaAfore = (sat.tasa_anual_afore || 0.085) * 100;
  const aporteAnual = sat.aporte_anual || 6000;
  const tabla = sat.tabla || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-900 border border-purple-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-black uppercase">
            Paso 6 • Beneficio Fiscal Art. 151
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
            🚀 Retiro Deducible &amp; Afore XXI Banorte
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Aportando <b className="text-purple-300">$250 quincenal</b> ({fmt(aporteAnual)}/año). Obtienes devolución de impuestos cada abril y rendimientos al <b className="text-emerald-400">{tasaAfore.toFixed(1)}% anual</b>.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 text-right">
          <span className="text-[10px] text-slate-400 uppercase font-extrabold">Saldo AFORE al Año 25</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-0.5">
            {fmt(tabla[tabla.length - 1]?.saldo_afore || 525000)}
          </h3>
        </div>
      </div>

      {/* Tabla a 25 Años */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl">
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900/90 sticky top-0 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Plazo / Año</th>
                <th className="p-3.5 text-right">Ahorro en Bolsa</th>
                <th className="p-3.5 text-right font-bold text-teal-400">Devolución SAT (15%)</th>
                <th className="p-3.5 text-right font-black text-emerald-400">Saldo AFORE Estimado</th>
                <th className="p-3.5 text-right font-bold text-indigo-300">Ganancia Neta</th>
                <th className="p-3.5 text-center font-bold text-amber-400">Multiplicador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tabla.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5 font-bold text-white">{row.anio}</td>
                  <td className="p-3.5 text-right text-slate-300">{fmt(row.ahorro_bolsa)}</td>
                  <td className="p-3.5 text-right font-bold text-teal-400">+{fmt(row.devuelto_sat)}</td>
                  <td className="p-3.5 text-right font-black text-emerald-400">{fmt(row.saldo_afore)}</td>
                  <td className="p-3.5 text-right font-bold text-indigo-300">{fmt(row.ganancia_neta)}</td>
                  <td className="p-3.5 text-center font-bold text-amber-400">{row.efecto_mult}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
