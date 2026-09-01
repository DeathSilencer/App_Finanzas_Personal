import React from 'react';
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
  FileText
} from 'lucide-react';
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

  const granTotal = cajita.gran_total || 3944;
  const rendMensual = cajita.rendimiento_mensual || 42.73;
  const rendAnual = cajita.rendimiento_anual || (granTotal * 0.13);
  const tasaNu = (cajita.tasa_anual || 0.13) * 100;

  const totalFuturo = cajita.total_futuro || 2000;
  const totalGastosDigital = cajita.total_gastos_digital || 1944;

  const porciones = cajita.porciones || {};
  const porcOcio = porciones.ocio || { presupuesto: 1500, gasto_real: ocio.gasto_real || 0, monto: ocio.remanente || 1500, pct: 36.0 };
  const porcEmg = porciones.emergencia || { presupuesto: 500, gasto_real: 0, monto: emg.aportado || 500, pct: 12.0 };
  const porcRet = porciones.retiro || { presupuesto: 250, gasto_real: 0, monto: ret.aportado || 250, pct: 6.0 };
  const porcMoto = porciones.moto_80 || { presupuesto: 1355.2, gasto_real: 0, monto: 1355.2, pct: 32.5 };
  const porcSalidas = porciones.salidas_20 || { presupuesto: 338.8, gasto_real: 0, monto: 338.8, pct: 8.1 };
  const porcImp = porciones.imprevistos || { presupuesto: 200, gasto_real: 0, monto: 200, pct: 4.8 };
  const porcCopias = porciones.copias || { presupuesto: 50, gasto_real: 0, monto: 50, pct: 1.2 };

  // Totales presupuestados y gastados en Cajita
  const totalPresupuestoCajita = (
    (porcOcio.presupuesto || 0) +
    (porcEmg.presupuesto || 0) +
    (porcRet.presupuesto || 0) +
    (porcMoto.presupuesto || 0) +
    (porcSalidas.presupuesto || 0) +
    (porcImp.presupuesto || 0) +
    (porcCopias.presupuesto || 0)
  );

  const totalGastadoCajita = (
    (porcOcio.gasto_real || 0) +
    (porcEmg.gasto_real || 0) +
    (porcRet.gasto_real || 0) +
    (porcMoto.gasto_real || 0) +
    (porcSalidas.gasto_real || 0) +
    (porcImp.gasto_real || 0) +
    (porcCopias.gasto_real || 0)
  );

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* HERO CARD: ÚNICA CAJITA TURBO NU (13% ANUAL) - CONSOLIDADO TOTAL */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-950/70 via-slate-900/90 to-slate-950 border border-purple-500/40 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                <span>Cajita Turbo Nu • {tasaNu.toFixed(1)}% Anual Compuesto</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[11px] font-bold">
                🛡️ Conectado en Tiempo Real con Gastos
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800 text-[11px] font-bold">
                ⚡ 7 Fondos en 1 Sola Cajita
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Total Real en Cajita Turbo:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-emerald-300 to-indigo-300">
                {fmt(granTotal)}
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Nu solo permite tener <b className="text-white font-semibold">1 sola Cajita Turbo</b>. Aquí conviven físicamente tus fondos de <b className="text-purple-300">Plan a Futuro ({fmt(totalFuturo)})</b> y los fondos digitales de <b className="text-emerald-300">Gastos Básicos ({fmt(totalGastosDigital)})</b> restando automáticamente lo que hayas consumido. Todo tu saldo real genera <b className="text-emerald-400 text-sm">+{fmt(rendMensual)}/mes</b> en rendimientos pasivos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/40 text-right space-y-0.5 shadow-xl">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                Rendimiento Pasivo Mensual
              </span>
              <h4 className="text-2xl font-black text-emerald-400">+{fmt(rendMensual)} / mes</h4>
              <p className="text-[10px] text-purple-300 font-semibold">
                Estimado anual: ~{fmt(rendAnual)} ({tasaNu.toFixed(1)}%)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onGoToOcio}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2"
              >
                <PartyPopper className="w-4 h-4" />
                <span>Ver Bitácora Ocio</span>
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

        {/* BARRA DE DISTRIBUCIÓN MULTICOLOR DE LOS 7 FONDOS */}
        <div className="mt-6 pt-6 border-t border-purple-500/20 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold text-slate-300 gap-1">
            <span>Distribución de los 7 Fondos en tu Cajita Turbo:</span>
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
            {/* Retiro SAT */}
            <div
              className="bg-indigo-500 transition-all duration-500 hover:opacity-80"
              style={{ width: `${porcRet.pct}%` }}
              title={`Retiro SAT: ${fmt(porcRet.monto)} (${porcRet.pct}%)`}
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
          </div>

          {/* Leyenda de los 7 colores */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 text-[11px] text-slate-300">
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
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></span>
              <span className="truncate">🚀 Retiro: <b>{fmt(porcRet.monto)}</b></span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0"></span>
              <span className="truncate">🛡️ Imprev.: <b>{fmt(porcImp.monto)}</b></span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0"></span>
              <span className="truncate">📄 Copias: <b>{fmt(porcCopias.monto)}</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* DOS GRANDES BLOQUES: FONDOS A FUTURO vs FONDOS DIGITALES DE GASTOS */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BLOQUE A: PLAN A FUTURO ($2,000.00) */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl border-purple-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase">
                Bloque A • Plan a Futuro
              </span>
              <h3 className="text-base font-bold text-white mt-1 flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-purple-400" />
                <span>Fondos Patrimoniales en Cajita</span>
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
                  <span>🍕 Ocio &amp; Salidas (Paso 7 • 30%)</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Presupuesto: {fmt(porcOcio.presupuesto || 1500)} | Gastado: <b className="text-rose-400">-{fmt(porcOcio.gasto_real || 0)}</b>
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
                  Asignación fija: {fmt(porcEmg.presupuesto || 500)}/quincena (Meta $15,000)
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-emerald-400">{fmt(porcEmg.monto)}</p>
                <span className="text-[9px] text-emerald-400 font-bold">🔒 Blindado</span>
              </div>
            </div>

            {/* Retiro SAT */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span>🚀 Retiro Deducible SAT (Paso 6 • 5%)</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Asignación fija: {fmt(porcRet.presupuesto || 250)}/quincena (AFORE XXI Banorte)
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-indigo-300">{fmt(porcRet.monto)}</p>
                <span className="text-[9px] text-indigo-300 font-bold">📈 Deducible</span>
              </div>
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
                <span>Saldo Disponible tras Gastos Reales</span>
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
                  <span>🏍️ Fondo Acelerador Moto (80%)</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Presupuesto: {fmt(porcMoto.presupuesto || 1355.2)} {porcMoto.gasto_real > 0 ? `| Gastado: -${fmt(porcMoto.gasto_real)}` : '| Protegido al 100%'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-purple-400">{fmt(porcMoto.monto)}</p>
                <span className="text-[9px] text-purple-300 font-bold">🏍️ Meta Moto</span>
              </div>
            </div>

            {/* Refuerzo Gustos / Salidas 20% */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  <span>🍦 Refuerzo Gustos / Salidas (20%)</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Presupuesto: {fmt(porcSalidas.presupuesto || 338.8)} | Gastado: <b className="text-rose-400">-{fmt(porcSalidas.gasto_real || 0)}</b>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-pink-400">{fmt(porcSalidas.monto)}</p>
                <span className="text-[9px] text-pink-300 font-bold">🍕 En Cuenta Nu</span>
              </div>
            </div>

            {/* Imprevistos y Copias */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-white flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                    <span>🛡️ Imprevistos</span>
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {porcImp.gasto_real > 0 ? `Gastado: -${fmt(porcImp.gasto_real)}` : `Base: ${fmt(porcImp.presupuesto || 200)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-teal-400">{fmt(porcImp.monto)}</p>
                  <span className="text-[8px] text-slate-400 font-semibold">Quedan en Cajita</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-white flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>📄 Copias / Papelería</span>
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {porcCopias.gasto_real > 0 ? (
                      <span className="text-rose-400 font-bold">Gastado: -{fmt(porcCopias.gasto_real)}</span>
                    ) : (
                      `Base: ${fmt(porcCopias.presupuesto || 50)}`
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-sky-400">{fmt(porcCopias.monto)}</p>
                  <span className="text-[8px] text-slate-400 font-semibold">Quedan en Cajita</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NOTA ACLARATORIA DE EFECTIVO RETIRADO */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start space-x-3 text-xs">
        <Wallet className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-slate-300 space-y-1">
          <p className="font-bold text-white">
            ¿Cómo se actualiza en automático tu saldo en Nu al registrar gastos?
          </p>
          <p>
            Al registrar cualquier gasto en <b className="text-white">Copias</b>, <b className="text-white">Imprevistos</b> o <b className="text-white">Refuerzo Salidas</b> desde el módulo de Gastos Básicos, el sistema <b className="text-emerald-400">descuenta inmediatamente el dinero gastado</b> de su saldo y actualiza el <b className="text-purple-300">Total en Cajita Turbo Nu</b> y su rendimiento pasivo al 13%. Lo que no gastes se queda generando dinero.
          </p>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* TABLA CONSOLIDADA DE TODOS LOS FONDOS EN CAJITA & CETES */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Coins className="w-4 h-4 text-purple-400" />
              <span>Matriz Consolidada de Fondos (Cajita Turbo Nu + Cetesdirecto)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Sincronizado en tiempo real con tu base de datos SQLite</p>
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
                <th className="p-3.5">Origen / Bloque</th>
                <th className="p-3.5 text-right">Presupuesto ($)</th>
                <th className="p-3.5 text-right">Gasto Real ($)</th>
                <th className="p-3.5 text-right font-black text-white">Saldo en Nu ($)</th>
                <th className="p-3.5 text-center">% en Cajita</th>
                <th className="p-3.5 text-right">Rendimiento Mensual</th>
                <th className="p-3.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {/* Ocio */}
              <tr className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-white">🍕 Gustos / Ocio</td>
                <td className="p-3.5 text-slate-300">Plan a Futuro (Paso 7 • 30%)</td>
                <td className="p-3.5 text-right text-slate-300 font-semibold">{fmt(porcOcio.presupuesto || 1500)}</td>
                <td className={`p-3.5 text-right font-bold ${porcOcio.gasto_real > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                  {porcOcio.gasto_real > 0 ? '-' + fmt(porcOcio.gasto_real) : '$0.00'}
                </td>
                <td className="p-3.5 text-right font-black text-amber-300 text-sm">{fmt(porcOcio.monto)}</td>
                <td className="p-3.5 text-center font-bold text-amber-400">{porcOcio.pct}%</td>
                <td className="p-3.5 text-right text-emerald-400 font-bold">+{fmt(porcOcio.monto * (0.13 / 12))}</td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Disponible
                  </span>
                </td>
              </tr>

              {/* Moto 80% */}
              <tr className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-white">🏍️ Fondo Acelerador Moto (80%)</td>
                <td className="p-3.5 text-slate-300">Gastos Básicos (Excedente Base)</td>
                <td className="p-3.5 text-right text-slate-300 font-semibold">{fmt(porcMoto.presupuesto || 1355.2)}</td>
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
                <td className="p-3.5 text-slate-300">Plan a Futuro (Paso 3 • 10%)</td>
                <td className="p-3.5 text-right text-slate-300 font-semibold">{fmt(porcEmg.presupuesto || 500)}</td>
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
                <td className="p-3.5 text-slate-300">Gastos Básicos (Excedente Base)</td>
                <td className="p-3.5 text-right text-slate-300 font-semibold">{fmt(porcSalidas.presupuesto || 338.8)}</td>
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

              {/* Retiro SAT */}
              <tr className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-white">🚀 Retiro SAT (AFORE)</td>
                <td className="p-3.5 text-slate-300">Plan a Futuro (Paso 6 • 5%)</td>
                <td className="p-3.5 text-right text-slate-300 font-semibold">{fmt(porcRet.presupuesto || 250)}</td>
                <td className="p-3.5 text-right text-slate-500 font-bold">$0.00</td>
                <td className="p-3.5 text-right font-black text-indigo-300 text-sm">{fmt(porcRet.monto)}</td>
                <td className="p-3.5 text-center font-bold text-indigo-400">{porcRet.pct}%</td>
                <td className="p-3.5 text-right text-emerald-400 font-bold">+{fmt(porcRet.monto * (0.13 / 12))}</td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Resguardado
                  </span>
                </td>
              </tr>

              {/* Imprevistos */}
              <tr className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-white">🛡️ Colchón de Imprevistos</td>
                <td className="p-3.5 text-slate-300">Gastos Básicos (Fondo Digital)</td>
                <td className="p-3.5 text-right text-slate-300 font-semibold">{fmt(porcImp.presupuesto || 200)}</td>
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
                <td className="p-3.5 text-slate-300">Gastos Básicos (Fondo Digital)</td>
                <td className="p-3.5 text-right text-slate-300 font-semibold">{fmt(porcCopias.presupuesto || 50)}</td>
                <td className={`p-3.5 text-right font-bold ${porcCopias.gasto_real > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                  {porcCopias.gasto_real > 0 ? '-' + fmt(porcCopias.gasto_real) : '$0.00'}
                </td>
                <td className="p-3.5 text-right font-black text-sky-300 text-sm">{fmt(porcCopias.monto)}</td>
                <td className="p-3.5 text-center font-bold text-sky-400">{porcCopias.pct}%</td>
                <td className="p-3.5 text-right text-emerald-400 font-bold">+{fmt(porcCopias.monto * (0.13 / 12))}</td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                    Reserva
                  </span>
                </td>
              </tr>

              {/* Cetesdirecto */}
              <tr className="hover:bg-slate-800/40 transition bg-blue-950/20">
                <td className="p-3.5 font-bold text-white">🔒 Ahorro Involuntario (Cetes)</td>
                <td className="p-3.5 text-slate-300">Plan a Futuro (Paso 1 • 5%)</td>
                <td className="p-3.5 text-right text-slate-300 font-semibold">{fmt(cetes.presupuesto || 250)}</td>
                <td className="p-3.5 text-right text-slate-500 font-bold">$0.00</td>
                <td className="p-3.5 text-right font-black text-blue-300 text-sm">{fmt(cetes.aportado || 250)}</td>
                <td className="p-3.5 text-center font-bold text-blue-400">— (Externo)</td>
                <td className="p-3.5 text-right text-blue-400 font-bold">+{fmt((cetes.aportado || 250) * (0.0645 / 12))}</td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                    Aportado
                  </span>
                </td>
              </tr>
            </tbody>

            {/* Footer con Totales */}
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
    </div>
  );
}
