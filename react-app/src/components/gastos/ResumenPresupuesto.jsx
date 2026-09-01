import React from 'react';
import { LayoutGrid, Table, CheckCircle2, Sliders } from 'lucide-react';
import { fmt } from '../../utils/formatters';

export default function ResumenPresupuesto({
  data,
  onOpenCerrarQuincena,
  onOpenConfig
}) {
  const resumen = data?.resumen || {};
  const categorias = data?.categorias || [];

  const presupuestoTotal = resumen.presupuesto_total || 2500;
  const gastoReal = resumen.gasto_total_real || 0;
  const remanente = resumen.remanente_total ?? 2500;
  const pctConsumido = resumen.pct_consumido || 0;
  const totalFijos = resumen.total_gastos_fijos || 750;
  const efectivo = resumen.efectivo_a_retirar || 500;
  const excedente = resumen.excedente_base_fijo || 1750;
  const excedenteMoto = resumen.excedente_80_moto || 1400;
  const excedenteSalidas = resumen.excedente_20_salidas || 350;

  return (
    <div className="space-y-6">
      {/* 4 KPIs Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="glass-panel p-5 rounded-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Presupuesto Quincenal</p>
          <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">{fmt(presupuestoTotal)}</h3>
          <p className="text-xs text-indigo-400 mt-2 font-semibold">
            Gastos fijos: <span className="text-slate-300">{fmt(totalFijos)}</span>
          </p>
        </div>

        {/* KPI 2 */}
        <div className="glass-panel p-5 rounded-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gasto Real Actual</p>
          <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">{fmt(gastoReal)}</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">{pctConsumido}% consumido</p>
        </div>

        {/* KPI 3 */}
        <div className="glass-panel p-5 rounded-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Efectivo a Retirar (Día de Pago)</p>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{fmt(efectivo)}</h3>
          <p className="text-xs text-slate-300 mt-2 font-medium">
            {fmt(resumen.monto_combi || 320)} Combi + {fmt(resumen.monto_comida || 180)} Comidas
          </p>
        </div>

        {/* KPI 4 */}
        <div className="glass-panel p-5 rounded-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Excedente Total Base</p>
          <h3 className="text-2xl sm:text-3xl font-black text-purple-400 mt-1">{fmt(excedente)}</h3>
          <p className="text-xs text-purple-300 mt-2 font-semibold">
            80% Moto ({fmt(excedenteMoto)}) | 20% Salidas ({fmt(excedenteSalidas)})
          </p>
        </div>
      </div>

      {/* Barra de Progreso del Presupuesto */}
      <div className="glass-panel p-5 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Progreso del Presupuesto Quincenal:</span>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
              Total Gastado: {fmt(gastoReal)}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-emerald-400">Disponible: {fmt(remanente)}</span>
            <button
              onClick={onOpenCerrarQuincena}
              className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition flex items-center space-x-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Cerrar Quincena</span>
            </button>
          </div>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, pctConsumido)}%` }}
          ></div>
        </div>
      </div>

      {/* Tabla de Control de Gastos por Categoría */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Table className="w-4 h-4 text-indigo-400" />
              <span>Tabla de Control de Gastos por Categoría</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cálculos automáticos sincronizados con SQLite
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenCerrarQuincena}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cerrar Quincena Actual</span>
            </button>
            <button
              onClick={onOpenConfig}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition"
            >
              <Sliders className="w-3 h-3" />
              <span>Configuración</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Categoría / Rubro</th>
                <th className="p-3.5">Mecánica / Detalle Operativo</th>
                <th className="p-3.5 text-right">Presupuesto</th>
                <th className="p-3.5 text-center">% Asignado</th>
                <th className="p-3.5 text-right">Gasto Real</th>
                <th className="p-3.5 text-right">Remanente</th>
                <th className="p-3.5 text-center">% Consumido</th>
                <th className="p-3.5 text-center min-w-[140px]">Semáforo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {categorias.map((cat, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5 font-bold text-white whitespace-nowrap">{cat.categoria}</td>
                  <td className="p-3.5 text-slate-400 text-xs">{cat.mecanica}</td>
                  <td className="p-3.5 text-right font-semibold text-white">{fmt(cat.presupuesto)}</td>
                  <td className="p-3.5 text-center text-slate-300 font-semibold">{cat.pct}%</td>
                  <td className="p-3.5 text-right font-bold text-rose-400">{fmt(cat.gasto_real)}</td>
                  <td className="p-3.5 text-right font-black text-emerald-400">{fmt(cat.remanente)}</td>
                  <td className="p-3.5 text-center font-bold text-slate-300">{cat.pct_consumido}%</td>
                  <td className="p-3.5 text-center">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-700 whitespace-nowrap">
                      {cat.semaforo}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
