import React from 'react';
import {
  LayoutDashboard,
  Shield,
  TrendingUp,
  Wallet,
  Award,
  Bike,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  PiggyBank,
  CreditCard,
  ArrowRight,
  Landmark
} from 'lucide-react';
import { fmt } from '../../utils/formatters';

export default function DashboardMaestro({
  futuroData = {},
  gastosData = {},
  onOpenConfig
}) {
  const dm = futuroData?.dashboard_maestro || {};
  const ingresoQ = dm.ingreso_base_quincenal || 5000;
  const ingresoM = dm.ingreso_base_mensual || 10000;

  // Datos reales sincronizados de Cajita Turbo Nu y Fondos
  const of = futuroData?.otros_fondos || {};
  const cajita = of.cajita_turbo || {};
  const ocio = of.ocio || {};
  const emg = of.emergencia || {};
  const cetes = of.cetes || {};
  const retiro = of.retiro || {};
  const desglose = cajita.desglose || {};

  const granTotalNu = cajita.gran_total ?? 0;
  const rendMensualEstimado = cajita.rendimiento_mensual ?? (granTotalNu * (0.13 / 12));

  // Saldos vivos reales en Nu
  const saldoOcioVivo = desglose.ocio ?? ocio.remanente ?? 0;
  const saldoEmergenciaVivo = desglose.emergencia ?? desglose.fondo_emergencia ?? emg.aportado ?? 0;
  const saldoMotoVivo = desglose.moto_80 ?? 0;
  const saldoSalidasVivo = desglose.salidas_20 ?? 0;
  const saldoImprevistosVivo = desglose.imprevistos ?? 0;
  const saldoCopiasVivo = desglose.copias ?? 0;
  const totalGastosDigitalVivo = cajita.total_gastos_digital ?? (saldoMotoVivo + saldoSalidasVivo + saldoImprevistosVivo);

  // Datos de Gastos Básicos
  const resumenGastos = gastosData?.resumen || {};
  const efectivoRetirar = resumenGastos.efectivo_a_retirar ?? 606;
  const mCombi = resumenGastos.monto_combi ?? 376;
  const mComida = resumenGastos.monto_comida ?? 180;
  const mCopias = resumenGastos.monto_copias ?? 50;

  // Datos de Moto
  const simMoto = gastosData?.simulador_moto || {};
  const metaMoto = simMoto.meta_total ?? 42000;
  const ahorradoHistoricoMoto = simMoto.total_ahorrado_acumulado ?? 0;
  const pctCumplidoHistorico = simMoto.pct_meta_cumplido ?? (metaMoto > 0 ? Math.round((ahorradoHistoricoMoto / metaMoto) * 1000) / 10 : 0);
  const pctCumplidoVivo = metaMoto > 0 ? Math.round((saldoMotoVivo / metaMoto) * 1000) / 10 : 0;
  const mesesMoto = simMoto.meses_estimados ?? 0;

  // Las 5 Reglas Maestras con asignación teórica y saldo vivo sincronizado
  const reglas = [
    {
      key: 'p2_basicos',
      titulo: '💳 Regla 1 (50%): Gastos Básicos & Acelerador Moto',
      paso: 'Paso 2: Presupuesto Base de Vida',
      pct: 50,
      quincenal: ingresoQ * 0.50,
      mensual: ingresoM * 0.50,
      saldoVivo: totalGastosDigitalVivo,
      saldoVivoLabel: 'Saldo Vivo Resguardado en Cajita Nu',
      color: 'border-indigo-500/40 text-indigo-400 bg-indigo-950/20',
      badgeColor: 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300',
      detalles: [
        {
          label: 'Efectivo a Retirar (Cartera)',
          val: `${fmt(efectivoRetirar)} ($${mCombi} Pasajes + $${mComida} Comidas + $${mCopias} Copias)`,
          tipo: 'efectivo'
        },
        {
          label: 'Fondo Acelerador Moto (80% Excedente)',
          val: `${fmt(saldoMotoVivo)} en Cajita Nu (+$1,355.20/Q)`,
          tipo: 'nu'
        },
        {
          label: 'Refuerzo Salidas (20% Excedente)',
          val: `${fmt(saldoSalidasVivo)} en Cajita Nu (+$338.80/Q)`,
          tipo: 'nu'
        },
        {
          label: 'Imprevistos Escolares',
          val: `${fmt(saldoImprevistosVivo)} en Cajita Nu (+$200/Q)`,
          tipo: 'nu'
        }
      ]
    },
    {
      key: 'p7_ocio',
      titulo: '🍕 Regla 2 (30%): Gustos & Ocio (Estilo de Vida)',
      paso: 'Paso 7: Ocio 100% Líquido',
      pct: 30,
      quincenal: ingresoQ * 0.30,
      mensual: ingresoM * 0.30,
      saldoVivo: saldoOcioVivo,
      saldoVivoLabel: 'Saldo Vivo Disponible para Gastar',
      color: 'border-amber-500/40 text-amber-400 bg-amber-950/20',
      badgeColor: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
      detalles: [
        {
          label: 'Presupuesto Base Quincenal',
          val: `${fmt(ingresoQ * 0.30)} cada quincena`,
          tipo: 'base'
        },
        {
          label: 'Remanente de Septiembre Acumulado',
          val: `+$${(saldoOcioVivo - (ingresoQ * 0.30) > 0 ? (saldoOcioVivo - (ingresoQ * 0.30)).toFixed(2) : '0.00')} resguardado`,
          tipo: 'ahorro'
        },
        {
          label: 'Medio de Pago Recomendado',
          val: 'Débito Nu / TDC Nu liquidable en fecha',
          tipo: 'info'
        }
      ]
    },
    {
      key: 'p3_emergencia',
      titulo: '🛡️ Regla 3 (10%): Fondo de Emergencia',
      paso: 'Paso 3: Blindaje 3 Meses',
      pct: 10,
      quincenal: ingresoQ * 0.10,
      mensual: ingresoM * 0.10,
      saldoVivo: saldoEmergenciaVivo,
      saldoVivoLabel: 'Saldo Blindado Vivo en Cajita Nu',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20',
      badgeColor: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
      detalles: [
        {
          label: 'Meta Objetivo (3 Meses)',
          val: `${fmt(emg.meta || 7500)} (${Math.round((saldoEmergenciaVivo / (emg.meta || 7500)) * 100)}% alcanzado)`,
          tipo: 'meta'
        },
        {
          label: 'Aporte Automático por Quincena',
          val: `+${fmt(ingresoQ * 0.10)} directo a Cajita Nu`,
          tipo: 'base'
        },
        {
          label: 'Disponibilidad y Tasa',
          val: 'Líquido 24/7 generando 13% Anual Nu',
          tipo: 'nu'
        }
      ]
    },
    {
      key: 'p1_involuntario',
      titulo: '🔒 Regla 4 (5%): Ahorro Involuntario (Cetes)',
      paso: 'Paso 1: Bloqueo Automático Previo',
      pct: 5,
      quincenal: ingresoQ * 0.05,
      mensual: ingresoM * 0.05,
      saldoVivo: Number(cetes.presupuesto || 250),
      saldoVivoLabel: 'Aporte Quincenal Programado',
      color: 'border-blue-500/40 text-blue-400 bg-blue-950/20',
      badgeColor: 'border-blue-500/40 bg-blue-500/20 text-blue-300',
      detalles: [
        {
          label: 'Destino Patrimonial',
          val: 'Cetesdirecto Bonos Gubernamentales (3 Meses)',
          tipo: 'info'
        },
        {
          label: 'Tasa Fija Rendimiento',
          val: '~6.45% - 11.0% anual respaldado por Banxico',
          tipo: 'rend'
        },
        {
          label: 'Estado Quincenal',
          val: 'Aportado ($250.00 / quincena)',
          tipo: 'ok'
        }
      ]
    },
    {
      key: 'p6_retiro',
      titulo: '🚀 Regla 5 (5%): Retiro & Deducible SAT',
      paso: 'Paso 6: Beneficio Fiscal LISR',
      pct: 5,
      quincenal: ingresoQ * 0.05,
      mensual: ingresoM * 0.05,
      saldoVivo: Number(retiro.presupuesto || 250),
      saldoVivoLabel: 'Aporte Quincenal Programado',
      color: 'border-purple-500/40 text-purple-400 bg-purple-950/20',
      badgeColor: 'border-purple-500/40 bg-purple-500/20 text-purple-300',
      detalles: [
        {
          label: 'Fondo de Retiro',
          val: 'AFORE XXI Banorte (Art. 151 LISR)',
          tipo: 'info'
        },
        {
          label: 'Devolución Anual SAT',
          val: '15% reembolsable en Declaración Anual',
          tipo: 'sat'
        },
        {
          label: 'Horizonte Temporal',
          val: 'Interés compuesto acumulado a 25 años',
          tipo: 'largo'
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* HERO BANNER: INGRESOS & PATRIMONIO LÍQUIDO VIVO */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="card-glass p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-purple-950/40 border border-indigo-500/30 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-2xl">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
              Sistema Maestro 50/30/10/5/5
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
              🟢 Sincronizado en Tiempo Real
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Ingreso Quincenal Base: <span className="text-emerald-400">{fmt(ingresoQ)}</span>
            <span className="text-sm sm:text-base font-medium text-slate-400 ml-2">({fmt(ingresoM)}/mes)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Consolidado maestro que une tus <b className="text-white">Gastos Básicos</b> con tu <b className="text-white">Plan Patrimonial a Futuro</b>. El dinero se asigna con disciplina matemática y se resguarda en tu cuenta Nu.
          </p>
        </div>

        {/* Card Capital Consolidado en Nu */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-purple-500/40 shadow-xl flex flex-col justify-between shrink-0 min-w-[280px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Landmark className="w-3.5 h-3.5 text-purple-400" />
                <span>Capital Vivo en Cajita Nu</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-950 text-purple-300 border border-purple-800">
                13% Anual
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1.5">
              {fmt(granTotalNu)}
            </h3>
            <p className="text-xs text-emerald-400 mt-1 font-semibold flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>+{fmt(rendMensualEstimado)}/mes estimado de rendimientos</span>
            </p>
          </div>
          <button
            onClick={onOpenConfig}
            className="mt-4 w-full py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
          >
            <span>Ajustar Parámetros Maestros</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* TARJETA DESTACADA: RADAR ACELERADOR MOTO DE CONTADO */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="card-glass p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-lg">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                <span>🏍️ Radar Acelerador Moto de Contado: {fmt(metaMoto)}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  Meta {fmt(metaMoto)}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Alimentado con el 80% de tu excedente de gastos básicos (+{fmt(resumenGastos.excedente_80_moto || 1355.20)}/quincena) + días hábiles de vacaciones.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Tiempo Estimado</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400">~{mesesMoto} meses</span>
            <span className="text-xs text-slate-400 block font-medium">(2.81 Cuatris)</span>
          </div>
        </div>

        {/* Barra de progreso hacia la meta */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-300">
              Saldo Vivo en Cajita Nu para Moto: <b className="text-purple-300">{fmt(saldoMotoVivo)}</b> ({pctCumplidoVivo}%)
            </span>
            <span className="text-emerald-400">
              Quincenas Cerradas: {fmt(ahorradoHistoricoMoto)} ({pctCumplidoHistorico}%)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, pctCumplidoVivo)}%` }}
            ></div>
          </div>
          <div className="flex flex-wrap justify-between items-center text-[11px] text-slate-400 gap-2">
            <span>
              🔒 Ahorro archivado en histórico: <b className="text-white">{fmt(ahorradoHistoricoMoto)}</b>
            </span>
            <span>
              ⚡ Quincena activa resguardada en Cajita Nu: <b className="text-purple-300">+{fmt(resumenGastos.excedente_80_moto || 1355.20)}</b>
            </span>
            <span>
              Resta para la meta: <b className="text-rose-400">{fmt(Math.max(0, metaMoto - saldoMotoVivo))}</b>
            </span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* GRID DE LAS 5 REGLAS MAESTRAS SINCRONIZADAS */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {reglas.map((item) => (
          <div
            key={item.key}
            className={`card-glass p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-lg transition-all hover:scale-[1.01] ${item.color}`}
          >
            {/* Top header de la tarjeta */}
            <div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {item.paso}
                </span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${item.badgeColor}`}>
                  {item.pct}% Asignado
                </span>
              </div>
              <h4 className="text-base font-black text-white mt-2 leading-snug">
                {item.titulo}
              </h4>
            </div>

            {/* Cuadro de Saldo Vivo Real */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                {item.saldoVivoLabel}:
              </span>
              <p className="text-xl sm:text-2xl font-black text-white">
                {fmt(item.saldoVivo)}
              </p>
            </div>

            {/* Desglose de Operación */}
            <div className="space-y-1.5 text-xs">
              {item.detalles.map((d, dIdx) => (
                <div
                  key={dIdx}
                  className="flex justify-between items-center py-1 border-b border-slate-800/50 text-[11px] gap-2"
                >
                  <span className="text-slate-400 truncate">{d.label}:</span>
                  <span className="font-bold text-slate-200 shrink-0 text-right">{d.val}</span>
                </div>
              ))}
            </div>

            {/* Footer con Asignación Teórica Quincenal vs Mensual */}
            <div className="pt-3 border-t border-slate-800/80 flex justify-between items-baseline">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">
                  Asignado Quincenal
                </span>
                <span className="text-base font-black text-white">
                  {fmt(item.quincenal)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">
                  Asignado Mensual
                </span>
                <span className="text-xs font-bold text-slate-300">
                  {fmt(item.mensual)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
