import React from 'react';
import { Wallet, TrendingUp, CreditCard, CheckCircle2, Database, Cloud } from 'lucide-react';

export default function Navbar({
  activeModule,
  setActiveModule,
  onOpenCerrarQuincena,
  onToggleTDC
}) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-0 min-h-[56px] sm:h-16 flex items-center justify-between gap-2">
        {/* Logo e Identidad de la App */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent truncate max-w-[140px] sm:max-w-none">
              {activeModule === 'gastos' ? 'Gastos Básicos' : 'Plan a Futuro'}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 flex items-center space-x-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                <Cloud className="w-3 h-3 inline shrink-0" />
                <span>Nube 24/7</span>
              </span>
            </p>
          </div>
        </div>

        {/* Acciones y Switcher de Módulos (Mobile Touch Friendly) */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Botón Cerrar Quincena */}
          <button
            onClick={onOpenCerrarQuincena}
            className="btn-success min-h-[36px] sm:min-h-[38px] px-2.5 sm:px-3.5 text-xs py-1"
            title="Cerrar y archivar quincena actual"
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Cerrar Quincena</span>
            <span className="sm:hidden text-[11px]">Cerrar</span>
          </button>

          {/* Botón Acceso Rápido TDC Nu */}
          <button
            onClick={onToggleTDC}
            className="btn-purple min-h-[36px] sm:min-h-[38px] px-2.5 sm:px-3 text-xs py-1"
            title="Abrir resumen de Tarjeta de Crédito Nu"
          >
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] sm:text-xs">TDC</span>
          </button>

          {/* Switcher Rápido de Módulo */}
          <div className="bg-slate-900 p-0.5 rounded-xl border border-slate-800 flex items-center shrink-0">
            <button
              onClick={() => setActiveModule('gastos')}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                activeModule === 'gastos'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Cambiar a Control de Gastos Básicos"
            >
              <Wallet className="w-3 h-3 shrink-0" />
              <span className="hidden md:inline">Gastos</span>
            </button>
            <button
              onClick={() => setActiveModule('futuro')}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                activeModule === 'futuro'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Cambiar a Plan Financiero a Futuro"
            >
              <TrendingUp className="w-3 h-3 shrink-0" />
              <span className="hidden md:inline">Futuro</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
