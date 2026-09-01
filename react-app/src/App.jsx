import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/common/Navbar';
import Toast from './components/common/Toast';
import TDCSideReminder from './components/common/TDCSideReminder';

// Módulos Gastos
import ResumenPresupuesto from './components/gastos/ResumenPresupuesto';
import RegistroDiario from './components/gastos/RegistroDiario';
import EstadoCuentaMensual from './components/gastos/EstadoCuentaMensual';
import SimuladorMoto from './components/gastos/SimuladorMoto';
import ConfigGastosModal from './components/gastos/ConfigGastosModal';
import CerrarQuincenaModal from './components/gastos/CerrarQuincenaModal';

// Módulos Futuro
import GeneralCajitaTurbo from './components/futuro/GeneralCajitaTurbo';
import RegistroOcio from './components/futuro/RegistroOcio';
import HistoricoFuturo from './components/futuro/HistoricoFuturo';
import DashboardMaestro from './components/futuro/DashboardMaestro';
import CetesEvolucion from './components/futuro/CetesEvolucion';
import ControlTDCNu from './components/futuro/ControlTDCNu';
import FondoEmergencia from './components/futuro/FondoEmergencia';
import RetiroSAT from './components/futuro/RetiroSAT';
import AjusteAporteModal from './components/futuro/AjusteAporteModal';
import CerrarQuincenaFuturoModal from './components/futuro/CerrarQuincenaFuturoModal';
import ConfigFuturoModal from './components/futuro/ConfigFuturoModal';

// API Services
import * as api from './services/api';

// Iconos
import {
  LayoutGrid, Edit3, FileText, Bike, Sliders,
  Landmark, PartyPopper, History, LayoutDashboard,
  Lock, CreditCard, ShieldCheck, Award
} from 'lucide-react';

export default function App() {
  // Estado de navegación
  const [activeModule, setActiveModule] = useState('gastos'); // 'gastos' | 'futuro'
  const [gastosTab, setGastosTab] = useState('resumen');
  const [futuroTab, setFuturoTab] = useState('general-cajita');

  // Estado de datos
  const [gastosData, setGastosData] = useState(null);
  const [historialGastos, setHistorialGastos] = useState({ meses: [], cierres: [] });
  const [futuroData, setFuturoData] = useState(null);
  const [historialFuturo, setHistorialFuturo] = useState([]);
  const [loading, setLoading] = useState(true);

  // Toasts
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Modales
  const [isConfigGastosOpen, setIsConfigGastosOpen] = useState(false);
  const [isCerrarQuincenaGastosOpen, setIsCerrarQuincenaGastosOpen] = useState(false);
  const [isConfigFuturoOpen, setIsConfigFuturoOpen] = useState(false);
  const [isCerrarQuincenaFuturoOpen, setIsCerrarQuincenaFuturoOpen] = useState(false);
  const [ajusteAporteTipo, setAjusteAporteTipo] = useState(null); // 'cetes' | 'emergencia' | 'retiro' | null
  const [isTDCReminderOpen, setIsTDCReminderOpen] = useState(false);

  // Cargar datos de Gastos
  const loadGastos = useCallback(async () => {
    try {
      const res = await api.getGastos();
      if (res.status === 'success') {
        setGastosData(res);
      }
    } catch (err) {
      console.error(err);
      addToast('Error al conectar con la API de Gastos', 'error');
    }
  }, []);

  const loadHistorialGastosData = useCallback(async () => {
    try {
      const res = await api.getHistorialGastos();
      if (res.status === 'success') {
        setHistorialGastos(res);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Cargar datos de Futuro
  const loadFuturo = useCallback(async () => {
    try {
      const res = await api.getFuturo();
      if (res.status === 'success') {
        setFuturoData(res);
      }
    } catch (err) {
      console.error(err);
      addToast('Error al conectar con la API de Futuro', 'error');
    }
  }, []);

  const loadHistorialFuturoData = useCallback(async () => {
    try {
      const res = await api.getHistorialFuturo();
      if (res.status === 'success') {
        setHistorialFuturo(res.cierres || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([
        loadGastos(),
        loadHistorialGastosData(),
        loadFuturo(),
        loadHistorialFuturoData()
      ]);
      setLoading(false);
    }
    init();
  }, [loadGastos, loadHistorialGastosData, loadFuturo, loadHistorialFuturoData]);

  // Manejadores Gastos Básicos
  const handleAddGasto = async (payload) => {
    try {
      const res = await api.addGasto(payload);
      addToast(res.message || 'Gasto guardado en SQLite', 'success');
      await Promise.all([loadGastos(), loadFuturo()]);
    } catch (err) {
      addToast(err.message || 'Error al guardar gasto', 'error');
    }
  };

  const handleDeleteGasto = async (id) => {
    try {
      const res = await api.deleteGasto(id);
      addToast(res.message || 'Gasto eliminado', 'warning');
      await Promise.all([loadGastos(), loadFuturo()]);
    } catch (err) {
      addToast(err.message || 'Error al eliminar', 'error');
    }
  };

  const handleLimpiarGastos = async () => {
    if (!window.confirm('¿Seguro que deseas reiniciar la bitácora de gastos diarios a $0.00?')) return;
    try {
      const res = await api.limpiarRegistroGastos();
      addToast(res.message || 'Bitácora en blanco', 'info');
      await Promise.all([loadGastos(), loadFuturo()]);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleConfirmarCierreGastos = async (payload) => {
    try {
      const res = await api.cerrarQuincenaGastos(payload);
      addToast(res.message, 'success');
      await Promise.all([loadGastos(), loadHistorialGastosData(), loadFuturo()]);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDeleteCierreGastos = async (id) => {
    if (!window.confirm('¿Eliminar esta quincena del histórico?')) return;
    try {
      const res = await api.borrarCierreGastos(id);
      addToast(res.message, 'warning');
      await Promise.all([loadHistorialGastosData(), loadGastos(), loadFuturo()]);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleMotoAporte = async (monto, modo) => {
    try {
      const res = await api.motoAporte(monto, modo);
      addToast(res.message, 'success');
      await Promise.all([loadGastos(), loadFuturo()]);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSaveConfigGastos = async (payload) => {
    try {
      const res = await api.saveConfigGastos(payload);
      addToast(res.message, 'success');
      await Promise.all([loadGastos(), loadFuturo()]);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Manejadores Plan a Futuro
  const handleAddGastoOcio = async (payload) => {
    try {
      const res = await api.addGastoOcio(payload);
      addToast(res.message || 'Gasto de ocio registrado', 'success');
      await loadFuturo();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDeleteGastoOcio = async (id) => {
    try {
      const res = await api.deleteGastoOcio(id);
      addToast(res.message || 'Gasto eliminado', 'warning');
      await loadFuturo();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleUpdateAportacion = async (tipo, monto) => {
    try {
      const res = await api.updateAportacionFuturo(tipo, monto);
      addToast(res.message, 'success');
      await loadFuturo();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleConfirmarCierreFuturo = async (payload) => {
    try {
      const res = await api.cerrarQuincenaFuturo(payload);
      addToast(res.message, 'success');
      await loadFuturo();
      await loadHistorialFuturoData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleAddCompraTDC = async (payload) => {
    try {
      const res = await api.addTDC(payload);
      addToast(res.message, 'success');
      await loadFuturo();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDeleteCompraTDC = async (id) => {
    try {
      const res = await api.deleteTDC(id);
      addToast(res.message, 'warning');
      await loadFuturo();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleLiquidarTDC = async () => {
    if (!window.confirm('¿Confirmas que liquidaste todas las compras pendientes de tu tarjeta Nu?')) return;
    try {
      const res = await api.payTDC();
      addToast(res.message, 'success');
      await loadFuturo();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSaveConfigFuturo = async (payload) => {
    try {
      const res = await api.saveConfigFuturo(payload);
      addToast(res.message, 'success');
      await loadFuturo();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col antialiased bg-[#0b1120] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Notificaciones Flotantes */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Recordatorio Lateral TDC Nu */}
      <TDCSideReminder
        isOpen={isTDCReminderOpen}
        onClose={() => setIsTDCReminderOpen(false)}
        tdcData={futuroData?.tdc}
        onGoToTDC={() => {
          setActiveModule('futuro');
          setFuturoTab('tdc');
        }}
      />

      {/* Barra de Navegación Principal */}
      <Navbar
        activeModule={activeModule}
        setActiveModule={(mod) => {
          setActiveModule(mod);
          loadGastos();
          loadFuturo();
        }}
        onOpenCerrarQuincena={() => {
          if (activeModule === 'gastos') {
            setIsCerrarQuincenaGastosOpen(true);
          } else {
            setIsCerrarQuincenaFuturoOpen(true);
          }
        }}
        onToggleTDC={() => setIsTDCReminderOpen(!isTDCReminderOpen)}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ================================================================= */}
        {/* VISTA 1: CONTROL DE GASTOS BÁSICOS */}
        {/* ================================================================= */}
        {activeModule === 'gastos' && (
          <div className="space-y-6">
            {/* Pestañas de Navegación de Gastos */}
            <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto tab-scroll">
              <button
                onClick={() => setGastosTab('resumen')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border transition whitespace-nowrap ${
                  gastosTab === 'resumen'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>📊 Resumen &amp; Presupuesto</span>
              </button>

              <button
                onClick={() => setGastosTab('diario')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border transition whitespace-nowrap ${
                  gastosTab === 'diario'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>📝 Registro Diario de Gastos</span>
              </button>

              <button
                onClick={() => setGastosTab('estado-cuenta')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border transition whitespace-nowrap ${
                  gastosTab === 'estado-cuenta'
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 border-teal-600'
                    : 'border-transparent text-teal-400 hover:text-teal-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>📜 Estado de Cuenta Mensual</span>
              </button>

              <button
                onClick={() => setGastosTab('moto')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border transition whitespace-nowrap ${
                  gastosTab === 'moto'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>🏍️ Simulador Moto ($35,000)</span>
              </button>

              <button
                onClick={() => setIsConfigGastosOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border border-transparent text-amber-400 hover:text-amber-300 transition whitespace-nowrap ml-auto"
              >
                <Sliders className="w-4 h-4" />
                <span>⚙️ Configuración</span>
              </button>
            </div>

            {/* Contenido de la pestaña activa en Gastos */}
            {gastosTab === 'resumen' && (
              <ResumenPresupuesto
                data={gastosData}
                onOpenCerrarQuincena={() => setIsCerrarQuincenaGastosOpen(true)}
                onOpenConfig={() => setIsConfigGastosOpen(true)}
              />
            )}

            {gastosTab === 'diario' && (
              <RegistroDiario
                registros={gastosData?.registros}
                onAddGasto={handleAddGasto}
                onDeleteGasto={handleDeleteGasto}
                onLimpiarRegistro={handleLimpiarGastos}
                onOpenCerrarQuincena={() => setIsCerrarQuincenaGastosOpen(true)}
              />
            )}

            {gastosTab === 'estado-cuenta' && (
              <EstadoCuentaMensual
                historialData={historialGastos}
                currentResumen={gastosData?.resumen}
                onDeleteCierre={handleDeleteCierreGastos}
                onOpenCerrarQuincena={() => setIsCerrarQuincenaGastosOpen(true)}
              />
            )}

            {gastosTab === 'moto' && (
              <SimuladorMoto
                simulador={gastosData?.simulador_moto}
                onMotoAporte={handleMotoAporte}
              />
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* VISTA 2: PLAN FINANCIERO A FUTURO & CAJITA TURBO NU */}
        {/* ================================================================= */}
        {activeModule === 'futuro' && (
          <div className="space-y-6">
            {/* Pestañas de Navegación de Futuro */}
            <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto tab-scroll">
              <button
                onClick={() => setFuturoTab('general-cajita')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border transition whitespace-nowrap ${
                  futuroTab === 'general-cajita'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border-purple-600'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Landmark className="w-4 h-4 text-purple-400" />
                <span>🏛️ General &amp; Cajita Turbo Nu</span>
              </button>

              <button
                onClick={() => setFuturoTab('ocio')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border transition whitespace-nowrap ${
                  futuroTab === 'ocio'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 border-amber-600'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <PartyPopper className="w-4 h-4 text-amber-400" />
                <span>🍕 Registro de Ocio &amp; Gastos</span>
              </button>

              <button
                onClick={() => setFuturoTab('historial-futuro')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border transition whitespace-nowrap ${
                  futuroTab === 'historial-futuro'
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 border-teal-600'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <History className="w-4 h-4 text-teal-400" />
                <span>📜 Histórico Quincenas Futuro</span>
              </button>

              <button
                onClick={() => setFuturoTab('dash-maestro')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border transition whitespace-nowrap ${
                  futuroTab === 'dash-maestro'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>📊 Dashboard Maestro</span>
              </button>

              <button
                onClick={() => setFuturoTab('cetes')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border transition whitespace-nowrap ${
                  futuroTab === 'cetes'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border-blue-600'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>🔒 Ahorro Cetes</span>
              </button>

              <button
                onClick={() => setFuturoTab('tdc')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border transition whitespace-nowrap ${
                  futuroTab === 'tdc'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border-purple-600'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>💳 Control TDC Nu</span>
              </button>

              <button
                onClick={() => setFuturoTab('fondo-emergencia')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border transition whitespace-nowrap ${
                  futuroTab === 'fondo-emergencia'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border-emerald-600'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>🛡️ Fondo Emergencia</span>
              </button>

              <button
                onClick={() => setFuturoTab('retiro')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border transition whitespace-nowrap ${
                  futuroTab === 'retiro'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border-purple-600'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>🚀 Retiro &amp; SAT</span>
              </button>

              <button
                onClick={() => setIsConfigFuturoOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border border-transparent text-amber-400 hover:text-amber-300 transition whitespace-nowrap ml-auto"
              >
                <Sliders className="w-4 h-4" />
                <span>⚙️ Configuración</span>
              </button>
            </div>

            {/* Contenido de la pestaña activa en Futuro */}
            {futuroTab === 'general-cajita' && (
              <GeneralCajitaTurbo
                futuroData={futuroData}
                onGoToOcio={() => setFuturoTab('ocio')}
                onOpenCerrarQuincena={() => setIsCerrarQuincenaFuturoOpen(true)}
                onOpenAjusteAporte={(tipo) => setAjusteAporteTipo(tipo)}
              />
            )}

            {futuroTab === 'ocio' && (
              <RegistroOcio
                futuroData={futuroData}
                onAddGastoOcio={handleAddGastoOcio}
                onDeleteGastoOcio={handleDeleteGastoOcio}
                onOpenCerrarQuincena={() => setIsCerrarQuincenaFuturoOpen(true)}
              />
            )}

            {futuroTab === 'historial-futuro' && (
              <HistoricoFuturo
                historial={historialFuturo}
                onReload={loadHistorialFuturoData}
                onOpenCerrarQuincena={() => setIsCerrarQuincenaFuturoOpen(true)}
              />
            )}

            {futuroTab === 'dash-maestro' && (
              <DashboardMaestro
                futuroData={futuroData}
                onOpenConfig={() => setIsConfigFuturoOpen(true)}
              />
            )}

            {futuroTab === 'cetes' && (
              <CetesEvolucion futuroData={futuroData} />
            )}

            {futuroTab === 'tdc' && (
              <ControlTDCNu
                tdcData={futuroData?.tdc}
                onAddCompra={handleAddCompraTDC}
                onDeleteCompra={handleDeleteCompraTDC}
                onLiquidarDeuda={handleLiquidarTDC}
              />
            )}

            {futuroTab === 'fondo-emergencia' && (
              <FondoEmergencia futuroData={futuroData} />
            )}

            {futuroTab === 'retiro' && (
              <RetiroSAT futuroData={futuroData} />
            )}
          </div>
        )}
      </main>

      {/* ================================================================= */}
      {/* MODALES GLOBALES */}
      {/* ================================================================= */}

      {/* Modal Configuración Gastos */}
      <ConfigGastosModal
        isOpen={isConfigGastosOpen}
        onClose={() => setIsConfigGastosOpen(false)}
        config={gastosData?.resumen}
        onSave={handleSaveConfigGastos}
      />

      {/* Modal Cerrar Quincena Gastos */}
      <CerrarQuincenaModal
        isOpen={isCerrarQuincenaGastosOpen}
        onClose={() => setIsCerrarQuincenaGastosOpen(false)}
        resumen={gastosData?.resumen}
        onConfirm={handleConfirmarCierreGastos}
      />

      {/* Modal Configuración Futuro */}
      <ConfigFuturoModal
        isOpen={isConfigFuturoOpen}
        onClose={() => setIsConfigFuturoOpen(false)}
        config={futuroData?.config}
        onSave={handleSaveConfigFuturo}
      />

      {/* Modal Cerrar Quincena Futuro */}
      <CerrarQuincenaFuturoModal
        isOpen={isCerrarQuincenaFuturoOpen}
        onClose={() => setIsCerrarQuincenaFuturoOpen(false)}
        futuroData={futuroData}
        onConfirm={handleConfirmarCierreFuturo}
      />

      {/* Modal Ajuste Aporte (Cetes / Emergencia / Retiro) */}
      <AjusteAporteModal
        isOpen={!!ajusteAporteTipo}
        onClose={() => setAjusteAporteTipo(null)}
        tipo={ajusteAporteTipo}
        futuroData={futuroData}
        onSave={handleUpdateAportacion}
      />
    </div>
  );
}
