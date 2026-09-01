import React, { useState, useMemo } from 'react';
import { FileText, Printer, Calendar, PieChart, Receipt, Trash2 } from 'lucide-react';
import { fmt } from '../../utils/formatters';

export default function EstadoCuentaMensual({
  historial = [],
  onDeleteCierre,
  onOpenCerrarQuincena
}) {
  // Lista de meses disponibles en el historial
  const mesesDisponibles = useMemo(() => {
    const setMeses = new Set();
    historial.forEach(c => {
      const mes = c.mes || (c.fecha_cierre ? c.fecha_cierre.substring(0, 7) : 'General');
      setMeses.add(mes);
    });
    return Array.from(setMeses);
  }, [historial]);

  const [mesSeleccionado, setMesSeleccionado] = useState(
    mesesDisponibles[0] || 'Todos'
  );

  // Filtrar quincenas del mes seleccionado
  const quincenasMes = useMemo(() => {
    if (mesSeleccionado === 'Todos' || !mesSeleccionado) return historial;
    return historial.filter(c => (c.mes || c.fecha_cierre?.substring(0, 7)) === mesSeleccionado);
  }, [historial, mesSeleccionado]);

  // Cálculos consolidados del mes
  const ingresoMes = quincenasMes.reduce((acc, q) => acc + (q.presupuesto || 0), 0);
  const gastadoMes = quincenasMes.reduce((acc, q) => acc + (q.gasto_real || 0), 0);
  const remanenteMes = quincenasMes.reduce((acc, q) => acc + (q.remanente || 0), 0);
  const motoMes = quincenasMes.reduce((acc, q) => acc + (q.ahorro_moto_80 || 0), 0);
  const salidasMes = quincenasMes.reduce((acc, q) => acc + (q.refuerzo_gustos_20 || 0), 0);
  const pctGastadoMes = ingresoMes > 0 ? ((gastadoMes / ingresoMes) * 100).toFixed(1) : 0;

  // Consolidar categorías de todas las quincenas del mes
  const categoriasConsolidadas = useMemo(() => {
    const cats = {};
    quincenasMes.forEach(q => {
      const detalle = q.detalle || {};
      const desglose = detalle.desglose_categorias || {};
      Object.entries(desglose).forEach(([catName, monto]) => {
        cats[catName] = (cats[catName] || 0) + monto;
      });
    });
    return Object.entries(cats).map(([categoria, gasto]) => ({
      categoria,
      gasto_real: gasto
    }));
  }, [quincenasMes]);

  // Bitácora exhaustiva de movimientos de todas las quincenas del mes
  const movimientosMes = useMemo(() => {
    const movs = [];
    quincenasMes.forEach(q => {
      const detalle = q.detalle || {};
      const items = detalle.movimientos || [];
      items.forEach(m => {
        movs.push({
          ...m,
          quincenaPeriodo: q.periodo
        });
      });
    });
    return movs;
  }, [quincenasMes]);

  return (
    <div className="space-y-6">
      {/* Header del Estado de Cuenta */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-teal-800/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">Estado de Cuenta Mensual</h2>
            <p className="text-xs text-slate-400">Consolidado automático de quincenas archivadas en SQLite</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {mesesDisponibles.length > 0 && (
            <div className="flex items-center space-x-2">
              <label className="text-xs text-slate-400 font-semibold">Seleccionar Mes:</label>
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:border-teal-500"
              >
                <option value="Todos">Todas las quincenas</option>
                {mesesDisponibles.map((m, idx) => (
                  <option key={idx} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
          <button
            onClick={onOpenCerrarQuincena}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Archivar Quincena Actual</span>
          </button>
        </div>
      </div>

      {/* 4 Cards de Resumen Mensual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-teal-500/30">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingreso Total Mensual</p>
          <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">{fmt(ingresoMes)}</h3>
          <p className="text-xs text-teal-400 mt-2 font-semibold">{quincenasMes.length} quincenas cerradas</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-rose-500/30">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Gastado en el Mes</p>
          <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">{fmt(gastadoMes)}</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">{pctGastadoMes}% del ingreso</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-emerald-500/30">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Ahorrado / Remanente</p>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{fmt(remanenteMes)}</h3>
          <p className="text-xs text-emerald-400 mt-2 font-semibold">Dinero protegido en cuenta</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-purple-500/30">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aporte Acumulado Moto (80%)</p>
          <h3 className="text-2xl sm:text-3xl font-black text-purple-400 mt-1">{fmt(motoMes)}</h3>
          <p className="text-xs text-purple-300 mt-2 font-semibold">Salidas (20%): {fmt(salidasMes)}</p>
        </div>
      </div>

      {/* Tabla de Quincenas Archivadas */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-teal-400" />
            <span>Quincenas Archivadas</span>
          </h3>
          <span className="text-xs text-slate-400">{quincenasMes.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Período</th>
                <th className="p-3.5 text-center">Fecha Cierre</th>
                <th className="p-3.5 text-right">Presupuesto</th>
                <th className="p-3.5 text-right">Gastos Fijos</th>
                <th className="p-3.5 text-right">Gasto Real</th>
                <th className="p-3.5 text-right">Remanente</th>
                <th className="p-3.5 text-right">Ahorro Moto (80%)</th>
                <th className="p-3.5 text-center">Movimientos</th>
                <th className="p-3.5 text-center min-w-[80px]">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {quincenasMes.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-500">
                    No hay quincenas archivadas aún. Haz clic en "Cerrar Quincena" para archivar tu primer período.
                  </td>
                </tr>
              ) : (
                quincenasMes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-white whitespace-nowrap">{q.periodo}</td>
                    <td className="p-3.5 text-center text-slate-400 whitespace-nowrap">{q.fecha_cierre}</td>
                    <td className="p-3.5 text-right font-semibold text-slate-300">{fmt(q.presupuesto)}</td>
                    <td className="p-3.5 text-right text-slate-400">{fmt(q.gastos_fijos)}</td>
                    <td className="p-3.5 text-right font-bold text-rose-400">{fmt(q.gasto_real)}</td>
                    <td className="p-3.5 text-right font-black text-emerald-400">{fmt(q.remanente)}</td>
                    <td className="p-3.5 text-right font-black text-purple-300">{fmt(q.ahorro_moto_80)}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {q.num_movimientos} movs
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onDeleteCierre(q.id)}
                        className="p-1 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                        title="Eliminar del histórico"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Desglose Consolidado por Categoría */}
      {categoriasConsolidadas.length > 0 && (
        <div className="glass-panel p-5 sm:p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-teal-400" />
              <span>Desglose Consolidado de Gastos por Categoría</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Categoría / Rubro</th>
                  <th className="p-3.5 text-right">Gasto Total Acumulado</th>
                  <th className="p-3.5 text-center">% del Gasto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {categoriasConsolidadas.map((cat, idx) => {
                  const pct = gastadoMes > 0 ? ((cat.gasto_real / gastadoMes) * 100).toFixed(1) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-bold text-white">{cat.categoria}</td>
                      <td className="p-3.5 text-right font-black text-rose-400">{fmt(cat.gasto_real)}</td>
                      <td className="p-3.5 text-center font-semibold text-slate-300">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bitácora Exhaustiva de Movimientos */}
      {movimientosMes.length > 0 && (
        <div className="glass-panel p-5 sm:p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-teal-400" />
              <span>Bitácora Exhaustiva de Movimientos</span>
            </h3>
            <span className="text-xs text-slate-400">{movimientosMes.length} movimientos</span>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 sticky top-0 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Quincena</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Concepto</th>
                  <th className="p-3">Método</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {movimientosMes.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 text-slate-500 font-medium">#{idx + 1}</td>
                    <td className="p-3 text-slate-300 whitespace-nowrap">{m.fecha}</td>
                    <td className="p-3 text-teal-300 whitespace-nowrap">{m.quincenaPeriodo}</td>
                    <td className="p-3 text-right font-black text-rose-400">{fmt(m.monto)}</td>
                    <td className="p-3 text-slate-300">{m.categoria}</td>
                    <td className="p-3 text-white font-medium">{m.concepto}</td>
                    <td className="p-3 text-slate-400">{m.metodo_pago}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
