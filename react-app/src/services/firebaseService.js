/**
 * firebaseService.js — Capa de persistencia en la nube en tiempo real (Cloud Firestore).
 * Sincronización instantánea 24/7 sin duplicados, reactiva e idéntica en web y móvil.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { computeGastos, computeFuturo, getDiaSemana, getTdcCompraMetrics, isGastoExcedente20, round2 } from './financialEngine.js';
import {
  INITIAL_CONFIG_GASTOS,
  INITIAL_GASTOS_DIARIOS,
  INITIAL_CONFIG_FUTURO,
  INITIAL_GASTOS_OCIO,
  INITIAL_COMPRAS_TDC
} from './seedData.js';

// Estado en memoria
let memoryState = {
  configGastos: { ...INITIAL_CONFIG_GASTOS },
  configFuturo: { ...INITIAL_CONFIG_FUTURO },
  gastosDiarios: [...INITIAL_GASTOS_DIARIOS],
  gastosOcio: [...INITIAL_GASTOS_OCIO],
  comprasTdc: [...INITIAL_COMPRAS_TDC],
  historicoGastos: [],
  historicoFuturo: [],
  ingresosExtra: []
};

// Función inteligente para inferir el mes exacto del período o fecha de cierre
export function inferMes(data = {}) {
  const mesesList = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

  // 1. Si data.mes viene explícito
  if (data.mes && typeof data.mes === 'string' && data.mes.trim()) {
    const cleanMes = data.mes.trim().toLowerCase();
    for (const m of mesesList) {
      if (cleanMes.includes(m)) return m;
    }
    return cleanMes;
  }

  // 2. Extraer del texto del periodo si contiene algún nombre de mes (ej. "2da Quincena Septiembre 2026")
  if (data.periodo && typeof data.periodo === 'string') {
    const pLower = data.periodo.toLowerCase();
    for (const m of mesesList) {
      if (pLower.includes(m)) return m;
    }
  }

  // 3. Extraer de fecha_cierre (ej. "2026-09-30")
  if (data.fecha_cierre && typeof data.fecha_cierre === 'string') {
    const parts = data.fecha_cierre.split('-');
    if (parts.length >= 2) {
      const monthNum = parseInt(parts[1], 10);
      if (monthNum >= 1 && monthNum <= 12) {
        return mesesList[monthNum - 1];
      }
    }
  }

  // 4. Fallback al mes actual
  return new Date().toLocaleString('es-MX', { month: 'long' }).toLowerCase();
}

// Función para estructurar histórico consolidado por meses para el Estado de Cuenta
export function buildHistorialGastos(cierres = []) {
  const mesesMap = {};

  for (const c of cierres) {
    const mesNom = inferMes(c);
    const anioVal = c.anio || (c.fecha_cierre ? parseInt(c.fecha_cierre.split('-')[0], 10) : 2026);
    const mesDisplay = mesNom.charAt(0).toUpperCase() + mesNom.slice(1);
    const key = `${mesNom} ${anioVal}`;
    if (!mesesMap[key]) {
      mesesMap[key] = {
        mes_anio: `${mesDisplay} ${anioVal}`,
        mes: mesDisplay,
        anio: anioVal,
        num_quincenas: 0,
        ingreso_total: 0,
        gastos_fijos_total: 0,
        gasto_real_total: 0,
        remanente_total: 0,
        ahorro_moto_total: 0,
        excedente_salidas_total: 0,
        quincenas: [],
        transacciones: []
      };
    }
    const m = mesesMap[key];
    m.num_quincenas += 1;
    m.ingreso_total = round2(m.ingreso_total + Number(c.presupuesto || 0));
    m.gastos_fijos_total = round2(m.gastos_fijos_total + Number(c.gastos_fijos || 0));
    m.gasto_real_total = round2(m.gasto_real_total + Number(c.gasto_real || 0));
    m.remanente_total = round2(m.remanente_total + Number(c.remanente || 0));
    m.ahorro_moto_total = round2(m.ahorro_moto_total + Number(c.ahorro_moto_80 || 0));
    m.excedente_salidas_total = round2(m.excedente_salidas_total + Number(c.refuerzo_gustos_20 || 0));
    m.quincenas.push(c);

    try {
      const det = typeof c.detalle_json === 'string' ? JSON.parse(c.detalle_json) : (c.detalle_json || {});
      const transIds = new Set();
      if (Array.isArray(det.registros)) {
        for (const r of det.registros) {
          const rId = String(r.id || `${r.fecha}-${r.concepto}-${r.monto}`);
          if (!transIds.has(rId)) {
            transIds.add(rId);
            m.transacciones.push({ ...r, quincena: c.periodo });
          }
        }
      }
      if (Array.isArray(det.compras_tdc)) {
        for (const cTdc of det.compras_tdc) {
          const cId = String(cTdc.id || `${cTdc.fecha}-${cTdc.concepto}-${cTdc.monto}`);
          if (!transIds.has(cId)) {
            transIds.add(cId);
            m.transacciones.push({ ...cTdc, quincena: c.periodo });
          }
        }
      }
      if (Array.isArray(det.ingresos_extra)) {
        for (const ie of det.ingresos_extra) {
          const ieId = String(ie.id || `${ie.fecha}-${ie.concepto}-${ie.monto}`);
          if (!transIds.has(ieId)) {
            transIds.add(ieId);
            m.transacciones.push({
              id: ie.id,
              fecha: ie.fecha || c.fecha_cierre,
              quincena: c.periodo,
              concepto: `💰 ${ie.concepto || 'Dinero Extra / Bono'}`,
              categoria: ie.modalidad === '50_30_10_5_5' ? '⚖️ Regla 50/30/10/5/5' : `🎯 Fondo ${ie.fondo_destino || 'Específico'}`,
              metodo_pago: 'Abono / Ingreso',
              monto: Number(ie.monto) || 0,
              tipo_movimiento: 'ingreso'
            });
          }
        }
      }
    } catch (e) {}
  }

  return {
    status: "success",
    cierres,
    meses: Object.values(mesesMap)
  };
}

// Función para estructurar histórico de futuro consolidado por meses para el Estado de Cuenta
export function buildHistorialFuturo(cierres = []) {
  const mesesMap = {};

  for (const c of cierres) {
    const mesNom = inferMes(c);
    const anioVal = c.anio || (c.fecha_cierre ? parseInt(c.fecha_cierre.split('-')[0], 10) : 2026);
    const mesDisplay = mesNom.charAt(0).toUpperCase() + mesNom.slice(1);
    const key = `${mesNom} ${anioVal}`;
    if (!mesesMap[key]) {
      mesesMap[key] = {
        mes_anio: `${mesDisplay} ${anioVal}`,
        mes: mesDisplay,
        anio: anioVal,
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

  // Calcular totales consolidados por mes evitando dobles conteos acumulados
  for (const key of Object.keys(mesesMap)) {
    const m = mesesMap[key];
    m.quincenas.sort((a, b) => (b.fecha_cierre || '').localeCompare(a.fecha_cierre || ''));
    m.num_quincenas = m.quincenas.length;

    const qReciente = m.quincenas[0];
    m.gasto_ocio_total = round2(m.quincenas.reduce((sum, c) => sum + Number(c.gasto_ocio || 0), 0));
    m.remanente_ocio_total = qReciente ? Number(qReciente.remanente_ocio || 0) : 0;
    m.total_cajita_cierre = qReciente ? Number(qReciente.total_cajita_cierre || 0) : 0;
    m.presupuesto_ocio_total = round2(m.gasto_ocio_total + m.remanente_ocio_total);
    m.aporte_emergencia_total = qReciente ? Number(qReciente.aporte_emergencia || 0) : 0;
    m.aporte_retiro_total = round2(m.quincenas.reduce((sum, c) => sum + Number(c.aporte_retiro || 0), 0));
    m.aporte_cetes_total = round2(m.quincenas.reduce((sum, c) => sum + Number(c.aporte_cetes || 0), 0));
  }

  return {
    status: "success",
    cierres,
    historial: cierres,
    meses: Object.values(mesesMap)
  };
}

// Notificador a suscriptores (React components)
const listeners = new Set();
function notifyListeners() {
  const gastos = computeGastos(
    memoryState.configGastos,
    memoryState.gastosDiarios,
    memoryState.historicoGastos,
    memoryState.comprasTdc,
    memoryState.ingresosExtra,
    memoryState.gastosOcio
  );
  const futuro = computeFuturo(
    memoryState.configFuturo,
    memoryState.configGastos,
    memoryState.gastosOcio,
    memoryState.comprasTdc,
    memoryState.gastosDiarios,
    memoryState.historicoFuturo,
    memoryState.historicoGastos,
    memoryState.ingresosExtra
  );
  const hGastos = buildHistorialGastos(memoryState.historicoGastos);
  const hFuturo = buildHistorialFuturo(memoryState.historicoFuturo);
  for (const cb of listeners) {
    try {
      cb({
        gastos,
        futuro,
        historialGastos: hGastos,
        historialFuturo: hFuturo,
        ingresosExtra: memoryState.ingresosExtra
      });
    } catch (e) {
      console.error("Error en listener de Firestore:", e);
    }
  }
}

// Inicialización de sembrado único en Firestore (solo una vez)
let isSeeded = false;
async function checkAndSeedInitialData() {
  if (isSeeded) return;
  try {
    const metaRef = doc(db, "_metadata", "seed_v2");
    const metaSnap = await getDoc(metaRef);
    if (!metaSnap.exists()) {
      const batch = writeBatch(db);
      batch.set(doc(db, "config_gastos", "main"), INITIAL_CONFIG_GASTOS);
      batch.set(doc(db, "config_futuro", "main"), INITIAL_CONFIG_FUTURO);
      for (const item of INITIAL_GASTOS_DIARIOS) {
        batch.set(doc(db, "gastos_diarios", String(item.id)), item);
      }
      for (const item of INITIAL_GASTOS_OCIO) {
        batch.set(doc(db, "gastos_ocio", String(item.id)), item);
      }
      for (const item of INITIAL_COMPRAS_TDC) {
        batch.set(doc(db, "compras_tdc", String(item.id)), item);
      }
      batch.set(metaRef, { seeded: true, timestamp: new Date().toISOString() });
      await batch.commit();
      isSeeded = true;
    } else {
      isSeeded = true;
    }
  } catch (e) {
    console.warn("Sembrado inicial de Firestore en espera:", e.message);
  }
}

// Inicialización de escuchadores en tiempo real (onSnapshot)
let isInitialized = false;
export async function initFirestoreListeners() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    await checkAndSeedInitialData();
  } catch (err) {
    console.warn("Aviso en checkAndSeedInitialData:", err);
  }

  try {
    // 1. Config Gastos
    onSnapshot(doc(db, "config_gastos", "main"), (docSnap) => {
      if (docSnap.exists()) {
        memoryState.configGastos = docSnap.data();
        notifyListeners();
      }
    }, (err) => console.warn("config_gastos snapshot:", err.message));

    // 2. Config Futuro
    onSnapshot(doc(db, "config_futuro", "main"), (docSnap) => {
      if (docSnap.exists()) {
        memoryState.configFuturo = docSnap.data();
        notifyListeners();
      }
    }, (err) => console.warn("config_futuro snapshot:", err.message));

    // 3. Gastos Diarios (Deduplicación estricta por Document ID)
    const qGastos = query(collection(db, "gastos_diarios"));
    onSnapshot(qGastos, (snapshot) => {
      const map = new Map();
      snapshot.forEach((d) => {
        map.set(d.id, { ...d.data(), id: d.id, fila: d.id });
      });
      const list = Array.from(map.values());
      list.sort((a, b) => {
        const d1 = b.fecha || '';
        const d2 = a.fecha || '';
        if (d1 !== d2) return d1.localeCompare(d2);
        return (b.created_at || '').localeCompare(a.created_at || '');
      });
      memoryState.gastosDiarios = list;
      notifyListeners();
    }, (err) => console.warn("gastos_diarios snapshot:", err.message));

    // 4. Gastos Ocio (Deduplicación estricta)
    const qOcio = query(collection(db, "gastos_ocio"));
    onSnapshot(qOcio, (snapshot) => {
      const map = new Map();
      snapshot.forEach((d) => {
        map.set(d.id, { ...d.data(), id: d.id, fila: d.id });
      });
      const list = Array.from(map.values());
      list.sort((a, b) => {
        const d1 = b.fecha || '';
        const d2 = a.fecha || '';
        if (d1 !== d2) return d1.localeCompare(d2);
        return (b.created_at || '').localeCompare(a.created_at || '');
      });
      memoryState.gastosOcio = list;
      notifyListeners();
    }, (err) => console.warn("gastos_ocio snapshot:", err.message));

    // 5. Compras TDC Nu (Deduplicación estricta)
    const qTdc = query(collection(db, "compras_tdc"));
    onSnapshot(qTdc, (snapshot) => {
      const map = new Map();
      snapshot.forEach((d) => {
        map.set(d.id, { ...d.data(), id: d.id, fila: d.id });
      });
      const list = Array.from(map.values());
      list.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
      memoryState.comprasTdc = list;
      notifyListeners();
    }, (err) => console.warn("compras_tdc snapshot:", err.message));

    // 6. Histórico Quincenas Gastos
    const qHistG = query(collection(db, "historico_quincenas_gastos"));
    onSnapshot(qHistG, (snapshot) => {
      const map = new Map();
      snapshot.forEach((d) => map.set(d.id, { ...d.data(), id: d.id }));
      const list = Array.from(map.values());
      list.sort((a, b) => (b.fecha_cierre || '').localeCompare(a.fecha_cierre || ''));
      memoryState.historicoGastos = list;
      notifyListeners();
    }, (err) => console.warn("historico_quincenas_gastos snapshot:", err.message));

    // 7. Histórico Quincenas Futuro
    const qHistF = query(collection(db, "historico_quincenas_futuro"));
    onSnapshot(qHistF, (snapshot) => {
      const map = new Map();
      snapshot.forEach((d) => map.set(d.id, { ...d.data(), id: d.id }));
      const list = Array.from(map.values());
      list.sort((a, b) => (b.fecha_cierre || '').localeCompare(a.fecha_cierre || ''));
      memoryState.historicoFuturo = list;
      notifyListeners();
    }, (err) => console.warn("historico_quincenas_futuro snapshot:", err.message));

    // 8. Ingresos Extra / Bonos (Deduplicación estricta)
    const qIngresos = query(collection(db, "ingresos_extra"));
    onSnapshot(qIngresos, (snapshot) => {
      const map = new Map();
      snapshot.forEach((d) => {
        map.set(d.id, { ...d.data(), id: d.id, fila: d.id });
      });
      const list = Array.from(map.values());
      list.sort((a, b) => {
        const d1 = b.fecha || '';
        const d2 = a.fecha || '';
        if (d1 !== d2) return d1.localeCompare(d2);
        return (b.created_at || '').localeCompare(a.created_at || '');
      });
      memoryState.ingresosExtra = list;
      notifyListeners();
    }, (err) => console.warn("ingresos_extra snapshot:", err.message));

  } catch (error) {
    console.warn("Error al inicializar Firestore:", error);
  }
}

// Iniciar escuchadores
initFirestoreListeners();

/**
 * Suscribirse a cambios en tiempo real
 */
export function subscribeFinancialData(callback) {
  listeners.add(callback);
  callback({
    gastos: computeGastos(
      memoryState.configGastos,
      memoryState.gastosDiarios,
      memoryState.historicoGastos,
      memoryState.comprasTdc,
      memoryState.ingresosExtra,
      memoryState.gastosOcio
    ),
    futuro: computeFuturo(
      memoryState.configFuturo,
      memoryState.configGastos,
      memoryState.gastosOcio,
      memoryState.comprasTdc,
      memoryState.gastosDiarios,
      memoryState.historicoFuturo,
      memoryState.historicoGastos,
      memoryState.ingresosExtra
    ),
    historialGastos: buildHistorialGastos(memoryState.historicoGastos),
    historialFuturo: buildHistorialFuturo(memoryState.historicoFuturo),
    ingresosExtra: memoryState.ingresosExtra
  });
  return () => listeners.delete(callback);
}

// ─────────────────────────────────────────────────────────────────────────────
// OPERACIONES DE GASTOS BÁSICOS (Sin duplicaciones)
// ─────────────────────────────────────────────────────────────────────────────

export async function getGastos() {
  return computeGastos(
    memoryState.configGastos,
    memoryState.gastosDiarios,
    memoryState.historicoGastos,
    memoryState.comprasTdc,
    memoryState.ingresosExtra,
    memoryState.gastosOcio
  );
}

export async function addGasto(data) {
  const fecha = data.fecha || new Date().toISOString().split('T')[0];
  const monto = round2(data.monto);
  const categoria = data.categoria || "Otros";
  const concepto = data.concepto || "";
  const metodo_pago = data.metodo || data.metodo_pago || "Efectivo";
  const retirado = data.retirado || "Sí (Efectivo)";
  const dia = getDiaSemana(fecha);

  const docData = {
    fecha,
    dia,
    monto,
    categoria,
    concepto,
    metodo_pago,
    retirado,
    created_at: new Date().toISOString()
  };

  // Guardar en Cloud Firestore (onSnapshot actualiza memoryState automáticamente)
  const docRef = await addDoc(collection(db, "gastos_diarios"), docData);

  // Si fue con TDC Nu, registrar automáticamente en compras_tdc preservando la categoría
  if (metodo_pago === 'TDC Nu') {
    await addTDC({
      fecha,
      monto,
      concepto,
      categoria: categoria || 'Básicos',
      tipo: 'Gasto Diario',
      apartado: 'Sí (En Cajita)',
      estado: 'Pendiente',
      origen_tipo: 'gasto_diario',
      origen_id: docRef.id
    });
  }

  // Sincronizar saldo vivo en Bóvedas si se pagó con Débito DiDi o Débito Nu
  if (metodo_pago === 'Débito DiDi') {
    const curDiDi = Number(memoryState.configFuturo?.saldo_real_didi ?? 3218.51);
    const newDiDi = Math.max(0, round2(curDiDi - monto));
    const upFuturo = { ...memoryState.configFuturo, saldo_real_didi: newDiDi, updated_at: new Date().toISOString() };
    memoryState.configFuturo = upFuturo;
    setDoc(doc(db, "config_futuro", "main"), upFuturo).catch(err => console.warn("Error sync didi:", err));
  } else if (metodo_pago === 'Débito Nu') {
    const curNu = Number(memoryState.configFuturo?.saldo_real_ajustado ?? 25054.21);
    const newNu = Math.max(0, round2(curNu - monto));
    const upFuturo = { ...memoryState.configFuturo, saldo_real_ajustado: newNu, updated_at: new Date().toISOString() };
    memoryState.configFuturo = upFuturo;
    setDoc(doc(db, "config_futuro", "main"), upFuturo).catch(err => console.warn("Error sync nu:", err));
  }

  return { status: "success", id: docRef.id, message: "Gasto registrado correctamente" };
}

export async function deleteGasto(id) {
  const idStr = String(id);
  const gastoToDelete = memoryState.gastosDiarios.find(r => String(r.id) === idStr);
  if (gastoToDelete) {
    const m = round2(Number(gastoToDelete.monto) || 0);
    const metodo = gastoToDelete.metodo_pago || 'Efectivo';
    if (metodo === 'Débito DiDi') {
      const curDiDi = Number(memoryState.configFuturo?.saldo_real_didi ?? 3218.51);
      const upFuturo = { ...memoryState.configFuturo, saldo_real_didi: round2(curDiDi + m), updated_at: new Date().toISOString() };
      memoryState.configFuturo = upFuturo;
      setDoc(doc(db, "config_futuro", "main"), upFuturo).catch(err => console.warn("Error restore didi:", err));
    } else if (metodo === 'Débito Nu') {
      const curNu = Number(memoryState.configFuturo?.saldo_real_ajustado ?? 25054.21);
      const upFuturo = { ...memoryState.configFuturo, saldo_real_ajustado: round2(curNu + m), updated_at: new Date().toISOString() };
      memoryState.configFuturo = upFuturo;
      setDoc(doc(db, "config_futuro", "main"), upFuturo).catch(err => console.warn("Error restore nu:", err));
    }
  }

  // Remoción optimista inmediata en memoria
  memoryState.gastosDiarios = memoryState.gastosDiarios.filter(r => String(r.id) !== idStr);
  notifyListeners();

  // Borrar en Firestore (y compra TDC vinculada si existe)
  const batch = writeBatch(db);
  batch.delete(doc(db, "gastos_diarios", idStr));

  try {
    const tdcSnap = await getDocs(query(collection(db, "compras_tdc")));
    tdcSnap.forEach((d) => {
      const data = d.data();
      if (data.origen_id === idStr || (data.origen_tipo === 'gasto_diario' && String(data.origen_id) === idStr)) {
        batch.delete(d.ref);
      }
    });
  } catch (e) {
    console.warn("Aviso al verificar compras TDC vinculadas:", e);
  }

  await batch.commit();
  return { status: "success", message: "Gasto eliminado correctamente" };
}

export async function saveConfigGastos(data) {
  const updated = {
    ...memoryState.configGastos,
    ...data,
    updated_at: new Date().toISOString()
  };
  memoryState.configGastos = updated;
  notifyListeners();
  await setDoc(doc(db, "config_gastos", "main"), updated);
  return { status: "success", message: "Configuración de gastos guardada" };
}

export async function motoAporte(monto, modo = 'sumar') {
  const val = round2(monto);
  let current = Number(memoryState.configGastos.aportaciones_directas_moto || 0);
  let finalVal = modo === 'sumar' ? current + val : val;
  if (finalVal < 0) finalVal = 0;

  const updated = {
    ...memoryState.configGastos,
    aportaciones_directas_moto: finalVal,
    updated_at: new Date().toISOString()
  };
  memoryState.configGastos = updated;
  notifyListeners();
  await setDoc(doc(db, "config_gastos", "main"), updated);
  return { status: "success", aportaciones_directas: finalVal, message: "Aporte a moto actualizado" };
}

export async function limpiarRegistroGastos() {
  memoryState.gastosDiarios = [];
  notifyListeners();

  const snap = await getDocs(collection(db, "gastos_diarios"));
  const batch = writeBatch(db);
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  return { status: "success", message: "Registro diario limpiado" };
}

export async function cerrarQuincenaGastos(data) {
  const periodo = data.periodo || `Quincena ${new Date().toLocaleDateString()}`;
  const current = computeGastos(
    memoryState.configGastos,
    memoryState.gastosDiarios,
    memoryState.historicoGastos,
    memoryState.comprasTdc,
    memoryState.ingresosExtra,
    memoryState.gastosOcio
  );
  const res = current.resumen;

  // Filtrar compras TDC de la quincena activa que no provengan de un gasto_diario duplicado
  const regsDiariosIds = new Set(memoryState.gastosDiarios.map(r => String(r.id)));
  const comprasTdcActivas = memoryState.comprasTdc.filter(c => !c.quincena_cerrada);
  const tdcComoMovimientos = comprasTdcActivas
    .filter(c => c.origen_tipo !== 'gasto_diario' && (!c.origen_id || !regsDiariosIds.has(String(c.origen_id))))
    .map(c => ({
      id: c.id,
      fecha: c.fecha,
      dia: 'TDC',
      monto: getTdcCompraMetrics(c).cuotaActual,
      categoria: c.categoria || 'Otros',
      concepto: c.concepto || 'Compra TDC Nu',
      metodo_pago: 'TDC Nu',
      retirado: c.apartado || 'Sí (En Cajita)'
    }));

  // Incluir gastos de Excedente 20% registrados desde la pestaña de Ocio (gastos_ocio)
  const gastosOcioExcedente20 = memoryState.gastosOcio
    .filter(r => isGastoExcedente20(r.categoria || ''))
    .map(r => ({ ...r, origen_coleccion: 'gastos_ocio' }));

  const todosMovimientos = [...memoryState.gastosDiarios, ...gastosOcioExcedente20, ...tdcComoMovimientos];

  const cierreData = {
    periodo,
    mes: inferMes(data),
    anio: data.anio || new Date().getFullYear(),
    fecha_cierre: data.fecha_cierre || new Date().toISOString().split('T')[0],
    presupuesto: res.presupuesto_total,
    gastos_fijos: res.total_gastos_fijos,
    gasto_real: res.gasto_total_real,
    remanente: res.remanente_total,
    ahorro_moto_80: round2(res.excedente_80_moto + (res.extra_moto_directo || 0)),
    refuerzo_gustos_20: round2(res.excedente_20_salidas + (res.extra_salidas_20 || 0)),
    num_movimientos: todosMovimientos.length,
    detalle_json: JSON.stringify({
      registros: todosMovimientos,
      compras_tdc: tdcComoMovimientos,
      desglose_categorias: res,
      monto_copias: res.monto_copias,
      monto_imprevistos: res.monto_imprevistos,
      ingresos_extra: memoryState.ingresosExtra.filter(i => !i.quincena_cerrada)
    }),
    created_at: new Date().toISOString()
  };

  // Guardar quincena archivada
  await addDoc(collection(db, "historico_quincenas_gastos"), cierreData);

  // Batch en Firestore: limpiar gastos diarios, gastos Excedente 20% en gastos_ocio y marcar compras TDC e ingresos extra como archivadas
  const snap = await getDocs(collection(db, "gastos_diarios"));
  const batch = writeBatch(db);
  snap.forEach((d) => batch.delete(d.ref));

  for (const go of gastosOcioExcedente20) {
    if (go.id) {
      batch.delete(doc(db, "gastos_ocio", String(go.id)));
    }
  }

  for (const c of comprasTdcActivas) {
    if (c.id) {
      const isMsi = Number(c.meses_totales) > 1;
      batch.update(doc(db, "compras_tdc", String(c.id)), {
        quincena_cerrada: true,
        periodo_cierre: periodo,
        ...(isMsi ? { gastos_cuota_cerrada: Number(c.meses_pagados || 0) } : {})
      });
    }
  }

  const ingresosExtraActivos = memoryState.ingresosExtra.filter(i => !i.quincena_cerrada);
  for (const ie of ingresosExtraActivos) {
    if (ie.id) {
      batch.update(doc(db, "ingresos_extra", String(ie.id)), {
        quincena_cerrada: true,
        periodo_cierre: periodo
      });
    }
  }
  await batch.commit();

  // Actualizar estado en memoria
  memoryState.gastosDiarios = [];
  const ex20Ids = new Set(gastosOcioExcedente20.map(g => String(g.id)));
  memoryState.gastosOcio = memoryState.gastosOcio.filter(r => !ex20Ids.has(String(r.id)));
  const activeTdcIds = new Set(comprasTdcActivas.map(c => String(c.id)));
  memoryState.comprasTdc = memoryState.comprasTdc.map(c => {
    if (!activeTdcIds.has(String(c.id))) return c;
    const isMsi = Number(c.meses_totales) > 1;
    return {
      ...c,
      quincena_cerrada: true,
      periodo_cierre: periodo,
      ...(isMsi ? { gastos_cuota_cerrada: Number(c.meses_pagados || 0) } : {})
    };
  });
  memoryState.ingresosExtra = memoryState.ingresosExtra.map(ie => ({
    ...ie,
    quincena_cerrada: true,
    periodo_cierre: periodo
  }));
  notifyListeners();
  return { status: "success", message: "Quincena archivada en el histórico exitosamente" };
}

export async function getHistorialGastos() {
  return buildHistorialGastos(memoryState.historicoGastos);
}

export async function borrarCierreGastos(id) {
  const idStr = String(id);
  memoryState.historicoGastos = memoryState.historicoGastos.filter(c => String(c.id) !== idStr);
  notifyListeners();
  await deleteDoc(doc(db, "historico_quincenas_gastos", idStr));
  return { status: "success", message: "Quincena eliminada del histórico" };
}

export async function revertirQuincenaGastos(id) {
  let targetDoc = null;
  let targetId = id ? String(id) : null;

  if (targetId) {
    targetDoc = memoryState.historicoGastos.find(c => String(c.id) === targetId);
    if (!targetDoc) {
      const snap = await getDoc(doc(db, "historico_quincenas_gastos", targetId));
      if (snap.exists()) {
        targetDoc = { id: snap.id, ...snap.data() };
      }
    }
  } else {
    const sorted = [...memoryState.historicoGastos].sort((a, b) => 
      (b.fecha_cierre || b.created_at || '').localeCompare(a.fecha_cierre || a.created_at || '')
    );
    if (sorted.length > 0) {
      targetDoc = sorted[0];
      targetId = String(targetDoc.id);
    }
  }

  if (!targetDoc) {
    throw new Error("No se encontró la quincena archivada para revertir");
  }

  let registros = [];
  try {
    const det = typeof targetDoc.detalle_json === 'string'
      ? JSON.parse(targetDoc.detalle_json)
      : (targetDoc.detalle_json || {});
    const allRegs = Array.isArray(det.registros) ? det.registros : [];
    registros = allRegs.filter(r => r.metodo_pago !== 'TDC Nu' || r.origen_tipo === 'gasto_diario');
  } catch (e) {
    console.warn("Error al parsear detalle_json:", e);
  }

  const registrosDiarios = registros.filter(r => r.origen_coleccion !== 'gastos_ocio');
  const registrosOcioEx20 = registros.filter(r => r.origen_coleccion === 'gastos_ocio');

  const batch = writeBatch(db);
  for (const r of registrosDiarios) {
    const cleanRecord = {
      fecha: r.fecha || new Date().toISOString().split('T')[0],
      dia: r.dia || "Lunes",
      monto: round2(Number(r.monto) || 0),
      categoria: r.categoria || "🚌 Pasajes Combi (Efectivo)",
      concepto: r.concepto || "",
      metodo_pago: r.metodo_pago || "Efectivo",
      retirado: r.retirado || "Sí (Efectivo)",
      created_at: r.created_at || new Date().toISOString()
    };
    if (r.id) {
      batch.set(doc(db, "gastos_diarios", String(r.id)), cleanRecord);
    } else {
      const newRef = doc(collection(db, "gastos_diarios"));
      batch.set(newRef, cleanRecord);
    }
  }

  for (const r of registrosOcioEx20) {
    const cleanOcio = {
      fecha: r.fecha || new Date().toISOString().split('T')[0],
      dia: r.dia || "Lunes",
      monto: round2(Number(r.monto) || 0),
      categoria: r.categoria || "🍦 Excedente 20%: Refuerzo Gustos / Salidas",
      concepto: r.concepto || "",
      metodo_pago: r.metodo_pago || "Débito DiDi",
      created_at: r.created_at || new Date().toISOString()
    };
    if (r.id) {
      batch.set(doc(db, "gastos_ocio", String(r.id)), cleanOcio);
    } else {
      const newRef = doc(collection(db, "gastos_ocio"));
      batch.set(newRef, cleanOcio);
    }
  }

  const comprasAfectadas = memoryState.comprasTdc.filter(c => c.periodo_cierre === targetDoc.periodo);
  for (const c of comprasAfectadas) {
    if (c.id) {
      batch.update(doc(db, "compras_tdc", String(c.id)), {
        quincena_cerrada: false,
        periodo_cierre: null,
        gastos_cuota_cerrada: null
      });
    }
  }

  const ingresosAfectados = memoryState.ingresosExtra.filter(i => i.periodo_cierre === targetDoc.periodo);
  for (const ie of ingresosAfectados) {
    if (ie.id) {
      batch.update(doc(db, "ingresos_extra", String(ie.id)), {
        quincena_cerrada: false,
        periodo_cierre: null
      });
    }
  }

  batch.delete(doc(db, "historico_quincenas_gastos", targetId));
  await batch.commit();

  memoryState.historicoGastos = memoryState.historicoGastos.filter(c => String(c.id) !== targetId);
  const existingIds = new Set(memoryState.gastosDiarios.map(g => String(g.id)));
  const toAdd = registrosDiarios.filter(r => !existingIds.has(String(r.id)));
  memoryState.gastosDiarios = [...toAdd, ...memoryState.gastosDiarios];
  const existingOcioIds = new Set(memoryState.gastosOcio.map(g => String(g.id)));
  const toAddOcio = registrosOcioEx20.filter(r => !existingOcioIds.has(String(r.id)));
  memoryState.gastosOcio = [...toAddOcio, ...memoryState.gastosOcio];
  memoryState.comprasTdc = memoryState.comprasTdc.map(c => 
    c.periodo_cierre === targetDoc.periodo ? { ...c, quincena_cerrada: false, periodo_cierre: null, gastos_cuota_cerrada: null } : c
  );
  memoryState.ingresosExtra = memoryState.ingresosExtra.map(ie =>
    ie.periodo_cierre === targetDoc.periodo ? { ...ie, quincena_cerrada: false, periodo_cierre: null } : ie
  );

  notifyListeners();
  return {
    status: "success",
    message: `Quincena "${targetDoc.periodo}" revertida exitosamente. Se restauraron los registros a tu quincena activa.`
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// OPERACIONES DE PLAN A FUTURO, CAJITA TURBO Y OCIO
// ─────────────────────────────────────────────────────────────────────────────

export async function getFuturo() {
  return computeFuturo(
    memoryState.configFuturo,
    memoryState.configGastos,
    memoryState.gastosOcio,
    memoryState.comprasTdc,
    memoryState.gastosDiarios,
    memoryState.historicoFuturo,
    memoryState.historicoGastos,
    memoryState.ingresosExtra
  );
}

export async function addGastoOcio(data) {
  const fecha = data.fecha || new Date().toISOString().split('T')[0];
  const monto = round2(data.monto);
  const categoria = data.categoria || "✨ Otros Gustos";
  const concepto = data.concepto || "";
  const metodo_pago = data.metodo || data.metodo_pago || "Débito Nu";
  const dia = getDiaSemana(fecha);

  const docData = {
    fecha,
    dia,
    monto,
    categoria,
    concepto,
    metodo_pago,
    created_at: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, "gastos_ocio"), docData);

  if (metodo_pago === 'TDC Nu') {
    await addTDC({
      fecha,
      monto,
      concepto,
      categoria: 'Ocio',
      tipo: 'Gasto Diario',
      apartado: 'Sí (En Cajita)',
      estado: 'Pendiente',
      origen_tipo: 'gasto_ocio',
      origen_id: docRef.id
    });
  }

  // Sincronizar saldo vivo en Bóvedas si se pagó con Débito DiDi o Débito Nu
  if (metodo_pago === 'Débito DiDi' || (categoria && (categoria.includes('Salidas') || categoria.includes('20%')) && metodo_pago.includes('DiDi'))) {
    const curDiDi = Number(memoryState.configFuturo?.saldo_real_didi ?? 3218.51);
    const newDiDi = Math.max(0, round2(curDiDi - monto));
    const upFuturo = { ...memoryState.configFuturo, saldo_real_didi: newDiDi, updated_at: new Date().toISOString() };
    memoryState.configFuturo = upFuturo;
    setDoc(doc(db, "config_futuro", "main"), upFuturo).catch(err => console.warn("Error sync didi:", err));
  } else if (metodo_pago === 'Débito Nu') {
    const curNu = Number(memoryState.configFuturo?.saldo_real_ajustado ?? 25054.21);
    const newNu = Math.max(0, round2(curNu - monto));
    const upFuturo = { ...memoryState.configFuturo, saldo_real_ajustado: newNu, updated_at: new Date().toISOString() };
    memoryState.configFuturo = upFuturo;
    setDoc(doc(db, "config_futuro", "main"), upFuturo).catch(err => console.warn("Error sync nu:", err));
  }

  return { status: "success", id: docRef.id, message: "Gasto de ocio registrado" };
}

export async function deleteGastoOcio(id) {
  const idStr = String(id);
  const gastoToDelete = memoryState.gastosOcio.find(r => String(r.id) === idStr);
  if (gastoToDelete) {
    const m = round2(Number(gastoToDelete.monto) || 0);
    const metodo = gastoToDelete.metodo_pago || 'Débito Nu';
    if (metodo === 'Débito DiDi') {
      const curDiDi = Number(memoryState.configFuturo?.saldo_real_didi ?? 3218.51);
      const upFuturo = { ...memoryState.configFuturo, saldo_real_didi: round2(curDiDi + m), updated_at: new Date().toISOString() };
      memoryState.configFuturo = upFuturo;
      setDoc(doc(db, "config_futuro", "main"), upFuturo).catch(err => console.warn("Error restore didi:", err));
    } else if (metodo === 'Débito Nu') {
      const curNu = Number(memoryState.configFuturo?.saldo_real_ajustado ?? 25054.21);
      const upFuturo = { ...memoryState.configFuturo, saldo_real_ajustado: round2(curNu + m), updated_at: new Date().toISOString() };
      memoryState.configFuturo = upFuturo;
      setDoc(doc(db, "config_futuro", "main"), upFuturo).catch(err => console.warn("Error restore nu:", err));
    }
  }

  memoryState.gastosOcio = memoryState.gastosOcio.filter(r => String(r.id) !== idStr);
  notifyListeners();

  const batch = writeBatch(db);
  batch.delete(doc(db, "gastos_ocio", idStr));

  try {
    const tdcSnap = await getDocs(query(collection(db, "compras_tdc")));
    tdcSnap.forEach((d) => {
      const data = d.data();
      if (data.origen_id === idStr || (data.origen_tipo === 'gasto_ocio' && String(data.origen_id) === idStr)) {
        batch.delete(d.ref);
      }
    });
  } catch (e) {
    console.warn("Aviso al verificar compras TDC vinculadas en ocio:", e);
  }

  await batch.commit();
  return { status: "success", message: "Gasto de ocio eliminado" };
}

export async function updateAportacionFuturo(tipo, monto) {
  const val = round2(monto);
  const updated = { ...memoryState.configFuturo, updated_at: new Date().toISOString() };
  if (tipo === 'cetes') updated.cetes_aportado_activo = val;
  else if (tipo === 'emergencia') updated.emergencia_aportado_activo = val;
  else if (tipo === 'retiro') updated.retiro_aportado_activo = val;

  memoryState.configFuturo = updated;
  notifyListeners();
  await setDoc(doc(db, "config_futuro", "main"), updated);
  return { status: "success", message: "Aportación actualizada" };
}

export async function cerrarQuincenaFuturo(data) {
  const current = computeFuturo(
    memoryState.configFuturo,
    memoryState.configGastos,
    memoryState.gastosOcio,
    memoryState.comprasTdc,
    memoryState.gastosDiarios,
    memoryState.historicoFuturo,
    memoryState.historicoGastos,
    memoryState.ingresosExtra
  );

  const ocio = current.otros_fondos.ocio;
  const emg = current.otros_fondos.emergencia;
  const ret = current.otros_fondos.retiro;
  const cet = current.otros_fondos.cetes;
  const caj = current.otros_fondos.cajita_turbo;

  const ocioFuturoActivos = memoryState.gastosOcio.filter(r => !isGastoExcedente20(r.categoria || ''));
  const tdcOcioCerradasIds = [...new Set(
    ocio.registros
      .filter(r => r.origen_tipo === 'compra_tdc' && r.origen_id)
      .map(r => String(r.origen_id))
  )];
  const tdcOcioPrev = tdcOcioCerradasIds.map(tdcId => {
    const tdcObj = memoryState.comprasTdc.find(c => String(c.id) === tdcId);
    return {
      id: tdcId,
      futuro_cerrado: !!tdcObj?.futuro_cerrado,
      futuro_cuota_cerrada: tdcObj?.futuro_cuota_cerrada ?? null
    };
  });

  const cierreData = {
    periodo: data.periodo || `Quincena ${new Date().toLocaleDateString()}`,
    mes: inferMes(data),
    anio: data.anio || new Date().getFullYear(),
    fecha_cierre: data.fecha_cierre || new Date().toISOString().split('T')[0],
    presupuesto_ocio: ocio.presupuesto,
    gasto_ocio: ocio.gasto_real,
    remanente_ocio: ocio.remanente,
    aporte_emergencia: emg.aportado,
    aporte_retiro: ret.aportado,
    aporte_cetes: cet.aportado,
    total_cajita_cierre: caj.gran_total,
    num_movimientos: ocioFuturoActivos.length + tdcOcioCerradasIds.length,
    detalle_json: JSON.stringify({
      registros_ocio: ocioFuturoActivos,
      compras_tdc_ocio_ids: tdcOcioCerradasIds,
      compras_tdc_ocio_prev: tdcOcioPrev
    }),
    created_at: new Date().toISOString()
  };

  await addDoc(collection(db, "historico_quincenas_futuro"), cierreData);

  // Limpiar únicamente gastos de ocio propios de Futuro (mantener Excedente 20% hasta que cierre Gastos)
  const batch = writeBatch(db);
  for (const r of ocioFuturoActivos) {
    if (r.id) {
      batch.delete(doc(db, "gastos_ocio", String(r.id)));
    }
  }
  const tdcUpdatesMap = new Map();
  for (const tdcId of tdcOcioCerradasIds) {
    const tdcObj = memoryState.comprasTdc.find(c => String(c.id) === tdcId);
    const isMsi = Number(tdcObj?.meses_totales) > 1;
    const tdcPatch = isMsi
      ? { futuro_cerrado: false, futuro_cuota_cerrada: Number(tdcObj?.meses_pagados || 0) }
      : { futuro_cerrado: true };
    tdcUpdatesMap.set(tdcId, tdcPatch);
    batch.update(doc(db, "compras_tdc", tdcId), tdcPatch);
  }
  await batch.commit();

  const closedIds = new Set(ocioFuturoActivos.map(r => String(r.id)));
  memoryState.gastosOcio = memoryState.gastosOcio.filter(r => !closedIds.has(String(r.id)));
  memoryState.comprasTdc = memoryState.comprasTdc.map(c => {
    const patch = tdcUpdatesMap.get(String(c.id));
    return patch ? { ...c, ...patch } : c;
  });
  notifyListeners();
  return { status: "success", message: "Quincena de Futuro archivada" };
}

export async function getHistorialFuturo() {
  return buildHistorialFuturo(memoryState.historicoFuturo);
}

export async function borrarCierreFuturo(id) {
  const idStr = String(id);
  memoryState.historicoFuturo = memoryState.historicoFuturo.filter(c => String(c.id) !== idStr);
  notifyListeners();
  await deleteDoc(doc(db, "historico_quincenas_futuro", idStr));
  return { status: "success", message: "Quincena de Futuro eliminada" };
}

export async function revertirQuincenaFuturo(id) {
  let targetDoc = null;
  let targetId = id ? String(id) : null;

  if (targetId) {
    targetDoc = memoryState.historicoFuturo.find(c => String(c.id) === targetId);
    if (!targetDoc) {
      const snap = await getDoc(doc(db, "historico_quincenas_futuro", targetId));
      if (snap.exists()) {
        targetDoc = { id: snap.id, ...snap.data() };
      }
    }
  } else {
    const sorted = [...memoryState.historicoFuturo].sort((a, b) => 
      (b.fecha_cierre || b.created_at || '').localeCompare(a.fecha_cierre || a.created_at || '')
    );
    if (sorted.length > 0) {
      targetDoc = sorted[0];
      targetId = String(targetDoc.id);
    }
  }

  if (!targetDoc) {
    throw new Error("No se encontró la quincena archivada para revertir");
  }

  let registros = [];
  let tdcOcioIds = [];
  let tdcOcioPrevMap = new Map();
  try {
    const det = typeof targetDoc.detalle_json === 'string'
      ? JSON.parse(targetDoc.detalle_json)
      : (targetDoc.detalle_json || {});
    registros = Array.isArray(det.registros_ocio) ? det.registros_ocio : [];
    tdcOcioIds = Array.isArray(det.compras_tdc_ocio_ids) ? det.compras_tdc_ocio_ids : [];
    if (Array.isArray(det.compras_tdc_ocio_prev)) {
      for (const p of det.compras_tdc_ocio_prev) {
        if (p?.id) tdcOcioPrevMap.set(String(p.id), p);
      }
    }
  } catch (e) {
    console.warn("Error al parsear detalle_json:", e);
  }

  const batch = writeBatch(db);
  for (const tdcId of tdcOcioIds) {
    const prev = tdcOcioPrevMap.get(String(tdcId));
    batch.update(doc(db, "compras_tdc", String(tdcId)), {
      futuro_cerrado: prev ? !!prev.futuro_cerrado : false,
      futuro_cuota_cerrada: prev ? (prev.futuro_cuota_cerrada ?? null) : null
    });
  }
  for (const r of registros) {
    const cleanRecord = {
      fecha: r.fecha || new Date().toISOString().split('T')[0],
      dia: r.dia || "Lunes",
      monto: round2(Number(r.monto) || 0),
      categoria: r.categoria || "✨ Otros Gustos",
      concepto: r.concepto || "",
      metodo_pago: r.metodo_pago || "Débito Nu",
      created_at: r.created_at || new Date().toISOString()
    };
    if (r.id) {
      batch.set(doc(db, "gastos_ocio", String(r.id)), cleanRecord);
    } else {
      const newRef = doc(collection(db, "gastos_ocio"));
      batch.set(newRef, cleanRecord);
    }
  }

  batch.delete(doc(db, "historico_quincenas_futuro", targetId));
  await batch.commit();

  memoryState.historicoFuturo = memoryState.historicoFuturo.filter(c => String(c.id) !== targetId);
  const existingIds = new Set(memoryState.gastosOcio.map(g => String(g.id)));
  const toAdd = registros.filter(r => !existingIds.has(String(r.id)));
  memoryState.gastosOcio = [...toAdd, ...memoryState.gastosOcio];
  if (tdcOcioIds.length > 0) {
    const tdcRevertSet = new Set(tdcOcioIds.map(String));
    memoryState.comprasTdc = memoryState.comprasTdc.map(c => {
      if (!tdcRevertSet.has(String(c.id))) return c;
      const prev = tdcOcioPrevMap.get(String(c.id));
      return {
        ...c,
        futuro_cerrado: prev ? !!prev.futuro_cerrado : false,
        futuro_cuota_cerrada: prev ? (prev.futuro_cuota_cerrada ?? null) : null
      };
    });
  }

  notifyListeners();
  return {
    status: "success",
    message: `Quincena "${targetDoc.periodo}" revertida exitosamente. Se restauraron ${registros.length} registros a tu quincena activa.`
  };
}

export async function ajustarCajitaTurbo(data) {
  const updated = {
    ...memoryState.configFuturo,
    updated_at: new Date().toISOString()
  };

  const saldoReal = data.saldo_real_ajustado !== undefined ? data.saldo_real_ajustado : (data.saldo_real !== undefined ? data.saldo_real : data.saldo);
  if (saldoReal !== undefined) {
    updated.saldo_real_ajustado = (saldoReal !== null && saldoReal !== '' && !isNaN(Number(saldoReal))) ? round2(Number(saldoReal)) : null;
  }

  const rendReal = data.rendimiento_real_nu !== undefined ? data.rendimiento_real_nu : (data.rendimiento_real !== undefined ? data.rendimiento_real : (data.rendimiento !== undefined ? data.rendimiento : null));
  if (rendReal !== undefined && rendReal !== null && !isNaN(Number(rendReal))) {
    updated.rendimiento_real_nu = round2(Number(rendReal));
  }

  // Soporte DiDi Cuenta (15%)
  if (data.saldo_real_didi !== undefined) {
    updated.saldo_real_didi = (data.saldo_real_didi !== null && data.saldo_real_didi !== '' && !isNaN(Number(data.saldo_real_didi))) ? round2(Number(data.saldo_real_didi)) : 0;
  }
  if (data.rendimiento_real_didi !== undefined) {
    updated.rendimiento_real_didi = (data.rendimiento_real_didi !== null && data.rendimiento_real_didi !== '' && !isNaN(Number(data.rendimiento_real_didi))) ? round2(Number(data.rendimiento_real_didi)) : 0;
  }
  if (data.didi_check_mensual !== undefined) {
    updated.didi_check_mensual = Boolean(data.didi_check_mensual);
  }

  // Soporte Openbank (13%)
  if (data.saldo_real_openbank !== undefined) {
    updated.saldo_real_openbank = (data.saldo_real_openbank !== null && data.saldo_real_openbank !== '' && !isNaN(Number(data.saldo_real_openbank))) ? round2(Number(data.saldo_real_openbank)) : 0;
  }
  if (data.rendimiento_real_openbank !== undefined) {
    updated.rendimiento_real_openbank = (data.rendimiento_real_openbank !== null && data.rendimiento_real_openbank !== '' && !isNaN(Number(data.rendimiento_real_openbank))) ? round2(Number(data.rendimiento_real_openbank)) : 0;
  }
  if (data.nu_check_mensual !== undefined) {
    updated.nu_check_mensual = Boolean(data.nu_check_mensual);
  }
  if (data.openbank_check_mensual !== undefined) {
    updated.openbank_check_mensual = Boolean(data.openbank_check_mensual);
  }

  memoryState.configFuturo = updated;
  notifyListeners();
  await setDoc(doc(db, "config_futuro", "main"), updated);
  return { status: "success", message: "Tríada de bóvedas conciliada correctamente" };
}

export const ajustarBovedaDual = ajustarCajitaTurbo;
export const ajustarTriada = ajustarCajitaTurbo;

// ─────────────────────────────────────────────────────────────────────────────
// OPERACIONES DE TARJETA DE CRÉDITO NU (TDC)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vincula una cuota de compra TDC (inicial 1/N o siguiente k/N tras liquidar una mensualidad MSI)
 * en gastos_ocio o gastos_diarios para que descuente del presupuesto del periodo activo.
 */
async function vincularCuotaTdcACategoria({ docId, categoria, fecha, monto, concepto, batch = null }) {
  const cat = String(categoria || '');
  const cuota = round2(Number(monto) || 0);
  if (!docId || cuota <= 0) return null;

  let targetCol = null;
  let origenTipoTdc = null;
  let payload = null;

  if ((cat === 'Ocio' || cat.includes('Ocio') || cat.includes('Gustos / Ocio')) && !isGastoExcedente20(cat)) {
    targetCol = 'gastos_ocio';
    origenTipoTdc = 'gasto_ocio';
    payload = {
      fecha,
      monto: cuota,
      categoria: '🍕 Salidas & Gustos',
      concepto,
      metodo_pago: 'TDC Nu',
      origen_tipo: 'compra_tdc',
      origen_id: String(docId),
      created_at: new Date().toISOString()
    };
  } else if (cat.includes('Excedente 20%') || cat.includes('Salidas') || cat.includes('Imprevistos') || cat.includes('Copias') || cat.includes('Material') || cat.includes('Comida') || cat.includes('Moto')) {
    let mappedCat = cat;
    if (cat.includes('Excedente 20%') || cat.includes('Salidas')) mappedCat = "🍕 Excedente 20%: Refuerzo Gustos / Salidas";
    else if (cat.includes('Imprevistos')) mappedCat = "🛡️ Imprevistos / Por si acaso";
    else if (cat.includes('Copias') || cat.includes('Material')) mappedCat = "📄 Copias, Material & Papelería";
    else if (cat.includes('Comida')) mappedCat = "🥪 Comidas en Escuela (Efectivo)";
    else if (cat.includes('Moto')) mappedCat = "🛡️ Excedente 80%: Fondo Emergencia / Moto";

    targetCol = 'gastos_diarios';
    origenTipoTdc = 'gasto_diario';
    payload = {
      fecha,
      dia: getDiaSemana(fecha),
      monto: cuota,
      categoria: mappedCat,
      concepto,
      metodo_pago: 'TDC Nu',
      retirado: 'En Cajita Nu',
      origen_tipo: 'compra_tdc',
      origen_id: String(docId),
      created_at: new Date().toISOString()
    };
  }

  if (!targetCol || !payload) return null;

  if (batch) {
    const newRef = doc(collection(db, targetCol));
    batch.set(newRef, payload);
    batch.update(doc(db, "compras_tdc", String(docId)), { origen_id: newRef.id, origen_tipo: origenTipoTdc });
    return { targetCol, record: { id: newRef.id, ...payload }, origen_id: newRef.id, origen_tipo: origenTipoTdc };
  }

  const newRef = await addDoc(collection(db, targetCol), payload);
  await updateDoc(doc(db, "compras_tdc", String(docId)), { origen_id: newRef.id, origen_tipo: origenTipoTdc });
  return { targetCol, record: { id: newRef.id, ...payload }, origen_id: newRef.id, origen_tipo: origenTipoTdc };
}

function registrarCuotaEnMemoria(linked) {
  if (!linked || !linked.record) return;
  const rid = String(linked.record.id);
  if (linked.targetCol === 'gastos_ocio') {
    if (!memoryState.gastosOcio.some(r => String(r.id) === rid)) {
      memoryState.gastosOcio = [linked.record, ...memoryState.gastosOcio];
    }
  } else if (linked.targetCol === 'gastos_diarios') {
    if (!memoryState.gastosDiarios.some(r => String(r.id) === rid)) {
      memoryState.gastosDiarios = [linked.record, ...memoryState.gastosDiarios];
    }
  }
}

export async function addTDC(data) {
  const mesesTotales = Math.max(1, parseInt(data.meses_totales, 10) || 1);
  const mesesPagados = Math.min(mesesTotales, Math.max(0, parseInt(data.meses_pagados, 10) || 0));
  const montoTotal = round2(data.monto);
  const docData = {
    fecha: data.fecha || new Date().toISOString().split('T')[0],
    monto: montoTotal,
    concepto: data.concepto || "",
    categoria: data.categoria || "Básicos",
    tipo: data.tipo || (mesesTotales > 1 ? `MSI (${mesesTotales}m)` : "Gasto Diario"),
    meses_totales: mesesTotales,
    meses_pagados: mesesPagados,
    monto_pagado: round2(data.monto_pagado || 0),
    apartado: data.apartado || "Sí (En Cajita)",
    estado: data.estado || "Pendiente",
    origen_tipo: data.origen_tipo || null,
    origen_id: data.origen_id || null,
    created_at: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, "compras_tdc"), docData);
  const metrics = getTdcCompraMetrics(docData);
  const montoCategoria = metrics.cuotaActual;
  const conceptoCategoria = metrics.esMsi
    ? `${docData.concepto || 'Compra MSI'} (MSI ${metrics.mesesPagados + 1}/${metrics.mesesTotales})`
    : (docData.concepto || 'Compra TDC Nu');

  // Si se registró directamente desde Control TDC Nu (sin origen previo),
  // vincular de inmediato con la categoría de Ocio o Gastos Diarios para que descuente al instante del presupuesto:
  if (!data.origen_tipo && !data.origen_id && montoCategoria > 0) {
    try {
      const linked = await vincularCuotaTdcACategoria({
        docId: docRef.id,
        categoria: docData.categoria,
        fecha: docData.fecha,
        monto: montoCategoria,
        concepto: conceptoCategoria
      });
      registrarCuotaEnMemoria(linked);
    } catch (err) {
      console.warn("Aviso al vincular compra TDC con categoría:", err);
    }
  }

  return { status: "success", id: docRef.id, message: metrics.esMsi ? `Compra a ${mesesTotales} MSI registrada ($${montoCategoria.toFixed(2)}/mes)` : "Compra TDC registrada" };
}

export async function editTDC(data) {
  const idStr = String(data.id || data.fila);
  const docRef = doc(db, "compras_tdc", idStr);

  const updatedFields = {};
  if (data.fecha !== undefined) updatedFields.fecha = data.fecha;
  if (data.monto !== undefined) updatedFields.monto = round2(data.monto);
  if (data.concepto !== undefined) updatedFields.concepto = data.concepto;
  if (data.categoria !== undefined) updatedFields.categoria = data.categoria;
  if (data.tipo !== undefined) updatedFields.tipo = data.tipo;
  if (data.apartado !== undefined) updatedFields.apartado = data.apartado;
  if (data.estado !== undefined) updatedFields.estado = data.estado;

  await updateDoc(docRef, updatedFields);
  return { status: "success", message: "Compra TDC actualizada" };
}

export async function deleteTDC(id) {
  const idStr = String(id);
  const compraToDelete = memoryState.comprasTdc.find(c => String(c.id) === idStr);
  memoryState.comprasTdc = memoryState.comprasTdc.filter(c => String(c.id) !== idStr);
  notifyListeners();

  const batch = writeBatch(db);
  batch.delete(doc(db, "compras_tdc", idStr));

  if (compraToDelete && compraToDelete.origen_id) {
    const oId = String(compraToDelete.origen_id);
    if (compraToDelete.origen_tipo === 'gasto_ocio') {
      batch.delete(doc(db, "gastos_ocio", oId));
      memoryState.gastosOcio = memoryState.gastosOcio.filter(r => String(r.id) !== oId);
    } else if (compraToDelete.origen_tipo === 'gasto_diario') {
      batch.delete(doc(db, "gastos_diarios", oId));
      memoryState.gastosDiarios = memoryState.gastosDiarios.filter(r => String(r.id) !== oId);
    }
  }

  // Búsqueda adicional por si algún registro apunta a esta compra_tdc
  try {
    const ocioSnap = await getDocs(collection(db, "gastos_ocio"));
    ocioSnap.forEach(d => {
      if (d.data().origen_id === idStr) {
        batch.delete(d.ref);
        memoryState.gastosOcio = memoryState.gastosOcio.filter(r => String(r.id) !== d.id);
      }
    });
    const diarioSnap = await getDocs(collection(db, "gastos_diarios"));
    diarioSnap.forEach(d => {
      if (d.data().origen_id === idStr) {
        batch.delete(d.ref);
        memoryState.gastosDiarios = memoryState.gastosDiarios.filter(r => String(r.id) !== d.id);
      }
    });
  } catch (e) {
    console.warn("Aviso al limpiar dependencias de compra TDC:", e);
  }

  await batch.commit();
  notifyListeners();
  return { status: "success", message: "Compra TDC eliminada" };
}

export async function payTDC() {
  const snap = await getDocs(collection(db, "compras_tdc"));
  const batch = writeBatch(db);
  let totalLiquidado = 0;

  const updatedList = [];
  const nextMsiLinks = [];
  const hoyIso = new Date().toISOString().split('T')[0];

  for (const d of snap.docs) {
    const data = d.data();
    const metrics = getTdcCompraMetrics(data);
    if (!metrics.liquidado && metrics.cuotaActual > 0) {
      totalLiquidado = round2(totalLiquidado + metrics.cuotaActual);
      if (metrics.esMsi) {
        const nextPagados = metrics.mesesPagados + 1;
        const nextMontoPagado = round2(metrics.montoPagado + metrics.cuotaActual);
        const nextEstado = nextPagados >= metrics.mesesTotales || nextMontoPagado >= metrics.montoTotal ? 'Liquidado' : 'Pendiente';
        const fechaLiq = nextEstado === 'Liquidado' ? hoyIso : null;
        const tdcPatch = {
          meses_pagados: nextPagados,
          monto_pagado: nextMontoPagado,
          estado: nextEstado,
          ...(fechaLiq ? { fecha_liquidacion: fechaLiq } : {})
        };
        batch.update(d.ref, tdcPatch);

        let updatedCompra = { id: d.id, ...data, ...tdcPatch };
        if (nextEstado === 'Pendiente') {
          const nextMetrics = getTdcCompraMetrics({ ...data, ...tdcPatch });
          if (nextMetrics.cuotaActual > 0) {
            const linked = await vincularCuotaTdcACategoria({
              docId: d.id,
              categoria: data.categoria,
              fecha: hoyIso,
              monto: nextMetrics.cuotaActual,
              concepto: `${data.concepto || 'Compra MSI'} (MSI ${nextPagados + 1}/${metrics.mesesTotales})`,
              batch
            });
            if (linked) {
              nextMsiLinks.push(linked);
              updatedCompra = { ...updatedCompra, origen_id: linked.origen_id, origen_tipo: linked.origen_tipo };
            }
          }
        }
        updatedList.push(updatedCompra);
      } else {
        batch.update(d.ref, { estado: 'Liquidado', fecha_liquidacion: hoyIso });
        updatedList.push({ id: d.id, ...data, estado: 'Liquidado', fecha_liquidacion: hoyIso });
      }
    } else {
      updatedList.push({ id: d.id, ...data });
    }
  }
  await batch.commit();

  for (const linked of nextMsiLinks) {
    registrarCuotaEnMemoria(linked);
  }
  memoryState.comprasTdc = updatedList;

  // Descontar la deuda liquidada de DiDi Cuenta por defecto (para mantener Nu Turbo intacta al 13%)
  let fuenteMsg = 'DiDi Cuenta';
  if (totalLiquidado > 0) {
    const curDiDi = Number(memoryState.configFuturo?.saldo_real_didi ?? 0);
    const curNu = Number(memoryState.configFuturo?.saldo_real_ajustado ?? 25054.21);
    const upFuturo = { ...memoryState.configFuturo, updated_at: new Date().toISOString() };
    if (curDiDi >= totalLiquidado) {
      upFuturo.saldo_real_didi = round2(curDiDi - totalLiquidado);
      fuenteMsg = 'DiDi Cuenta';
    } else {
      upFuturo.saldo_real_ajustado = Math.max(0, round2(curNu - totalLiquidado));
      fuenteMsg = 'Cajita Nu';
    }
    memoryState.configFuturo = upFuturo;
    await setDoc(doc(db, "config_futuro", "main"), upFuturo);
  }

  notifyListeners();
  return { status: "success", message: `Corte TDC Nu liquidado (-$${round2(totalLiquidado).toFixed(2)} de ${fuenteMsg})` };
}

export async function payCuotaTDC(id) {
  const idStr = String(id);
  const docRef = doc(db, "compras_tdc", idStr);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return { status: "error", message: "Compra no encontrada" };

  const data = snap.data();
  const metrics = getTdcCompraMetrics(data);
  if (metrics.liquidado || metrics.cuotaActual <= 0) {
    return { status: "info", message: "Esta compra ya está liquidada" };
  }

  const cuota = metrics.cuotaActual;
  const hoyIso = new Date().toISOString().split('T')[0];
  let updates = { estado: 'Liquidado', fecha_liquidacion: hoyIso };
  if (metrics.esMsi) {
    const nextPagados = metrics.mesesPagados + 1;
    const nextMontoPagado = round2(metrics.montoPagado + cuota);
    const nextEstado = nextPagados >= metrics.mesesTotales || nextMontoPagado >= metrics.montoTotal ? 'Liquidado' : 'Pendiente';
    updates = {
      meses_pagados: nextPagados,
      monto_pagado: nextMontoPagado,
      estado: nextEstado,
      ...(nextEstado === 'Liquidado' ? { fecha_liquidacion: hoyIso } : {})
    };
  }

  await updateDoc(docRef, updates);
  let linkedNext = null;
  if (metrics.esMsi && updates.estado === 'Pendiente') {
    const nextMetrics = getTdcCompraMetrics({ ...data, ...updates });
    if (nextMetrics.cuotaActual > 0) {
      try {
        linkedNext = await vincularCuotaTdcACategoria({
          docId: idStr,
          categoria: data.categoria,
          fecha: hoyIso,
          monto: nextMetrics.cuotaActual,
          concepto: `${data.concepto || 'Compra MSI'} (MSI ${updates.meses_pagados + 1}/${metrics.mesesTotales})`
        });
        registrarCuotaEnMemoria(linkedNext);
      } catch (err) {
        console.warn("Aviso al programar siguiente mensualidad MSI:", err);
      }
    }
  }
  memoryState.comprasTdc = memoryState.comprasTdc.map(c =>
    String(c.id) === idStr
      ? {
          ...c,
          ...updates,
          ...(linkedNext ? { origen_id: linkedNext.origen_id, origen_tipo: linkedNext.origen_tipo } : {})
        }
      : c
  );

  const curDiDi = Number(memoryState.configFuturo?.saldo_real_didi ?? 0);
  const curNu = Number(memoryState.configFuturo?.saldo_real_ajustado ?? 25054.21);
  const upFuturo = { ...memoryState.configFuturo, updated_at: new Date().toISOString() };
  let fuenteMsg = 'DiDi Cuenta';
  if (curDiDi >= cuota) {
    upFuturo.saldo_real_didi = round2(curDiDi - cuota);
    fuenteMsg = 'DiDi Cuenta';
  } else {
    upFuturo.saldo_real_ajustado = Math.max(0, round2(curNu - cuota));
    fuenteMsg = 'Cajita Nu';
  }
  memoryState.configFuturo = upFuturo;
  await setDoc(doc(db, "config_futuro", "main"), upFuturo);

  notifyListeners();
  return {
    status: "success",
    message: metrics.esMsi
      ? `Mensualidad ${updates.meses_pagados}/${metrics.mesesTotales} pagada (-$${cuota.toFixed(2)} de ${fuenteMsg})`
      : `Compra liquidada (-$${cuota.toFixed(2)} de ${fuenteMsg})`
  };
}

export async function saveConfigFuturo(data) {
  const updated = {
    ...memoryState.configFuturo,
    ...data,
    updated_at: new Date().toISOString()
  };
  memoryState.configFuturo = updated;
  notifyListeners();
  await setDoc(doc(db, "config_futuro", "main"), updated);
  return { status: "success", message: "Configuración de Futuro guardada" };
}

// ─────────────────────────────────────────────────────────────────────────────
// OPERACIONES DE INGRESOS EXTRA / BONOS (Modalidad C Híbrida)
// ─────────────────────────────────────────────────────────────────────────────

export async function addIngresoExtra(data) {
  const monto = round2(data.monto);
  if (isNaN(monto) || monto <= 0) {
    throw new Error("El monto del ingreso extra debe ser mayor a 0");
  }

  const docData = {
    fecha: data.fecha || new Date().toISOString().split('T')[0],
    concepto: data.concepto ? data.concepto.trim() : "Bono / Dinero Extra",
    monto: monto,
    modalidad: data.modalidad || "especifico", // "especifico" | "patrimonial"
    destino: data.destino || "moto",
    quincena_cerrada: false,
    periodo_cierre: null,
    created_at: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, "ingresos_extra"), docData);
  return { status: "success", id: docRef.id, message: "Dinero extra registrado con éxito" };
}

export async function deleteIngresoExtra(id) {
  if (!id) throw new Error("ID de ingreso extra requerido");
  const idStr = String(id);
  memoryState.ingresosExtra = memoryState.ingresosExtra.filter(i => String(i.id) !== idStr);
  notifyListeners();
  await deleteDoc(doc(db, "ingresos_extra", idStr));
  return { status: "success", message: "Ingreso extra eliminado" };
}
