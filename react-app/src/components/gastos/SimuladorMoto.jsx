import React, { useState } from 'react';
import { Bike, DollarSign, Calendar, TrendingUp, PlusCircle } from 'lucide-react';
import { fmt } from '../../utils/formatters';

export default function SimuladorMoto({ simulador = {}, onMotoAporte }) {
  const [montoAporte, setMontoAporte] = useState('');
  const [modo, setModo] = useState('sumar');

  const meta = simulador.meta_total || 35000;
  const ahorroExtraVacaciones = simulador.ahorro_extra_vacaciones || 1250;
  const diasLibres = simulador.dias_libres_cuatri || 25;
  const excedenteQ = simulador.excedente_quincenal_80 || 1400;
  const cuatrisEstimados = simulador.cuatris_estimados || 2.81;
  const mesesEstimados = simulador.meses_estimados || 11.2;
  const totalAhorrado = simulador.total_ahorrado_acumulado || 0;
  const pctCumplido = simulador.pct_meta_cumplido || 0;
  const aportacionesDirectas = simulador.aportaciones_directas || 0;
  const ahorroHistorico = simulador.ahorro_acumulado_historico || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(montoAporte);
    if (isNaN(val) || val <= 0) return;
    onMotoAporte(val, modo);
    setMontoAporte('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Card: Simulador Moto */}
      <div className="card-hero-purple">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="badge-indigo">
              Plan de Aceleración Cuatrimestral
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">
              🏍️ Meta Moto: <span className="text-emerald-400">{fmt(meta)}</span> de Contado
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Aprovechando tus <b className="text-white">{diasLibres} días hábiles sin clases (L-V)</b> por cuatrimestre (Ahorro Extra Auto: <b className="text-emerald-400">+{fmt(ahorroExtraVacaciones)}</b>) + tu excedente quincenal del 80% (<b className="text-indigo-400">{fmt(excedenteQ)}</b>).
            </p>
          </div>
          <div className="text-right shrink-0 p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30">
            <span className="kpi-label">Tiempo Estimado</span>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5">{cuatrisEstimados} Cuatris</h3>
            <p className="text-xs text-slate-400 mt-1 font-semibold">(~{mesesEstimados} meses)</p>
          </div>
        </div>

        {/* Barra de progreso de la meta */}
        <div className="mt-6 pt-6 border-t border-indigo-500/20 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300">Progreso hacia los {fmt(meta)}:</span>
            <span className="text-emerald-400 font-bold">{pctCumplido}% completado</span>
          </div>
          <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, pctCumplido)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Ahorrado: <b className="text-white">{fmt(totalAhorrado)}</b></span>
            <span>Resta: <b className="text-rose-400">{fmt(Math.max(0, meta - totalAhorrado))}</b></span>
          </div>
        </div>
      </div>

      {/* Grid: 3 Tarjetas de Resumen + Formulario de Aportación */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Ahorro por Cuatrimestre */}
        <div className="card-glass p-4 sm:p-5 border-indigo-500/30 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="kpi-label">Ahorro por Cuatrimestre</span>
            <h3 className="kpi-val-indigo text-indigo-400 font-black text-2xl mt-1">{fmt(simulador.ahorro_por_cuatrimestre || 12450)}</h3>
            <p className="text-xs text-slate-400 mt-2">
              8 quincenas al 80% ({fmt(excedenteQ * 8)}) + Ahorro vacaciones ({fmt(ahorroExtraVacaciones)}).
            </p>
          </div>
        </div>

        {/* Card 2: Aportaciones Directas */}
        <div className="card-glass p-4 sm:p-5 border-emerald-500/30 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="kpi-label">Aportaciones Directas</span>
            <h3 className="kpi-val-emerald text-2xl mt-1">{fmt(aportacionesDirectas)}</h3>
            <p className="text-xs text-slate-400 mt-2">
              Dinero extra ingresado directamente para acelerar la compra de la moto.
            </p>
          </div>
        </div>

        {/* Formulario: Registrar Aporte Directo */}
        <div className="card-glass p-4 sm:p-5 border-amber-500/30">
          <h4 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Registrar Aporte Voluntario a Moto</span>
          </h4>
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="form-label">Monto a abonar ($ MXN)</label>
              <input
                type="number"
                step="50"
                required
                placeholder="0.00"
                value={montoAporte}
                onChange={(e) => setMontoAporte(e.target.value)}
                className="form-input font-bold text-amber-400"
              />
            </div>
            <div className="flex space-x-3 text-xs py-1">
              <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
                <input
                  type="radio"
                  name="modo_moto"
                  value="sumar"
                  checked={modo === 'sumar'}
                  onChange={() => setModo('sumar')}
                  className="text-amber-500"
                />
                <span>Sumar al actual</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
                <input
                  type="radio"
                  name="modo_moto"
                  value="fijar"
                  checked={modo === 'fijar'}
                  onChange={() => setModo('fijar')}
                  className="text-amber-500"
                />
                <span>Fijar total</span>
              </label>
            </div>
            <button
              type="submit"
              className="btn-amber w-full !bg-amber-600 hover:!bg-amber-500 text-white font-bold"
            >
              Guardar Aporte en la Nube
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
