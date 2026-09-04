import React, { useState } from 'react';
import { History, RefreshCw, PlusCircle, Eye, X, Trash2 } from 'lucide-react';
import { fmt } from '../../utils/formatters';

export default function HistoricoFuturo({
  historial = [],
  onReload,
  onOpenCerrarQuincena,
  onDeleteCierre
}) {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-glass p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-teal-800/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">Histórico Quincenas de Futuro</h2>
            <p className="text-xs text-slate-400">Consolidado quincenal archivado en la Nube 24/7 • Control y Eliminación</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onReload}
            className="btn-ghost"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>
          <button
            onClick={onOpenCerrarQuincena}
            className="btn-success"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Archivar Quincena Actual</span>
          </button>
        </div>
      </div>

      {/* Tabla de Quincenas de Futuro */}
      <div className="card-glass p-4 sm:p-6">
        <div className="table-responsive-container">
          <table className="table-modern">
            <thead>
              <tr>
                <th className="table-modern-th">#</th>
                <th className="table-modern-th">Período</th>
                <th className="table-modern-th text-center">Fecha Cierre</th>
                <th className="table-modern-th text-right">Pres. Ocio</th>
                <th className="table-modern-th text-right">Gasto Ocio</th>
                <th className="table-modern-th text-right">Remanente Ocio</th>
                <th className="table-modern-th text-right">Aporte Emergencia</th>
                <th className="table-modern-th text-right">Aporte Retiro</th>
                <th className="table-modern-th text-right">Aporte Cetes</th>
                <th className="table-modern-th text-right">Total Cajita Nu</th>
                <th className="table-modern-th text-center">Movs</th>
                <th className="table-modern-th text-center min-w-[140px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {historial.length === 0 ? (
                <tr>
                  <td colSpan="12" className="p-8 text-center text-slate-500">
                    No hay quincenas archivadas de Plan a Futuro aún.
                  </td>
                </tr>
              ) : (
                historial.map((c, index) => (
                  <tr key={c.id || index} className="table-modern-tr">
                    <td className="table-modern-td font-semibold text-slate-500">#{c.id || index + 1}</td>
                    <td className="table-modern-td font-bold text-white whitespace-nowrap">{c.periodo}</td>
                    <td className="table-modern-td text-center text-slate-400 whitespace-nowrap">{c.fecha_cierre}</td>
                    <td className="table-modern-td text-right text-slate-300">{fmt(c.presupuesto_ocio)}</td>
                    <td className="table-modern-td text-right font-semibold text-rose-400">{fmt(c.gasto_ocio)}</td>
                    <td className="table-modern-td text-right font-black text-emerald-400">{fmt(c.remanente_ocio)}</td>
                    <td className="table-modern-td text-right text-teal-300">{fmt(c.aporte_emergencia)}</td>
                    <td className="table-modern-td text-right text-indigo-300">{fmt(c.aporte_retiro)}</td>
                    <td className="table-modern-td text-right text-blue-300">{fmt(c.aporte_cetes)}</td>
                    <td className="table-modern-td text-right font-black text-purple-300 text-sm">{fmt(c.total_cajita_cierre)}</td>
                    <td className="table-modern-td text-center">
                      <span className="badge-slate">
                        {c.num_movimientos} movs
                      </span>
                    </td>
                    <td className="table-modern-td text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setSelectedItem(c)}
                          className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold transition flex items-center space-x-1"
                          title="Ver detalle"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                        {onDeleteCierre && (
                          <button
                            onClick={() => onDeleteCierre(c.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-bold transition flex items-center space-x-1"
                            title="Eliminar esta quincena del histórico"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalle de Quincena Archivada */}
      {selectedItem && (
        <div className="modal-overlay">
          <div className="modal-sheet max-w-lg border border-teal-500/30">
            <div className="modal-header">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Detalle: {selectedItem.periodo}</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400">Fecha de Cierre:</span>
                  <p className="font-bold text-white">{selectedItem.fecha_cierre}</p>
                </div>
                <div>
                  <span className="text-slate-400">Total en Cajita Nu:</span>
                  <p className="font-black text-purple-300 text-sm">{fmt(selectedItem.total_cajita_cierre)}</p>
                </div>
                <div>
                  <span className="text-slate-400">Remanente Ocio Resguardado:</span>
                  <p className="font-bold text-emerald-400">{fmt(selectedItem.remanente_ocio)}</p>
                </div>
                <div>
                  <span className="text-slate-400">Fondo de Emergencia:</span>
                  <p className="font-bold text-teal-300">{fmt(selectedItem.aporte_emergencia)}</p>
                </div>
                <div>
                  <span className="text-slate-400">Retiro SAT:</span>
                  <p className="font-bold text-indigo-300">{fmt(selectedItem.aporte_retiro)}</p>
                </div>
                <div>
                  <span className="text-slate-400">Cetesdirecto:</span>
                  <p className="font-bold text-blue-300">{fmt(selectedItem.aporte_cetes)}</p>
                </div>
              </div>

              {/* Lista de gastos archivados */}
              <div>
                <h4 className="font-bold text-slate-300 mb-2">Movimientos de Ocio Archivados:</h4>
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-800 rounded-xl p-2 bg-slate-900/60">
                  {(!selectedItem.detalle?.registros_ocio || selectedItem.detalle.registros_ocio.length === 0) ? (
                    <p className="text-slate-500 p-2 text-center">No se registraron gastos en este período.</p>
                  ) : (
                    selectedItem.detalle.registros_ocio.map((r, i) => (
                      <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-slate-800/40 text-xs">
                        <div>
                          <span className="font-bold text-white">{r.concepto}</span>
                          <span className="text-slate-400 ml-2">({r.categoria})</span>
                        </div>
                        <span className="font-black text-rose-400">{fmt(r.monto)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-2">
              {onDeleteCierre && (
                <button
                  type="button"
                  onClick={() => {
                    const idToDelete = selectedItem.id;
                    setSelectedItem(null);
                    onDeleteCierre(idToDelete);
                  }}
                  className="btn-danger"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Quincena</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="btn-ghost flex-1"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
