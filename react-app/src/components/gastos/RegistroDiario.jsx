import React, { useState } from 'react';
import { Zap, PlusCircle, List, Trash2, Eraser, CheckCircle2, CreditCard } from 'lucide-react';
import { fmt, getTodayDate } from '../../utils/formatters';

export default function RegistroDiario({
  registros,
  onAddGasto,
  onDeleteGasto,
  onLimpiarRegistro,
  onOpenCerrarQuincena
}) {
  const [fecha, setFecha] = useState(getTodayDate());
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('🚌 Pasajes Combi (Efectivo)');
  const [concepto, setConcepto] = useState('');
  const [metodo, setMetodo] = useState('Efectivo');
  const [retirado, setRetirado] = useState('Sí (Efectivo)');

  const quickButtons = [
    { label: '🚌 Combi Ida', monto: 16, cat: '🚌 Pasajes Combi (Efectivo)', con: 'Combi de ida' },
    { label: '🚌 Combi Ida y Vuelta', monto: 32, cat: '🚌 Pasajes Combi (Efectivo)', con: 'Combi ida y regreso' },
    { label: '❤️ Pasaje Novia Ida', monto: 14, cat: '🚌 Pasajes Combi (Efectivo)', con: 'Pasaje sábado con novia ida' },
    { label: '❤️ Pasaje Novia Completo', monto: 28, cat: '🚌 Pasajes Combi (Efectivo)', con: 'Pasaje sábado con novia ida y vuelta' },
    { label: '🥪 Desayuno / Torta', monto: 45, cat: '🥪 Comidas en Escuela (Efectivo)', con: 'Desayuno en escuela' },
    { label: '🍲 Comida Completa', monto: 80, cat: '🥪 Comidas en Escuela (Efectivo)', con: 'Comida corrida escolar' },
    { label: '📄 Copias / Impresiones', monto: 15, cat: '📄 Copias, Material & Papelería', con: 'Copias e impresiones' },
    { label: '✏️ Papelería / Útiles', monto: 35, cat: '📄 Copias, Material & Papelería', con: 'Material escolar' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(monto);
    if (isNaN(val) || val <= 0) return;

    onAddGasto({
      fecha,
      monto: val,
      categoria,
      concepto: concepto.trim() || 'Gasto registrado',
      metodo,
      retirado
    });

    setMonto('');
    setConcepto('');
  };

  const handleQuickClick = (item) => {
    onAddGasto({
      fecha: getTodayDate(),
      monto: item.monto,
      categoria: item.cat,
      concepto: item.con,
      metodo: 'Efectivo',
      retirado: 'Sí (Efectivo)'
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna Izquierda: Botones Rápidos + Formulario */}
      <div className="space-y-6">
        {/* Botones Rápidos */}
        <div className="glass-panel p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Botones Rápidos (1 Clic)</span>
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {quickButtons.map((btn, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickClick(btn)}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-left transition hover:scale-[1.02] flex flex-col justify-between"
              >
                <span className="text-xs text-slate-300 font-semibold truncate">{btn.label}</span>
                <span className="text-base font-black text-indigo-400 mt-1">{fmt(btn.monto)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Formulario Personalizado */}
        <div className="glass-panel p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
            <PlusCircle className="w-4 h-4 text-indigo-400" />
            <span>Registrar Gasto Personalizado</span>
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-medium">Fecha</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1 focus:border-indigo-500"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1 focus:border-indigo-500 font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1"
              >
                <option value="🚌 Pasajes Combi (Efectivo)">🚌 Pasajes Combi (Efectivo)</option>
                <option value="🥪 Comidas en Escuela (Efectivo)">🥪 Comidas en Escuela (Efectivo)</option>
                <option value="📄 Copias, Material & Papelería">📄 Copias, Material & Papelería</option>
                <option value="🛡️ Imprevistos / Por si acaso">🛡️ Imprevistos / Por si acaso</option>
                <option value="🛡️ Excedente 80%: Fondo Emergencia / Moto">🛡️ Excedente 80%: Fondo Emergencia / Moto</option>
                <option value="🍕 Excedente 20%: Refuerzo Gustos / Salidas">🍕 Excedente 20%: Refuerzo Gustos / Salidas</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 font-medium">Concepto / Detalle</label>
              <input
                type="text"
                required
                placeholder="Ej. Combi de regreso o comida"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1 focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 font-medium">Método</label>
                <select
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Débito Nu">Débito Nu</option>
                  <option value="TDC Nu">TDC Nu</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 font-medium">Retirado</label>
                <select
                  value={retirado}
                  onChange={(e) => setRetirado(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1"
                >
                  <option value="Sí (Efectivo)">Sí (Efectivo)</option>
                  <option value="En Cajita Nu">En Cajita Nu</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            {metodo === 'TDC Nu' && (
              <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-[11px] text-purple-200 flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-purple-400 shrink-0" />
                <span>💳 Se registrará automáticamente en tu <b>Tarjeta de Crédito Nu</b> como compra a pagar.</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition shadow-lg shadow-indigo-600/30"
            >
              Guardar Gasto en SQLite
            </button>
          </form>
        </div>
      </div>

      {/* Columna Derecha: Tabla Bitácora de Gastos */}
      <div className="glass-panel p-5 rounded-2xl lg:col-span-2 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <List className="w-4 h-4 text-indigo-400" />
              <span>Historial de Gastos Activos</span>
            </h3>
            <p className="text-xs text-slate-400">Persistencia instantánea sin bloqueos de Excel</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold">
              {registros?.length || 0} registros
            </span>
            <button
              onClick={onLimpiarRegistro}
              className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Limpiar a $0</span>
            </button>
            <button
              onClick={onOpenCerrarQuincena}
              className="px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition flex items-center space-x-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Cerrar Quincena</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 max-h-[500px] overflow-y-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 sticky top-0 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Día</th>
                <th className="p-3 text-right">Monto</th>
                <th className="p-3">Categoría</th>
                <th className="p-3">Concepto</th>
                <th className="p-3">Método</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(!registros || registros.length === 0) ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">
                    No hay gastos registrados en esta quincena. ¡Todo tu presupuesto sigue disponible!
                  </td>
                </tr>
              ) : (
                registros.map((r, index) => (
                  <tr key={r.id || index} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 text-slate-500 font-medium">#{r.id || index + 1}</td>
                    <td className="p-3 text-slate-300 whitespace-nowrap">{r.fecha}</td>
                    <td className="p-3 text-slate-400">{r.dia}</td>
                    <td className="p-3 text-right font-black text-rose-400">{fmt(r.monto)}</td>
                    <td className="p-3 text-indigo-300 font-medium whitespace-nowrap">{r.categoria}</td>
                    <td className="p-3 text-white font-medium">{r.concepto}</td>
                    <td className="p-3 text-slate-300">{r.metodo_pago}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onDeleteGasto(r.id)}
                        className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-4 h-4" />
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
  );
}
