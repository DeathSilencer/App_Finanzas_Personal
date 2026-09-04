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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quickItems = [
    { monto: 45, label: '☕ Café / Snack', cat: '🍕 Salidas & Gustos', concepto: 'Café / Snack' },
    { monto: 150, label: '🍔 Comida Fuera', cat: '🍔 Comida Fuera / Restaurantes', concepto: 'Comida en restaurante' },
    { monto: 120, label: '🎬 Cine / Dulcería', cat: '🎬 Cine & Entretenimiento', concepto: 'Boletos de cine' },
    { monto: 250, label: '🎮 Videojuego / App', cat: '🎮 Videojuegos & Digital', concepto: 'Compra digital / juego' },
    { monto: 350, label: '🍻 Salida Fin de Sem.', cat: '🍕 Salidas & Gustos', concepto: 'Salida fin de semana' },
    { monto: 60, label: '🛒 Antojo / Tiendita', cat: '🍕 Salidas & Gustos', concepto: 'Antojo / Oxxo' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(monto);
    if (isNaN(val) || val <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddGastoOcio({
        fecha,
        monto: val,
        categoria,
        concepto: concepto.trim() || 'Gasto de ocio',
        metodo
      });
      setMonto('');
      setConcepto('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickClick = async (item) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddGastoOcio({
        fecha: getTodayDate(),
        monto: item.monto,
        categoria: item.cat,
        concepto: item.concepto,
        metodo: 'Débito Nu'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 4 KPIs de Ocio */}
      <div className="mobile-grid-kpi">
        <div className="card-kpi">
          <span className="kpi-label">Presupuesto Quincenal Ocio</span>
          <h3 className="kpi-val-white">{fmt(presupuesto)}</h3>
          <p className="kpi-subtext text-amber-400 font-semibold truncate">Paso 7: Salidas, gustos &amp; diversión</p>
        </div>
        <div className="card-kpi">
          <span className="kpi-label">Gasto Real Actual</span>
          <h3 className="kpi-val-rose">{fmt(gastado)}</h3>
          <p className="kpi-subtext">{pctConsumido}% consumido</p>
        </div>
        <div className="card-kpi">
          <span className="kpi-label">Saldo Disponible para Gastar</span>
          <h3 className="kpi-val-emerald">{fmt(disponible)}</h3>
          <p className="kpi-subtext truncate">Libre para comidas o salidas</p>
        </div>
        <div className="card-kpi border-purple-500/30">
          <span className="kpi-label">Resguardo en Cajita Turbo</span>
          <h3 className="kpi-val-purple">{fmt(totalCajita)}</h3>
          <p className="kpi-subtext text-purple-300 font-semibold truncate">Emergencia + Retiro + Ocio</p>
        </div>
      </div>

      {/* Barra de Progreso de Ocio */}
      <div className="card-glass p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Consumo de Ocio ({fmt(presupuesto)}):</span>
            <span className="badge-rose">
              Gastado: {fmt(gastado)}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-emerald-400">Disponible: {fmt(disponible)}</span>
            <button
              onClick={onOpenCerrarQuincena}
              className="btn-success !py-1 !px-2.5 !text-xs !min-h-[32px]"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Columna Izquierda: Botones Rápidos y Formulario */}
        <div className="space-y-4 sm:space-y-6">
          {/* Botones Rápidos */}
          <div className="card-glass p-4 sm:p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Botones Rápidos de Ocio (1 Clic)</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {quickItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleQuickClick(item)}
                  className={`btn-quick ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-xs text-slate-300 font-semibold truncate block">{item.label}</span>
                  <span className="text-sm sm:text-base font-black text-amber-400 mt-1 block">{fmt(item.monto)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Formulario Personalizado */}
          <div className="card-glass p-4 sm:p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
              <PlusCircle className="w-4 h-4 text-purple-400" />
              <span>Registrar Gasto de Ocio</span>
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Monto ($ MXN)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="form-input font-bold text-amber-400"
                />
              </div>
              <div>
                <label className="form-label">Categoría de Ocio</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="form-select"
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
                <label className="form-label">Concepto / Detalle</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Tacos con amigos o cine"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Método de Pago</label>
                <select
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value)}
                  className="form-select"
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
                disabled={isSubmitting}
                className={`btn-purple w-full mt-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Gasto de Ocio en la Nube'}
              </button>
            </form>
          </div>
        </div>

        {/* Columna Derecha: Tabla Bitácora de Ocio */}
        <div className="card-glass p-4 sm:p-5 lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                <List className="w-4 h-4 text-purple-400" />
                <span>Bitácora de Gastos de Ocio</span>
              </h3>
              <p className="text-xs text-slate-400">Actualiza automáticamente tu disponible en Cajita Turbo</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-slate">
                {registros.length} registros
              </span>
              <button
                onClick={onOpenCerrarQuincena}
                className="btn-success !py-1 !px-2.5 !text-xs !min-h-[32px]"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Cerrar Quincena</span>
              </button>
            </div>
          </div>

          <div className="table-responsive-container flex-1 max-h-[500px] overflow-y-auto">
            <table className="table-modern">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="table-modern-th">#</th>
                  <th className="table-modern-th">Fecha</th>
                  <th className="table-modern-th">Día</th>
                  <th className="table-modern-th text-right">Monto</th>
                  <th className="table-modern-th">Categoría</th>
                  <th className="table-modern-th">Concepto</th>
                  <th className="table-modern-th">Método</th>
                  <th className="table-modern-th text-center">Acciones</th>
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
                    <tr key={r.id || index} className="table-modern-tr">
                      <td className="table-modern-td text-slate-500 font-medium">#{r.id || index + 1}</td>
                      <td className="table-modern-td text-slate-300 whitespace-nowrap">{r.fecha}</td>
                      <td className="table-modern-td text-slate-400">{r.dia}</td>
                      <td className="table-modern-td text-right font-black text-rose-400">{fmt(r.monto)}</td>
                      <td className="table-modern-td text-amber-300 font-medium whitespace-nowrap">{r.categoria}</td>
                      <td className="table-modern-td text-white font-medium">{r.concepto}</td>
                      <td className="table-modern-td text-slate-300">{r.metodo_pago}</td>
                      <td className="table-modern-td text-center">
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
