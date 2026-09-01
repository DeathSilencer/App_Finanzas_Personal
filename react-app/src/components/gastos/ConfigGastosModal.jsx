import React, { useState, useEffect } from 'react';
import { X, Sliders, Save } from 'lucide-react';

export default function ConfigGastosModal({ isOpen, onClose, config = {}, onSave }) {
  if (!isOpen) return null;

  const [presupuesto, setPresupuesto] = useState(config.presupuesto_asignado || 2500);
  const [combi, setCombi] = useState(config.monto_combi || 320);
  const [comida, setComida] = useState(config.monto_comida || 180);
  const [copias, setCopias] = useState(config.monto_copias || 50);
  const [imprevistos, setImprevistos] = useState(config.monto_imprevistos || 200);
  const [metaMoto, setMetaMoto] = useState(config.meta_moto || 35000);
  const [diasLibres, setDiasLibres] = useState(config.dias_libres_cuatri || 25);
  const [quincenasCuatri, setQuincenasCuatri] = useState(config.quincenas_cuatri || 8);

  useEffect(() => {
    if (config) {
      if (config.presupuesto_asignado !== undefined) setPresupuesto(config.presupuesto_asignado);
      if (config.monto_combi !== undefined) setCombi(config.monto_combi);
      if (config.monto_comida !== undefined) setComida(config.monto_comida);
      if (config.monto_copias !== undefined) setCopias(config.monto_copias);
      if (config.monto_imprevistos !== undefined) setImprevistos(config.monto_imprevistos);
      if (config.meta_moto !== undefined) setMetaMoto(config.meta_moto);
      if (config.dias_libres_cuatri !== undefined) setDiasLibres(config.dias_libres_cuatri);
      if (config.quincenas_cuatri !== undefined) setQuincenasCuatri(config.quincenas_cuatri);
    }
  }, [config]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      presupuesto_asignado: parseFloat(presupuesto),
      monto_combi: parseFloat(combi),
      monto_comida: parseFloat(comida),
      monto_copias: parseFloat(copias),
      monto_imprevistos: parseFloat(imprevistos),
      meta_moto: parseFloat(metaMoto),
      dias_libres_num: parseInt(diasLibres),
      quincenas_cuatri: parseInt(quincenasCuatri),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel p-6 sm:p-7 rounded-3xl max-w-lg w-full border border-amber-500/30 shadow-2xl relative space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configuración de Parámetros</h3>
              <p className="text-xs text-slate-400">Gastos Básicos &amp; Simulador Moto</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold">Presupuesto Quincenal ($)</label>
              <input
                type="number"
                step="50"
                required
                value={presupuesto}
                onChange={(e) => setPresupuesto(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1 font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 font-semibold">Meta Moto ($)</label>
              <input
                type="number"
                step="500"
                required
                value={metaMoto}
                onChange={(e) => setMetaMoto(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1 font-bold text-emerald-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold">Combi Quincenal ($)</label>
              <input
                type="number"
                step="1"
                required
                value={combi}
                onChange={(e) => setCombi(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
              />
              <span className="text-[10px] text-slate-500">($32/día x 10 días = $320)</span>
            </div>
            <div>
              <label className="text-slate-400 font-semibold">Comidas Escuela ($)</label>
              <input
                type="number"
                step="10"
                required
                value={comida}
                onChange={(e) => setComida(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold">Copias &amp; Material ($)</label>
              <input
                type="number"
                step="10"
                required
                value={copias}
                onChange={(e) => setCopias(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400 font-semibold">Imprevistos ($)</label>
              <input
                type="number"
                step="10"
                required
                value={imprevistos}
                onChange={(e) => setImprevistos(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold">Días Libres por Cuatri</label>
              <input
                type="number"
                step="1"
                required
                value={diasLibres}
                onChange={(e) => setDiasLibres(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1 font-bold text-amber-300"
              />
              <span className="text-[10px] text-slate-500">Días sin clases para ahorro extra</span>
            </div>
            <div>
              <label className="text-slate-400 font-semibold">Quincenas por Cuatri</label>
              <input
                type="number"
                step="1"
                required
                value={quincenasCuatri}
                onChange={(e) => setQuincenasCuatri(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-600/30"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar en SQLite</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
