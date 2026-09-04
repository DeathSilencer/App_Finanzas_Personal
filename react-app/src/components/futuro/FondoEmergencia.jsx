import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { fmt } from '../../utils/formatters';

export default function FondoEmergencia({ futuroData = {} }) {
  const fe = futuroData?.fondo_emergencia || {};
  const meta = fe.meta_total || 15000;
  const aporteMensual = fe.aporte_mensual || 1000;
  const tabla = fe.tabla || [];
  const saldoActual = futuroData?.otros_fondos?.emergencia?.aportado || 500;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-glass p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="badge-emerald">
            Paso 3 • Colchón de Seguridad
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
            🛡️ Fondo de Emergencia: Meta {fmt(meta)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Equivalente a 3 meses de gastos básicos. Aportando <b className="text-emerald-300">$500 quincenal</b> ({fmt(aporteMensual)}/mes) resguardado al 13% en tu Cajita Turbo.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-left sm:text-right shrink-0 w-full sm:w-auto">
          <span className="kpi-label">Saldo Actual Blindado</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-0.5">{fmt(saldoActual)}</h3>
        </div>
      </div>

      {/* Tabla de Proyección a 24 Meses */}
      <div className="card-glass p-4 sm:p-6">
        <div className="table-responsive-container max-h-[550px] overflow-y-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th className="table-modern-th">Plazo</th>
                <th className="table-modern-th text-right">Aporte del Mes</th>
                <th className="table-modern-th text-right">Rendimiento Mensual (13%)</th>
                <th className="table-modern-th text-right font-black text-emerald-400">Saldo Acumulado</th>
                <th className="table-modern-th text-center">% de la Meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tabla.map((row, idx) => (
                <tr key={idx} className="table-modern-tr">
                  <td className="table-modern-td font-bold text-white">{row.mes}</td>
                  <td className="table-modern-td text-right text-slate-300">{fmt(row.aporte)}</td>
                  <td className="table-modern-td text-right font-bold text-emerald-400">+{fmt(row.rendimiento_mes)}</td>
                  <td className="table-modern-td text-right font-black text-white">{fmt(row.saldo_acumulado)}</td>
                  <td className="table-modern-td text-center font-bold text-emerald-400">{row.pct_meta}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
