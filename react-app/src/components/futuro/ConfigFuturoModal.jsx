import React, { useState, useEffect } from 'react';
import { X, Sliders, Save } from 'lucide-react';

export default function ConfigFuturoModal({
  isOpen,
  onClose,
  config = {},
  onSave
}) {
  if (!isOpen) return null;

  const [ingreso, setIngreso] = useState(config.ingreso_base || 5000);
  const [tasaNu, setTasaNu] = useState((config.tasa_nu || 0.13) * 100);
  const [tasaCetes, setTasaCetes] = useState((config.tasa_cetes || 0.0645) * 100);
  const [tasaAfore, setTasaAfore] = useState((config.tasa_afore || 0.085) * 100);

  const [pctP1, setPctP1] = useState((config.pct_p1 || 0.05) * 100);
  const [pctP2, setPctP2] = useState((config.pct_p2 || 0.50) * 100);
  const [pctP7, setPctP7] = useState((config.pct_p7 || 0.30) * 100);
  const [pctP3, setPctP3] = useState((config.pct_p3 || 0.10) * 100);
  const [pctP6, setPctP6] = useState((config.pct_p6 || 0.05) * 100);

  const [tdcLimite, setTdcLimite] = useState(config.tdc_limite || 4000);
  const [tdcCorte, setTdcCorte] = useState(config.tdc_corte || 23);
  const [tdcPago, setTdcPago] = useState(config.tdc_pago || 3);

  useEffect(() => {
    if (config) {
      if (config.ingreso_base !== undefined) setIngreso(config.ingreso_base);
      if (config.tasa_nu !== undefined) setTasaNu(config.tasa_nu * 100);
      if (config.tasa_cetes !== undefined) setTasaCetes(config.tasa_cetes * 100);
      if (config.tasa_afore !== undefined) setTasaAfore(config.tasa_afore * 100);
      if (config.pct_p1 !== undefined) setPctP1(config.pct_p1 * 100);
      if (config.pct_p2 !== undefined) setPctP2(config.pct_p2 * 100);
      if (config.pct_p7 !== undefined) setPctP7(config.pct_p7 * 100);
      if (config.pct_p3 !== undefined) setPctP3(config.pct_p3 * 100);
      if (config.pct_p6 !== undefined) setPctP6(config.pct_p6 * 100);
      if (config.tdc_limite !== undefined) setTdcLimite(config.tdc_limite);
      if (config.tdc_corte !== undefined) setTdcCorte(config.tdc_corte);
      if (config.tdc_pago !== undefined) setTdcPago(config.tdc_pago);
    }
  }, [config]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ingreso_base: parseFloat(ingreso),
      tasa_nu: parseFloat(tasaNu) / 100,
      tasa_cetes: parseFloat(tasaCetes) / 100,
      tasa_afore: parseFloat(tasaAfore) / 100,
      pct_p1: parseFloat(pctP1) / 100,
      pct_p2: parseFloat(pctP2) / 100,
      pct_p7: parseFloat(pctP7) / 100,
      pct_p3: parseFloat(pctP3) / 100,
      pct_p6: parseFloat(pctP6) / 100,
      tdc_limite: parseFloat(tdcLimite),
      tdc_corte: parseInt(tdcCorte),
      tdc_pago: parseInt(tdcPago),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel p-6 sm:p-7 rounded-3xl max-w-xl w-full border border-purple-500/30 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Celdas Maestras y Parámetros</h3>
              <p className="text-xs text-slate-400">Plan a Futuro &amp; Regla 50/30/10/5/5</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Ingreso y Tasas */}
          <div>
            <h4 className="font-bold text-purple-300 mb-2">Ingreso y Tasas Anuales:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-slate-400 font-semibold">Sueldo Qna ($)</label>
                <input
                  type="number"
                  step="100"
                  required
                  value={ingreso}
                  onChange={(e) => setIngreso(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1 font-bold text-emerald-400"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold">Tasa Nu (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={tasaNu}
                  onChange={(e) => setTasaNu(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold">Tasa Cetes (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={tasaCetes}
                  onChange={(e) => setTasaCetes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold">Tasa AFORE (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={tasaAfore}
                  onChange={(e) => setTasaAfore(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Porcentajes Regla 50/30/10/5/5 */}
          <div>
            <h4 className="font-bold text-purple-300 mb-2">Distribución Porcentual (%):</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div>
                <label className="text-slate-400 font-semibold">P1 Cetes (%)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={pctP1}
                  onChange={(e) => setPctP1(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold">P2 Básicos (%)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={pctP2}
                  onChange={(e) => setPctP2(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold">P7 Ocio (%)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={pctP7}
                  onChange={(e) => setPctP7(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold">P3 Emerg. (%)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={pctP3}
                  onChange={(e) => setPctP3(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold">P6 Retiro (%)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={pctP6}
                  onChange={(e) => setPctP6(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Parámetros Tarjeta de Crédito Nu */}
          <div>
            <h4 className="font-bold text-purple-300 mb-2">Parámetros Tarjeta Nu:</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-slate-400 font-semibold">Límite Crédito ($)</label>
                <input
                  type="number"
                  step="100"
                  required
                  value={tdcLimite}
                  onChange={(e) => setTdcLimite(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1 font-bold"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold">Día de Corte</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="31"
                  required
                  value={tdcCorte}
                  onChange={(e) => setTdcCorte(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold">Día Límite Pago</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="31"
                  required
                  value={tdcPago}
                  onChange={(e) => setTdcPago(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white mt-1"
                />
              </div>
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
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-lg shadow-purple-600/30"
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
