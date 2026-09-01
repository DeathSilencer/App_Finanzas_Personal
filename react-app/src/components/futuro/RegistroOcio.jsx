import React, { useState } from 'react';
import { PartyPopper, Zap, PlusCircle, List, Trash2, CheckCircle2, CreditCard } from 'lucide-react';
import { fmt, getTodayDate } from '../../utils/formatters';

export default function RegistroOcio({
  futuroData = {},
  onAddGastoOcio,
  onDeleteGastoOcio,
  onOpenCerrarQuincena
}) {
  const of = futuroData?.otros_fondos || {};
  const ocio = of.ocio || {};
  const cajita = of.cajita_turbo || {};
  const registros = of.registros_ocio || [];

  const presupuesto = ocio.presupuesto || 1500;
  const gastado = ocio.gasto_real || 0;
  const disponible = ocio.remanente ?? 1500;
  const pctConsumido = ocio.pct_consumido || 0;
  const totalCajita = cajita.gran_total || 2000;

  const [fecha, setFecha] = useState(getTodayDate());
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('🍕 Salidas & Gustos');
  const [concepto, setConcepto] = useState('');
  const [metodo, setMetodo] = useState('Débito Nu');

  const quickItems = [
    { monto: 45, label: '☕ Café / Snack', cat: '🍕 Salidas & Gustos', concepto: 'Café / Snack' },
    { monto: 150, label: '🍔 Comida Fuera', cat: '🍔 Comida Fuera / Restaurantes', concepto: 'Comida en restaurante' },
    { monto: 120, label: '🎬 Cine / Dulcería', cat: '🎬 Cine & Entretenimiento', concepto: 'Boletos de cine' },
    { monto: 250, label: '🎮 Videojuego / App', cat: '🎮 Videojuegos & Digital', concepto: 'Compra digital / juego' },
    { monto: 350, label: '🍻 Salida Fin de Sem.', cat: '🍕 Salidas & Gustos', concepto: 'Salida fin de semana' },
    { monto: 60, label: '🛒 Antojo / Tiendita', cat: '🍕 Salidas & Gustos', concepto: 'Antojo / Oxxo' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(monto);
    if (isNaN(val) || val <= 0) return;

    onAddGastoOcio({
      fecha,
      monto: val,
      categoria,
      concepto: concepto.trim() || 'Gasto de ocio',
      metodo
    });

    setMonto('');
    setConcepto('');
  };

  const handleQuickClick = (item) => {
    onAddGastoOcio({
      fecha: getTodayDate(),
      monto: item.monto,
      categoria: item.cat,
      concepto: item.concepto,
      metodo: 'Débito Nu'
    });
  };

  return (
    <div className="space-y-6">
      {/* 4 KPIs de Ocio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Presupuesto Quincenal Ocio</p>
          <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">{fmt(presupuesto)}</h3>
          <p className="text-xs text-amber-400 mt-2 font-semibold">Paso 7: Salidas, gustos &amp; diversión</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gasto Real Actual</p>
          <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">{fmt(gastado)}</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">{pctConsumido}% consumido</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo Disponible para Gastar</p>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{fmt(disponible)}</h3>
          <p className="text-xs text-slate-300 mt-2 font-medium">Libre para comidas o salidas</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-purple-500/30">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resguardo en Cajita Turbo</p>
          <h3 className="text-2xl sm:text-3xl font-black text-purple-400 mt-1">{fmt(totalCajita)}</h3>
          <p className="text-xs text-purple-300 mt-2 font-semibold">Incluye Emergencia + Retiro + Ocio</p>
        </div>
      </div>

      {/* Barra de Progreso de Ocio */}
      <div className="glass-panel p-5 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Consumo del Presupuesto de Ocio ({fmt(presupuesto)}):</span>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40">
              Gastado: {fmt(gastado)}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-emerald-400">Disponible: {fmt(disponible)}</span>
            <button
              onClick={onOpenCerrarQuincena}
              className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center space-x-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Cerrar Quincena</span>
            </button>
          </div>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, pctConsumido)}%` }}
          ></div>
        </div>
      </div>

      {/* Grid: Botones Rápidos + Formulario + Tabla Bitácora */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Botones Rápidos y Formulario */}
        <div className="space-y-6">
          {/* Botones Rápidos */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Botones Rápidos de Ocio (1 Clic)</span>
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {quickItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickClick(item)}
                  className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-left transition hover:scale-[1.02] flex flex-col justify-between"
                >
                  <span className="text-xs text-slate-300 font-semibold truncate">{item.label}</span>
                  <span className="text-base font-black text-amber-400 mt-1">{fmt(item.monto)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Formulario Personalizado */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
              <PlusCircle className="w-4 h-4 text-purple-400" />
              <span>Registrar Gasto de Ocio</span>
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium">Fecha</label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1 focus:border-purple-500"
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1 focus:border-purple-500 font-bold"
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium">Categoría de Ocio</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1"
                >
                  <option value="🍕 Salidas &amp; Gustos">🍕 Salidas &amp; Gustos</option>
                  <option value="🎬 Cine &amp; Entretenimiento">🎬 Cine &amp; Entretenimiento</option>
                  <option value="🎮 Videojuegos &amp; Digital">🎮 Videojuegos &amp; Digital</option>
                  <option value="🍔 Comida Fuera / Restaurantes">🍔 Comida Fuera / Restaurantes</option>
                  <option value="🛍️ Compras Personales">🛍️ Compras Personales</option>
                  <option value="✨ Otros Gustos">✨ Otros Gustos</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 font-medium">Concepto / Detalle</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Tacos con amigos o cine"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium">Método de Pago</label>
                <select
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1"
                >
                  <option value="Débito Nu">Débito Nu (Cajita)</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="TDC Nu">TDC Nu</option>
                </select>
              </div>

              {metodo === 'TDC Nu' && (
                <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-[11px] text-purple-200 flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>💳 Se registrará automáticamente en tu <b>Tarjeta de Crédito Nu</b> como compra a pagar.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition shadow-lg shadow-purple-600/30"
              >
                Guardar Gasto de Ocio en SQLite
              </button>
            </form>
          </div>
        </div>

        {/* Columna Derecha: Tabla Bitácora de Ocio */}
        <div className="glass-panel p-5 rounded-2xl lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <List className="w-4 h-4 text-purple-400" />
                <span>Bitácora de Gastos de Ocio</span>
              </h3>
              <p className="text-xs text-slate-400">Actualiza automáticamente tu disponible en Cajita Turbo</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold">
                {registros.length} registros
              </span>
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
                {registros.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-500">
                      No hay gastos de ocio registrados en esta quincena.
                    </td>
                  </tr>
                ) : (
                  registros.map((r, index) => (
                    <tr key={r.id || index} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-slate-500 font-medium">#{r.id || index + 1}</td>
                      <td className="p-3 text-slate-300 whitespace-nowrap">{r.fecha}</td>
                      <td className="p-3 text-slate-400">{r.dia}</td>
                      <td className="p-3 text-right font-black text-rose-400">{fmt(r.monto)}</td>
                      <td className="p-3 text-amber-300 font-medium whitespace-nowrap">{r.categoria}</td>
                      <td className="p-3 text-white font-medium">{r.concepto}</td>
                      <td className="p-3 text-slate-300">{r.metodo_pago}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onDeleteGastoOcio(r.id)}
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
    </div>
  );
}
