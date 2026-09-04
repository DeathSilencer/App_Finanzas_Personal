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
      <div className="card-glass p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-blue-950/50 via-slate-900 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="badge-sky">
            Paso 1 • Interés Compuesto
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
            🔒 Cetesdirecto a 25 Años
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Aportando <b className="text-blue-300">$250 quincenal</b> ({fmt(aporteAnual)} al año) reinvertido a una tasa estimada del <b className="text-emerald-400">{tasa.toFixed(2)}% anual</b>.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 text-left sm:text-right shrink-0 w-full sm:w-auto">
          <span className="kpi-label">Saldo al Año 25</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-0.5">
            {fmt(tabla[tabla.length - 1]?.saldo_total || 370000)}
          </h3>
        </div>
      </div>

      {/* Tabla a 25 años */}
      <div className="card-glass p-4 sm:p-6">
        <div className="table-responsive-container max-h-[550px] overflow-y-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th className="table-modern-th">Plazo / Año</th>
                <th className="table-modern-th text-right">Ahorro en Bolsa (Puesto de tu bolsa)</th>
                <th className="table-modern-th text-right">Interés Compuesto Generado</th>
                <th className="table-modern-th text-right font-black text-emerald-400">Saldo Total Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tabla.map((row, idx) => (
                <tr key={idx} className="table-modern-tr">
                  <td className="table-modern-td font-bold text-white">{row.anio}</td>
                  <td className="table-modern-td text-right text-slate-300">{fmt(row.ahorro_bolsa)}</td>
                  <td className="table-modern-td text-right font-bold text-blue-400">+{fmt(row.interes_acumulado)}</td>
                  <td className="table-modern-td text-right font-black text-emerald-400">{fmt(row.saldo_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
