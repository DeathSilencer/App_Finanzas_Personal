import React, { useState } from 'react';
import { CreditCard, PlusCircle, Trash2, CheckCircle2, Calendar, Zap } from 'lucide-react';
import { fmt, round2, getTodayDate } from '../../utils/formatters';

export default function ControlTDCNu({
  tdcData = {},
  onAddCompra,
  onDeleteCompra,
  onLiquidarDeuda,
  onPayCuota
}) {
  const compras = tdcData.compras || tdcData.formatted_tdc || [];
  const deuda = tdcData.deuda_actual ?? 0;
  const pagoMes = tdcData.pago_mes ?? deuda;
  const limite = tdcData.limite_credito ?? tdcData.limite ?? 2400;
  const disponible = tdcData.saldo_disponible ?? tdcData.disponible ?? Math.max(0, limite - deuda);
  const usoPct = tdcData.pct_uso ?? tdcData.pct_uso_credito ?? 0;
  const corte = tdcData.proximo_corte || tdcData.fecha_corte_prox || (tdcData.dia_corte_config ? `Día ${tdcData.dia_corte_config}` : "Día 23");
  const pago = tdcData.proximo_pago || tdcData.fecha_pago_prox || (tdcData.dia_pago_config ? `Día ${tdcData.dia_pago_config}` : "Día 3");

  const [fecha, setFecha] = useState(getTodayDate());
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState('Ocio');
  const [modalidad, setModalidad] = useState('contado'); // 'contado' | 'msi'
  const [mesesTotales, setMesesTotales] = useState(6);
  const [apartado, setApartado] = useState('Sí (En Cajita)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const montoVal = parseFloat(monto);
  const mesesPlazo = modalidad === 'msi' ? Math.max(2, parseInt(mesesTotales, 10) || 6) : 1;
  const cuotaPreview = !isNaN(montoVal) && montoVal > 0 ? round2(montoVal / mesesPlazo) : 0;
  const excedeLinea = !isNaN(montoVal) && montoVal > disponible;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isNaN(montoVal) || montoVal <= 0 || isSubmitting) return;
    if (excedeLinea && !window.confirm(`Esta compra (${fmt(montoVal)}) excede tu saldo disponible en TDC (${fmt(disponible)}). ¿Deseas registrarla de todas formas?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddCompra({
        fecha,
        monto: montoVal,
        concepto: concepto.trim() || 'Compra TDC Nu',
        categoria,
        tipo: modalidad === 'msi' ? `MSI (${mesesPlazo}m)` : 'Gasto Diario',
        meses_totales: mesesPlazo,
        meses_pagados: 0,
        monto_pagado: 0,
        apartado,
        estado: 'Pendiente'
      });
      setMonto('');
      setConcepto('');
      setModalidad('contado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 4 KPIs de Tarjeta */}
      <div className="mobile-grid-kpi">
        <div className="card-kpi border-purple-500/30">
          <span className="kpi-label">Límite de Crédito Nu</span>
          <h3 className="kpi-val-white">{fmt(limite)}</h3>
          <p className="kpi-subtext text-purple-300 font-semibold truncate">TDC Nu Gold / Platinum</p>
        </div>
        <div className="card-kpi border-rose-500/30">
          <span className="kpi-label">Línea Ocupada (Total)</span>
          <h3 className="kpi-val-rose">{fmt(deuda)}</h3>
          <p className="kpi-subtext">{usoPct}% de uso de línea</p>
        </div>
        <div className="card-kpi border-emerald-500/30">
          <span className="kpi-label">Saldo Disponible</span>
          <h3 className="kpi-val-emerald">{fmt(disponible)}</h3>
          <p className="kpi-subtext text-emerald-300 font-semibold truncate">Línea libre para compras</p>
        </div>
        <div className="card-kpi border-amber-500/30">
          <span className="kpi-label">Pago del Mes (No Intereses)</span>
          <h3 className="kpi-val-amber">{fmt(pagoMes)}</h3>
          <p className="kpi-subtext text-amber-300 font-semibold">Corte: {corte} • Pago: {pago}</p>
        </div>
      </div>

      {/* Grid: Formulario + Tabla de Compras */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Formulario */}
        <div className="card-glass p-4 sm:p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <PlusCircle className="w-4 h-4 text-purple-400" />
            <span>Registrar Compra con TDC Nu</span>
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
              <label className="form-label">Monto Total ($ MXN)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="form-input font-bold text-rose-400"
              />
              {excedeLinea && (
                <p className="text-[10px] text-amber-400 mt-1 font-semibold">
                  ⚠️ Excede tu disponible actual ({fmt(disponible)}).
                </p>
              )}
            </div>
            <div>
              <label className="form-label">Concepto / Establecimiento</label>
              <input
                type="text"
                required
                placeholder="Ej. Amazon / Gemini / Oxxo"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Modalidad: Contado vs MSI */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="form-label">Modalidad</label>
                <select
                  value={modalidad}
                  onChange={(e) => setModalidad(e.target.value)}
                  className="form-select"
                >
                  <option value="contado">Contado (1 pago)</option>
                  <option value="msi">Meses Sin Intereses</option>
                </select>
              </div>
              {modalidad === 'msi' && (
                <div>
                  <label className="form-label">Plazo (Meses)</label>
                  <select
                    value={mesesTotales}
                    onChange={(e) => setMesesTotales(Number(e.target.value))}
                    className="form-select font-bold text-purple-300"
                  >
                    <option value={3}>3 MSI</option>
                    <option value={6}>6 MSI</option>
                    <option value={9}>9 MSI</option>
                    <option value={12}>12 MSI</option>
                    <option value={18}>18 MSI</option>
                    <option value={24}>24 MSI</option>
                  </select>
                </div>
              )}
            </div>

            {modalidad === 'msi' && cuotaPreview > 0 && (
              <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-500/40 text-[11px] text-indigo-200 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Cuota mensual ({mesesPlazo}m):</span>
                </span>
                <b className="text-white">{fmt(cuotaPreview)}/mes</b>
              </div>
            )}

            <div>
              <label className="form-label">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => {
                  setCategoria(e.target.value);
                  setApartado('Sí (En Cajita)');
                }}
                className="form-select"
              >
                <option value="Ocio">🍕 Ocio &amp; Estilo de Vida (30% en Nu)</option>
                <option value="🍕 Excedente 20%: Refuerzo Gustos / Salidas">🍦 Refuerzo Gustos / Salidas (20% en DiDi)</option>
                <option value="🛡️ Imprevistos / Por si acaso">🛡️ Colchón de Imprevistos (en DiDi)</option>
                <option value="📄 Copias, Material & Papelería">📄 Copias, Material & Papelería</option>
                <option value="🥪 Comidas en Escuela (Efectivo)">🥪 Comidas en Escuela</option>
                <option value="🛡️ Excedente 80%: Fondo Emergencia / Moto">🏍️ Acelerador Moto</option>
              </select>
            </div>
            <div>
              <label className="form-label">¿Apartado en Cajita Nu?</label>
              <select
                value={apartado}
                onChange={(e) => setApartado(e.target.value)}
                className="form-select"
              >
                <option value="Sí (En Cajita)">Sí (En Cajita al 13%)</option>
                <option value="Pendiente">Pendiente por apartar</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`btn-purple w-full mt-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Compra en la Nube'}
            </button>
          </form>

          {/* Banner Educativo Jineteo 13% */}
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200 space-y-1">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Jineteo Inteligente + MSI:</span>
            </span>
            <p className="text-slate-300">
              Las compras de contado y las <b>cuotas mensuales de MSI</b> se descuentan hoy de tu categoría, mientras tu dinero físico <b>sigue en Cajita Nu generando el 13%</b> hasta el Día 3. Tu línea disponible refleja el saldo total comprometido.
            </p>
          </div>

          {pagoMes > 0 && (
            <button
              onClick={onLiquidarDeuda}
              className="btn-success w-full"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Liquidar Corte del Mes ({fmt(pagoMes)})</span>
            </button>
          )}
        </div>

        {/* Tabla de Compras */}
        <div className="card-glass p-4 sm:p-5 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span>Movimientos de Tarjeta Nu</span>
            </h3>
            <span className="badge-slate">{compras.length} compras</span>
          </div>

          <div className="table-responsive-container flex-1 max-h-[540px] overflow-y-auto">
            <table className="table-modern">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="table-modern-th">Fecha</th>
                  <th className="table-modern-th">Concepto</th>
                  <th className="table-modern-th text-right">Total / Cuota</th>
                  <th className="table-modern-th">Plazo / Progreso</th>
                  <th className="table-modern-th">Categoría</th>
                  <th className="table-modern-th text-center">Estado</th>
                  <th className="table-modern-th text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {compras.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500">
                      No hay compras registradas en tu tarjeta. Deuda: $0.00.
                    </td>
                  </tr>
                ) : (
                  compras.map((c, i) => {
                    const esMsi = c.es_msi || (Number(c.meses_totales) > 1);
                    const totalM = Number(c.meses_totales) || 1;
                    const pagadosM = Number(c.meses_pagados) || 0;
                    const cuota = c.cuota_actual ?? c.monto;
                    const restante = c.saldo_pendiente ?? (c.estado === 'Liquidado' ? 0 : c.monto);
                    return (
                      <tr key={c.id || i} className="table-modern-tr">
                        <td className="table-modern-td text-slate-300 whitespace-nowrap">{c.fecha}</td>
                        <td className="table-modern-td font-medium text-white">
                          <div>{c.concepto}</div>
                          {esMsi && c.estado !== 'Liquidado' && (
                            <span className="text-[10px] text-slate-400">
                              Restante en línea: {fmt(restante)}
                            </span>
                          )}
                        </td>
                        <td className="table-modern-td text-right whitespace-nowrap">
                          <div className="font-black text-rose-400">{fmt(c.monto)}</div>
                          {esMsi && c.estado !== 'Liquidado' && (
                            <div className="text-[10px] text-amber-300 font-bold">
                              {fmt(cuota)}/mes
                            </div>
                          )}
                        </td>
                        <td className="table-modern-td whitespace-nowrap">
                          {esMsi ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                              {totalM} MSI ({pagadosM}/{totalM})
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Contado</span>
                          )}
                        </td>
                        <td className="table-modern-td text-slate-400 text-[11px]">{c.categoria}</td>
                        <td className="table-modern-td text-center">
                          <span className={c.estado === 'Liquidado' ? 'badge-emerald' : 'badge-rose'}>
                            {c.estado === 'Liquidado' ? 'Liquidado' : (esMsi ? `En curso (${pagadosM}/${totalM})` : 'Pendiente')}
                          </span>
                        </td>
                        <td className="table-modern-td text-center whitespace-nowrap">
                          <div className="inline-flex items-center space-x-1">
                            {c.estado !== 'Liquidado' && onPayCuota && (
                              <button
                                onClick={() => onPayCuota(c.id)}
                                className="px-2 py-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg transition"
                                title={esMsi ? `Pagar mensualidad (${fmt(cuota)})` : `Liquidar (${fmt(cuota)})`}
                              >
                                {esMsi ? '+1 cuota' : 'Pagar'}
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteCompra(c.id)}
                              className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </div>
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
