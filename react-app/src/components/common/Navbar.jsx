import React from 'react';
import { Wallet, TrendingUp, CreditCard, CheckCircle2, Database } from 'lucide-react';

export default function Navbar({
  activeModule,
  setActiveModule,
  onOpenCerrarQuincena,
  onToggleTDC
}) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo y Nombre */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              {activeModule === 'gastos' ? 'Control de Gastos Básicos' : 'Plan Financiero a Futuro'}
            </h1>
            <p className="text-xs text-slate-400 flex items-center space-x-1">
              <span>Sincronizado con</span>
              <span className="text-indigo-400 font-semibold flex items-center space-x-1">
                <Database className="w-3 h-3 inline ml-0.5" />
                <span>finanzas.db (SQLite)</span>
              </span>
            </p>
          </div>
        </div>

        {/* Acciones del Header */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Botón Cerrar Quincena */}
          <button
            onClick={onOpenCerrarQuincena}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cerrar Quincena</span>
            <span className="sm:hidden">Cerrar</span>
          </button>

          {/* Botón TDC Nu */}
          <button
            onClick={onToggleTDC}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-xs font-bold text-purple-300 border border-purple-500/30 transition"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>TDC Nu</span>
          </button>

          {/* Indicador SQLite */}
          <div className="hidden md:flex items-center space-x-2 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>SQLite Activo</span>
          </div>

          {/* Selector de Módulo */}
          {activeModule === 'gastos' ? (
            <button
              onClick={() => setActiveModule('futuro')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-xs font-bold text-indigo-300 border border-indigo-500/30 transition"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Ir a Plan a Futuro</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveModule('gastos')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Ir a Gastos Básicos</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
