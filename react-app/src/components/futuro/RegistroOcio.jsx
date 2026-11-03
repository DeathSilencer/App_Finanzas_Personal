import React, { useState } from 'react';
import { PartyPopper, Zap, PlusCircle, List, Trash2, CheckCircle2, CreditCard, RotateCcw, Sparkles } from 'lucide-react';
import { fmt, getTodayDate } from '../../utils/formatters';

export const CAT_OCIO_30 = '🍕 Ocio & Estilo de Vida (30%)';
export const CAT_EXCEDENTE_20 = '🍦 Excedente 20%: Refuerzo Gustos / Salidas';

export default function RegistroOcio({
  futuroData = {},
  onAddGastoOcio,
  onDeleteGastoOcio,
  onOpenCerrarQuincena,
  onRevertirCierre
}) {
  const of = futuroData?.otros_fondos || {};
  const ocio = of.ocio || {};
  const cajita = of.cajita_turbo || {};
  const registros = of.registros_ocio || ocio.registros || [];

  // Fondos y métricas de Ocio 30% (En Nu al 13%)
  const presupuestoOcio = ocio.presupuesto || 1500;
  const gastadoOcio = ocio.gasto_real || 0;
  const disponibleOcio = ocio.remanente ?? 1500;
  const pctConsumidoOcio = ocio.pct_consumido || 0;

  // Fondos y métricas de Excedente 20% (En DiDi al 15%)
  const porcionSalidas20 = cajita?.porciones?.salidas_20 || {};
  const disponibleSalidas20 = cajita?.desglose?.salidas_20 ?? 1078.90;
  const gastadoSalidas20 = porcionSalidas20.gasto_real || 0;

  // Totales globales
  const totalDisponibleDisfrute = (disponibleOcio || 0) + (disponibleSalidas20 || 0);
  const totalCajita = cajita.gran_total || 28534.51;

  const [fecha, setFecha] = useState(getTodayDate());
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState(CAT_OCIO_30);
  const [concepto, setConcepto] = useState('');
  const [metodo, setMetodo] = useState('Débito Nu');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quickItems = [
    { monto: 45, label: '☕ Café / Snack', cat: CAT_OCIO_30, metodo: 'Débito Nu', concepto: 'Café / Snack' },
    { monto: 150, label: '🍔 Comida Fuera', cat: CAT_EXCEDENTE_20, metodo: 'Débito DiDi', concepto: 'Comida en restaurante' },
    { monto: 120, label: '🎬 Cine / Boletos', cat: CAT_OCIO_30, metodo: 'Débito Nu', concepto: 'Boletos de cine' },
    { monto: 350, label: '🍻 Salida Fin de Sem.', cat: CAT_EXCEDENTE_20, metodo: 'Débito DiDi', concepto: 'Salida de fin de semana' },
    { monto: 250, label: '🛍️ Gusto Personal', cat: CAT_OCIO_30, metodo: 'Débito Nu', concepto: 'Compra personal / Gusto' },
    { monto: 60, label: '🍦 Antojo / Postre', cat: CAT_EXCEDENTE_20, metodo: 'Débito DiDi', concepto: 'Antojo o postre' }
  ];

  const handleCategoriaChange = (newCat) => {
    setCategoria(newCat);
    if (newCat === CAT_EXCEDENTE_20) {
      if (metodo === 'Débito Nu') setMetodo('Débito DiDi');
    } else {
      if (metodo === 'Débito DiDi') setMetodo('Débito Nu');
    }
  };

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
        concepto: concepto.trim() || (categoria === CAT_EXCEDENTE_20 ? 'Salida de fin de semana' : 'Gasto de ocio'),
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
        metodo: item.metodo || 'Débito Nu'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const esExcedente20 = (cat = '') => {
    const c = String(cat).toLowerCase();
    return c.includes('excedente 20%') || c.includes('refuerzo');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 4 KPIs Clave: Ocio (Nu 13%) + Salidas (DiDi 15%) + Totales */}
      <div className="mobile-grid-kpi">
        <div className="card-kpi border-purple-500/30">
          <div className="flex items-center justify-between">
            <span className="kpi-label">🍕 Ocio &amp; Gustos (30%)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">En Nu 13%</span>
          </div>
          <h3 className="kpi-val-purple">{fmt(disponibleOcio)}</h3>
          <p className="kpi-subtext text-purple-300 truncate font-semibold">
            Presupuesto: {fmt(presupuestoOcio)} • Gastado: -{fmt(gastadoOcio)}
          </p>
        </div>

        <div className="card-kpi border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="kpi-label">🍦 Excedente 20%: Salidas</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">En DiDi 15%</span>
          </div>
          <h3 className="kpi-val-amber">{fmt(disponibleSalidas20)}</h3>
          <p className="kpi-subtext text-amber-300 truncate font-semibold">
            Gastado en quincena: -{fmt(gastadoSalidas20)}
          </p>
        </div>

        <div className="card-kpi border-emerald-500/30">
          <span className="kpi-label">🎉 Total para Salidas &amp; Gustos</span>
          <h3 className="kpi-val-emerald">{fmt(totalDisponibleDisfrute)}</h3>
          <p className="kpi-subtext text-emerald-300 font-semibold truncate">
            Ocio Nu ({fmt(disponibleOcio)}) + Salidas DiDi ({fmt(disponibleSalidas20)})
          </p>
        </div>

        <div className="card-kpi border-blue-500/30">
          <span className="kpi-label">🏛️ Tríada Bóvedas Líquidas</span>
          <h3 className="kpi-val-white">{fmt(totalCajita)}</h3>
          <p className="kpi-subtext text-blue-300 font-semibold truncate">
            Nu ($25,045.17) + DiDi ($3,489.34)
          </p>
        </div>
      </div>

      {/* Barra de Progreso y Acciones */}
      <div className="card-glass p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Monitoreo de Fondos de Diversión:</span>
            <span className="badge-purple">
              Ocio Nu: {fmt(disponibleOcio)} libre
            </span>
            <span className="badge-amber">
              Salidas DiDi: {fmt(disponibleSalidas20)} libre
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {onRevertirCierre && (
              <button
                onClick={() => onRevertirCierre()}
                className="btn-base bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 !py-1 !px-2.5 !text-xs !min-h-[32px]"
                title="Revertir la última quincena cerrada y restaurar sus gastos a esta pantalla"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Revertir</span>
              </button>
            )}
            <button
              onClick={onOpenCerrarQuincena}
              className="btn-success !py-1 !px-2.5 !text-xs !min-h-[32px]"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cerrar Quincena</span>
            </button>
          </div>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${Math.min(100, pctConsumidoOcio)}%` }}
            title={`Ocio consumido: ${pctConsumidoOcio}%`}
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
              <span>Botones Rápidos (1 Clic)</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {quickItems.map((item, idx) => {
                const is20 = esExcedente20(item.cat);
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleQuickClick(item)}
                    className={`btn-quick flex flex-col justify-between text-left ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div>
                      <span className="text-xs text-slate-300 font-semibold truncate block">{item.label}</span>
                      <span className={`text-[10px] font-bold block mt-0.5 ${is20 ? 'text-amber-400' : 'text-purple-400'}`}>
                        {is20 ? 'DiDi (20%)' : 'Nu (30%)'}
                      </span>
                    </div>
                    <span className="text-sm sm:text-base font-black text-white mt-1.5 block">{fmt(item.monto)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formulario Personalizado */}
          <div className="card-glass p-4 sm:p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
              <PlusCircle className="w-4 h-4 text-purple-400" />
              <span>Registrar Gasto de Diversión</span>
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
                  className="form-input font-bold text-amber-400 text-sm"
                />
              </div>

              <div>
                <label className="form-label">Categoría de Destino</label>
                <select
                  value={categoria}
                  onChange={(e) => handleCategoriaChange(e.target.value)}
                  className="form-select font-bold text-white"
                >
                  <option value={CAT_OCIO_30}>🍕 Ocio &amp; Estilo de Vida (30% • En Nu 13%)</option>
                  <option value={CAT_EXCEDENTE_20}>🍦 Excedente 20%: Refuerzo Gustos / Salidas (En DiDi 15%)</option>
                </select>
              </div>

              {/* Banner Informativo del Fondo Seleccionado */}
              {categoria === CAT_EXCEDENTE_20 ? (
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-200 flex items-center space-x-2">
                  <span className="text-base">🟠</span>
                  <span>Descuenta de tu <b>Excedente 20% (${fmt(disponibleSalidas20)} disp.)</b> albergado en <b>DiDi Cuenta al 15% anual</b>.</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-[11px] text-purple-200 flex items-center space-x-2">
                  <span className="text-base">🟣</span>
                  <span>Descuenta de tu <b>Ocio 30% (${fmt(disponibleOcio)} disp.)</b> albergado en <b>Cajita Nu al 13% anual</b>.</span>
                </div>
              )}

              <div>
                <label className="form-label">Concepto / Detalle</label>
                <input
                  type="text"
                  required
                  placeholder={categoria === CAT_EXCEDENTE_20 ? "Ej. Cena tacos fin de semana" : "Ej. Boletos de cine o compras"}
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
                  <option value="Débito DiDi">🟠 Débito DiDi (15% Rendimiento)</option>
                  <option value="Débito Nu">🟣 Débito Nu (Cajita 13%)</option>
                  <option value="TDC Nu">💳 TDC Nu (Se agenda pago automático)</option>
                  <option value="Débito Openbank">🔴 Débito Openbank (Apartados)</option>
                  <option value="Efectivo">💵 Efectivo</option>
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
                className={`btn-purple w-full mt-2 !py-2.5 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Gasto en la Nube'}
              </button>
            </form>
          </div>
        </div>

        {/* Columna Derecha: Tabla Bitácora de Gastos */}
        <div className="card-glass p-4 sm:p-5 lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                <List className="w-4 h-4 text-purple-400" />
                <span>Bitácora de Gastos de Ocio &amp; Salidas</span>
              </h3>
              <p className="text-xs text-slate-400">Ruteo automático: Ocio a Nu (13%) y Excedente 20% a DiDi (15%)</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-slate">
                {registros.length} registros
              </span>
              {onRevertirCierre && (
                <button
                  onClick={() => onRevertirCierre()}
                  className="btn-base bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 !py-1 !px-2.5 !text-xs !min-h-[32px]"
                  title="Revertir la última quincena cerrada y restaurar sus gastos a esta pantalla"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Revertir</span>
                </button>
              )}
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
                  <th className="table-modern-th">Categoría / Fondo</th>
                  <th className="table-modern-th">Concepto</th>
                  <th className="table-modern-th">Método</th>
                  <th className="table-modern-th text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {registros.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-500">
                      No hay gastos registrados en esta quincena activa.
                    </td>
                  </tr>
                ) : (
                  registros.map((r, index) => {
                    const is20 = esExcedente20(r.categoria);
                    return (
                      <tr key={r.id || index} className="table-modern-tr">
                        <td className="table-modern-td text-slate-500 font-medium">#{r.id || index + 1}</td>
                        <td className="table-modern-td text-slate-300 whitespace-nowrap">{r.fecha}</td>
                        <td className="table-modern-td text-slate-400">{r.dia}</td>
                        <td className="table-modern-td text-right font-black text-rose-400">{fmt(r.monto)}</td>
                        <td className="table-modern-td whitespace-nowrap">
                          {is20 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              🍦 Excedente 20% (DiDi 15%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              🍕 Ocio (Nu 13%)
                            </span>
                          )}
                        </td>
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
