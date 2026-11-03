import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, X, ShieldAlert, Sparkles } from 'lucide-react';
import { fmt, round2 } from '../../utils/formatters';

export default function ModalCompensacionGasto({
  isOpen,
  onClose,
  gastoPendiente,
  disponibleActual = 0,
  faltante = 0,
  categoriasDisponibles = [],
  onConfirmarCompensacion
}) {
  if (!isOpen || !gastoPendiente) return null;

  const montoTotal = Number(gastoPendiente.monto) || 0;
  const categoriaDestino = gastoPendiente.categoria || 'Gasto';

  // Filtrar categorías que no sean la misma categoría y que tengan saldo positivo
  const opcionesDonantes = categoriasDisponibles.filter(c => 
    c.categoria !== categoriaDestino && (Number(c.remanente) || 0) > 0
  );

  // Seleccionar por defecto la primera con saldo suficiente para cubrir el faltante
  const mejorOpcion = opcionesDonantes.find(c => (Number(c.remanente) || 0) >= faltante) || opcionesDonantes[0];
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(mejorOpcion?.categoria || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const donanteActual = opcionesDonantes.find(c => c.categoria === categoriaSeleccionada) || mejorOpcion;
  const saldoDonante = Number(donanteActual?.remanente) || 0;
  const alcanzaDonante = saldoDonante >= faltante;

  const handleConfirmar = async () => {
    if (!categoriaSeleccionada || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirmarCompensacion({
        gastoOriginal: gastoPendiente,
        categoriaPrincipal: categoriaDestino,
        montoPrincipal: disponibleActual > 0 ? disponibleActual : 0,
        categoriaOrigen: categoriaSeleccionada,
        montoOrigen: faltante,
        origenTipo: donanteActual?.origen || 'gastos'
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-sheet max-w-lg border border-amber-500/40 bg-slate-950/95 shadow-2xl">
        {/* Header */}
        <div className="modal-header border-b border-amber-500/30 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Límite de Presupuesto Excedido</span>
              </h3>
              <p className="text-xs text-amber-300/90 font-medium">
                Se requiere compensación de fondos para no sobregirar
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 py-3 text-xs">
          {/* Card de Situación de Presupuesto */}
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Gasto que intentas registrar:</span>
              <span className="text-sm font-black text-rose-400">{fmt(montoTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Disponible en {categoriaDestino}:</span>
              <span className="text-sm font-bold text-emerald-400">{fmt(disponibleActual)}</span>
            </div>
            <div className="pt-2 border-t border-amber-500/20 flex justify-between items-center">
              <span className="text-amber-200 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Faltante por cubrir:</span>
              </span>
              <span className="text-base font-black text-amber-300 font-mono">{fmt(faltante)}</span>
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed text-[11px]">
            Para evitar números rojos o saldo negativo en tu Estado de Cuenta, puedes tomar los <b className="text-amber-300 font-bold">{fmt(faltante)}</b> faltantes de otra categoría que sí tenga saldo disponible.
          </p>

          {/* Selector de Categoría Donante */}
          {opcionesDonantes.length === 0 ? (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
              🚫 No tienes fondos disponibles en ninguna otra categoría para cubrir este excedente. El registro se cancela para proteger tus finanzas.
            </div>
          ) : (
            <div className="space-y-2">
              <label className="form-label text-slate-200 font-bold">
                Selecciona de qué categoría tomar los {fmt(faltante)}:
              </label>
              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                className="form-select font-bold text-white bg-slate-900 border-amber-500/40"
              >
                {opcionesDonantes.map((c, idx) => (
                  <option key={idx} value={c.categoria}>
                    {c.categoria} (Disponible: {fmt(c.remanente)})
                  </option>
                ))}
              </select>

              {donanteActual && (
                <div className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between ${
                  alcanzaDonante 
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' 
                    : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                }`}>
                  <span>Saldo disponible en categoría elegida:</span>
                  <b className="font-mono text-xs">{fmt(saldoDonante)}</b>
                </div>
              )}
            </div>
          )}

          {/* Desglose de cómo quedará registrado */}
          {alcanzaDonante && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-[11px]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Reflejo transparente en tu Estado de Cuenta:
              </span>
              {disponibleActual > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>1. En {categoriaDestino}:</span>
                  <b className="text-white">{fmt(disponibleActual)} (agota disponible)</b>
                </div>
              )}
              <div className="flex justify-between text-amber-300">
                <span>{disponibleActual > 0 ? '2.' : '1.'} En {categoriaSeleccionada}:</span>
                <b className="font-bold">{fmt(faltante)} (apoyo de compensación)</b>
              </div>
              <p className="text-[10px] text-emerald-400 pt-1 border-t border-slate-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Ninguna categoría queda en saldo negativo. Todo cuadra al centavo.</span>
              </p>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-ghost flex-1 !text-xs !py-2.5"
            >
              Cancelar (No gastar)
            </button>
            {alcanzaDonante && (
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={isSubmitting || !alcanzaDonante}
                className="btn-amber flex-1 !text-xs !py-2.5 font-bold"
              >
                {isSubmitting ? 'Procesando...' : `Aprobar y Registrar (${fmt(montoTotal)})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
