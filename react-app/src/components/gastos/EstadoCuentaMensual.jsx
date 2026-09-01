import React, { useState, useMemo } from 'react';
import { FileText, Printer, PlusCircle, Trash2 } from 'lucide-react';
import { fmt, round2 } from '../../utils/formatters';

export default function EstadoCuentaMensual({
  historialData = {},
  currentResumen = {},
  onDeleteCierre,
  onOpenCerrarQuincena
}) {
  // Obtener meses y cierres desde historialData
  const meses = useMemo(() => {
    if (Array.isArray(historialData)) return [];
    return historialData.meses || [];
  }, [historialData]);

  const cierres = useMemo(() => {
    if (Array.isArray(historialData)) return historialData;
    return historialData.cierres || [];
  }, [historialData]);

  // Mes seleccionado por defecto (el más reciente)
  const [selectedMesStr, setSelectedMesStr] = useState(
    meses.length > 0 ? meses[0].mes_anio : ''
  );

  // Sincronizar si cambian los meses
  const activeMesStr = useMemo(() => {
    if (selectedMesStr && meses.some(m => m.mes_anio === selectedMesStr)) {
      return selectedMesStr;
    }
    return meses.length > 0 ? meses[0].mes_anio : '';
  }, [selectedMesStr, meses]);

  // Encontrar el mes actual y el mes anterior para comparativas
  const currIdx = useMemo(() => {
    return meses.findIndex(m => m.mes_anio === activeMesStr);
  }, [meses, activeMesStr]);

  const mData = currIdx !== -1 ? meses[currIdx] : null;
  const prevMonth = currIdx !== -1 && currIdx + 1 < meses.length ? meses[currIdx + 1] : null;

  // Fecha del estado de cuenta
  const fechaEstadoCuenta = useMemo(() => {
    if (mData && mData.quincenas && mData.quincenas.length > 0) {
      return mData.quincenas[0].fecha_cierre || new Date().toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }, [mData]);

  // Si no hay datos
  const hasData = !!mData && mData.num_quincenas > 0;

  // Cálculos base dinámicos
  const numQ = mData?.num_quincenas || 1;
  const mCombi = currentResumen.monto_combi || 376;
  const mComida = currentResumen.monto_comida || 180;
  const mCopias = currentResumen.monto_copias || 50;
  const mImprevistos = currentResumen.monto_imprevistos || 200;

  const ingresoTotal = mData?.ingreso_total || 0;
  const gastoRealTotal = mData?.gasto_real_total || 0;
  const remanenteTotal = mData?.remanente_total || 0;
  const ahorroMotoTotal = mData?.ahorro_moto_total || 0;
  const salidasTotal = mData?.excedente_salidas_total || 0;
  const pctGastadoMes = ingresoTotal > 0 ? ((gastoRealTotal / ingresoTotal) * 100).toFixed(1) : '0.0';

  // Efectivo consolidado (Combi + Comidas)
  const transacciones = mData?.transacciones || [];
  const efectivoRetirarTotal = (mCombi + mComida) * numQ;
  const efectivoGastoReal = transacciones
    .filter(t => (t.categoria || '').includes("Pasajes") || (t.categoria || '').includes("Comidas"))
    .reduce((sum, t) => sum + (t.monto || 0), 0);
  const efectivoRemanente = Math.max(0, efectivoRetirarTotal - efectivoGastoReal);

  // Digitales en Cajita (Copias + Imprevistos)
  const digitalesPresupuesto = (mCopias + mImprevistos) * numQ;
  const digitalesGastoReal = transacciones
    .filter(t => (t.categoria || '').includes("Copias") || (t.categoria || '').includes("Imprevistos"))
    .reduce((sum, t) => sum + (t.monto || 0), 0);
  const digitalesRemanente = Math.max(0, digitalesPresupuesto - digitalesGastoReal);

  // Saldo real que genera 13% en Cajita Turbo Nu
  const saldoEnCajitaTurboNu = Math.max(0, remanenteTotal - efectivoRetirarTotal);
  const rendCajitaNuMensual = saldoEnCajitaTurboNu * (0.13 / 12);

  // ───────────────────────────────────────────────────────────────────────────
  // SECCIÓN d: Items de Resumen de Movimientos
  // ───────────────────────────────────────────────────────────────────────────
  const itemsResumen = useMemo(() => {
    if (!hasData) return [];
    return [
      {
        concepto: "1010  PRESUPUESTO TOTAL ASIGNADO (INGRESOS)",
        presupuesto: ingresoTotal,
        gasto: 0,
        saldo: ingresoTotal,
        isHeader: true
      },
      {
        concepto: "2010  EFECTIVO RETIRADO (Pasajes Combi + Comidas Escuela — No genera rend.)",
        presupuesto: efectivoRetirarTotal,
        gasto: efectivoGastoReal,
        saldo: efectivoRemanente
      },
      {
        concepto: "2020  GASTOS DIGITALES EN CAJITA (Copias & Imprevistos — Cajita Nu 13%)",
        presupuesto: digitalesPresupuesto,
        gasto: digitalesGastoReal,
        saldo: digitalesRemanente
      },
      {
        concepto: "3010  FONDO ACELERADOR MOTO (80% Excedente Base — Cajita Nu 13%)",
        presupuesto: ahorroMotoTotal,
        gasto: 0,
        saldo: ahorroMotoTotal
      },
      {
        concepto: "4010  FONDO REFUERZO SALIDAS Y GUSTOS (20% Excedente Base — Débito Nu)",
        presupuesto: salidasTotal,
        gasto: transacciones.filter(t => (t.categoria || '').includes("Excedente 20%")).reduce((s, t) => s + (t.monto || 0), 0),
        saldo: salidasTotal
      }
    ];
  }, [hasData, ingresoTotal, efectivoRetirarTotal, efectivoGastoReal, efectivoRemanente, digitalesPresupuesto, digitalesGastoReal, digitalesRemanente, ahorroMotoTotal, salidasTotal, transacciones]);

  // ───────────────────────────────────────────────────────────────────────────
  // SECCIÓN f: Comparativa vs Mes Anterior
  // ───────────────────────────────────────────────────────────────────────────
  const compRows = useMemo(() => {
    if (!hasData) return [];
    if (prevMonth) {
      const deltaGasto = gastoRealTotal - prevMonth.gasto_real_total;
      const pctGasto = prevMonth.gasto_real_total > 0 ? ((deltaGasto / prevMonth.gasto_real_total) * 100).toFixed(1) : '0.0';
      const deltaRem = remanenteTotal - prevMonth.remanente_total;
      const pctRem = prevMonth.remanente_total > 0 ? ((deltaRem / prevMonth.remanente_total) * 100).toFixed(1) : '0.0';
      const tasaCurr = ingresoTotal > 0 ? ((remanenteTotal / ingresoTotal) * 100).toFixed(1) : '0.0';
      const tasaPrev = prevMonth.ingreso_total > 0 ? ((prevMonth.remanente_total / prevMonth.ingreso_total) * 100).toFixed(1) : '0.0';
      const deltaTasa = (parseFloat(tasaCurr) - parseFloat(tasaPrev)).toFixed(1);

      const efectivoRetirarPrev = (mCombi + mComida) * prevMonth.num_quincenas;
      const saldoNuPrev = Math.max(0, prevMonth.remanente_total - efectivoRetirarPrev);
      const rendNuPrev = saldoNuPrev * (0.13 / 12);

      return [
        {
          indicador: "💳 Gasto Real Total Ejecutado",
          prev: fmt(prevMonth.gasto_real_total),
          curr: fmt(gastoRealTotal),
          delta: (deltaGasto >= 0 ? "+" : "") + fmt(deltaGasto),
          pct: (pctGasto >= 0 ? "+" : "") + `${pctGasto}%`,
          diag: deltaGasto <= 0 ? "🟢 Disminuyó el gasto (Mayor ahorro generado)" : "🔴 Aumentó el gasto vs mes anterior",
          isGood: deltaGasto <= 0
        },
        {
          indicador: "💰 Saldo Remanente / Ahorrado Total",
          prev: fmt(prevMonth.remanente_total),
          curr: fmt(remanenteTotal),
          delta: (deltaRem >= 0 ? "+" : "") + fmt(deltaRem),
          pct: (pctRem >= 0 ? "+" : "") + `${pctRem}%`,
          diag: deltaRem >= 0 ? "🟢 Crecimiento positivo de capital" : "🟡 Menor remanente que el mes previo",
          isGood: deltaRem >= 0
        },
        {
          indicador: "📈 Tasa de Eficiencia de Ahorro",
          prev: `${tasaPrev}%`,
          curr: `${tasaCurr}%`,
          delta: (parseFloat(deltaTasa) >= 0 ? "+" : "") + `${deltaTasa}%`,
          pct: `${tasaCurr}%`,
          diag: parseFloat(tasaCurr) >= 50 ? "🏆 Nivel de ahorro óptimo (>50% de ingresos protegidos)" : "🟢 Nivel de ahorro saludable",
          isGood: true
        },
        {
          indicador: "🟣 Rendimiento Cajita Turbo Nu (13% Anual)",
          prev: fmt(rendNuPrev),
          curr: fmt(rendCajitaNuMensual),
          delta: (rendCajitaNuMensual >= rendNuPrev ? "+" : "") + fmt(rendCajitaNuMensual - rendNuPrev),
          pct: "13.0% Anual",
          diag: `Generando +${fmt(rendCajitaNuMensual)} MXN/mes sobre saldo digital (${fmt(saldoEnCajitaTurboNu)}) restando efectivo`,
          isGood: true
        }
      ];
    } else {
      return [
        {
          indicador: "💳 Gasto Real vs Presupuesto Asignado",
          prev: fmt(ingresoTotal),
          curr: fmt(gastoRealTotal),
          delta: `-${fmt(remanenteTotal)}`,
          pct: `${pctGastadoMes}% Consumido`,
          diag: remanenteTotal > 0 ? "🟢 Ahorro del 100% de la bolsa no consumida" : "🟡 Gasto al 100% del presupuesto",
          isGood: true
        },
        {
          indicador: "💰 Saldo Remanente Total",
          prev: "$0.00 (Línea Base)",
          curr: fmt(remanenteTotal),
          delta: `+${fmt(remanenteTotal)}`,
          pct: "100%",
          diag: "🏆 Primer período consolidado exitosamente en el histórico",
          isGood: true
        },
        {
          indicador: "🟣 Rendimiento Cajita Turbo Nu (13% Anual)",
          prev: "$0.00",
          curr: fmt(rendCajitaNuMensual),
          delta: `+${fmt(rendCajitaNuMensual)}/mes`,
          pct: "13.0% Anual",
          diag: `Generando +${fmt(rendCajitaNuMensual)} MXN/mes sobre saldo digital (${fmt(saldoEnCajitaTurboNu)}) restando efectivo`,
          isGood: true
        }
      ];
    }
  }, [hasData, prevMonth, gastoRealTotal, remanenteTotal, ingresoTotal, pctGastadoMes, rendCajitaNuMensual, saldoEnCajitaTurboNu, mCombi, mComida]);

  // ───────────────────────────────────────────────────────────────────────────
  // SECCIÓN g: Desglose Consolidado por Categoría
  // ───────────────────────────────────────────────────────────────────────────
  const categoriasConsolidadas = useMemo(() => {
    if (!hasData) return [];
    const catNombres = [
      "🚌 Pasajes Combi (Efectivo)",
      "🥪 Comidas en Escuela (Efectivo)",
      "📄 Copias, Material & Papelería",
      "🛡️ Imprevistos / Por si acaso",
      "🛡️ Excedente 80%: Fondo Emergencia / Moto",
      "🍕 Excedente 20%: Refuerzo Gustos / Salidas"
    ];
    const catPresupuestosBase = {
      "🚌 Pasajes Combi (Efectivo)": mCombi * numQ,
      "🥪 Comidas en Escuela (Efectivo)": mComida * numQ,
      "📄 Copias, Material & Papelería": mCopias * numQ,
      "🛡️ Imprevistos / Por si acaso": mImprevistos * numQ,
      "🛡️ Excedente 80%: Fondo Emergencia / Moto": ahorroMotoTotal,
      "🍕 Excedente 20%: Refuerzo Gustos / Salidas": salidasTotal
    };

    return catNombres.map(catName => {
      const gastoCat = transacciones.filter(t => {
        const c = t.categoria || '';
        if (catName.includes("Pasajes") && c.includes("Pasajes")) return true;
        if (catName.includes("Comidas") && c.includes("Comidas")) return true;
        if (catName.includes("Copias") && c.includes("Copias")) return true;
        if (catName.includes("Imprevistos") && c.includes("Imprevistos")) return true;
        if (catName.includes("Excedente 80%") && c.includes("Excedente 80%")) return true;
        if (catName.includes("Excedente 20%") && c.includes("Excedente 20%")) return true;
        return false;
      }).reduce((sum, t) => sum + (t.monto || 0), 0);

      const presCat = catPresupuestosBase[catName] || 0;
      const remCat = Math.max(0, presCat - gastoCat);
      const pctCat = presCat > 0 ? ((gastoCat / presCat) * 100).toFixed(1) : '0.0';

      return {
        catName,
        presCat,
        gastoCat,
        remCat,
        pctCat,
        isExcedido: parseFloat(pctCat) > 100
      };
    });
  }, [hasData, mCombi, mComida, mCopias, mImprevistos, numQ, ahorroMotoTotal, salidasTotal, transacciones]);

  // ───────────────────────────────────────────────────────────────────────────
  // SECCIÓN h: Recomendación Inteligente de Retiro & Compensación
  // ───────────────────────────────────────────────────────────────────────────
  const compensacionData = useMemo(() => {
    if (!hasData) return { rows: [], advice: null };

    const baseQCombi = mCombi;
    const baseQComida = mComida;
    const baseQCopias = mCopias;
    const baseQImprevistos = mImprevistos;
    const baseQMoto = round2(ahorroMotoTotal / numQ);
    const baseQSalidas = round2(salidasTotal / numQ);

    const items = [
      {
        nombre: "🚌 Pasajes Combi (Efectivo)",
        tipo: "Efectivo Físico",
        isEfectivo: true,
        presBaseQ: baseQCombi,
        presTotal: baseQCombi * numQ,
        gasto: transacciones.filter(t => (t.categoria || '').includes("Pasajes")).reduce((s, t) => s + (t.monto || 0), 0)
      },
      {
        nombre: "🥪 Comidas en Escuela (Efectivo)",
        tipo: "Efectivo Físico",
        isEfectivo: true,
        presBaseQ: baseQComida,
        presTotal: baseQComida * numQ,
        gasto: transacciones.filter(t => (t.categoria || '').includes("Comidas")).reduce((s, t) => s + (t.monto || 0), 0)
      },
      {
        nombre: "📄 Copias, Material & Papelería",
        tipo: "Digital (Cajita Nu)",
        isEfectivo: false,
        presBaseQ: baseQCopias,
        presTotal: baseQCopias * numQ,
        gasto: transacciones.filter(t => (t.categoria || '').includes("Copias")).reduce((s, t) => s + (t.monto || 0), 0)
      },
      {
        nombre: "🛡️ Imprevistos / Por si acaso",
        tipo: "Digital (Cajita Nu)",
        isEfectivo: false,
        presBaseQ: baseQImprevistos,
        presTotal: baseQImprevistos * numQ,
        gasto: transacciones.filter(t => (t.categoria || '').includes("Imprevistos")).reduce((s, t) => s + (t.monto || 0), 0)
      },
      {
        nombre: "🛡️ Excedente 80%: Fondo Moto",
        tipo: "Inversión (Cajita Nu)",
        isEfectivo: false,
        presBaseQ: baseQMoto,
        presTotal: baseQMoto * numQ,
        gasto: 0
      },
      {
        nombre: "🍕 Excedente 20%: Refuerzo Salidas",
        tipo: "Digital / Débito Nu",
        isEfectivo: false,
        presBaseQ: baseQSalidas,
        presTotal: baseQSalidas * numQ,
        gasto: transacciones.filter(t => (t.categoria || '').includes("Excedente 20%")).reduce((s, t) => s + (t.monto || 0), 0)
      }
    ];

    let totSobranteEfectivoQ = 0;
    let totRetiroNetoEfectivoQ = 0;
    let totPresBaseEfectivoQ = 0;

    const rows = items.map(item => {
      const sobranteTotal = Math.max(0, item.presTotal - item.gasto);
      const sobranteQ = Math.min(item.presBaseQ, round2(sobranteTotal / numQ));
      const montoNetoQ = (item.isEfectivo || item.nombre.includes("Copias") || item.nombre.includes("Imprevistos"))
        ? Math.max(0, item.presBaseQ - sobranteQ)
        : item.presBaseQ;
      const ahorroQ = item.presBaseQ - montoNetoQ;

      if (item.isEfectivo) {
        totPresBaseEfectivoQ += item.presBaseQ;
        totSobranteEfectivoQ += sobranteQ;
        totRetiroNetoEfectivoQ += montoNetoQ;
      }

      return {
        ...item,
        sobranteQ,
        montoNetoQ,
        ahorroQ
      };
    });

    const sobCombi = Math.min(baseQCombi, round2(Math.max(0, items[0].presTotal - items[0].gasto) / numQ));
    const sobComida = Math.min(baseQComida, round2(Math.max(0, items[1].presTotal - items[1].gasto) / numQ));
    const sobCopias = Math.min(baseQCopias, round2(Math.max(0, items[2].presTotal - items[2].gasto) / numQ));
    const sobImp = Math.min(baseQImprevistos, round2(Math.max(0, items[3].presTotal - items[3].gasto) / numQ));

    const sacarCombi = Math.max(0, baseQCombi - sobCombi);
    const sacarComida = Math.max(0, baseQComida - sobComida);
    const fondearCopias = Math.max(0, baseQCopias - sobCopias);
    const fondearImp = Math.max(0, baseQImprevistos - sobImp);

    return {
      rows,
      advice: {
        totPresBaseEfectivoQ,
        totSobranteEfectivoQ,
        totRetiroNetoEfectivoQ,
        baseQCombi,
        baseQComida,
        sobCombi,
        sobComida,
        sobCopias,
        sobImp,
        sacarCombi,
        sacarComida,
        fondearCopias,
        fondearImp
      }
    };
  }, [hasData, mCombi, mComida, mCopias, mImprevistos, numQ, ahorroMotoTotal, salidasTotal, transacciones]);

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* BARRA SUPERIOR DE CONTROLES (NO IMPRIMIBLE) */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-teal-800/40 no-print">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">Estado de Cuenta Formal</h2>
            <p className="text-xs text-slate-400">
              Consolidado automático con rendimientos, comparativas y bitácora en estilo institucional
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
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:border-teal-500"
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
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-teal-900/40 transition flex items-center space-x-1.5 border border-teal-400/40"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar PDF</span>
          </button>

          <button
            onClick={onOpenCerrarQuincena}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Archivar Quincena</span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* KPI CARDS RESUMEN RÁPIDO (SOLO PANTALLA) */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="glass-panel p-5 rounded-2xl border-teal-500/30">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingreso Total Mensual</p>
          <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">{fmt(ingresoTotal)}</h3>
          <p className="text-xs text-teal-400 mt-2 font-semibold">
            {mData ? `${mData.num_quincenas} quincena${mData.num_quincenas > 1 ? 's' : ''} consolidada${mData.num_quincenas > 1 ? 's' : ''}` : '0 quincenas'}
          </p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-rose-500/30">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Gastado en el Mes</p>
          <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">{fmt(gastoRealTotal)}</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">{pctGastadoMes}% del ingreso mensual</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-emerald-500/30">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Ahorrado / Remanente</p>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{fmt(remanenteTotal)}</h3>
          <p className="text-xs text-emerald-400 mt-2 font-semibold">Dinero protegido en Cajita</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-purple-500/30">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aporte Acumulado Moto (80%)</p>
          <h3 className="text-2xl sm:text-3xl font-black text-purple-400 mt-1">{fmt(ahorroMotoTotal)}</h3>
          <p className="text-xs text-purple-300 mt-2 font-semibold">Salidas (20%): {fmt(salidasTotal)}</p>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* DOCUMENTO INSTITUCIONAL FORMAL: ESTADO DE CUENTA (PANTALLA & IMPRESIÓN) */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div
        id="print-estado-cuenta"
        className="ec-doc bg-white text-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-300 shadow-2xl space-y-6"
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
                SISTEMA DE GESTIÓN PATRIMONIAL &amp; PRESUPUESTO
              </p>
            </div>
          </div>

          <div className="ec-header-box px-6 py-2 rounded-lg text-center shadow-sm min-w-[240px]">
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              ESTADO DE CUENTA
            </h1>
            <p className="text-xs font-black text-indigo-950 mt-0.5 uppercase tracking-wide">
              {mData?.mes_anio?.toUpperCase() || 'GENERAL'}
            </p>
            <p className="text-[10px] text-slate-600 font-bold">
              al Día {fechaEstadoCuenta}
            </p>
          </div>

          <div className="text-right text-xs space-y-0.5 min-w-[120px]">
            <p className="text-slate-600 font-bold">Página <b className="text-slate-900">1 / 1</b></p>
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
              <p className="font-bold text-slate-800">Plan Maestro 50/30/10/5/5 • Cajita Turbo Nu 13%</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase">Moneda / Divisa:</span>
              <p className="font-bold text-slate-800">MXN (Pesos Mexicanos)</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase">Estado de Cuenta:</span>
              <p className="font-black text-emerald-700">CONSOLIDADO AL 100%</p>
            </div>
          </div>
        </div>

        {/* BANNER DE BALANCE DESTACADO */}
        <div className="ec-card-block p-3.5 rounded-xl bg-slate-100 border border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              SALDO REMANENTE AHORRADO EN EL PERÍODO:
              <span className="text-emerald-700 text-sm font-black ml-1.5">{fmt(remanenteTotal)} MXN</span>
            </h4>
            <p className="text-[10px] text-slate-600 mt-0.5">
              El saldo remanente incluye el excedente base más el ahorro extra no consumido, protegido en Cajita Nu (13% anual).
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase border border-emerald-300 shrink-0">
            🛡️ CAPITAL RESGUARDADO
          </span>
        </div>

        {!hasData ? (
          <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300 rounded-2xl">
            <p className="font-semibold text-sm">No hay quincenas archivadas en el histórico aún.</p>
            <p className="text-xs mt-1">Haz clic en <b>"Archivar Quincena"</b> para cerrar tu primer período y generar el estado de cuenta formal.</p>
          </div>
        ) : (
          <>
            {/* SECCIÓN d: RESUMEN DE INGRESOS Y GASTOS DEL PERÍODO */}
            <div className="ec-card-block space-y-2">
              <div className="ec-section-bar p-2 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center">
                  <span className="ec-badge-letter">d</span>
                  <span className="text-xs font-black tracking-wide">RESUMEN DE INGRESOS Y GASTOS DEL PERÍODO</span>
                </div>
                <span className="text-[10px] text-slate-300 font-semibold lowercase">cifras en mxn</span>
              </div>
              <div className="overflow-x-auto border border-slate-300 rounded-b-lg">
                <table className="ec-table">
                  <thead>
                    <tr>
                      <th className="text-left w-2/5">Concepto / Rubro Financiero</th>
                      <th className="text-right w-1/5">Presupuesto Asignado ($)</th>
                      <th className="text-right w-1/5">Gasto Real Ejecutado ($)</th>
                      <th className="text-right w-1/5">Remanente / Saldo ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsResumen.map((item, idx) => (
                      <tr key={idx} className={item.isHeader ? 'bg-slate-100 font-bold' : ''}>
                        <td className={`font-bold ${item.isHeader ? 'text-slate-900' : 'text-slate-700'}`}>
                          {item.concepto}
                        </td>
                        <td className="text-right ec-blue">{fmt(item.presupuesto)}</td>
                        <td className={`text-right ${item.gasto > 0 ? 'ec-red' : 'text-slate-400'}`}>
                          {item.gasto > 0 ? '-' + fmt(item.gasto) : '$0.00'}
                        </td>
                        <td className="text-right ec-green">{fmt(item.saldo)}</td>
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
                <span className="font-black tracking-widest uppercase">T O T A L E S</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-black">
                <div>Presupuesto: <span className="ec-blue text-sm">{fmt(ingresoTotal)}</span></div>
                <div>Gasto Real: <span className="ec-red text-sm">-{fmt(gastoRealTotal)}</span></div>
                <div>Saldo Remanente: <span className="ec-green text-sm">{fmt(remanenteTotal)}</span></div>
              </div>
            </div>

            {/* SECCIÓN f: COMPARATIVA CON MES ANTERIOR & RENDIMIENTO FINANCIERO */}
            <div className="ec-card-block space-y-2">
              <div className="ec-section-bar p-2 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center">
                  <span className="ec-badge-letter">f</span>
                  <span className="text-xs font-black tracking-wide">
                    COMPARATIVA VS MES ANTERIOR &amp; RENDIMIENTO FINANCIERO
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 font-semibold lowercase">análisis de variación y rendimiento</span>
              </div>
              <div className="overflow-x-auto border border-slate-300 rounded-b-lg">
                <table className="ec-table">
                  <thead>
                    <tr>
                      <th className="text-left">Indicador Financiero</th>
                      <th className="text-right">Mes Anterior</th>
                      <th className="text-right">Mes Actual</th>
                      <th className="text-right">Variación ($)</th>
                      <th className="text-center">Variación (%)</th>
                      <th className="text-left">Diagnóstico / Rendimiento Estimado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="font-bold text-slate-900">{row.indicador}</td>
                        <td className="text-right text-slate-600 font-semibold">{row.prev}</td>
                        <td className="text-right font-bold text-slate-900">{row.curr}</td>
                        <td className={`text-right font-black ${row.isGood ? 'ec-green' : 'ec-red'}`}>{row.delta}</td>
                        <td className={`text-center font-bold ${row.isGood ? 'ec-green' : 'ec-red'}`}>{row.pct}</td>
                        <td className="text-left text-xs font-semibold text-slate-700">{row.diag}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN g: DESGLOSE CONSOLIDADO POR CATEGORÍA */}
            <div className="ec-card-block space-y-2">
              <div className="ec-section-bar p-2 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center">
                  <span className="ec-badge-letter">g</span>
                  <span className="text-xs font-black tracking-wide">DESGLOSE CONSOLIDADO POR CATEGORÍA / RUBRO</span>
                </div>
                <span className="text-[10px] text-slate-300 font-semibold lowercase">detalle presupuestario</span>
              </div>
              <div className="overflow-x-auto border border-slate-300 rounded-b-lg">
                <table className="ec-table">
                  <thead>
                    <tr>
                      <th className="text-left">Categoría / Rubro</th>
                      <th className="text-right">Presupuesto Mensual ($)</th>
                      <th className="text-right">Gasto Real ($)</th>
                      <th className="text-right">Remanente / Ahorro ($)</th>
                      <th className="text-center">% Consumido</th>
                      <th className="text-center">Semáforo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriasConsolidadas.map((cat, idx) => (
                      <tr key={idx}>
                        <td className="font-bold text-slate-900">{cat.catName}</td>
                        <td className="text-right ec-blue">{fmt(cat.presCat)}</td>
                        <td className={`text-right ${cat.gastoCat > 0 ? 'ec-red' : 'text-slate-400'}`}>
                          {cat.gastoCat > 0 ? '-' + fmt(cat.gastoCat) : '$0.00'}
                        </td>
                        <td className="text-right ec-green">{fmt(cat.remCat)}</td>
                        <td className={`text-center font-bold ${cat.isExcedido ? 'ec-red' : 'text-slate-800'}`}>
                          {cat.pctCat}%
                        </td>
                        <td className="text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            cat.isExcedido
                              ? 'bg-red-100 text-red-900 border border-red-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {cat.isExcedido ? '🔴 Excedido' : '🟢 En Control'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN h: RECOMENDACIÓN INTELIGENTE DE RETIRO DE EFECTIVO & FONDOS */}
            <div className="ec-card-block space-y-2">
              <div className="ec-section-bar p-2 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center">
                  <span className="ec-badge-letter">h</span>
                  <span className="text-xs font-black tracking-wide">
                    RECOMENDACIÓN INTELIGENTE DE RETIRO DE EFECTIVO &amp; FONDOS (COMPENSACIÓN DE SOBRANTES)
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 font-semibold lowercase">ajuste para el próximo pago</span>
              </div>
              <div className="overflow-x-auto border border-slate-300 rounded-b-lg">
                <table className="ec-table">
                  <thead>
                    <tr>
                      <th className="text-left">Categoría / Rubro</th>
                      <th className="text-center">Tipo / Manejo</th>
                      <th className="text-right">Presupuesto Base ($)</th>
                      <th className="text-right">Gasto Real ($)</th>
                      <th className="text-right">Sobrante a Favor ($)</th>
                      <th className="text-right">Monto Neto Próximo Pago ($)</th>
                      <th className="text-right">Ahorro en Retiro ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compensacionData.rows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="font-bold text-slate-900">{row.nombre}</td>
                        <td className={`text-center font-semibold text-[10px] ${row.isEfectivo ? 'text-emerald-800' : 'text-indigo-800'}`}>
                          {row.tipo}
                        </td>
                        <td className="text-right ec-blue">{fmt(row.presBaseQ)}</td>
                        <td className={`text-right ${row.gasto > 0 ? 'ec-red' : 'text-slate-400'}`}>
                          {row.gasto > 0 ? '-' + fmt(row.gasto) : '$0.00'}
                        </td>
                        <td className="text-right font-black ec-green">{fmt(row.sobranteQ)}</td>
                        <td className={`text-right font-black ${row.isEfectivo ? 'text-emerald-700' : 'text-indigo-900'}`}>
                          {fmt(row.montoNetoQ)}
                        </td>
                        <td className={`text-right font-bold ${row.ahorroQ > 0 ? 'ec-green' : 'text-slate-400'}`}>
                          {row.ahorroQ > 0 ? '+' + fmt(row.ahorroQ) : '$0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Caja Destacada de Desglose Específico de Retiro en Efectivo */}
              {compensacionData.advice && (
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 text-xs space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-300 pb-2.5">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-extrabold uppercase">Presupuesto Efectivo Base:</p>
                      <p className="text-base font-black text-slate-900 mt-0.5">{fmt(compensacionData.advice.totPresBaseEfectivoQ)}</p>
                      <p className="text-[9px] text-slate-500">
                        ({fmt(compensacionData.advice.baseQCombi)} Pasajes + {fmt(compensacionData.advice.baseQComida)} Comidas)
                      </p>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-[10px] text-emerald-800 font-extrabold uppercase">Sobrante que Tienes en Mano:</p>
                      <p className="text-base font-black text-emerald-700 mt-0.5">-{fmt(compensacionData.advice.totSobranteEfectivoQ)}</p>
                      <p className="text-[9px] text-emerald-700">Ahorro de retiro físico</p>
                    </div>
                    <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-300 shadow-sm">
                      <p className="text-[10px] text-indigo-900 font-extrabold uppercase">🏦 EFECTIVO NETO A RETIRAR ESTA QUINCENA:</p>
                      <p className="text-base font-black text-indigo-700 mt-0.5">{fmt(compensacionData.advice.totRetiroNetoEfectivoQ)}</p>
                      <p className="text-[9px] text-indigo-700 font-bold">Monto exacto para el cajero</p>
                    </div>
                  </div>
                  <div className="space-y-1 pt-1 text-[11px] text-slate-700">
                    <p className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <span>💡</span>
                      <span>Instrucción Exacta de Retiro y Fondeo para el Próximo Día de Pago:</span>
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 pl-1 text-[10.5px]">
                      <li>
                        <b>🚌 Pasajes Combi:</b> Retirar <b className="text-emerald-800">{fmt(compensacionData.advice.sacarCombi)}</b> en cajero{' '}
                        {compensacionData.advice.sobCombi > 0
                          ? `(en lugar de ${fmt(compensacionData.advice.baseQCombi)}, porque ya cuentas con ${fmt(compensacionData.advice.sobCombi)} de remanente en mano)`
                          : `(monto base completo)`}.
                      </li>
                      <li>
                        <b>🥪 Comidas Escuela:</b> Retirar <b className="text-emerald-800">{fmt(compensacionData.advice.sacarComida)}</b> en cajero{' '}
                        {compensacionData.advice.sobComida > 0
                          ? `(en lugar de ${fmt(compensacionData.advice.baseQComida)}, porque ya cuentas con ${fmt(compensacionData.advice.sobComida)} de remanente en mano)`
                          : `(monto base completo)`}.
                      </li>
                      <li>
                        <b>📄 Copias &amp; Papelería:</b> Cuentas con <b>{fmt(compensacionData.advice.sobCopias)}</b> resguardados en Cajita Nu{' '}
                        {compensacionData.advice.fondearCopias > 0
                          ? `(solo requieres asignar ${fmt(compensacionData.advice.fondearCopias)} adicionales)`
                          : `(saldo íntegro cubierto)`}.
                      </li>
                      <li>
                        <b>🛡️ Imprevistos:</b> Cuentas con <b>{fmt(compensacionData.advice.sobImp)}</b> resguardados en Cajita Nu{' '}
                        {compensacionData.advice.fondearImp > 0
                          ? `(solo requieres asignar ${fmt(compensacionData.advice.fondearImp)} adicionales)`
                          : `(saldo íntegro cubierto)`}.
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN i: RESUMEN DE QUINCENAS ARCHIVADAS EN EL MES */}
            <div className="ec-card-block space-y-2">
              <div className="ec-section-bar p-2 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center">
                  <span className="ec-badge-letter">i</span>
                  <span className="text-xs font-black tracking-wide">RESUMEN DE QUINCENAS ARCHIVADAS EN EL MES</span>
                </div>
                <span className="text-[10px] text-slate-300 font-semibold lowercase">desglose por quincena</span>
              </div>
              <div className="overflow-x-auto border border-slate-300 rounded-b-lg">
                <table className="ec-table">
                  <thead>
                    <tr>
                      <th className="text-left">Período Quincenal</th>
                      <th className="text-center">Fecha Cierre</th>
                      <th className="text-right">Presupuesto ($)</th>
                      <th className="text-right">Gastos Fijos ($)</th>
                      <th className="text-right">Gasto Real ($)</th>
                      <th className="text-right">Remanente ($)</th>
                      <th className="text-right">Aporte Moto 80% ($)</th>
                      <th className="text-center">Movimientos</th>
                      <th className="text-center no-print">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mData.quincenas.map((q, idx) => (
                      <tr key={q.id || idx}>
                        <td className="font-bold text-slate-900">{q.periodo}</td>
                        <td className="text-center text-slate-600 font-medium">{q.fecha_cierre}</td>
                        <td className="text-right ec-blue">{fmt(q.presupuesto)}</td>
                        <td className="text-right text-slate-600">{fmt(q.gastos_fijos)}</td>
                        <td className="text-right ec-red">{q.gasto_real > 0 ? '-' + fmt(q.gasto_real) : '$0.00'}</td>
                        <td className="text-right ec-green">{fmt(q.remanente)}</td>
                        <td className="text-right font-black text-indigo-900">{fmt(q.ahorro_moto_80)}</td>
                        <td className="text-center font-semibold text-slate-700">{q.num_movimientos || q.num_transacciones || 0} reg.</td>
                        <td className="text-center whitespace-nowrap no-print">
                          <button
                            onClick={() => onDeleteCierre(q.id)}
                            className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-[10px] font-bold transition flex items-center space-x-1 mx-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Eliminar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN j: BITÁCORA DETALLADA DE MOVIMIENTOS */}
            <div className="ec-card-block space-y-2">
              <div className="ec-section-bar p-2 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center">
                  <span className="ec-badge-letter">j</span>
                  <span className="text-xs font-black tracking-wide">BITÁCORA DETALLADA DE MOVIMIENTOS Y GASTOS</span>
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
                          No se registraron gastos individuales en las quincenas archivadas.
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
                          <td className="text-slate-600 whitespace-nowrap">{tx.metodo_pago || tx.metodo || 'Efectivo'}</td>
                          <td className="text-right font-black ec-red">-{fmt(tx.monto)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN k: NOTA FORMAL Y PIE DE PÁGINA */}
            <div className="ec-card-block p-3 rounded-xl bg-slate-50 border border-slate-300 text-[10px] text-slate-600 space-y-1">
              <p className="font-extrabold uppercase text-slate-800">
                k NOTA DE AUDITORÍA Y CONTROL:
              </p>
              <p>
                ESTE DOCUMENTO ES UN ESTADO DE CUENTA CONSOLIDADO GENERADO AUTOMÁTICAMENTE A PARTIR DE TUS REGISTROS EN BASE DE DATOS SQLITE (<b className="text-slate-800">finanzas.db</b>).
              </p>
              <p className="text-[9px] text-slate-500">
                Cálculos sincronizados con fórmulas exactas de rendimiento anualizado en Cajita Turbo Nu (13% anual sobre saldo digital resguardado, excluyendo efectivo retirado). Válido para control personal y administración presupuestaria.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
