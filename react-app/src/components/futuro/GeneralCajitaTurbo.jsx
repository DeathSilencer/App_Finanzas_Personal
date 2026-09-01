import React from 'react';
import { Landmark, ShieldCheck, Award, Lock, PartyPopper, CheckCircle2, Sliders } from 'lucide-react';
import { fmt } from '../../utils/formatters';

export default function GeneralCajitaTurbo({
  futuroData = {},
  onGoToOcio,
  onOpenCerrarQuincena,
  onOpenAjusteAporte
}) {
  const of = futuroData?.otros_fondos || {};
  const cajita = of.cajita_turbo || {};
  const ocio = of.ocio || {};
  const emg = of.emergencia || {};
  const ret = of.retiro || {};
  const cetes = of.cetes || {};

  const granTotal = cajita.gran_total || 2000;
  const rendMensual = cajita.rendimiento_mensual || 21.67;
  const tasaNu = (cajita.tasa_anual || 0.13) * 100;
  const rendAnual = granTotal * (cajita.tasa_anual || 0.13);

  const porciones = cajita.porciones || {};
  const pctOcio = porciones.ocio?.pct ?? 62.5;
  const pctEmg = porciones.emergencia?.pct ?? 25.0;
  const pctRet = porciones.retiro?.pct ?? 12.5;

  return (
    <div className="space-y-6">
      {/* Hero Card: Única Cajita Turbo Nu (13% Anual) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-950/60 via-slate-900/90 to-slate-950 border border-purple-500/30 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                <span>Cajita Turbo Nu • {tasaNu.toFixed(1)}% Anual Compuesto</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[11px] font-bold">
                🛡️ Sub-contabilidad Inteligente
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Total en Cajita Turbo:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-purple-400">
                {fmt(granTotal)}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Nu solo permite tener <b className="text-white font-semibold">1 sola Cajita Turbo</b>. Aquí conviven físicamente tus 3 fondos protegidos. Tu dinero genera <b className="text-emerald-400">+{fmt(rendMensual)}/mes</b> en rendimientos diarios manteniendo el blindaje contable de cada peso.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 text-right space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Rendimiento Anual Nu</span>
              <h4 className="text-2xl font-black text-purple-400">{tasaNu.toFixed(2)}%</h4>
              <p className="text-[10px] text-emerald-400 font-semibold">Estimado: ~{fmt(rendAnual)}/año</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onGoToOcio}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2"
              >
                <PartyPopper className="w-4 h-4" />
                <span>Ver Bitácora de Ocio</span>
              </button>
              <button
                onClick={onOpenCerrarQuincena}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar Quincena</span>
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Distribución Proporcional de la Cajita */}
        <div className="mt-6 pt-6 border-t border-purple-500/20 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
            <span>Distribución de Fondos dentro de tu Cajita Turbo:</span>
            <span className="text-purple-300 font-mono text-[11px]">
              {pctOcio}% Ocio • {pctEmg}% Emergencia • {pctRet}% Retiro
            </span>
          </div>
          <div className="w-full h-4 bg-slate-800/90 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="bg-amber-400 transition-all duration-500 cursor-pointer"
              style={{ width: `${pctOcio}%` }}
              title={`Ocio Disponible: ${fmt(ocio.remanente || 1250)}`}
            ></div>
            <div
              className="bg-emerald-500 transition-all duration-500 cursor-pointer"
              style={{ width: `${pctEmg}%` }}
              title={`Fondo Emergencia: ${fmt(emg.aportado || 500)}`}
            ></div>
            <div
              className="bg-indigo-500 transition-all duration-500 cursor-pointer"
              style={{ width: `${pctRet}%` }}
              title={`Retiro SAT: ${fmt(ret.aportado || 250)}`}
            ></div>
          </div>
          <div className="flex flex-wrap items-center justify-between text-[11px] gap-2 pt-1 text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-slate-300">🍕 Ocio Disponible: <b className="text-white">{fmt(ocio.remanente || 1250)}</b></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">🛡️ Fondo Emergencia: <b className="text-white">{fmt(emg.aportado || 500)}</b></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span className="text-slate-300">🚀 Retiro SAT: <b className="text-white">{fmt(ret.aportado || 250)}</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 4 Tarjetas de los Otros $2,500 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tarjeta 1: Ocio */}
        <div className="glass-panel p-5 rounded-2xl border-amber-500/30 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase">
                Paso 7 • 30%
              </span>
              <span className="text-xs text-slate-400 font-semibold">Cajita Turbo Nu</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-3 flex items-center space-x-1.5">
              <span>🍕 Gustos / Ocio</span>
            </h4>
            <h3 className="text-2xl font-black text-amber-400 mt-1">{fmt(ocio.remanente || 1250)}</h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Presupuesto: <b className="text-slate-300">{fmt(ocio.presupuesto || 1500)}</b> | Gastado: <b className="text-rose-400">{fmt(ocio.gasto_real || 250)}</b>
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-emerald-400 font-semibold">🟢 {fmt(ocio.remanente || 1250)} Disponible</span>
            <button
              onClick={onGoToOcio}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition"
            >
              Registrar
            </button>
          </div>
        </div>

        {/* Tarjeta 2: Fondo Emergencia */}
        <div className="glass-panel p-5 rounded-2xl border-emerald-500/30 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase">
                Paso 3 • 10%
              </span>
              <span className="text-xs text-slate-400 font-semibold">Cajita Turbo Nu</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-3 flex items-center space-x-1.5">
              <span>🛡️ Fondo de Emergencia</span>
            </h4>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{fmt(emg.aportado || 500)}</h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Asignación: <b className="text-slate-300">{fmt(emg.presupuesto || 500)} / qna</b> (Meta: $15,000)
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>Blindado en Cajita</span>
            </span>
            <button
              onClick={() => onOpenAjusteAporte('emergencia')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Ajustar
            </button>
          </div>
        </div>

        {/* Tarjeta 3: Retiro SAT */}
        <div className="glass-panel p-5 rounded-2xl border-indigo-500/30 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-black uppercase">
                Paso 6 • 5%
              </span>
              <span className="text-xs text-slate-400 font-semibold">Cajita Turbo Nu</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-3 flex items-center space-x-1.5">
              <span>🚀 Retiro SAT (AFORE)</span>
            </h4>
            <h3 className="text-2xl font-black text-indigo-400 mt-1">{fmt(ret.aportado || 250)}</h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Asignación: <b className="text-slate-300">{fmt(ret.presupuesto || 250)} / qna</b> (Deducible SAT)
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-indigo-300 font-semibold">📈 Deducción Art. 151</span>
            <button
              onClick={() => onOpenAjusteAporte('retiro')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Ajustar
            </button>
          </div>
        </div>

        {/* Tarjeta 4: Cetesdirecto */}
        <div className="glass-panel p-5 rounded-2xl border-blue-500/30 flex flex-col justify-between space-y-4 bg-gradient-to-br from-blue-950/30 via-slate-900 to-slate-900">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-black uppercase">
                Paso 1 • 5%
              </span>
              <span className="text-xs text-blue-300 font-semibold">Cetesdirecto (3M)</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-3 flex items-center space-x-1.5">
              <span>🔒 Ahorro Involuntario</span>
            </h4>
            <h3 className="text-2xl font-black text-blue-400 mt-1">{fmt(cetes.aportado || 250)}</h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Asignación: <b className="text-slate-300">{fmt(cetes.presupuesto || 250)} / qna</b> al 6.45%
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{cetes.estado || 'Aportado (Cetes)'}</span>
            </span>
            <button
              onClick={() => onOpenAjusteAporte('cetes')}
              className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs font-bold transition"
            >
              Declarar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla Estructura de los Otros $2,500 */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Landmark className="w-4 h-4 text-purple-400" />
              <span>Estructura de los Otros $2,500 Quincenales (50% Restante del Sueldo)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Sincronizado con SQLite</p>
          </div>
          <button
            onClick={onGoToOcio}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition"
          >
            Registrar Gasto de Ocio
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Fondo / Destino</th>
                <th className="p-3.5">Paso / Regla</th>
                <th className="p-3.5 text-center">% Presupuesto</th>
                <th className="p-3.5 text-right">Asignación Quincenal</th>
                <th className="p-3.5 text-right">Aportado / Gastado</th>
                <th className="p-3.5 text-right">Saldo Actual</th>
                <th className="p-3.5">Cuenta / Ubicación Física</th>
                <th className="p-3.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              <tr className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-white">🍕 Gustos / Ocio</td>
                <td className="p-3.5 text-slate-300">Paso 7: Estilo de Vida</td>
                <td className="p-3.5 text-center font-bold text-amber-400">30.0%</td>
                <td className="p-3.5 text-right font-semibold text-white">{fmt(ocio.presupuesto || 1500)}</td>
                <td className="p-3.5 text-right font-bold text-rose-400">-{fmt(ocio.gasto_real || 250)}</td>
                <td className="p-3.5 text-right font-black text-amber-300 text-sm">{fmt(ocio.remanente || 1250)}</td>
                <td className="p-3.5 text-purple-300 font-medium">🟣 Cajita Turbo Nu (Líquido)</td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Disponible
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-white">🛡️ Fondo de Emergencia</td>
                <td className="p-3.5 text-slate-300">Paso 3: Colchón 3 Meses</td>
                <td className="p-3.5 text-center font-bold text-emerald-400">10.0%</td>
                <td className="p-3.5 text-right font-semibold text-white">{fmt(emg.presupuesto || 500)}</td>
                <td className="p-3.5 text-right font-bold text-emerald-400">+{fmt(emg.aportado || 500)}</td>
                <td className="p-3.5 text-right font-black text-emerald-400 text-sm">{fmt(emg.aportado || 500)}</td>
                <td className="p-3.5 text-purple-300 font-medium">🟣 Cajita Turbo Nu (Intocable)</td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Blindado
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-white">🚀 Retiro SAT (AFORE)</td>
                <td className="p-3.5 text-slate-300">Paso 6: Deducible Art. 151</td>
                <td className="p-3.5 text-center font-bold text-indigo-400">5.0%</td>
                <td className="p-3.5 text-right font-semibold text-white">{fmt(ret.presupuesto || 250)}</td>
                <td className="p-3.5 text-right font-bold text-indigo-400">+{fmt(ret.aportado || 250)}</td>
                <td className="p-3.5 text-right font-black text-indigo-300 text-sm">{fmt(ret.aportado || 250)}</td>
                <td className="p-3.5 text-purple-300 font-medium">🟣 Cajita Turbo Nu (Resguardo)</td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Resguardado
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/40 transition bg-blue-950/10">
                <td className="p-3.5 font-bold text-white">🔒 Ahorro Involuntario</td>
                <td className="p-3.5 text-slate-300">Paso 1: Bloqueo Automático</td>
                <td className="p-3.5 text-center font-bold text-blue-400">5.0%</td>
                <td className="p-3.5 text-right font-semibold text-white">{fmt(cetes.presupuesto || 250)}</td>
                <td className="p-3.5 text-right font-bold text-blue-400">+{fmt(cetes.aportado || 250)}</td>
                <td className="p-3.5 text-right font-black text-blue-300 text-sm">{fmt(cetes.aportado || 250)}</td>
                <td className="p-3.5 text-blue-300 font-medium">🔵 Cetesdirecto (3 Meses)</td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                    Aportado
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-900 font-bold border-t-2 border-slate-700 text-xs">
              <tr>
                <td colSpan="2" className="p-3.5 text-white uppercase font-extrabold">Total Otros Fondos:</td>
                <td className="p-3.5 text-center text-emerald-400 font-black">50.0%</td>
                <td className="p-3.5 text-right text-emerald-400 font-black text-sm">$2,500.00</td>
                <td className="p-3.5 text-right text-slate-300 font-black">
                  +{fmt((emg.aportado || 500) + (ret.aportado || 250))} | -{fmt(ocio.gasto_real || 250)}
                </td>
                <td className="p-3.5 text-right text-purple-300 font-black text-base">
                  {fmt(granTotal + (cetes.aportado || 250))}
                </td>
                <td colSpan="2" className="p-3.5 text-right text-slate-400 font-semibold">
                  Cajita Nu ({fmt(granTotal)}) + Cetes ({fmt(cetes.aportado || 250)})
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
