import React, { useState, useMemo } from 'react';
import {
  History,
  RefreshCw,
  PlusCircle,
  Eye,
  X,
  Trash2,
  Printer,
  Sparkles
} from 'lucide-react';
import { fmt, round2 } from '../../utils/formatters';

export default function HistoricoFuturo({
  historialData = {},
  historial = [],
  futuroData = {},
  onReload,
  onOpenCerrarQuincena,
  onDeleteCierre
}) {
  const [selectedItem, setSelectedItem] = useState(null);

  // Obtener lista de cierres normalizada
  const cierres = useMemo(() => {
    if (Array.isArray(historialData)) return historialData;
    if (historialData && Array.isArray(historialData.cierres)) return historialData.cierres;
    if (Array.isArray(historial)) return historial;
    if (historial && Array.isArray(historial.cierres)) return historial.cierres;
    return [];
  }, [historialData, historial]);

  // Agrupar por mes
  const meses = useMemo(() => {
    if (historialData && Array.isArray(historialData.meses) && historialData.meses.length > 0) {
      return historialData.meses;
    }

    const mesesMap = {};
    for (const c of cierres) {
      const mesNom = c.mes || 'septiembre';
      const key = `${mesNom} ${c.anio || 2026}`;
      if (!mesesMap[key]) {
        mesesMap[key] = {
          mes_anio: key,
          mes: mesNom,
          anio: c.anio || 2026,
          num_quincenas: 0,
          presupuesto_ocio_total: 0,
          gasto_ocio_total: 0,
          remanente_ocio_total: 0,
          aporte_emergencia_total: 0,
          aporte_retiro_total: 0,
          aporte_cetes_total: 0,
          total_cajita_cierre: 0,
          quincenas: [],
          transacciones: []
        };
      }
      const m = mesesMap[key];
      m.num_quincenas += 1;
      m.presupuesto_ocio_total = round2(m.presupuesto_ocio_total + Number(c.presupuesto_ocio || 0));
      m.gasto_ocio_total = round2(m.gasto_ocio_total + Number(c.gasto_ocio || 0));
      m.remanente_ocio_total = round2(m.remanente_ocio_total + Number(c.remanente_ocio || 0));
      m.aporte_emergencia_total = round2(m.aporte_emergencia_total + Number(c.aporte_emergencia || 0));
      m.aporte_retiro_total = round2(m.aporte_retiro_total + Number(c.aporte_retiro || 0));
      m.aporte_cetes_total = round2(m.aporte_cetes_total + Number(c.aporte_cetes || 0));
      if (c.total_cajita_cierre) {
        m.total_cajita_cierre = Number(c.total_cajita_cierre);
      }
      m.quincenas.push(c);

      try {
        const det = typeof c.detalle_json === 'string' ? JSON.parse(c.detalle_json) : (c.detalle_json || c.detalle || {});
        const transIds = new Set();
        if (Array.isArray(det.registros_ocio)) {
          for (const r of det.registros_ocio) {
            const rId = String(r.id || `${r.fecha}-${r.concepto}-${r.monto}`);
            if (!transIds.has(rId)) {
              transIds.add(rId);
              m.transacciones.push({ ...r, quincena: c.periodo });
            }
          }
        }
      } catch (e) {}
    }

    return Object.values(mesesMap);
  }, [historialData, cierres]);

  // Mes seleccionado por defecto (el más reciente)
  const [selectedMesStr, setSelectedMesStr] = useState(
    meses.length > 0 ? meses[0].mes_anio : ''
  );

  const activeMesStr = useMemo(() => {
    if (selectedMesStr && meses.some(m => m.mes_anio === selectedMesStr)) {
      return selectedMesStr;
    }
    return meses.length > 0 ? meses[0].mes_anio : '';
  }, [selectedMesStr, meses]);

  const currIdx = useMemo(() => {
    return meses.findIndex(m => m.mes_anio === activeMesStr);
  }, [meses, activeMesStr]);

  const mData = currIdx !== -1 ? meses[currIdx] : null;
  const hasData = !!mData && mData.num_quincenas > 0;

  // Fecha del estado de cuenta
  const fechaEstadoCuenta = useMemo(() => {
    if (mData && mData.quincenas && mData.quincenas.length > 0) {
      return mData.quincenas[0].fecha_cierre || new Date().toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }, [mData]);

  // Totales
  const presOcioMes = mData?.presupuesto_ocio_total || 0;
  const gastoOcioMes = mData?.gasto_ocio_total || 0;
  const remOcioMes = mData?.remanente_ocio_total || 0;
  const emgMes = mData?.aporte_emergencia_total || 0;
  const retMes = mData?.aporte_retiro_total || 0;
  const cetMes = mData?.aporte_cetes_total || 0;
  const cajitaCierre = mData?.total_cajita_cierre || 0;
  const transacciones = mData?.transacciones || [];

  const pctOcioGastado = presOcioMes > 0 ? ((gastoOcioMes / presOcioMes) * 100).toFixed(1) : '0.0';
  const totalInversionesLargoPlazo = cetMes + retMes;
  const rendMensualEstimadoCajita = cajitaCierre * (0.13 / 12);

  // Filas del resumen institucional de fondos (Sección d)
  const itemsFondos = useMemo(() => {
    if (!hasData) return [];
    return [
      {
        fondo: "1010  FONDO DE OCIO & ESTILO DE VIDA (30% Presupuesto Futuro)",
        tipo: "Cajita Turbo Nu / Débito Nu",
        asignado: presOcioMes,
        gastado: gastoOcioMes,
        saldo: remOcioMes,
        rendimiento: "13% sobre remanente resguardado"
      },
      {
        fondo: "2010  FONDO DE EMERGENCIA (10% Presupuesto Futuro — Cajita Nu)",
        tipo: "Cajita Turbo Nu (Líquido 24/7)",
        asignado: emgMes,
        gastado: 0,
        saldo: emgMes,
        rendimiento: "13% Anualizado Nu"
      },
      {
        fondo: "3010  FONDO DE RETIRO SAT (5% Presupuesto Futuro — AFORE Banorte)",
        tipo: "Pensión & Deducible Anual SAT",
        asignado: retMes,
        gastado: retMes,
        saldo: 0,
        isExternal: true,
        rendimiento: "Interés compuesto largo plazo"
      },
      {
        fondo: "4010  FONDO CETESDIRECTO (5% Presupuesto Futuro — Bonos Gubernamentales)",
        tipo: "Cetes 28 / 91 días (Tasa Fija)",
        asignado: cetMes,
        gastado: cetMes,
        saldo: 0,
        isExternal: true,
        rendimiento: "~11.0% Tasa Cetes Gubernamental"
      },
      {
        fondo: "5010  CAPITAL CONSOLIDADO EN CAJITA TURBO NU AL CORTE",
        tipo: "Cajita Nu Turbo (13% Anual)",
        asignado: cajitaCierre,
        gastado: 0,
        saldo: cajitaCierre,
        rendimiento: `+${fmt(rendMensualEstimadoCajita)} MXN/mes aprox.`,
        isTotalNu: true
      }
    ];
  }, [hasData, presOcioMes, gastoOcioMes, remOcioMes, emgMes, retMes, cetMes, cajitaCierre, rendMensualEstimadoCajita]);

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* BARRA SUPERIOR DE CONTROLES (NO IMPRIMIBLE) */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="card-glass p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-teal-800/40 no-print">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">Histórico Quincenas &amp; Estado Patrimonial</h2>
            <p className="text-xs text-slate-400">
              Consolidado de Ocio, Fondos Patrimoniales y Cajita Turbo archivados en la Nube 24/7
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {meses.length > 0 && (
            <div className="flex items-center space-x-2">
              <label className="text-xs text-slate-400 font-semibold">Seleccionar Mes:</label>
              <select
                value={activeMesStr}
                onChange={(e) => setSelectedMesStr(e.target.value)}
                className="form-select text-xs font-bold py-1.5 px-3 w-auto focus:border-teal-500"
              >
                {meses.map((m, idx) => (
                  <option key={idx} value={m.mes_anio}>
                    {m.mes_anio} ({m.num_quincenas} quincena{m.num_quincenas > 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => window.print()}
            className="btn-base bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white shadow-lg shadow-teal-900/40 border border-teal-400/40"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>

          <button
            onClick={onReload}
            className="btn-ghost"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>

          <button
            onClick={onOpenCerrarQuincena}
            className="btn-success"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Archivar Quincena Actual</span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 4 CARDS KPI RESUMEN RÁPIDO (SOLO PANTALLA - no-print) */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="mobile-grid-kpi no-print">
        <div className="card-kpi border-teal-500/30">
          <span className="kpi-label">Presupuesto Ocio del Mes</span>
          <h3 className="kpi-val-white">{fmt(presOcioMes)}</h3>
          <p className="kpi-subtext text-teal-400 font-semibold">
            {mData ? `${mData.num_quincenas} quincena${mData.num_quincenas > 1 ? 's' : ''} archivada${mData.num_quincenas > 1 ? 's' : ''}` : '0 quincenas'}
          </p>
        </div>

        <div className="card-kpi border-rose-500/30">
          <span className="kpi-label">Total Egresado / Invertido</span>
          <h3 className="kpi-val-rose">-{fmt(gastoOcioMes + retMes + cetMes)}</h3>
          <p className="kpi-subtext">Ocio: -{fmt(gastoOcioMes)} | Retiro+Cetes: -{fmt(retMes + cetMes)}</p>
        </div>

        <div className="card-kpi border-emerald-500/30">
          <span className="kpi-label">Remanente Ocio Resguardado</span>
          <h3 className="kpi-val-emerald">{fmt(remOcioMes)}</h3>
          <p className="kpi-subtext text-emerald-400 font-semibold">Ahorrado en Cajita Nu (13%)</p>
        </div>

        <div className="card-kpi border-purple-500/30">
          <span className="kpi-label">Total en Cajita Nu al Cierre</span>
          <h3 className="kpi-val-purple">{fmt(cajitaCierre)}</h3>
          <p className="kpi-subtext text-purple-300 font-semibold">
            Inversiones Cetes+Retiro: {fmt(totalInversionesLargoPlazo)}
          </p>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* GESTIÓN INTERACTIVA DE QUINCENAS ARCHIVADAS (no-print) */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="card-glass p-4 sm:p-5 border-slate-800 no-print space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
            <h3 className="text-sm font-bold text-white">
              {hasData ? `Quincenas Archivadas en ${mData.mes_anio}` : 'Quincenas Archivadas de Plan a Futuro'}
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {hasData ? `${mData.quincenas.length} quincena${mData.quincenas.length > 1 ? 's' : ''} en el histórico` : '0 registros'}
          </span>
        </div>

        <div className="table-responsive-container">
          <table className="table-modern">
            <thead>
              <tr>
                <th className="table-modern-th">#</th>
                <th className="table-modern-th">Período</th>
                <th className="table-modern-th text-center">Fecha Cierre</th>
                <th className="table-modern-th text-right">Pres. Ocio</th>
                <th className="table-modern-th text-right">Gasto Ocio</th>
                <th className="table-modern-th text-right">Remanente Ocio</th>
                <th className="table-modern-th text-right">Fondo Emergencia</th>
                <th className="table-modern-th text-right">Retiro SAT</th>
                <th className="table-modern-th text-right">Cetesdirecto</th>
                <th className="table-modern-th text-right">Total Cajita Nu</th>
                <th className="table-modern-th text-center">Movs</th>
                <th className="table-modern-th text-center min-w-[130px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {cierres.length === 0 ? (
                <tr>
                  <td colSpan="12" className="p-8 text-center text-slate-500">
                    No hay quincenas archivadas de Plan a Futuro aún.
                  </td>
                </tr>
              ) : (
                (hasData ? mData.quincenas : cierres).map((c, index) => (
                  <tr key={c.id || index} className="table-modern-tr">
                    <td className="table-modern-td font-semibold text-slate-500">#{index + 1}</td>
                    <td className="table-modern-td font-bold text-white whitespace-nowrap">{c.periodo}</td>
                    <td className="table-modern-td text-center text-slate-400 whitespace-nowrap">{c.fecha_cierre}</td>
                    <td className="table-modern-td text-right text-slate-300 font-semibold">{fmt(c.presupuesto_ocio)}</td>
                    <td className="table-modern-td text-right font-bold text-rose-400">
                      {c.gasto_ocio > 0 ? '-' + fmt(c.gasto_ocio) : '$0.00'}
                    </td>
                    <td className="table-modern-td text-right font-black text-emerald-400">{fmt(c.remanente_ocio)}</td>
                    <td className="table-modern-td text-right text-teal-300 font-semibold">{fmt(c.aporte_emergencia)}</td>
                    <td className="table-modern-td text-right text-indigo-300 font-semibold">{fmt(c.aporte_retiro)}</td>
                    <td className="table-modern-td text-right text-blue-300 font-semibold">{fmt(c.aporte_cetes)}</td>
                    <td className="table-modern-td text-right font-black text-purple-300 text-sm">{fmt(c.total_cajita_cierre)}</td>
                    <td className="table-modern-td text-center">
                      <span className="badge-slate">
                        {c.num_movimientos || 0} movs
                      </span>
                    </td>
                    <td className="table-modern-td text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setSelectedItem(c)}
                          className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold transition flex items-center space-x-1"
                          title="Ver desglose detallado"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                        {onDeleteCierre && (
                          <button
                            onClick={() => onDeleteCierre(c.id)}
                            className="btn-danger !min-h-[28px] !py-1 !px-2 text-xs"
                            title="Eliminar esta quincena del histórico"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Eliminar</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* DOCUMENTO INSTITUCIONAL FORMAL: ESTADO DE CUENTA PATRIMONIAL (PANTALLA & IMPRESIÓN) */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div
        id="print-estado-cuenta"
        className="ec-doc bg-white text-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-300 shadow-2xl space-y-6 print:p-0 print:border-none print:shadow-none print:space-y-1"
      >
        {/* ENCABEZADO SUPERIOR FORMAL (a) */}
        <div className="ec-card-block flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-md border border-slate-800">
              <span>PF</span>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 uppercase">
                CONTROL FINANCIERO PERSONAL
              </h2>
              <p className="text-[10px] text-slate-600 font-semibold tracking-wider uppercase">
                SISTEMA DE GESTIÓN PATRIMONIAL &amp; PLAN A FUTURO
              </p>
            </div>
          </div>

          <div className="ec-header-box px-6 py-2 rounded-lg text-center shadow-sm min-w-[240px]">
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              ESTADO DE CUENTA PATRIMONIAL
            </h1>
            <p className="text-xs font-black text-indigo-950 mt-0.5 uppercase tracking-wide">
              {mData?.mes_anio?.toUpperCase() || 'PLAN A FUTURO'}
            </p>
            <p className="text-[10px] text-slate-600 font-bold">
              al Día {fechaEstadoCuenta}
            </p>
          </div>

          <div className="text-right text-xs space-y-0.5 min-w-[120px]">
            <p className="text-slate-600 font-bold">Estado <b className="text-slate-900">Mensual</b></p>
            <p className="text-slate-600 font-bold">Fecha: <b className="text-slate-900">{fechaEstadoCuenta}</b></p>
            <p className="text-[9px] text-emerald-800 font-black uppercase">● AUDITADO &amp; CUADRADO</p>
          </div>
        </div>

        {/* CUADRO DE METADATOS DEL TITULAR (b & c) */}
        <div className="ec-card-block ec-meta-box p-3.5 rounded-xl border border-slate-900 text-xs shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
            <div>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase">b Titular / Usuario:</span>
              <p className="font-black text-slate-900 uppercase text-xs">David (Control Personal)</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase">c Plan Financiero:</span>
              <p className="font-bold text-slate-800">Plan Maestro 50/30/10/5/5 • Fondos Patrimoniales</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase">Moneda / Divisa:</span>
              <p className="font-bold text-slate-800">MXN (Pesos Mexicanos)</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase">Estado Patrimonial:</span>
              <p className="font-black text-emerald-700">CONSOLIDADO EN NUBE 24/7</p>
            </div>
          </div>
        </div>

        {/* BANNER DE BALANCE DESTACADO */}
        <div className="ec-card-block p-3.5 rounded-xl bg-slate-100 border border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              SALDO TOTAL RESGUARDADO EN CAJITA NU AL CIERRE:
              <span className="text-purple-700 text-sm font-black ml-1.5">{fmt(cajitaCierre)} MXN</span>
            </h4>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Capital total generando <b>13% de rendimiento anual</b> con liquidez 24/7 (Fondo Emergencia + Remanente Ocio acumulado).
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-950 text-[10px] font-black uppercase border border-purple-300 shrink-0">
            🟣 CAPITAL PROTEGIDO 13% NU
          </span>
        </div>

        {!hasData ? (
          <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300 rounded-2xl">
            <p className="font-semibold text-sm">No hay quincenas archivadas de Plan a Futuro aún.</p>
            <p className="text-xs mt-1">
              Haz clic en <b>"Archivar Quincena Actual"</b> para cerrar tu primer período y generar el estado patrimonial formal.
            </p>
          </div>
        ) : (
          <>
            {/* SECCIÓN d: RESUMEN DE FONDOS Y CAPITALES DEL PERÍODO */}
            <div className="ec-card-block space-y-2">
              <div className="ec-section-bar p-2 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center">
                  <span className="ec-badge-letter">d</span>
                  <span className="text-xs font-black tracking-wide">RESUMEN DE FONDOS Y CAPITALES DEL PERÍODO</span>
                </div>
                <span className="text-[10px] text-slate-300 font-semibold lowercase">cifras en mxn</span>
              </div>
              <div className="overflow-x-auto border border-slate-300 rounded-b-lg">
                <table className="ec-table">
                  <thead>
                    <tr>
                      <th className="text-left w-2/5">Fondo Patrimonial / Instrumento</th>
                      <th className="text-center w-1/5">Tipo de Cuenta / Manejo</th>
                      <th className="text-right w-1/6">Asignación Mensual ($)</th>
                      <th className="text-right w-1/6">Gasto Real ($)</th>
                      <th className="text-right w-1/6">Saldo / Remanente ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsFondos.map((item, idx) => (
                      <tr key={idx} className={item.isTotalNu ? 'bg-purple-50 font-bold' : ''}>
                        <td className={`font-bold ${item.isTotalNu ? 'text-purple-950' : 'text-slate-800'}`}>
                          {item.fondo}
                        </td>
                        <td className="text-center text-[10px] font-semibold text-slate-600">
                          {item.tipo}
                        </td>
                        <td className="text-right ec-blue">{fmt(item.asignado)}</td>
                        <td className={`text-right ${item.gastado > 0 ? 'ec-red' : 'text-slate-400'}`}>
                          {item.gastado > 0 ? '-' + fmt(item.gastado) : '$0.00'}
                        </td>
                        <td className="text-right ec-green">
                          {item.isExternal ? (
                            <span>$0.00 <span className="text-[9px] text-indigo-700 block font-normal">(Aportado)</span></span>
                          ) : (
                            fmt(item.saldo)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN e: BARRA ENMARCADA DE TOTALES */}
            <div className="ec-card-block ec-total-bar p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center">
                <span className="ec-badge-letter">e</span>
                <span className="font-black tracking-widest uppercase">T O T A L E S   P A T R I M O N I A L E S</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-black">
                <div>Asignado a Fondos: <span className="ec-blue text-sm">{fmt(presOcioMes + emgMes + retMes + cetMes)}</span></div>
                <div>Gasto Real / Invertido: <span className="ec-red text-sm">-{fmt(gastoOcioMes + retMes + cetMes)}</span></div>
                <div>Ahorro Ocio Resguardado: <span className="ec-green text-sm">{fmt(remOcioMes)}</span></div>
                <div>Total en Cajita Nu: <span className="text-purple-800 text-sm">{fmt(cajitaCierre)}</span></div>
              </div>
            </div>

            {/* SECCIÓN f: RENDIMIENTO FINANCIERO Y EFICIENCIA DE FONDOS */}
            <div className="ec-card-block space-y-2">
              <div className="ec-section-bar p-2 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center">
                  <span className="ec-badge-letter">f</span>
                  <span className="text-xs font-black tracking-wide">
                    RENDIMIENTO FINANCIERO &amp; EFICIENCIA PATRIMONIAL
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 font-semibold lowercase">estrategia 50/30/10/5/5</span>
              </div>
              <div className="overflow-x-auto border border-slate-300 rounded-b-lg">
                <table className="ec-table">
                  <thead>
                    <tr>
                      <th className="text-left">Indicador Estratégico</th>
                      <th className="text-right">Monto / Tasa</th>
                      <th className="text-left">Destino / Instrumento</th>
                      <th className="text-left">Diagnóstico de Eficiencia Patrimonial</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-bold text-slate-900">🟣 Rendimiento Mensual Estimado Cajita Turbo Nu</td>
                      <td className="text-right font-black text-purple-700">+{fmt(rendMensualEstimadoCajita)}/mes</td>
                      <td className="text-slate-700 font-semibold">13.0% Anual Fijo</td>
                      <td className="text-slate-700 text-xs">
                        Generado de forma automática sobre el saldo resguardado de <b>{fmt(cajitaCierre)} MXN</b>.
                      </td>
                    </tr>
                    <tr>
                      <td className="font-bold text-slate-900">🛡️ Tasa de Protección de Remanente de Ocio</td>
                      <td className="text-right font-black text-emerald-700">
                        {presOcioMes > 0 ? ((remOcioMes / presOcioMes) * 100).toFixed(1) + '%' : '100%'}
                      </td>
                      <td className="text-slate-700 font-semibold">Cajita Turbo Nu</td>
                      <td className="text-slate-700 text-xs">
                        {remOcioMes > 0
                          ? `Protegiste ${fmt(remOcioMes)} no consumidos de ocio, incrementando tu patrimonio líquido.`
                          : 'Se consumió la totalidad del presupuesto asignado a ocio.'}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-bold text-slate-900">🏛️ Aportaciones Externas a Largo Plazo</td>
                      <td className="text-right font-black text-indigo-700">{fmt(totalInversionesLargoPlazo)}</td>
                      <td className="text-slate-700 font-semibold">Cetes ({fmt(cetMes)}) + Retiro SAT ({fmt(retMes)})</td>
                      <td className="text-slate-700 text-xs">
                        Diversificación fuera del sistema bancario tradicional (Deuda Soberana y AFORE Banorte).
                      </td>
                    </tr>
                    <tr>
                      <td className="font-bold text-slate-900">🛡️ Capital Líquido Fondo de Emergencia</td>
                      <td className="text-right font-black text-teal-700">+{fmt(emgMes)}</td>
                      <td className="text-slate-700 font-semibold">Cajita Turbo Nu (13%)</td>
                      <td className="text-slate-700 text-xs">
                        Respaldo blindado ante imprevistos mayores sin necesidad de recurrir a deudas o crédito costoso.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN g: BITÁCORA EXHAUSTIVA DE MOVIMIENTOS DE OCIO DEL MES */}
            <div className="ec-card-block space-y-2">
              <div className="ec-section-bar p-2 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center">
                  <span className="ec-badge-letter">g</span>
                  <span className="text-xs font-black tracking-wide">BITÁCORA EXHAUSTIVA DE MOVIMIENTOS DE OCIO DEL MES</span>
                </div>
                <span className="text-[10px] text-slate-300 font-semibold lowercase">
                  {transacciones.length} movimientos
                </span>
              </div>
              <div className="overflow-x-auto border border-slate-300 rounded-b-lg max-h-[400px] overflow-y-auto">
                <table className="ec-table">
                  <thead>
                    <tr>
                      <th className="text-center w-12">#</th>
                      <th className="text-left">Fecha</th>
                      <th className="text-left">Quincena</th>
                      <th className="text-left">Concepto / Detalle</th>
                      <th className="text-left">Categoría</th>
                      <th className="text-left">Método Pago</th>
                      <th className="text-right">Importe ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transacciones.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-6 text-center text-slate-500 font-semibold">
                          No se registraron gastos individuales de ocio en las quincenas archivadas.
                        </td>
                      </tr>
                    ) : (
                      transacciones.map((tx, idx) => (
                        <tr key={idx}>
                          <td className="text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="text-slate-600 whitespace-nowrap">{tx.fecha}</td>
                          <td className="font-semibold text-indigo-900 whitespace-nowrap">{tx.quincena || mData.quincenas[0]?.periodo}</td>
                          <td className="font-bold text-slate-900">{tx.concepto}</td>
                          <td className="text-slate-600 whitespace-nowrap">{tx.categoria}</td>
                          <td className="text-slate-600 whitespace-nowrap">{tx.metodo_pago || tx.metodo || 'Débito Nu'}</td>
                          <td className="text-right font-black ec-red">-{fmt(tx.monto)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN h: NOTA INSTITUCIONAL Y AUDITORÍA */}
            <div className="ec-card-block p-3 rounded-xl bg-slate-50 border border-slate-300 text-[10px] text-slate-600 space-y-1">
              <p className="font-extrabold uppercase text-slate-800">
                h NOTA DE AUDITORÍA Y RESGUARDO PATRIMONIAL:
              </p>
              <p>
                ESTE ESTADO PATRIMONIAL ES GENERADO AUTOMÁTICAMENTE A PARTIR DE LOS CIERRES REGISTRADOS EN <b className="text-slate-800">Cloud Firestore</b>.
              </p>
              <p className="text-[9px] text-slate-500">
                Los fondos asignados siguen la disciplina del presupuesto maestro 50/30/10/5/5. Los saldos en Cajita Turbo Nu se liquidan diariamente generando intereses compuestos a favor del titular.
              </p>
            </div>
          </>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* MODAL DETALLE DE QUINCENA ARCHIVADA */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {selectedItem && (
        <div className="modal-overlay">
          <div className="modal-sheet max-w-xl border border-teal-500/30">
            <div className="modal-header">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Detalle de Quincena Archivada</h3>
                  <p className="text-[11px] text-slate-400">{selectedItem.periodo}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* 6 Cards KPI de la quincena */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block">Fecha de Cierre</span>
                  <p className="font-bold text-white mt-0.5">{selectedItem.fecha_cierre}</p>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-purple-500/30">
                  <span className="text-[10px] text-purple-300 font-semibold block">Total en Cajita Nu</span>
                  <p className="font-black text-purple-300 text-sm mt-0.5">{fmt(selectedItem.total_cajita_cierre)}</p>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 font-semibold block">Remanente Ocio</span>
                  <p className="font-black text-emerald-400 mt-0.5">{fmt(selectedItem.remanente_ocio)}</p>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-teal-500/30">
                  <span className="text-[10px] text-teal-300 font-semibold block">Fondo Emergencia</span>
                  <p className="font-bold text-teal-300 mt-0.5">{fmt(selectedItem.aporte_emergencia)}</p>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-indigo-500/30">
                  <span className="text-[10px] text-indigo-300 font-semibold block">Retiro SAT AFORE</span>
                  <p className="font-bold text-indigo-300 mt-0.5">{fmt(selectedItem.aporte_retiro)}</p>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-blue-500/30">
                  <span className="text-[10px] text-blue-300 font-semibold block">Cetesdirecto</span>
                  <p className="font-bold text-blue-300 mt-0.5">{fmt(selectedItem.aporte_cetes)}</p>
                </div>
              </div>

              {/* Lista de gastos archivados en la quincena */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Movimientos de Ocio Registrados</span>
                  </h4>
                  <span className="badge-slate text-[10px]">
                    Presupuesto: {fmt(selectedItem.presupuesto_ocio)} | Gastado: {fmt(selectedItem.gasto_ocio)}
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-800 rounded-xl p-2 bg-slate-900/60">
                  {(() => {
                    let items = [];
                    try {
                      const det = typeof selectedItem.detalle_json === 'string'
                        ? JSON.parse(selectedItem.detalle_json)
                        : (selectedItem.detalle_json || selectedItem.detalle || {});
                      items = det.registros_ocio || [];
                    } catch (e) {}

                    if (items.length === 0) {
                      return (
                        <p className="text-slate-500 p-4 text-center">
                          No se registraron gastos individuales de ocio en este período.
                        </p>
                      );
                    }

                    return items.map((r, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-2.5 rounded-lg bg-slate-800/40 border border-slate-800/60 hover:border-slate-700 transition text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-white">{r.concepto}</p>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                            <span>{r.fecha}</span>
                            <span>•</span>
                            <span className="text-teal-300 font-medium">{r.categoria}</span>
                            <span>•</span>
                            <span className="text-slate-400">{r.metodo_pago || r.metodo || 'Débito Nu'}</span>
                          </div>
                        </div>
                        <span className="font-black text-rose-400 text-sm">
                          -{fmt(r.monto)}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center space-x-2">
              {onDeleteCierre && (
                <button
                  type="button"
                  onClick={() => {
                    const idToDelete = selectedItem.id;
                    setSelectedItem(null);
                    onDeleteCierre(idToDelete);
                  }}
                  className="btn-danger !py-2 !px-3 text-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Quincena</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="btn-ghost flex-1 !py-2 text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
