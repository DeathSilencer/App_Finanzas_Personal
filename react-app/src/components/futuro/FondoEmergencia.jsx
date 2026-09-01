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
      <div className="glass-panel p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase">
            Paso 3 • Colchón de Seguridad
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
            🛡️ Fondo de Emergencia: Meta {fmt(meta)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Equivalente a 3 meses de gastos básicos. Aportando <b className="text-emerald-300">$500 quincenal</b> ({fmt(aporteMensual)}/mes) resguardado al 13% en tu Cajita Turbo.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-right">
          <span className="text-[10px] text-slate-400 uppercase font-extrabold">Saldo Actual Blindado</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-0.5">{fmt(saldoActual)}</h3>
        </div>
      </div>

      {/* Tabla de Proyección a 24 Meses */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl">
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900/90 sticky top-0 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Plazo</th>
                <th className="p-3.5 text-right">Aporte del Mes</th>
                <th className="p-3.5 text-right">Rendimiento Mensual (13%)</th>
                <th className="p-3.5 text-right font-black text-emerald-400">Saldo Acumulado</th>
                <th className="p-3.5 text-center">% de la Meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tabla.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5 font-bold text-white">{row.mes}</td>
                  <td className="p-3.5 text-right text-slate-300">{fmt(row.aporte)}</td>
                  <td className="p-3.5 text-right font-bold text-emerald-400">+{fmt(row.rendimiento_mes)}</td>
                  <td className="p-3.5 text-right font-black text-white">{fmt(row.saldo_acumulado)}</td>
                  <td className="p-3.5 text-center font-bold text-emerald-400">{row.pct_meta}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
