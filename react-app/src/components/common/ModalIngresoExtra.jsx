import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Save,
  Trash2,
  Bike,
  ShieldCheck,
  PartyPopper,
  Wallet,
  Landmark,
  Coins,
  IceCream,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { fmt } from '../../utils/formatters';

const DESTINOS = [
  {
    id: 'moto',
    titulo: 'Acelerador de Moto',
    subtitulo: 'Suma directo a la meta de $42,000 en Cajita Nu',
    icon: Bike,
    color: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
  },
  {
    id: 'emergencia',
    titulo: 'Fondo de Emergencia',
    subtitulo: 'Refuerza tu blindaje en Cajita Nu',
    icon: ShieldCheck,
    color: 'border-blue-500/40 bg-blue-950/30 text-blue-300'
  },
  {
    id: 'ocio',
    titulo: 'Gustos & Ocio',
    subtitulo: 'Aumenta tu saldo disponible en Cajita Nu',
    icon: PartyPopper,
    color: 'border-amber-500/40 bg-amber-950/30 text-amber-300'
  },
  {
    id: 'presupuesto_gastos',
    titulo: 'Presupuesto Quincenal (Gastos)',
    subtitulo: 'Amplía el tope de gastos de la quincena activa',
    icon: Wallet,
    color: 'border-indigo-500/40 bg-indigo-950/30 text-indigo-300'
  },
  {
    id: 'salidas_20',
    titulo: 'Refuerzo Salidas (20%)',
    subtitulo: 'Colchón adicional para salidas en Cajita Nu',
    icon: IceCream,
    color: 'border-pink-500/40 bg-pink-950/30 text-pink-300'
  },
  {
    id: 'cetes',
    titulo: 'Cetesdirecto',
    subtitulo: 'Inversión externa en CETES gubernamental',
    icon: Landmark,
    color: 'border-teal-500/40 bg-teal-950/30 text-teal-300'
  },
  {
    id: 'retiro',
    titulo: 'AFORE / Retiro SAT',
    subtitulo: 'Aportación voluntaria deducible para tu retiro',
    icon: Coins,
    color: 'border-violet-500/40 bg-violet-950/30 text-violet-300'
  }
];

export default function ModalIngresoExtra({
  isOpen,
  onClose,
  onSave,
  onDelete,
  ingresosExtra = []
}) {
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [modalidad, setModalidad] = useState('especifico'); // 'especifico' | 'patrimonial'
  const [destino, setDestino] = useState('moto');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const montoNum = parseFloat(monto) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (montoNum <= 0) return;

    try {
      setSaving(true);
      await onSave({
        monto: montoNum,
        concepto: concepto.trim() || 'Bono / Dinero Extra',
        fecha,
        modalidad,
        destino: modalidad === 'especifico' ? destino : 'patrimonial'
      });
      setMonto('');
      setConcepto('');
      setSaving(false);
      onClose();
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const getDestinoLabel = (item) => {
    if (item.modalidad === 'patrimonial') {
      return '⚖️ Regla Patrimonial (50/30/10/5/5)';
    }
    const match = DESTINOS.find(d => d.id === item.destino);
    return match ? match.titulo : item.destino;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-sheet max-w-lg border border-amber-500/40 bg-slate-900/95 backdrop-blur-2xl shadow-2xl shadow-amber-500/10">
        {/* Cabecera */}
        <div className="modal-header">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Agregador de Dinero Extra &amp; Bonos</h3>
              <p className="text-xs text-slate-400">Modalidad C: Híbrida (Directo o Patrimonial)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selector de Modalidad */}
        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 grid grid-cols-2 gap-1 text-xs font-semibold mb-4">
          <button
            type="button"
            onClick={() => setModalidad('especifico')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition ${
              modalidad === 'especifico'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>🎯 Fondo Específico</span>
          </button>
          <button
            type="button"
            onClick={() => setModalidad('patrimonial')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition ${
              modalidad === 'patrimonial'
                ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚖️ Regla 50/30/10/5/5</span>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Monto del Bono / Extra ($ MXN)</label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="Ej. 10000"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="form-input font-bold text-base text-amber-300 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="form-label">Fecha del Ingreso</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="form-input text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Concepto u Origen del Dinero</label>
            <input
              type="text"
              placeholder="Ej. Bono de trabajo, dinero extra, regalo, etc."
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              className="form-input text-xs"
            />
          </div>

          {/* Opciones según la modalidad */}
          {modalidad === 'especifico' ? (
            <div>
              <label className="form-label mb-2 block">Selecciona el destino del 100% de este dinero:</label>
              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {DESTINOS.map((d) => {
                  const Icon = d.icon;
                  const isSelected = destino === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDestino(d.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between ${
                        isSelected
                          ? 'border-amber-500/80 bg-amber-500/10 text-white shadow-sm ring-1 ring-amber-500/40'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${d.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs">{d.titulo}</div>
                          <div className="text-[10px] text-slate-400">{d.subtitulo}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          100%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="card-glass p-3 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-purple-200">Desglose Patrimonial Automático</span>
                <span className="text-[10px] text-purple-300 font-semibold">100% Cuadrado</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="flex items-center space-x-1.5 text-slate-300">
                    <Bike className="w-3.5 h-3.5 text-emerald-400" />
                    <span>🏍️ Acelerador Moto (50%):</span>
                  </span>
                  <b className="text-emerald-400 font-bold">{fmt(montoNum * 0.50)}</b>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="flex items-center space-x-1.5 text-slate-300">
                    <PartyPopper className="w-3.5 h-3.5 text-amber-400" />
                    <span>🍕 Gustos &amp; Ocio (30%):</span>
                  </span>
                  <b className="text-amber-400 font-bold">{fmt(montoNum * 0.30)}</b>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="flex items-center space-x-1.5 text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>🛡️ Fondo Emergencia (10%):</span>
                  </span>
                  <b className="text-blue-400 font-bold">{fmt(montoNum * 0.10)}</b>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="flex items-center space-x-1.5 text-slate-300">
                    <Landmark className="w-3.5 h-3.5 text-teal-400" />
                    <span>🔒 Cetesdirecto (5%):</span>
                  </span>
                  <b className="text-teal-400 font-bold">{fmt(montoNum * 0.05)}</b>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="flex items-center space-x-1.5 text-slate-300">
                    <Coins className="w-3.5 h-3.5 text-violet-400" />
                    <span>🚀 AFORE / Retiro SAT (5%):</span>
                  </span>
                  <b className="text-violet-400 font-bold">{fmt(montoNum * 0.05)}</b>
                </div>
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 py-2 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || montoNum <= 0}
              className="btn-amber flex-1 py-2 text-xs flex items-center justify-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Guardando...' : '+ Integrar Dinero Extra'}</span>
            </button>
          </div>
        </form>

        {/* Bitácora de Dinero Extra Activo en la Quincena */}
        {ingresosExtra.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Dinero Extra en Quincena Activa</span>
              </span>
              <span className="text-[11px] font-bold text-amber-400">
                Total: +{fmt(ingresosExtra.reduce((s, i) => s + (Number(i.monto) || 0), 0))}
              </span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
              {ingresosExtra.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs hover:border-slate-700 transition"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center space-x-2">
                      <b className="text-white truncate">{item.concepto || 'Bono'}</b>
                      <span className="text-[10px] text-slate-400">{item.fecha}</span>
                    </div>
                    <div className="text-[10px] text-amber-300/80 truncate">
                      {getDestinoLabel(item)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="font-bold text-emerald-400">+{fmt(item.monto)}</span>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition"
                      title="Eliminar ingreso extra"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
