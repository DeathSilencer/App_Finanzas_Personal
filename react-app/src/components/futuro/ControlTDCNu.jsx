import React, { useState } from 'react';
import { CreditCard, PlusCircle, Trash2, CheckCircle2, DollarSign } from 'lucide-react';
import { fmt, getTodayDate } from '../../utils/formatters';

export default function ControlTDCNu({
  tdcData = {},
  onAddCompra,
  onDeleteCompra,
  onLiquidarDeuda
}) {
  const compras = tdcData.compras || [];
  const deuda = tdcData.deuda_actual || 0;
  const limite = tdcData.limite_credito || 4000;
  const disponible = tdcData.saldo_disponible || limite;
  const usoPct = tdcData.pct_uso || 0;
  const corte = tdcData.proximo_corte || "Día 23";
  const pago = tdcData.proximo_pago || "Día 3";

  const [fecha, setFecha] = useState(getTodayDate());
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState('Básicos');
  const [tipo, setTipo] = useState('Gasto Diario');
  const [apartado, setApartado] = useState('Sí (En Cajita)');

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(monto);
    if (isNaN(val) || val <= 0) return;

    onAddCompra({
      fecha,
      monto: val,
      concepto: concepto.trim() || 'Compra TDC Nu',
      categoria,
      tipo,
      apartado,
      estado: 'Pendiente'
    });

    setMonto('');
    setConcepto('');
  };

  return (
    <div className="space-y-6">
      {/* 4 KPIs de Tarjeta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-purple-500/30">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Límite de Crédito Nu</p>
          <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">{fmt(limite)}</h3>
          <p className="text-xs text-purple-300 mt-2 font-semibold">TDC Nu Gold / Platinum</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-rose-500/30">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deuda Actual / Gastado</p>
          <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">{fmt(deuda)}</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">{usoPct}% de uso de línea</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-emerald-500/30">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo Disponible</p>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{fmt(disponible)}</h3>
          <p className="text-xs text-emerald-300 mt-2 font-semibold">Línea libre para compras</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-amber-500/30">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Próximas Fechas</p>
          <h4 className="text-sm font-black text-white mt-1">Corte: <span className="text-amber-300">{corte}</span></h4>
          <p className="text-xs text-amber-300 mt-2 font-semibold">Límite Pago: {pago}</p>
        </div>
      </div>

      {/* Grid: Formulario + Tabla de Compras */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <PlusCircle className="w-4 h-4 text-purple-400" />
            <span>Registrar Compra con TDC Nu</span>
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-medium">Fecha</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium">Monto ($ MXN)</label>
              <input
                type="number"
                step="0.5"
                required
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1 font-bold focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium">Concepto / Establecimiento</label>
              <input
                type="text"
                required
                placeholder="Ej. Oxxo / Despensa / Gasolina"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1"
              >
                <option value="Básicos">Básicos</option>
                <option value="Ocio">Ocio</option>
                <option value="Imprevistos">Imprevistos</option>
                <option value="Copias/Material">Copias/Material</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 font-medium">¿Apartado en Cajita Básicos?</label>
              <select
                value={apartado}
                onChange={(e) => setApartado(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1"
              >
                <option value="Sí (En Cajita)">Sí (En Cajita al 13%)</option>
                <option value="Pendiente">Pendiente por apartar</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition shadow-lg shadow-purple-600/30"
            >
              Guardar Compra en SQLite
            </button>
          </form>

          {deuda > 0 && (
            <button
              onClick={onLiquidarDeuda}
              className="w-full py-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Liquidar Toda la Deuda ({fmt(deuda)})</span>
            </button>
          )}
        </div>

        {/* Tabla de Compras */}
        <div className="glass-panel p-5 rounded-2xl lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span>Movimientos de Tarjeta Nu</span>
            </h3>
            <span className="text-xs text-slate-400">{compras.length} compras</span>
          </div>

          <div className="overflow-x-auto max-h-[480px] overflow-y-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 sticky top-0 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Concepto</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Apartado Cajita</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {compras.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-500">
                      No hay compras registradas en tu tarjeta. Deuda: $0.00.
                    </td>
                  </tr>
                ) : (
                  compras.map((c, i) => (
                    <tr key={c.id || i} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-slate-500">#{c.id || i + 1}</td>
                      <td className="p-3 text-slate-300 whitespace-nowrap">{c.fecha}</td>
                      <td className="p-3 font-medium text-white">{c.concepto}</td>
                      <td className="p-3 text-right font-black text-rose-400">{fmt(c.monto)}</td>
                      <td className="p-3 text-slate-400">{c.categoria}</td>
                      <td className="p-3 text-purple-300">{c.apartado}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          c.estado === 'Liquidado'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}>
                          {c.estado || 'Pendiente'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onDeleteCompra(c.id)}
                          className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                          title="Eliminar"
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
      </div>
    </div>
  );
}
