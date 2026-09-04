import React from 'react';
import { LayoutGrid, Table, CheckCircle2, Sliders, Wallet } from 'lucide-react';
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
  const totalFijos = resumen.total_gastos_fijos || 806;
  const excedente = resumen.excedente_base_fijo || 1694;
  const excedenteMoto = resumen.excedente_80_moto || 1355.2;
  const excedenteSalidas = resumen.excedente_20_salidas || 338.8;

  // Variables de Efectivo y Compensación Inteligente
  const montoCombi = resumen.monto_combi || 376;
  const montoComida = resumen.monto_comida || 180;
  const montoCopias = resumen.monto_copias || 50;
  const presupuestoEfectivoBase = resumen.presupuesto_efectivo_base || (montoCombi + montoComida + montoCopias);
  const sobranteEfectivoMano = resumen.sobrante_efectivo_mano || 0;
  const efectivoNetoRetirar = resumen.efectivo_neto_retirar ?? (presupuestoEfectivoBase - sobranteEfectivoMano);

  const sobranteCombi = resumen.sobrante_combi ?? 0;
  const sobranteComida = resumen.sobrante_comida ?? 0;
  const sobranteCopias = resumen.sobrante_copias ?? 0;
  const sacarCombi = resumen.sacar_combi ?? Math.max(0, montoCombi - sobranteCombi);
  const sacarComida = resumen.sacar_comida ?? Math.max(0, montoComida - sobranteComida);
  const sacarCopias = resumen.sacar_copias ?? Math.max(0, montoCopias - sobranteCopias);
  const gastoCopiasDigital = resumen.gasto_copias_digital || 0;

  const saldoImpNu = resumen.saldo_imprevistos_nu ?? (resumen.monto_imprevistos || 200);
  const fondearImp = resumen.fondear_imprevistos ?? Math.max(0, (resumen.monto_imprevistos || 200) - saldoImpNu);

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 4 KPIS SUPERIORES */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Presupuesto Total */}
        <div className="glass-panel p-5 rounded-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Presupuesto Quincenal</p>
          <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">{fmt(presupuestoTotal)}</h3>
          <p className="text-xs text-indigo-400 mt-2 font-semibold">
            Gastos fijos: <span className="text-slate-300">{fmt(totalFijos)}</span>
          </p>
        </div>

        {/* KPI 2: Gasto Real */}
        <div className="glass-panel p-5 rounded-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gasto Real Actual</p>
          <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">{fmt(gastoReal)}</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">{pctConsumido}% consumido</p>
        </div>

        {/* KPI 3: Efectivo Neto Real a Retirar */}
        <div className="glass-panel p-5 rounded-2xl border-emerald-500/40">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Efectivo Neto a Retirar (Cajero)</p>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{fmt(efectivoNetoRetirar)}</h3>
          <p className="text-xs text-slate-300 mt-2 font-medium">
            {sobranteEfectivoMano > 0 ? (
              <span>
                Base: {fmt(presupuestoEfectivoBase)} | <b className="text-amber-300">En mano: -{fmt(sobranteEfectivoMano)}</b>
              </span>
            ) : (
              <span>{fmt(montoCombi)} Combi + {fmt(montoComida)} Comidas + {fmt(montoCopias)} Copias</span>
            )}
          </p>
        </div>

        {/* KPI 4: Excedente Total */}
        <div className="glass-panel p-5 rounded-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Excedente Total Base</p>
          <h3 className="text-2xl sm:text-3xl font-black text-purple-400 mt-1">{fmt(excedente)}</h3>
          <p className="text-xs text-purple-300 mt-2 font-semibold">
            80% Moto ({fmt(excedenteMoto)}) | 20% Salidas ({fmt(excedenteSalidas)})
          </p>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PANEL INTELIGENTE DE RETIRO EN CAJERO Y COMPENSACIÓN DE SOBRANTES */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-md">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Recomendación Inteligente de Retiro en Cajero (Compensación de Sobrantes)
              </h3>
              <p className="text-xs text-slate-400">
                Calculado en tiempo real según el efectivo físico que aún tienes en mano
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold self-start sm:self-auto">
            💵 Efectivo Físico Optimizado
          </span>
        </div>

        {/* 3 Cajas Destacadas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Presupuesto Efectivo Base:
            </span>
            <h4 className="text-2xl font-black text-white mt-1">{fmt(presupuestoEfectivoBase)}</h4>
            <p className="text-[10px] text-slate-400 mt-1">({fmt(montoCombi)} Pasajes + {fmt(montoComida)} Comidas + {fmt(montoCopias)} Copias)</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Sobrante que Tienes en Mano:
            </span>
            <h4 className={`text-2xl font-black mt-1 ${sobranteEfectivoMano > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
              -{fmt(sobranteEfectivoMano)}
            </h4>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">Ahorro de retiro físico</p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 shadow-lg shadow-emerald-950/60 flex flex-col justify-center">
            <span className="text-[11px] font-black text-emerald-300 uppercase tracking-wider">
              🏦 EFECTIVO NETO A RETIRAR ESTA QUINCENA:
            </span>
            <h4 className="text-3xl font-black text-emerald-300 mt-1">{fmt(efectivoNetoRetirar)}</h4>
            <p className="text-[10px] text-emerald-200 font-semibold mt-1">Monto exacto para el cajero</p>
          </div>
        </div>

        {/* Caja Informativa con Instrucciones Específicas */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-xs text-slate-300 space-y-2">
          <p className="font-bold text-white flex items-center space-x-1.5">
            <span className="text-amber-400">💡</span>
            <span>Instrucción Exacta de Retiro y Fondeo para el Próximo Día de Pago:</span>
          </p>
          <ul className="space-y-1.5 pl-2">
            <li className="flex items-start space-x-1.5">
              <span>🚌</span>
              <span>
                <b className="text-white">Pasajes Combi:</b> Retirar <b className="text-emerald-400">{fmt(sacarCombi)}</b> en cajero (en lugar de {fmt(montoCombi)}, porque ya cuentas con <b className="text-amber-300">{fmt(sobranteCombi)}</b> de remanente en mano).
              </span>
            </li>
            <li className="flex items-start space-x-1.5">
              <span>🥪</span>
              <span>
                <b className="text-white">Comidas Escuela:</b> Retirar <b className="text-emerald-400">{fmt(sacarComida)}</b> en cajero (en lugar de {fmt(montoComida)}, porque ya cuentas con <b className="text-amber-300">{fmt(sobranteComida)}</b> de remanente en mano).
              </span>
            </li>
            <li className="flex items-start space-x-1.5">
              <span>📄</span>
              <span>
                <b className="text-white">Copias &amp; Papelería:</b> Retirar <b className="text-emerald-400">{fmt(sacarCopias)}</b> en cajero (en lugar de {fmt(montoCopias)}, porque ya cuentas con <b className="text-amber-300">{fmt(sobranteCopias)}</b> de remanente en mano
                {gastoCopiasDigital > 0 ? ` • ${fmt(gastoCopiasDigital)} pagados por transferencia Nu` : ''}).
              </span>
            </li>
            <li className="flex items-start space-x-1.5">
              <span>🛡️</span>
              <span>
                <b className="text-white">Imprevistos:</b> Cuentas con <b className="text-purple-300">{fmt(saldoImpNu)}</b> resguardados en Cajita Nu (solo requieres asignar <b className="text-indigo-300">{fmt(fondearImp)}</b> adicionales).
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* BARRA DE PROGRESO DEL PRESUPUESTO */}
      {/* ────────────────────────────────────────────────────────────────── */}
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

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* TABLA DE CONTROL DE GASTOS POR CATEGORÍA */}
      {/* ────────────────────────────────────────────────────────────────── */}
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
