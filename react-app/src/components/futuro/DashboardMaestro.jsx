import React from 'react';
import { LayoutDashboard, Shield, TrendingUp, Wallet, Award } from 'lucide-react';
import { fmt } from '../../utils/formatters';

export default function DashboardMaestro({ futuroData = {}, onOpenConfig }) {
  const dm = futuroData?.dashboard_maestro || {};
  const ingresoQ = dm.ingreso_base_quincenal || 5000;
  const ingresoM = dm.ingreso_base_mensual || 10000;
  const dist = dm.distribucion || {};

  const items = [
    {
      key: 'p1_involuntario',
      titulo: '🔒 Ahorro Involuntario (Cetes)',
      paso: 'Paso 1: Bloqueo Automático',
      pct: 5,
      quincenal: ingresoQ * 0.05,
      mensual: ingresoM * 0.05,
      destino: 'Cetesdirecto a 3 meses (6.45% anual)',
      color: 'border-blue-500/30 text-blue-400 bg-blue-950/20'
    },
    {
      key: 'p2_basicos',
      titulo: '💳 Gastos Básicos (Vida)',
      paso: 'Paso 2: Presupuesto Base',
      pct: 50,
      quincenal: ingresoQ * 0.50,
      mensual: ingresoM * 0.50,
      destino: 'Combi ($32/día) + Comidas + Copias + Imprevistos + 80% Moto',
      color: 'border-indigo-500/30 text-indigo-400 bg-indigo-950/20'
    },
    {
      key: 'p7_ocio',
      titulo: '🍕 Gustos & Ocio',
      paso: 'Paso 7: Estilo de Vida',
      pct: 30,
      quincenal: ingresoQ * 0.30,
      mensual: ingresoM * 0.30,
      destino: 'Cajita Turbo Nu (Líquido para gastar)',
      color: 'border-amber-500/30 text-amber-400 bg-amber-950/20'
    },
    {
      key: 'p3_emergencia',
      titulo: '🛡️ Fondo de Emergencia',
      paso: 'Paso 3: Colchón de 3 Meses',
      pct: 10,
      quincenal: ingresoQ * 0.10,
      mensual: ingresoM * 0.10,
      destino: 'Cajita Turbo Nu (Blindado e intocable)',
      color: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20'
    },
    {
      key: 'p6_retiro',
      titulo: '🚀 Retiro & Beneficio SAT',
      paso: 'Paso 6: Deducible Art. 151',
      pct: 5,
      quincenal: ingresoQ * 0.05,
      mensual: ingresoM * 0.05,
      destino: 'AFORE XXI Banorte / Devolución Fiscal',
      color: 'border-purple-500/30 text-purple-400 bg-purple-950/20'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Resumen */}
      <div className="card-glass p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="badge-indigo">
            Sistema 50/30/10/5/5
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
            Ingreso Quincenal Base: <span className="text-emerald-400">{fmt(ingresoQ)}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Equivalente a <b className="text-white">{fmt(ingresoM)}/mes</b> distribuidos con disciplina matemática.
          </p>
        </div>
        <button
          onClick={onOpenConfig}
          className="btn-amber shrink-0 w-full sm:w-auto"
        >
          Ajustar Parámetros Maestros
        </button>
      </div>

      {/* Grid de 5 Reglas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, idx) => (
          <div key={idx} className={`card-glass p-5 flex flex-col justify-between space-y-3 ${item.color}`}>
            <div>
              <div className="flex justify-between items-center">
                <span className="kpi-label">{item.paso}</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700">{item.pct}%</span>
              </div>
              <h4 className="text-base font-bold text-white mt-2">{item.titulo}</h4>
              <p className="text-xs text-slate-400 mt-1">{item.destino}</p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
              <div>
                <span className="text-[10px] text-slate-500 block">Quincenal</span>
                <span className="text-lg font-black text-white">{fmt(item.quincenal)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Mensual</span>
                <span className="text-sm font-bold text-slate-300">{fmt(item.mensual)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
