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
  RefreshCw,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Zap,
  CreditCard
} from 'lucide-react';
import { fmt } from '../../utils/formatters';
import { ajustarCajitaTurbo, motoAporte } from '../../services/api';

export default function GeneralCajitaTurbo({
  futuroData = {},
  onGoToOcio,
  onOpenCerrarQuincena,
  onOpenAjusteAporte,
  onOpenIngresoExtra,
  onReloadFuturo,
  addToast
}) {
  const of = futuroData?.otros_fondos || {};
  const cajita = of.cajita_turbo || {};
  const ocio = of.ocio || {};
  const emg = of.emergencia || {};
  const ret = of.retiro || {};
  const cetes = of.cetes || {};

  // Totales Tríada de Alto Rendimiento
  const granTotal = cajita.gran_total_liquido ?? cajita.gran_total ?? 28534.51;
  const saldoNu = cajita.saldo_nu ?? 25045.17;
  const rendNu = cajita.rendimientos_nu ?? 226.68;
  const saldoDiDi = cajita.saldo_didi ?? 3489.34;
  const rendDiDi = cajita.rendimientos_didi ?? 0.0;
  const saldoOpenbank = cajita.saldo_openbank ?? 0.0;
  const rendOpenbank = cajita.rendimientos_openbank ?? 0.0;

  const rendDiarioTotal = cajita.rend_diario_total ?? 10.49;
  const rendMensual = cajita.rendimiento_mensual ?? 314.80;
  const rendAnual = cajita.rendimiento_anual ?? 3777.60;

  const pctNu = cajita.pct_llenado_nu ?? 100.0;
  const pctDiDi = cajita.pct_llenado_didi ?? 34.9;
  const pctOpen = cajita.pct_llenado_openbank ?? 0.0;
  const pctTotal = cajita.pct_llenado_total ?? 43.9;

  const capacidadRestanteDiDi = cajita.capacidad_restante_didi ?? 6510.66;
  const capacidadRestanteOpen = cajita.capacidad_restante_openbank ?? 30000.00;
  const capacidadRestanteTotal = cajita.capacidad_restante_total ?? 36465.49;

  const desgBovedas = cajita.desglose_bovedas || {};
  const desgNu = desgBovedas.nu?.fondos || {};
  const desgDiDi = desgBovedas.didi?.fondos || {};
  const desgOpen = desgBovedas.openbank?.fondos || {};

  const nuCheckMensual = cajita.nu_check_mensual !== false;
  const didiCheckMensual = cajita.didi_check_mensual !== false;
  const openbankCheckMensual = cajita.openbank_check_mensual === true;

  const totalFuturo = cajita.total_futuro ?? 0;
  const totalGastosDigital = cajita.total_gastos_digital ?? 0;

  const porciones = cajita.porciones || {};
  const desglose = cajita.desglose || {};
  const porcOcio = porciones.ocio || { presupuesto: 0, gasto_real: ocio.gasto_real || 0, monto: ocio.remanente || 0, pct: 0 };
  const porcEmg = porciones.emergencia || { presupuesto: 0, gasto_real: 0, monto: emg.aportado || 0, pct: 0 };
  const porcMoto = porciones.moto_80 || { presupuesto: 0, gasto_real: 0, monto: desglose.moto_80 ?? 0, pct: 0 };
  const porcSalidas = porciones.salidas_20 || { presupuesto: 0, gasto_real: 0, monto: desglose.salidas_20 ?? 0, pct: 0 };
  const porcImp = porciones.imprevistos || { presupuesto: 0, gasto_real: 0, monto: desglose.imprevistos ?? 0, pct: 0 };
  const porcDisp = porciones.disponible || { presupuesto: 0, gasto_real: 0, monto: cajita.saldo_base_disponible || 0, pct: 0 };

  const rendimientosActuales = Number(cajita.rendimientos_totales ?? (rendNu + rendDiDi + rendOpenbank) ?? 226.68);
  const tieneRendimientos = rendimientosActuales > 0;

  // Estado y lógica para modal de conciliación Tríada de Bóvedas
  const [showModalConciliar, setShowModalConciliar] = useState(false);
  const [tabConciliar, setTabConciliar] = useState('didi'); // 'nu' | 'didi' | 'openbank'
  const [inputSaldoNu, setInputSaldoNu] = useState(saldoNu ? Number(saldoNu).toFixed(2) : '25054.21');
  const [inputRendNu, setInputRendNu] = useState(rendNu ? Number(rendNu).toFixed(2) : '235.72');
  const [inputSaldoDiDi, setInputSaldoDiDi] = useState(saldoDiDi ? Number(saldoDiDi).toFixed(2) : '3218.51');
  const [inputRendDiDi, setInputRendDiDi] = useState(rendDiDi ? Number(rendDiDi).toFixed(2) : '1.45');
  const [inputSaldoOpen, setInputSaldoOpen] = useState(saldoOpenbank ? Number(saldoOpenbank).toFixed(2) : '0.00');
  const [inputRendOpen, setInputRendOpen] = useState(rendOpenbank ? Number(rendOpenbank).toFixed(2) : '0.00');
  const [inputCheckNu, setInputCheckNu] = useState(nuCheckMensual);
  const [inputCheckDiDi, setInputCheckDiDi] = useState(didiCheckMensual);
  const [inputCheckOpen, setInputCheckOpen] = useState(openbankCheckMensual);
  const [savingAjuste, setSavingAjuste] = useState(false);

  useEffect(() => {
    if (!showModalConciliar) {
      setInputSaldoNu(saldoNu ? Number(saldoNu).toFixed(2) : '25054.21');
      setInputRendNu(rendNu ? Number(rendNu).toFixed(2) : '235.72');
      setInputSaldoDiDi(saldoDiDi ? Number(saldoDiDi).toFixed(2) : '3218.51');
      setInputRendDiDi(rendDiDi ? Number(rendDiDi).toFixed(2) : '1.45');
      setInputSaldoOpen(saldoOpenbank ? Number(saldoOpenbank).toFixed(2) : '0.00');
      setInputRendOpen(rendOpenbank ? Number(rendOpenbank).toFixed(2) : '0.00');
      setInputCheckNu(nuCheckMensual);
      setInputCheckDiDi(didiCheckMensual);
      setInputCheckOpen(openbankCheckMensual);
    }
  }, [saldoNu, rendNu, saldoDiDi, rendDiDi, saldoOpenbank, rendOpenbank, nuCheckMensual, didiCheckMensual, openbankCheckMensual, showModalConciliar]);

  const handleOpenConciliar = (targetTab = 'didi') => {
    setTabConciliar(targetTab);
    setInputSaldoNu(Number(saldoNu || 25054.21).toFixed(2));
    setInputRendNu(Number(rendNu || 235.72).toFixed(2));
    setInputSaldoDiDi(Number(saldoDiDi || 3218.51).toFixed(2));
    setInputRendDiDi(Number(rendDiDi || 1.45).toFixed(2));
    setInputSaldoOpen(Number(saldoOpenbank || 0).toFixed(2));
    setInputRendOpen(Number(rendOpenbank || 0).toFixed(2));
    setInputCheckNu(nuCheckMensual);
    setInputCheckDiDi(didiCheckMensual);
    setInputCheckOpen(openbankCheckMensual);
    setShowModalConciliar(true);
  };

  const handleGuardarConciliacion = async (e) => {
    e.preventDefault();
    try {
      setSavingAjuste(true);
      const valSaldoNu = parseFloat(inputSaldoNu);
      const valRendNu = parseFloat(inputRendNu);
      const valSaldoDiDi = parseFloat(inputSaldoDiDi);
      const valRendDiDi = parseFloat(inputRendDiDi);
      const valSaldoOpen = parseFloat(inputSaldoOpen);
      const valRendOpen = parseFloat(inputRendOpen);

      const res = await ajustarCajitaTurbo({
        saldo_real_ajustado: isNaN(valSaldoNu) ? null : valSaldoNu,
        rendimiento_real_nu: isNaN(valRendNu) ? 0 : valRendNu,
        saldo_real_didi: isNaN(valSaldoDiDi) ? 0 : valSaldoDiDi,
        rendimiento_real_didi: isNaN(valRendDiDi) ? 0 : valRendDiDi,
        saldo_real_openbank: isNaN(valSaldoOpen) ? 0 : valSaldoOpen,
        rendimiento_real_openbank: isNaN(valRendOpen) ? 0 : valRendOpen,
        nu_check_mensual: inputCheckNu,
        didi_check_mensual: inputCheckDiDi,
        openbank_check_mensual: inputCheckOpen
      });

      if (addToast) {
        addToast(res.message || 'Tríada de bóvedas conciliada exitosamente', 'success');
      }
      if (onReloadFuturo) {
        await onReloadFuturo();
      }
      setShowModalConciliar(false);
    } catch (err) {
      if (addToast) {
        addToast(err.message || 'Error al conciliar bóvedas', 'error');
      }
    } finally {
      setSavingAjuste(false);
    }
  };

  const efectivoCartera = cajita.efectivo_cartera || {
    presupuesto_actual: 606,
    monto_combi: 376,
    monto_comida: 180,
    monto_copias: 50
  };

  const totalFondosExternos = (cetes.aportado || 250) + (ret.aportado || 250);

  // Cálculos de Auditoría y Detección de Sobrantes/Faltantes en la Conciliación
  const valNu = parseFloat(inputSaldoNu) || 0;
  const valRendNu = parseFloat(inputRendNu) || 0;
  const baseNu = Math.max(0, valNu - valRendNu);

  const valDiDi = parseFloat(inputSaldoDiDi) || 0;
  const valRendDiDi = parseFloat(inputRendDiDi) || 0;
  const baseDiDi = Math.max(0, valDiDi - valRendDiDi);

  const valOpen = parseFloat(inputSaldoOpen) || 0;
  const valRendOpen = parseFloat(inputRendOpen) || 0;
  const baseOpen = Math.max(0, valOpen - valRendOpen);

  const totalBaseBancos = Math.round((baseNu + baseDiDi + baseOpen) * 100) / 100;
  const totalAsignadoFondos = Math.round((
    (porcEmg.monto || 0) +
    (porcOcio.monto || 0) +
    (porcMoto.monto || 0) +
    (porcSalidas.monto || 0) +
    (porcImp.monto || 0) +
    (Number(cajita.apartado_tdc_nu) || 0)
  ) * 100) / 100;
  const diferenciaCuadre = Math.round((totalBaseBancos - totalAsignadoFondos) * 100) / 100;

  const handleAutoAsignarDiferencia = async (montoDif) => {
    try {
      setSavingAjuste(true);
      await motoAporte(montoDif, 'sumar');
      if (addToast) {
        if (montoDif > 0) {
          addToast(`Sobrante de +${fmt(montoDif)} asignado a la Moto. ¡Cuadre al 100%!`, 'success');
        } else {
          addToast(`Faltante de -${fmt(Math.abs(montoDif))} absorbido en la Moto. ¡Cuadre al 100%!`, 'info');
        }
      }
      if (onReloadFuturo) await onReloadFuturo();
    } catch (e) {
      if (addToast) addToast(e.message || 'Error al auto-asignar diferencia', 'error');
    } finally {
      setSavingAjuste(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* HERO CARD: TRÍADA DE ALTO RENDIMIENTO (13%-15% • CAPACIDAD $65,000) */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="card-hero-purple">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-purple !py-1 !text-xs font-black">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>Tríada de Alto Rendimiento • Capacidad $65,000 MXN</span>
              </span>
              <span className="badge-amber font-bold">
                🟠 DiDi (15% • $10k)
              </span>
              <span className="badge-emerald font-bold">
                🟣 Nu Turbo (13% • $25k)
              </span>
              <span className="badge-rose font-bold">
                🔴 Openbank (13% • $30k)
              </span>
              {tieneRendimientos && (
                <span className="badge-amber font-black">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>+{fmt(rendimientosActuales)} ganados</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Total Líquido en Tríada:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-300 to-emerald-300">
                {fmt(granTotal)}
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tu patrimonio líquido genera a las tasas líderes del mercado: <b className="text-amber-300 font-bold">15% en DiDi Cuenta ({fmt(saldoDiDi)})</b> y <b className="text-purple-300 font-bold">13% en Nu Turbo ({fmt(saldoNu)})</b>, con respaldo en <b className="text-rose-400 font-bold">Openbank Apartados ({fmt(saldoOpenbank)})</b>. Tus cuentas te generan automáticamente <b className="text-emerald-400 text-sm font-bold">+{fmt(rendMensual)}/mes</b> en rendimientos pasivos (~<b className="text-emerald-300 font-bold">+{fmt(rendDiarioTotal)}/día</b>) con disponibilidad diaria 24/7.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            <div className="card-glass-subtle text-right space-y-0.5 border-amber-500/40 shadow-xl w-full sm:w-auto bg-slate-900/90">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">
                Rendimiento Pasivo Estimado
              </span>
              <h4 className="text-2xl font-black text-emerald-400">+{fmt(rendMensual)} / mes</h4>
              <p className="text-[10px] text-amber-300 font-semibold">
                +{fmt(rendDiarioTotal)} diarios • Proyección anual: ~{fmt(rendAnual)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onOpenIngresoExtra}
                className="btn-amber !text-xs !min-h-[40px] flex-1 sm:flex-initial bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold"
                title="Registrar bono o dinero extra"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>+ Dinero Extra</span>
              </button>
              <button
                onClick={() => handleOpenConciliar('didi')}
                className="btn-ghost !text-xs !min-h-[40px] text-amber-300 border-amber-500/40 flex-1 sm:flex-initial"
                title="Ajustar o sincronizar saldos con DiDi, Nu y Openbank"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Conciliar Tríada</span>
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

        {/* BARRA DE CAPACIDAD TOTAL $65,000 (NU + DIDI + OPENBANK) */}
        <div className="mt-6 pt-6 border-t border-purple-500/20 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold text-slate-300 gap-1">
            <span>Capacidad Total de Rendimiento en Bóvedas ({fmt(granTotal)} de $65,000.00):</span>
            <span className="text-amber-300 font-mono text-[11px]">
              Nu ({fmt(saldoNu)}) + DiDi ({fmt(saldoDiDi)}) + Open ({fmt(saldoOpenbank)}) = {pctTotal}% del cupo máximo
            </span>
          </div>

          <div className="w-full h-4 bg-slate-800/90 rounded-full overflow-hidden flex shadow-inner border border-slate-700">
            {/* Nu Turbo ($25k max) */}
            <div
              className="bg-purple-500 transition-all duration-500 hover:opacity-90"
              style={{ width: `${(Math.min(saldoNu, 25000) / 65000) * 100}%` }}
              title={`Nu Turbo: ${fmt(saldoNu)} (Tope $25,000)`}
            ></div>
            {/* DiDi Cuenta ($10k max) */}
            <div
              className="bg-amber-500 transition-all duration-500 hover:opacity-90"
              style={{ width: `${(Math.min(saldoDiDi, 10000) / 65000) * 100}%` }}
              title={`DiDi Cuenta: ${fmt(saldoDiDi)} (Tope $10,000 al 15%)`}
            ></div>
            {/* Openbank ($30k max) */}
            <div
              className="bg-rose-500 transition-all duration-500 hover:opacity-90"
              style={{ width: `${(Math.min(saldoOpenbank, 30000) / 65000) * 100}%` }}
              title={`Openbank: ${fmt(saldoOpenbank)} (Tope $30,000 al 13%)`}
            ></div>
            {/* Rendimientos */}
            {tieneRendimientos && (
              <div
                className="bg-emerald-400 transition-all duration-500 animate-pulse"
                style={{ width: `${(rendimientosActuales / 65000) * 100}%` }}
                title={`Rendimientos Ganados: ${fmt(rendimientosActuales)}`}
              ></div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center space-x-1.5 text-purple-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span>
                <span>Nu Turbo: <b>{fmt(saldoNu)}</b> (100% Lleno • 13%)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-amber-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                <span>DiDi: <b>{fmt(saldoDiDi)}</b> (Prioridad #1 • 15%)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-rose-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                <span>Openbank: <b>{fmt(saldoOpenbank)}</b> (Cascada • 13%)</span>
              </span>
              {tieneRendimientos && (
                <span className="flex items-center space-x-1.5 text-emerald-300 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
                  <span>Rendim.: <b>+{fmt(rendimientosActuales)}</b></span>
                </span>
              )}
            </div>
            <div className="text-amber-300 font-bold">
              Cupo al 15% en DiDi: +{fmt(capacidadRestanteDiDi)} | En Openbank al 13%: +{fmt(capacidadRestanteOpen)}
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* TRES TARJETAS DE LA TRÍADA: NU TURBO vs DIDI CUENTA vs OPENBANK    */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* TARJETA 1: NU CAJITA TURBO (13%) */}
        <div className="card-glass p-5 rounded-3xl border-purple-500/40 bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg border border-purple-500/30">
                🟣
              </div>
              <div>
                <span className="text-[10px] text-purple-300 uppercase font-black tracking-wider block">Bóveda Base Nu</span>
                <h3 className="text-base font-black text-white">Cajita Turbo 🚀 (13% Anual)</h3>
              </div>
            </div>
            <span className="badge-purple font-mono font-bold">
              {pctNu.toFixed(1)}% Lleno
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Saldo Total en Nu:</span>
              <span className="text-lg font-black text-white font-mono">{fmt(saldoNu)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Rendimientos Netos:</span>
              <span className="text-emerald-400 font-bold font-mono">+{fmt(rendNu)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Capital Base Depositado:</span>
              <span className="text-purple-300 font-bold font-mono">{fmt(saldoNu - rendNu)}</span>
            </div>
            <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Generando diariamente:</span>
              <span className="text-emerald-300 font-bold">+{fmt(cajita.rend_diario_nu || 9.04)} / día (~{fmt((cajita.rend_diario_nu || 9.04) * 30)}/mes)</span>
            </div>
          </div>

          {/* Barra de progreso Nu */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-slate-400">
              <span>Tope de Depósito ($25,000):</span>
              <span className="text-purple-300 font-bold">{fmt(saldoNu)} / {fmt(25000)}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, pctNu)}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-emerald-400 font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Tope alcanzado. Crece por interés compuesto al 13%.</span>
            </p>
          </div>

          {/* Fondos asignados a Nu */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1.5 text-slate-300">
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Fondos Resguardados en Nu:</span>
            <div className="flex justify-between">
              <span>🛡️ Emergencia (Meta 3M):</span>
              <b className="text-emerald-400">{fmt(desgNu.emergencia || porcEmg.monto)}</b>
            </div>
            <div className="flex justify-between">
              <span>🍕 Ocio &amp; Estilo de Vida:</span>
              <b className="text-amber-400">{fmt(desgNu.ocio || porcOcio.monto)}</b>
            </div>
            <div className="flex justify-between">
              <span>🏍️ Moto (Resguardo Base):</span>
              <b className="text-purple-300">{fmt(desgNu.moto_80 || 10836.77)}</b>
            </div>
            {Number(desgNu.apartado_tdc || 0) > 0 && (
              <div className="flex justify-between text-purple-300 font-semibold border-t border-purple-500/20 pt-1">
                <span>💳 Apartado Pago TDC Nu:</span>
                <b className="text-rose-400">{fmt(desgNu.apartado_tdc)}</b>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>1 compra mensual: <b>Cumplida</b></span>
            </div>
            <button
              onClick={() => handleOpenConciliar('nu')}
              className="btn-ghost !text-xs !py-1.5 !px-3 text-purple-300 border-purple-500/40 hover:bg-purple-500/20 font-bold flex items-center space-x-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Conciliar Nu</span>
            </button>
          </div>
        </div>

        {/* TARJETA 2: DIDI CUENTA (15% ANUAL) - PRIORIDAD #1 */}
        <div className="card-glass p-5 rounded-3xl border-amber-500/50 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 shadow-2xl space-y-4 ring-1 ring-amber-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg border border-amber-500/40">
                🟠
              </div>
              <div>
                <span className="text-[10px] text-amber-300 uppercase font-black tracking-wider block">Bóveda Prioritaria DiDi</span>
                <h3 className="text-base font-black text-white">DiDi Cuenta ⚡ (15% Anual)</h3>
              </div>
            </div>
            <span className="badge-amber font-mono font-bold">
              {pctDiDi.toFixed(1)}% Lleno
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Saldo en DiDi Cuenta:</span>
              <span className="text-lg font-black text-white font-mono">{fmt(saldoDiDi)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Rendimientos Ganados:</span>
              <span className="text-emerald-400 font-bold font-mono">+{fmt(rendDiDi)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Cupo Restante al 15%:</span>
              <span className="text-amber-300 font-bold font-mono">+{fmt(capacidadRestanteDiDi)}</span>
            </div>
            <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Generando diariamente:</span>
              <span className="text-emerald-300 font-bold">+{fmt(cajita.rend_diario_didi || 1.45)} / día (~{fmt((cajita.rend_diario_didi || 1.45) * 30)}/mes)</span>
            </div>
          </div>

          {/* Barra de progreso DiDi */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-slate-400">
              <span>Tope al 15% ($10,000):</span>
              <span className="text-amber-300 font-bold">{fmt(saldoDiDi)} / {fmt(10000)}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, pctDiDi)}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-amber-300 font-medium flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Prioridad #1: Llenar hasta $10k. Excedentes van a Openbank.</span>
            </p>
          </div>

          {/* Fondos albergados en DiDi */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1.5 text-slate-300">
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Fondos Albergados en DiDi:</span>
            <div className="flex justify-between">
              <span>🏍️ Moto (Porción Activa):</span>
              <b className="text-purple-300">{fmt(desgDiDi.moto_80 || 1661.44)}</b>
            </div>
            <div className="flex justify-between">
              <span>🍦 Refuerzo Salidas (20%):</span>
              <b className="text-pink-400">{fmt(desgDiDi.salidas_20 || porcSalidas.monto)}</b>
            </div>
            <div className="flex justify-between">
              <span>🩹 Colchón Imprevistos:</span>
              <b className="text-teal-300">{fmt(desgDiDi.imprevistos || porcImp.monto)}</b>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-300 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sin compras obligatorias (15%)</span>
            </div>
            <button
              onClick={() => handleOpenConciliar('didi')}
              className="btn-ghost !text-xs !py-1.5 !px-3 text-amber-300 border-amber-500/40 hover:bg-amber-500/20 font-bold flex items-center space-x-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Conciliar DiDi</span>
            </button>
          </div>
        </div>

        {/* TARJETA 3: OPENBANK APARTADO (13% ANUAL) - RECEPTOR CASCADA */}
        <div className="card-glass p-5 rounded-3xl border-rose-500/40 bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-950 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-lg border border-rose-500/30">
                🔴
              </div>
              <div>
                <span className="text-[10px] text-rose-300 uppercase font-black tracking-wider block">Bóveda Santander Cascada</span>
                <h3 className="text-base font-black text-white">Openbank Apartado 🛡️ (13% Anual)</h3>
              </div>
            </div>
            <span className="badge-rose font-mono font-bold">
              {pctOpen.toFixed(1)}% Lleno
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Saldo en Apartado Open:</span>
              <span className="text-lg font-black text-white font-mono">{fmt(saldoOpenbank)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Rendimientos Ganados:</span>
              <span className="text-emerald-400 font-bold font-mono">+{fmt(rendOpenbank)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Capacidad Disponible al 13%:</span>
              <span className="text-emerald-300 font-bold font-mono">+{fmt(capacidadRestanteOpen)}</span>
            </div>
            <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Generando diariamente:</span>
              <span className="text-emerald-300 font-bold">+{fmt(cajita.rend_diario_openbank || 0.00)} / día</span>
            </div>
          </div>

          {/* Barra de progreso Openbank */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-slate-400">
              <span>Tope al 13% ($30,000):</span>
              <span className="text-rose-300 font-bold">{fmt(saldoOpenbank)} / {fmt(30000)}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, pctOpen)}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-rose-300 font-medium flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span>Recibirá excedentes y ahorros una vez que DiDi llegue a $10,000.</span>
            </p>
          </div>

          {/* Fondos albergados en Openbank */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1.5 text-slate-300">
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Fondos Albergados en Openbank:</span>
            <div className="flex justify-between">
              <span>🏍️ Acelerador Moto (Cascada):</span>
              <b className="text-purple-300">{fmt(desgOpen.moto_80 || 0.00)}</b>
            </div>
            <div className="flex justify-between text-slate-400 italic">
              <span>Cupo reservado para excedentes DiDi:</span>
              <b className="text-slate-300">Activo</b>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center space-x-1.5 text-[11px] text-amber-300 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>1 compra / recarga al mes para 13%</span>
            </div>
            <button
              onClick={() => handleOpenConciliar('openbank')}
              className="btn-ghost !text-xs !py-1.5 !px-3 text-rose-300 border-rose-500/40 hover:bg-rose-500/20 font-bold flex items-center space-x-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-rose-400" />
              <span>Conciliar Open</span>
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* DOS GRANDES BLOQUES: FONDOS A FUTURO vs FONDOS DIGITALES DE GASTOS */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BLOQUE A: PLAN A FUTURO */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl border-purple-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase">
                Bloque A • Plan a Futuro
              </span>
              <h3 className="text-base font-bold text-white mt-1 flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-purple-400" />
                <span>Fondos Patrimoniales Acumulativos</span>
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Subtotal</span>
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
                <span className="text-[9px] text-purple-300 font-bold">🟣 Resguardo en Nu</span>
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
                  Acumulado blindado al 13% (Meta $15,000)
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-emerald-400">{fmt(porcEmg.monto)}</p>
                <span className="text-[9px] text-emerald-400 font-bold">🔒 Intocable en Nu</span>
              </div>
            </div>

            {/* Apartado en Cajita para TDC Nu si hay compras pendientes */}
            {Number(cajita.apartado_tdc_nu || 0) > 0 && (
              <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-500/30 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-purple-200 flex items-center space-x-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                    <span>💳 Apartado en Cajita para TDC Nu</span>
                  </p>
                  <p className="text-[10px] text-purple-300/80 mt-0.5">
                    Resguardo al 13% en Cajita Turbo hasta fecha de pago
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-rose-400">{fmt(cajita.apartado_tdc_nu)}</p>
                  <span className="text-[9px] text-emerald-400 font-bold">⚡ Generando 13%</span>
                </div>
              </div>
            )}

            {/* Banner Cuentas Externas */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold flex items-center space-x-1">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>Fondos Externos (Fuera de la Tríada):</span>
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
                *Descontados de tu cuenta al fondear sus plataformas externas directas.
              </p>
            </div>
          </div>
        </div>

        {/* BLOQUE B: FONDOS DIGITALES DE GASTOS BÁSICOS */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase">
                Bloque B • Gastos Básicos &amp; Acelerador Moto
              </span>
              <h3 className="text-base font-bold text-white mt-1 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Saldo Acumulado en Bóvedas al 13%-15%</span>
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Subtotal</span>
              <p className="text-xl font-black text-emerald-400">{fmt(totalGastosDigital)}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* Acelerador Moto 80% */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>🏍️ Acelerador Moto (80% Excedente + Aporte)</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Ahorro acumulado + quincena activa (Meta $42,000)
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-purple-400">{fmt(porcMoto.monto)}</p>
                <span className="text-[9px] text-purple-300 font-bold">13% Nu + 15% DiDi</span>
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
                <span className="text-[9px] text-amber-400 font-bold">🟠 Débito DiDi (15%)</span>
              </div>
            </div>

            {/* Colchón de Imprevistos */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                  <span>🛡️ Colchón de Imprevistos</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {porcImp.gasto_real > 0 ? (
                    <span className="text-rose-400 font-bold">Gastado: -{fmt(porcImp.gasto_real)}</span>
                  ) : (
                    `Presupuesto: ${fmt(porcImp.presupuesto)}`
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-teal-400">{fmt(porcImp.monto)}</p>
                <span className="text-[9px] text-amber-400 font-bold">🟠 En DiDi Cuenta (15%)</span>
              </div>
            </div>

            {/* Banner Informativo de Retiro en Efectivo Físico */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2 text-xs shadow-lg">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center space-x-1.5 text-emerald-400">
                  <Banknote className="w-4 h-4" />
                  <span>Efectivo Físico en Cartera (Retirado en Cajero):</span>
                </span>
                <span className="font-black text-emerald-300 text-sm">
                  {fmt(efectivoCartera.presupuesto_actual || 606)} base
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-semibold">🚌 Pasajes</p>
                  <p className="font-bold text-white">{fmt(efectivoCartera.monto_combi || 376)}</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-semibold">🥪 Comidas</p>
                  <p className="font-bold text-white">{fmt(efectivoCartera.monto_comida || 180)}</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-semibold">📄 Copias</p>
                  <p className="font-bold text-white">{fmt(efectivoCartera.monto_copias || 50)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* MODAL CONCILIAR TRÍADA DE BÓVEDAS (NU + DIDI + OPENBANK)          */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {showModalConciliar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="card-glass max-w-lg w-full p-6 border-amber-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Conciliar Tríada de Bóvedas</h3>
                  <p className="text-[11px] text-slate-400">Sincroniza saldos y rendimientos con tus Apps de DiDi, Nu y Openbank</p>
                </div>
              </div>
              <button
                onClick={() => setShowModalConciliar(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pestañas de Conciliación (3 Bóvedas) */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setTabConciliar('didi')}
                className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${tabConciliar === 'didi' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <span>🟠 DiDi (15%)</span>
              </button>
              <button
                type="button"
                onClick={() => setTabConciliar('nu')}
                className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${tabConciliar === 'nu' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <span>🟣 Nu Turbo (13%)</span>
              </button>
              <button
                type="button"
                onClick={() => setTabConciliar('openbank')}
                className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${tabConciliar === 'openbank' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <span>🔴 Openbank (13%)</span>
              </button>
            </div>

            <form onSubmit={handleGuardarConciliacion} className="space-y-4 text-xs">
              {tabConciliar === 'didi' && (
                /* Formulario DiDi Cuenta */
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span>Saldo Actual en DiDi Cuenta:</span>
                      <b className="text-white font-mono">{fmt(parseFloat(inputSaldoDiDi) || 0)}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Rendimientos DiDi:</span>
                      <b className="text-emerald-400 font-mono">+{fmt(parseFloat(inputRendDiDi) || 0)}</b>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-amber-500/20 text-[11px]">
                      <span>Cupo Restante al 15%:</span>
                      <b className="text-amber-300 font-mono">{fmt(Math.max(0, 10000 - (parseFloat(inputSaldoDiDi) || 0)))}</b>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">🟠 Saldo Real en DiDi Cuenta ($ MXN):</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={inputSaldoDiDi}
                      onChange={(e) => setInputSaldoDiDi(e.target.value)}
                      placeholder="Ej. 3489.34"
                      className="form-input font-bold text-white text-base"
                    />
                    <p className="form-helper">El saldo disponible en tu DiDi Cuenta dentro de la app DiDi Dinero.</p>
                  </div>

                  <div>
                    <label className="form-label">📈 Rendimiento Reportado por DiDi ($ MXN):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={inputRendDiDi}
                      onChange={(e) => setInputRendDiDi(e.target.value)}
                      placeholder="0.00"
                      className="form-input font-bold text-emerald-400"
                    />
                    <p className="form-helper">Ganancias acumuladas generadas al 15% en DiDi Cuenta.</p>
                  </div>
                </div>
              )}

              {tabConciliar === 'nu' && (
                /* Formulario Nu */
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span>Saldo Actual en Nu:</span>
                      <b className="text-white font-mono">{fmt(parseFloat(inputSaldoNu) || 0)}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Rendimientos Reportados:</span>
                      <b className="text-emerald-400 font-mono">+{fmt(parseFloat(inputRendNu) || 0)}</b>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-purple-500/20 text-[11px]">
                      <span>Capital Base Depositado:</span>
                      <b className="text-purple-300 font-mono">{fmt(Math.max(0, (parseFloat(inputSaldoNu) || 0) - (parseFloat(inputRendNu) || 0)))}</b>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">🟣 Saldo Total Real en Cajitas Nu ($ MXN):</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={inputSaldoNu}
                      onChange={(e) => setInputSaldoNu(e.target.value)}
                      placeholder="Ej. 25045.17"
                      className="form-input font-bold text-white text-base"
                    />
                    <p className="form-helper">El monto total que aparece en tu pantalla de Cajitas Nu.</p>
                  </div>

                  <div>
                    <label className="form-label">📈 Rendimiento Reportado por Nu ($ MXN):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={inputRendNu}
                      onChange={(e) => setInputRendNu(e.target.value)}
                      placeholder="Ej. 226.68"
                      className="form-input font-bold text-emerald-400"
                    />
                    <p className="form-helper">El monto verde de "Así ha crecido tu saldo en Cajitas".</p>
                  </div>
                </div>
              )}

              {tabConciliar === 'openbank' && (
                /* Formulario Openbank */
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span>Saldo en Apartado Open:</span>
                      <b className="text-white font-mono">{fmt(parseFloat(inputSaldoOpen) || 0)}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Rendimientos Openbank:</span>
                      <b className="text-emerald-400 font-mono">+{fmt(parseFloat(inputRendOpen) || 0)}</b>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-rose-500/20 text-[11px]">
                      <span>Cupo Disponible al 13%:</span>
                      <b className="text-emerald-300 font-mono">{fmt(Math.max(0, 30000 - (parseFloat(inputSaldoOpen) || 0)))}</b>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">🔴 Saldo en Apartado Open Santander ($ MXN):</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={inputSaldoOpen}
                      onChange={(e) => setInputSaldoOpen(e.target.value)}
                      placeholder="0.00"
                      className="form-input font-bold text-white text-base"
                    />
                    <p className="form-helper">El saldo disponible en tu Apartado Open de la app Openbank.</p>
                  </div>

                  <div>
                    <label className="form-label">📈 Rendimiento Total Reportado por Openbank ($ MXN):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={inputRendOpen}
                      onChange={(e) => setInputRendOpen(e.target.value)}
                      placeholder="0.00"
                      className="form-input font-bold text-emerald-400"
                    />
                    <p className="form-helper">El monto de "Rendimiento total" en la sección de tu Apartado Open.</p>
                  </div>
                </div>
              )}

              {/* BLOQUE DE AUDITORÍA Y DETECCIÓN DE SOBRANTES / FALTANTES */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider">Auditoría de Cuadre Tríada:</span>
                  <span className="font-mono text-slate-300">
                    Bancos: <b>{fmt(totalBaseBancos)}</b> vs Fondos: <b>{fmt(totalAsignadoFondos)}</b>
                  </span>
                </div>

                {Math.abs(diferenciaCuadre) < 0.05 ? (
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center space-x-2 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <div>
                      <p className="font-bold text-xs">🟢 Cuadre Matemático 100% Perfecto</p>
                      <p className="text-[10px] text-slate-300">Tus cuentas bancarias coinciden con tus fondos asignados. Cero dinero fantasma ni fugas.</p>
                    </div>
                  </div>
                ) : diferenciaCuadre > 0.05 ? (
                  <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/50 space-y-2 text-amber-300">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                      <div>
                        <p className="font-bold text-xs">🟡 Sobrante Detectado: +{fmt(diferenciaCuadre)} MXN</p>
                        <p className="text-[10px] text-slate-300">Tus bancos tienen {fmt(diferenciaCuadre)} más de lo que está asignado en tus presupuestos.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={savingAjuste}
                      onClick={() => handleAutoAsignarDiferencia(diferenciaCuadre)}
                      className="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20"
                    >
                      <Bike className="w-3.5 h-3.5" />
                      <span>Asignar Sobrante a la Moto (+{fmt(diferenciaCuadre)})</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/50 space-y-2 text-rose-300">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <div>
                        <p className="font-bold text-xs">🔴 Faltante Detectado: -{fmt(Math.abs(diferenciaCuadre))} MXN</p>
                        <p className="text-[10px] text-slate-300">Tus bancos tienen menos saldo que tus presupuestos (posible gasto no registrado).</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={savingAjuste}
                      onClick={() => handleAutoAsignarDiferencia(diferenciaCuadre)}
                      className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] transition flex items-center justify-center space-x-1.5 shadow-md shadow-rose-600/20"
                    >
                      <Bike className="w-3.5 h-3.5" />
                      <span>Compensar Faltante en la Moto (-{fmt(Math.abs(diferenciaCuadre))})</span>
                    </button>
                  </div>
                )}
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
                  className="btn-purple !bg-gradient-to-r !from-amber-600 !via-purple-600 !to-rose-600 hover:opacity-90 disabled:opacity-50"
                >
                  {savingAjuste ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Guardar y Sincronizar Tríada</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
