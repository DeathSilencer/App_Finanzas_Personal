import React, { useState, useEffect } from 'react';
import {
  Landmark,
  ShieldCheck,
  Award,
  Lock,
  PartyPopper,
  CheckCircle2,
  Sliders,
  Bike,
  Sparkles,
  Wallet,
  Coins,
  Receipt,
  FileText,
  ExternalLink,
  Banknote,
  X,
  RefreshCw
} from 'lucide-react';
import { fmt } from '../../utils/formatters';
import { ajustarCajitaTurbo } from '../../services/api';

export default function GeneralCajitaTurbo({
  futuroData = {},
  onGoToOcio,
  onOpenCerrarQuincena,
  onOpenAjusteAporte,
  onReloadFuturo,
  addToast
}) {
  const of = futuroData?.otros_fondos || {};
  const cajita = of.cajita_turbo || {};
  const ocio = of.ocio || {};
  const emg = of.emergencia || {};
  const ret = of.retiro || {};
  const cetes = of.cetes || {};

  const granTotal = cajita.gran_total || 3644;
  const rendMensual = cajita.rendimiento_mensual || 39.48;
  const rendAnual = cajita.rendimiento_anual || (granTotal * 0.13);
  const tasaNu = (cajita.tasa_anual || 0.13) * 100;

  const totalFuturo = cajita.total_futuro || 1750;
  const totalGastosDigital = cajita.total_gastos_digital || 1894;

  const porciones = cajita.porciones || {};
  const porcOcio = porciones.ocio || { presupuesto: 1500, gasto_real: ocio.gasto_real || 0, monto: ocio.remanente || 1500, pct: 35.0 };
  const porcEmg = porciones.emergencia || { presupuesto: 500, gasto_real: 0, monto: emg.aportado || 500, pct: 13.7 };
  const porcMoto = porciones.moto_80 || { presupuesto: 1355.2, gasto_real: 0, monto: 1355.2, pct: 37.2 };
  const porcSalidas = porciones.salidas_20 || { presupuesto: 338.8, gasto_real: 0, monto: 338.8, pct: 9.3 };
  const porcImp = porciones.imprevistos || { presupuesto: 200, gasto_real: 0, monto: 200, pct: 5.5 };
  const porcCopias = porciones.copias || { presupuesto: 50, gasto_real: 0, monto: 50, pct: 1.4 };
  const porcRendimientos = porciones.rendimientos || {
    presupuesto: cajita.rendimientos_ganados_nu || 0,
    gasto_real: 0,
    monto: cajita.rendimientos_ganados_nu || 0,
    pct: granTotal > 0 ? (((cajita.rendimientos_ganados_nu || 0) / granTotal) * 100) : 0
  };
  const tieneRendimientos = (porcRendimientos.monto || 0) > 0;

  // Estado y lógica para modal de conciliación con Nu
  const [showModalConciliar, setShowModalConciliar] = useState(false);
  const [inputSaldoReal, setInputSaldoReal] = useState(cajita.gran_total || 3682.95);
  const [inputRendimiento, setInputRendimiento] = useState(cajita.rendimiento_real_ganado || 5.88);
  const [savingAjuste, setSavingAjuste] = useState(false);

  useEffect(() => {
    if (cajita.gran_total) {
      setInputSaldoReal(cajita.gran_total);
    }
    if (cajita.rendimiento_real_ganado !== undefined) {
      setInputRendimiento(cajita.rendimiento_real_ganado);
    }
  }, [cajita.gran_total, cajita.rendimiento_real_ganado]);

  const handleGuardarConciliacion = async (e) => {
    e.preventDefault();
    try {
      setSavingAjuste(true);
      const res = await ajustarCajitaTurbo({
        saldo_real: parseFloat(inputSaldoReal),
        rendimiento_real: parseFloat(inputRendimiento)
      });
      if (addToast) {
        addToast(res.message || 'Cajita Turbo sincronizada con Nu', 'success');
      }
      if (onReloadFuturo) {
        await onReloadFuturo();
      }
      setShowModalConciliar(false);
    } catch (err) {
      if (addToast) {
        addToast(err.message || 'Error al conciliar saldo', 'error');
      }
    } finally {
      setSavingAjuste(false);
    }
  };

  // Totales presupuestados y gastados en los fondos de Cajita Nu (esta quincena actual)
  const totalPresupuestoCajita = (
    (porcOcio.presupuesto || 0) +
    (porcEmg.presupuesto || 0) +
    (porcMoto.presupuesto || 0) +
    (porcSalidas.presupuesto || 0) +
    (porcImp.presupuesto || 0) +
    (porcCopias.presupuesto || 0) +
    (tieneRendimientos ? porcRendimientos.monto : 0)
  );

  const totalGastadoCajita = (
    (porcOcio.gasto_real || 0) +
    (porcEmg.gasto_real || 0) +
    (porcMoto.gasto_real || 0) +
    (porcSalidas.gasto_real || 0) +
    (porcImp.gasto_real || 0) +
    (porcCopias.gasto_real || 0)
  );

  const efectivoCartera = cajita.efectivo_cartera || {
    presupuesto_actual: 556,
    monto_combi: 376,
    monto_comida: 180,
    proximo_presupuesto_total: 606,
    monto_copias: 50,
    desglose_actual: "$376.00 Pasajes + $180.00 Comidas",
    desglose_proximo: "$376.00 Pasajes + $180.00 Comidas + $50.00 Copias Físicas"
  };

  const totalFondosExternos = (cetes.aportado || 250) + (ret.aportado || 250);

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* HERO CARD: ÚNICA CAJITA TURBO NU (13% ANUAL) - CONSOLIDADO REAL */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="card-hero-purple">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-purple !py-1 !text-xs">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                <span>Cajita Turbo Nu • {tasaNu.toFixed(1)}% Anual Compuesto</span>
              </span>
              <span className="badge-emerald">
                🛡️ Acumulativo en Cada Cierre de Quincena
              </span>
              <span className="badge-indigo">
                ⚡ 6 Fondos en Nu (Quincena Actual)
              </span>
              {tieneRendimientos && (
                <span className="badge-amber font-black">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>+{fmt(cajita.rendimientos_ganados_nu)} ganados en Nu (13%)</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Total Real en Cajita Turbo:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-emerald-300 to-indigo-300">
                {fmt(granTotal)}
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Nu solo permite tener <b className="text-white font-semibold">1 sola Cajita Turbo</b>. Aquí conviven tus fondos acumulativos de <b className="text-purple-300">Plan a Futuro ({fmt(totalFuturo)})</b> y los fondos digitales de <b className="text-emerald-300">Gastos Básicos ({fmt(totalGastosDigital)})</b>. Cada quincena que cierras, <b className="text-emerald-300">se suma todo lo no gastado más las nuevas asignaciones</b>, haciendo subir tu saldo real a <b className="text-emerald-400 text-sm">+{fmt(rendMensual)}/mes</b> en rendimientos pasivos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            <div className="card-glass-subtle text-right space-y-0.5 border-purple-500/40 shadow-xl w-full sm:w-auto">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">
                Rendimiento Pasivo Mensual
              </span>
              <h4 className="text-2xl font-black text-emerald-400">+{fmt(rendMensual)} / mes</h4>
              <p className="text-[10px] text-purple-300 font-semibold">
                Estimado anual: ~{fmt(rendAnual)} ({tasaNu.toFixed(1)}%)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowModalConciliar(true)}
                className="btn-ghost !text-xs !min-h-[40px] text-purple-300 border-purple-500/40 flex-1 sm:flex-initial"
                title="Ajustar o sincronizar saldo exacto con tu App Nu"
              >
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Conciliar con Nu</span>
              </button>
              <button
                onClick={onGoToOcio}
                className="btn-purple !text-xs !min-h-[40px] flex-1 sm:flex-initial"
              >
                <PartyPopper className="w-4 h-4" />
                <span>Registrar Ocio</span>
              </button>
              <button
                onClick={onOpenCerrarQuincena}
                className="btn-success !text-xs !min-h-[40px] flex-1 sm:flex-initial"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Cerrar Quincena</span>
              </button>
            </div>
          </div>
        </div>

        {/* BARRA DE DISTRIBUCIÓN MULTICOLOR DE LOS 6 FONDOS EN CAJITA NU */}
        <div className="mt-6 pt-6 border-t border-purple-500/20 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold text-slate-300 gap-1">
            <span>Distribución de los 6 Fondos en tu Cajita Turbo (Quincena Actual):</span>
            <span className="text-purple-300 font-mono text-[11px]">
              Futuro ({fmt(totalFuturo)}) + Gastos Digitales ({fmt(totalGastosDigital)}) = {fmt(granTotal)}
            </span>
          </div>

          <div className="w-full h-4 bg-slate-800/90 rounded-full overflow-hidden flex shadow-inner border border-slate-700">
            {/* Ocio */}
            <div
              className="bg-amber-400 transition-all duration-500 hover:opacity-80"
              style={{ width: `${porcOcio.pct}%` }}
              title={`Ocio: ${fmt(porcOcio.monto)} (${porcOcio.pct}%)`}
            ></div>
            {/* Moto 80% */}
            <div
              className="bg-purple-500 transition-all duration-500 hover:opacity-80"
              style={{ width: `${porcMoto.pct}%` }}
              title={`Moto 80%: ${fmt(porcMoto.monto)} (${porcMoto.pct}%)`}
            ></div>
            {/* Emergencia */}
            <div
              className="bg-emerald-500 transition-all duration-500 hover:opacity-80"
              style={{ width: `${porcEmg.pct}%` }}
              title={`Emergencia: ${fmt(porcEmg.monto)} (${porcEmg.pct}%)`}
            ></div>
            {/* Refuerzo Salidas 20% */}
            <div
              className="bg-pink-500 transition-all duration-500 hover:opacity-80"
              style={{ width: `${porcSalidas.pct}%` }}
              title={`Salidas 20%: ${fmt(porcSalidas.monto)} (${porcSalidas.pct}%)`}
            ></div>
            {/* Imprevistos */}
            <div
              className="bg-teal-400 transition-all duration-500 hover:opacity-80"
              style={{ width: `${porcImp.pct}%` }}
              title={`Imprevistos: ${fmt(porcImp.monto)} (${porcImp.pct}%)`}
            ></div>
            {/* Copias */}
            <div
              className="bg-sky-400 transition-all duration-500 hover:opacity-80"
              style={{ width: `${porcCopias.pct}%` }}
              title={`Copias: ${fmt(porcCopias.monto)} (${porcCopias.pct}%)`}
            ></div>
            {/* Rendimientos Ganados */}
            {tieneRendimientos && (
              <div
                className="bg-yellow-400 transition-all duration-500 hover:opacity-80 animate-pulse"
                style={{ width: `${porcRendimientos.pct}%` }}
                title={`Rendimientos Ganados Nu: ${fmt(porcRendimientos.monto)} (${porcRendimientos.pct.toFixed(1)}%)`}
              ></div>
            )}
          </div>

          {/* Leyenda de los 6 o 7 colores */}
          <div className={`grid grid-cols-2 sm:grid-cols-3 ${tieneRendimientos ? 'lg:grid-cols-7' : 'lg:grid-cols-6'} gap-2 pt-2 text-[11px] text-slate-300`}>
            <div className="flex items-center space-x-1.5 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
              <span className="truncate">🍕 Ocio: <b>{fmt(porcOcio.monto)}</b></span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span>
              <span className="truncate">🏍️ Moto: <b>{fmt(porcMoto.monto)}</b></span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="truncate">🛡️ Emerg.: <b>{fmt(porcEmg.monto)}</b></span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0"></span>
              <span className="truncate">🍦 Salidas: <b>{fmt(porcSalidas.monto)}</b></span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0"></span>
              <span className="truncate">🛡️ Imprev.: <b>{fmt(porcImp.monto)}</b></span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0"></span>
              <span className="truncate">📄 Copias: <b>{fmt(porcCopias.monto)}</b></span>
            </div>
            {tieneRendimientos && (
              <div className="flex items-center space-x-1.5 bg-yellow-950/60 p-1.5 rounded-lg border border-yellow-600/50 text-yellow-300">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0 animate-pulse"></span>
                <span className="truncate">✨ Rendim.: <b>+{fmt(porcRendimientos.monto)}</b></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* DOS GRANDES BLOQUES: FONDOS A FUTURO vs FONDOS DIGITALES DE GASTOS */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BLOQUE A: PLAN A FUTURO EN CAJITA NU */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl border-purple-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase">
                Bloque A • Plan a Futuro en Nu
              </span>
              <h3 className="text-base font-bold text-white mt-1 flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-purple-400" />
                <span>Fondos Patrimoniales Acumulativos</span>
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Subtotal en Nu</span>
              <p className="text-xl font-black text-purple-400">{fmt(totalFuturo)}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* Ocio */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>🍕 Ocio &amp; Estilo de Vida (Paso 7 • 30%)</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Presupuesto acumulado: {fmt(porcOcio.presupuesto)} | Gastado: <b className="text-rose-400">-{fmt(porcOcio.gasto_real)}</b>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-amber-400">{fmt(porcOcio.monto)}</p>
                <span className="text-[9px] text-emerald-400 font-bold">🟢 En Cajita Nu</span>
              </div>
            </div>

            {/* Emergencia */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>🛡️ Fondo de Emergencia (Paso 3 • 10%)</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Acumulado blindado en Cajita (Meta $15,000)
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-emerald-400">{fmt(porcEmg.monto)}</p>
                <span className="text-[9px] text-emerald-400 font-bold">🔒 Intocable</span>
              </div>
            </div>

            {/* Banner Cuentas Externas Fuera de Nu */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold flex items-center space-x-1">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>Fondos Externos (Fuera de Nu):</span>
                </span>
                <span className="font-bold text-slate-300">{fmt(totalFondosExternos)} / quincena</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                <div>
                  <span className="text-blue-400 font-bold">🔒 Cetesdirecto:</span> {fmt(cetes.aportado || 250)}
                </div>
                <div>
                  <span className="text-indigo-400 font-bold">🚀 AFORE Banorte:</span> {fmt(ret.aportado || 250)}
                </div>
              </div>
              <p className="text-[9px] text-slate-500">
                *Descontados de tu cuenta Nu al ser fondeados a sus plataformas directas.
              </p>
            </div>
          </div>
        </div>

        {/* BLOQUE B: FONDOS DIGITALES DE GASTOS BÁSICOS EN NU (CONECTADOS) */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase">
                Bloque B • Gastos Básicos en Nu
              </span>
              <h3 className="text-base font-bold text-white mt-1 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Saldo Acumulado en Cajita (Quincena Actual)</span>
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Saldo Restante en Nu</span>
              <p className="text-xl font-black text-emerald-400">{fmt(totalGastosDigital)}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* Acelerador Moto 80% */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>🏍️ Acelerador Moto (80% Excedente)</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Ahorro acumulado + quincena activa (Meta $35,000)
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-purple-400">{fmt(porcMoto.monto)}</p>
                <span className="text-[9px] text-purple-300 font-bold">Generando 13%</span>
              </div>
            </div>

            {/* Refuerzo Salidas 20% */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  <span>🍦 Refuerzo Gustos / Salidas (20%)</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {porcSalidas.gasto_real > 0 ? (
                    <span className="text-rose-400 font-bold">Gastado: -{fmt(porcSalidas.gasto_real)}</span>
                  ) : (
                    `Presupuesto: ${fmt(porcSalidas.presupuesto)}`
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-pink-400">{fmt(porcSalidas.monto)}</p>
                <span className="text-[9px] text-emerald-400 font-bold">En Débito Nu</span>
              </div>
            </div>

            {/* Imprevistos y Copias */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-white flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                    <span>🛡️ Imprevistos</span>
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {porcImp.gasto_real > 0 ? (
                      <span className="text-rose-400 font-bold">Gastado: -{fmt(porcImp.gasto_real)}</span>
                    ) : (
                      `Saldo: ${fmt(porcImp.presupuesto)}`
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-teal-400">{fmt(porcImp.monto)}</p>
                  <span className="text-[8px] text-slate-400 font-semibold">En Cajita</span>
                </div>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-white flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>📄 Copias</span>
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {porcCopias.gasto_real > 0 ? (
                      <span className="text-rose-400 font-bold">Gastado: -{fmt(porcCopias.gasto_real)}</span>
                    ) : (
                      `Saldo: ${fmt(porcCopias.presupuesto)}`
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-sky-400">{fmt(porcCopias.monto)}</p>
                  <span className="text-[8px] text-emerald-400 font-semibold">En Cajita</span>
                </div>
              </div>
            </div>

            {/* Banner Informativo de Transición al Siguiente Día de Pago */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold flex items-center space-x-1 text-emerald-400">
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Efectivo Físico en Cartera:</span>
                </span>
                <span className="font-bold text-emerald-300">{fmt(efectivoCartera.presupuesto_actual)} actual</span>
              </div>
              <p className="text-[10px] text-slate-300">
                *En esta quincena activa tu retiro base fue de <b className="text-white">{efectivoCartera.desglose_actual}</b> ({fmt(efectivoCartera.presupuesto_actual)}). A partir de tu próximo día de pago (siguiente quincena), pasará a <b className="text-emerald-400">{fmt(efectivoCartera.proximo_presupuesto_total)}</b> para incluir Copias en efectivo y blindar tu transporte.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NOTA ACLARATORIA DE ACUMULACIÓN EN CADA CIERRE */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start space-x-3 text-xs">
        <Wallet className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-slate-300 space-y-1">
          <p className="font-bold text-white">
            ¿Cómo sube en automático tu cuenta cada vez que cierras quincena?
          </p>
          <p>
            Al presionar <b className="text-emerald-400">Cerrar Quincena</b>, todo el dinero que no gastaste se resguarda en tu cuenta Nu y <b className="text-white">se suma directamente con la nueva quincena entrante</b>. El Fondo de Emergencia crece en <b className="text-emerald-400">+$500</b>, el Fondo de Moto en <b className="text-purple-300">+$1,355.20</b>, y tu bolsa de Ocio acumula el sobrante anterior. Así tu <b className="text-purple-300">Total en Cajita Turbo</b> va creciendo quincena a quincena generando rendimientos cada vez más altos al 13%.
          </p>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* TABLA CONSOLIDADA DE TODOS LOS FONDOS EN CAJITA NU (13%) */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="card-glass p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
              <Coins className="w-4 h-4 text-purple-400" />
              <span>Matriz Consolidada de Fondos en Cajita Turbo Nu (13% Anual)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Sincronizado en tiempo real con la Nube 24/7 (Cloud Firestore) • Quincena Actual</p>
          </div>
          <button
            onClick={onGoToOcio}
            className="btn-amber !py-1.5 !px-3 !text-xs"
          >
            Registrar Gasto de Ocio
          </button>
        </div>

        <div className="table-responsive-container">
          <table className="table-modern">
            <thead>
              <tr>
                <th className="table-modern-th">Fondo / Apartado</th>
                <th className="table-modern-th">Origen / Bloque</th>
                <th className="table-modern-th text-right">Presupuesto ($)</th>
                <th className="table-modern-th text-right">Gasto Real ($)</th>
                <th className="table-modern-th text-right font-black text-white">Saldo en Nu ($)</th>
                <th className="table-modern-th text-center">% en Cajita</th>
                <th className="table-modern-th text-right">Rendimiento Mensual</th>
                <th className="table-modern-th text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {/* Ocio */}
              <tr className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-white">🍕 Gustos / Ocio</td>
                <td className="p-3.5 text-slate-300">Plan a Futuro (Acumulativo)</td>
                <td className="p-3.5 text-right text-slate-300 font-semibold">{fmt(porcOcio.presupuesto)}</td>
                <td className={`p-3.5 text-right font-bold ${porcOcio.gasto_real > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                  {porcOcio.gasto_real > 0 ? '-' + fmt(porcOcio.gasto_real) : '$0.00'}
                </td>
                <td className="p-3.5 text-right font-black text-amber-300 text-sm">{fmt(porcOcio.monto)}</td>
                <td className="p-3.5 text-center font-bold text-amber-400">{porcOcio.pct}%</td>
                <td className="p-3.5 text-right text-emerald-400 font-bold">+{fmt(porcOcio.monto * (0.13 / 12))}</td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    Disponible
                  </span>
                </td>
              </tr>

              {/* Moto 80% */}
              <tr className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-white">🏍️ Fondo Acelerador Moto (80%)</td>
                <td className="p-3.5 text-slate-300">Gastos Básicos (Acumulativo)</td>
                <td className="p-3.5 text-right text-slate-300 font-semibold">{fmt(porcMoto.presupuesto)}</td>
                <td className={`p-3.5 text-right font-bold ${porcMoto.gasto_real > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                  {porcMoto.gasto_real > 0 ? '-' + fmt(porcMoto.gasto_real) : '$0.00'}
                </td>
                <td className="p-3.5 text-right font-black text-purple-300 text-sm">{fmt(porcMoto.monto)}</td>
                <td className="p-3.5 text-center font-bold text-purple-400">{porcMoto.pct}%</td>
                <td className="p-3.5 text-right text-emerald-400 font-bold">+{fmt(porcMoto.monto * (0.13 / 12))}</td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                    Meta Moto
                  </span>
                </td>
              </tr>

              {/* Emergencia */}
              <tr className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-white">🛡️ Fondo de Emergencia</td>
                <td className="p-3.5 text-slate-300">Plan a Futuro (Acumulativo)</td>
                <td className="p-3.5 text-right text-slate-300 font-semibold">{fmt(porcEmg.presupuesto)}</td>
                <td className="p-3.5 text-right text-slate-500 font-bold">$0.00</td>
                <td className="p-3.5 text-right font-black text-emerald-400 text-sm">{fmt(porcEmg.monto)}</td>
                <td className="p-3.5 text-center font-bold text-emerald-400">{porcEmg.pct}%</td>
                <td className="p-3.5 text-right text-emerald-400 font-bold">+{fmt(porcEmg.monto * (0.13 / 12))}</td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Blindado
                  </span>
                </td>
              </tr>

              {/* Refuerzo Salidas 20% */}
              <tr className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-white">🍦 Refuerzo Gustos / Salidas (20%)</td>
                <td className="p-3.5 text-slate-300">Gastos Básicos (Acumulativo)</td>
                <td className="p-3.5 text-right text-slate-300 font-semibold">{fmt(porcSalidas.presupuesto)}</td>
                <td className={`p-3.5 text-right font-bold ${porcSalidas.gasto_real > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                  {porcSalidas.gasto_real > 0 ? '-' + fmt(porcSalidas.gasto_real) : '$0.00'}
                </td>
                <td className="p-3.5 text-right font-black text-pink-300 text-sm">{fmt(porcSalidas.monto)}</td>
                <td className="p-3.5 text-center font-bold text-pink-400">{porcSalidas.pct}%</td>
                <td className="p-3.5 text-right text-emerald-400 font-bold">+{fmt(porcSalidas.monto * (0.13 / 12))}</td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-950 text-pink-300 border border-pink-800">
                    En Cuenta Nu
                  </span>
                </td>
              </tr>

              {/* Imprevistos */}
              <tr className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-white">🛡️ Colchón de Imprevistos</td>
                <td className="p-3.5 text-slate-300">Gastos Básicos (Acumulativo)</td>
                <td className="p-3.5 text-right text-slate-300 font-semibold">{fmt(porcImp.presupuesto)}</td>
                <td className={`p-3.5 text-right font-bold ${porcImp.gasto_real > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                  {porcImp.gasto_real > 0 ? '-' + fmt(porcImp.gasto_real) : '$0.00'}
                </td>
                <td className="p-3.5 text-right font-black text-teal-300 text-sm">{fmt(porcImp.monto)}</td>
                <td className="p-3.5 text-center font-bold text-teal-400">{porcImp.pct}%</td>
                <td className="p-3.5 text-right text-emerald-400 font-bold">+{fmt(porcImp.monto * (0.13 / 12))}</td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800">
                    Reserva
                  </span>
                </td>
              </tr>

              {/* Copias */}
              <tr className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-white">📄 Copias, Material &amp; Papelería</td>
                <td className="p-3.5 text-slate-300">Gastos Básicos (En Cajita Nu)</td>
                <td className="p-3.5 text-right text-slate-300 font-semibold">{fmt(porcCopias.presupuesto)}</td>
                <td className={`p-3.5 text-right font-bold ${porcCopias.gasto_real > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                  {porcCopias.gasto_real > 0 ? '-' + fmt(porcCopias.gasto_real) : '$0.00'}
                </td>
                <td className="p-3.5 text-right font-black text-sky-300 text-sm">{fmt(porcCopias.monto)}</td>
                <td className="p-3.5 text-center font-bold text-sky-400">{porcCopias.pct}%</td>
                <td className="p-3.5 text-right text-emerald-400 font-bold">+{fmt(porcCopias.monto * (0.13 / 12))}</td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                    En Cajita Nu
                  </span>
                </td>
              </tr>

              {/* Rendimientos Ganados Nu (13%) */}
              {tieneRendimientos && (
                <tr className="hover:bg-yellow-950/20 transition bg-yellow-950/10">
                  <td className="p-3.5 font-bold text-yellow-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Rendimientos Ganados Nu (13%)</span>
                  </td>
                  <td className="p-3.5 text-yellow-200/80">Crecimiento Pasivo Diario Acreditado</td>
                  <td className="p-3.5 text-right text-yellow-300/70 font-semibold">{fmt(porcRendimientos.monto)}</td>
                  <td className="p-3.5 text-right font-bold text-slate-500">$0.00</td>
                  <td className="p-3.5 text-right font-black text-yellow-300 text-sm">+{fmt(porcRendimientos.monto)}</td>
                  <td className="p-3.5 text-center font-bold text-yellow-400">{porcRendimientos.pct.toFixed(1)}%</td>
                  <td className="p-3.5 text-right text-emerald-400 font-bold">+{fmt(porcRendimientos.monto * (0.13 / 12))}</td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-950 text-yellow-300 border border-yellow-700">
                      Ganancia Real
                    </span>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Footer con Totales de los Fondos en Nu */}
            <tfoot className="bg-slate-900 font-bold border-t-2 border-slate-700 text-xs">
              <tr>
                <td colSpan="2" className="p-3.5 text-white uppercase font-extrabold">
                  TOTAL EN CAJITA TURBO NU (13%):
                </td>
                <td className="p-3.5 text-right text-slate-400 font-black">
                  {fmt(totalPresupuestoCajita)}
                </td>
                <td className="p-3.5 text-right text-rose-400 font-black">
                  {totalGastadoCajita > 0 ? '-' + fmt(totalGastadoCajita) : '$0.00'}
                </td>
                <td className="p-3.5 text-right text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-emerald-300 font-black text-base">
                  {fmt(granTotal)}
                </td>
                <td className="p-3.5 text-center text-purple-300 font-black">100.0%</td>
                <td className="p-3.5 text-right text-emerald-400 font-black text-sm">
                  +{fmt(rendMensual)} / mes
                </td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Generando 13%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* MODAL: CONCILIAR SALDO REAL Y RENDIMIENTOS CON APP NU */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {showModalConciliar && (
        <div className="modal-overlay">
          <div className="modal-sheet border-purple-500/40">
            <div className="modal-header">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Conciliar con App Nu</h3>
                  <p className="text-xs text-slate-400">Sincroniza tus rendimientos diarios y saldo real</p>
                </div>
              </div>
              <button
                onClick={() => setShowModalConciliar(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarConciliacion} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Capital Base Presupuestado:</span>
                  <b className="text-white font-mono text-sm">{fmt(cajita.capital_base || 3678)}</b>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Rendimientos Netos Acreditados:</span>
                  <b className="text-emerald-400 font-mono text-sm">
                    +{fmt(Math.max(0, (parseFloat(inputSaldoReal) || 0) - (cajita.capital_base || 3678)))}
                  </b>
                </div>
                <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-200">Total Sincronizado en App:</span>
                  <b className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-emerald-300">
                    {fmt(parseFloat(inputSaldoReal) || 0)}
                  </b>
                </div>
              </div>

              <div>
                <label className="form-label">
                  📱 Saldo Total Real en Cajitas Nu ($ MXN):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={inputSaldoReal}
                  onChange={(e) => setInputSaldoReal(e.target.value)}
                  placeholder="Ej. 3682.95"
                  className="form-input font-bold text-white text-base"
                />
                <p className="form-helper">
                  Copia exactamente el número de "Total en Cajitas" de tu app Nu (ej. $3,682.95).
                </p>
              </div>

              <div>
                <label className="form-label">
                  📈 Rendimiento Reportado por Nu ($ MXN):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={inputRendimiento}
                  onChange={(e) => setInputRendimiento(e.target.value)}
                  placeholder="Ej. 5.88"
                  className="form-input font-bold text-emerald-400"
                />
                <p className="form-helper">
                  Monto verde de "Así ha crecido tu saldo en Cajitas: ↗ $5.88".
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowModalConciliar(false)}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingAjuste}
                  className="btn-purple !bg-gradient-to-r !from-purple-600 !to-emerald-600 hover:!from-purple-500 hover:!to-emerald-500 disabled:opacity-50"
                >
                  {savingAjuste ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Guardar y Sincronizar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
