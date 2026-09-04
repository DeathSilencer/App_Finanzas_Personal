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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(monto);
    if (isNaN(val) || val <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddCompra({
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
          <span className="kpi-label">Deuda Actual / Gastado</span>
          <h3 className="kpi-val-rose">{fmt(deuda)}</h3>
          <p className="kpi-subtext">{usoPct}% de uso de línea</p>
        </div>
        <div className="card-kpi border-emerald-500/30">
          <span className="kpi-label">Saldo Disponible</span>
          <h3 className="kpi-val-emerald">{fmt(disponible)}</h3>
          <p className="kpi-subtext text-emerald-300 font-semibold truncate">Línea libre para compras</p>
        </div>
        <div className="card-kpi border-amber-500/30">
          <span className="kpi-label">Próximas Fechas</span>
          <h4 className="text-sm sm:text-base font-black text-white mt-1">Corte: <span className="text-amber-300">{corte}</span></h4>
          <p className="kpi-subtext text-amber-300 font-semibold">Límite Pago: {pago}</p>
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
              <label className="form-label">Monto ($ MXN)</label>
              <input
                type="number"
                step="0.5"
                required
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="form-input font-bold text-rose-400"
              />
            </div>
            <div>
              <label className="form-label">Concepto / Establecimiento</label>
              <input
                type="text"
                required
                placeholder="Ej. Oxxo / Despensa / Gasolina"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="form-select"
              >
                <option value="Básicos">Básicos</option>
                <option value="Ocio">Ocio</option>
                <option value="Imprevistos">Imprevistos</option>
                <option value="Copias/Material">Copias/Material</option>
              </select>
            </div>
            <div>
              <label className="form-label">¿Apartado en Cajita Básicos?</label>
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

          {deuda > 0 && (
            <button
              onClick={onLiquidarDeuda}
              className="btn-success w-full"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Liquidar Toda la Deuda ({fmt(deuda)})</span>
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

          <div className="table-responsive-container flex-1 max-h-[480px] overflow-y-auto">
            <table className="table-modern">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="table-modern-th">#</th>
                  <th className="table-modern-th">Fecha</th>
                  <th className="table-modern-th">Concepto</th>
                  <th className="table-modern-th text-right">Monto</th>
                  <th className="table-modern-th">Categoría</th>
                  <th className="table-modern-th">Apartado Cajita</th>
                  <th className="table-modern-th text-center">Estado</th>
                  <th className="table-modern-th text-center">Acción</th>
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
                    <tr key={c.id || i} className="table-modern-tr">
                      <td className="table-modern-td text-slate-500">#{c.id || i + 1}</td>
                      <td className="table-modern-td text-slate-300 whitespace-nowrap">{c.fecha}</td>
                      <td className="table-modern-td font-medium text-white">{c.concepto}</td>
                      <td className="table-modern-td text-right font-black text-rose-400">{fmt(c.monto)}</td>
                      <td className="table-modern-td text-slate-400">{c.categoria}</td>
                      <td className="table-modern-td text-purple-300">{c.apartado}</td>
                      <td className="table-modern-td text-center">
                        <span className={c.estado === 'Liquidado' ? 'badge-emerald' : 'badge-rose'}>
                          {c.estado || 'Pendiente'}
                        </span>
                      </td>
                      <td className="table-modern-td text-center">
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
