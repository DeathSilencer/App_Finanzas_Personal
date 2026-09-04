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
      <div className="card-glass p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-900 border border-purple-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="badge-purple">
            Paso 6 • Beneficio Fiscal Art. 151
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
            🚀 Retiro Deducible &amp; Afore XXI Banorte
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Aportando <b className="text-purple-300">$250 quincenal</b> ({fmt(aporteAnual)}/año). Obtienes devolución de impuestos cada abril y rendimientos al <b className="text-emerald-400">{tasaAfore.toFixed(1)}% anual</b>.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 text-left sm:text-right shrink-0 w-full sm:w-auto">
          <span className="kpi-label">Saldo AFORE al Año 25</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-0.5">
            {fmt(tabla[tabla.length - 1]?.saldo_afore || 525000)}
          </h3>
        </div>
      </div>

      {/* Tabla a 25 Años */}
      <div className="card-glass p-4 sm:p-6">
        <div className="table-responsive-container max-h-[550px] overflow-y-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th className="table-modern-th">Plazo / Año</th>
                <th className="table-modern-th text-right">Ahorro en Bolsa</th>
                <th className="table-modern-th text-right font-bold text-teal-400">Devolución SAT (15%)</th>
                <th className="table-modern-th text-right font-black text-emerald-400">Saldo AFORE Estimado</th>
                <th className="table-modern-th text-right font-bold text-indigo-300">Ganancia Neta</th>
                <th className="table-modern-th text-center font-bold text-amber-400">Multiplicador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tabla.map((row, idx) => (
                <tr key={idx} className="table-modern-tr">
                  <td className="table-modern-td font-bold text-white">{row.anio}</td>
                  <td className="table-modern-td text-right text-slate-300">{fmt(row.ahorro_bolsa)}</td>
                  <td className="table-modern-td text-right font-bold text-teal-400">+{fmt(row.devuelto_sat)}</td>
                  <td className="table-modern-td text-right font-black text-emerald-400">{fmt(row.saldo_afore)}</td>
                  <td className="table-modern-td text-right font-bold text-indigo-300">{fmt(row.ganancia_neta)}</td>
                  <td className="table-modern-td text-center font-bold text-amber-400">{row.efecto_mult}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
