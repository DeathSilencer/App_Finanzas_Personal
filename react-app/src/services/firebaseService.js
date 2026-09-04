/**
 * firebaseService.js — Capa de persistencia en la nube en tiempo real (Cloud Firestore).
 * Permite acceso 24/7 desde cualquier dispositivo (móvil y web) con sincronización instantánea.
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
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { computeGastos, computeFuturo, getDiaSemana, round2 } from './financialEngine';
import {
  INITIAL_CONFIG_GASTOS,
  INITIAL_GASTOS_DIARIOS,
  INITIAL_CONFIG_FUTURO,
  INITIAL_GASTOS_OCIO,
  INITIAL_COMPRAS_TDC
} from './seedData';

// Estado local reactivo en memoria para responder de inmediato mientras Firestore sincroniza
let memoryState = {
  configGastos: { ...INITIAL_CONFIG_GASTOS },
  configFuturo: { ...INITIAL_CONFIG_FUTURO },
  gastosDiarios: [...INITIAL_GASTOS_DIARIOS],
  gastosOcio: [...INITIAL_GASTOS_OCIO],
  comprasTdc: [...INITIAL_COMPRAS_TDC],
  historicoGastos: [],
  historicoFuturo: []
};

// Suscriptores a cambios
const listeners = new Set();
function notifyListeners() {
  const gastos = computeGastos(memoryState.configGastos, memoryState.gastosDiarios, memoryState.historicoGastos);
  const futuro = computeFuturo(
    memoryState.configFuturo,
    memoryState.configGastos,
    memoryState.gastosOcio,
    memoryState.comprasTdc,
    memoryState.gastosDiarios,
    memoryState.historicoFuturo,
    memoryState.historicoGastos
  );
  for (const cb of listeners) {
    try {
      cb({
        gastos,
        futuro,
        historialGastos: memoryState.historicoGastos,
        historialFuturo: memoryState.historicoFuturo
      });
    } catch (e) {
      console.error("Error en listener de Firestore:", e);
    }
  }
}

// Inicialización de escuchadores en tiempo real (onSnapshot)
let isInitialized = false;
export function initFirestoreListeners() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    // 1. Config Gastos
    onSnapshot(doc(db, "config_gastos", "main"), async (docSnap) => {
      if (docSnap.exists()) {
        memoryState.configGastos = docSnap.data();
      } else {
        // Sembrar datos iniciales si no existe
        await setDoc(doc(db, "config_gastos", "main"), INITIAL_CONFIG_GASTOS);
        memoryState.configGastos = { ...INITIAL_CONFIG_GASTOS };
      }
      notifyListeners();
    }, (err) => console.warn("Firestore config_gastos snapshot:", err.message));

    // 2. Config Futuro
    onSnapshot(doc(db, "config_futuro", "main"), async (docSnap) => {
      if (docSnap.exists()) {
        memoryState.configFuturo = docSnap.data();
      } else {
        await setDoc(doc(db, "config_futuro", "main"), INITIAL_CONFIG_FUTURO);
        memoryState.configFuturo = { ...INITIAL_CONFIG_FUTURO };
      }
      notifyListeners();
    }, (err) => console.warn("Firestore config_futuro snapshot:", err.message));

    // 3. Gastos Diarios
    const qGastos = query(collection(db, "gastos_diarios"));
    onSnapshot(qGastos, async (snapshot) => {
      if (snapshot.empty && memoryState.gastosDiarios.length === INITIAL_GASTOS_DIARIOS.length) {
        // Si está vacía en la nube la primera vez, sembrar registros iniciales
        for (const item of INITIAL_GASTOS_DIARIOS) {
          await setDoc(doc(db, "gastos_diarios", String(item.id)), item);
        }
      } else {
        const list = [];
        snapshot.forEach((d) => list.push({ ...d.data(), id: d.id, fila: d.id }));
        // Ordenar por fecha descendente
        list.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
        memoryState.gastosDiarios = list;
        notifyListeners();
      }
    }, (err) => console.warn("Firestore gastos_diarios snapshot:", err.message));

    // 4. Gastos Ocio
    const qOcio = query(collection(db, "gastos_ocio"));
    onSnapshot(qOcio, async (snapshot) => {
      if (snapshot.empty && memoryState.gastosOcio.length === INITIAL_GASTOS_OCIO.length) {
        for (const item of INITIAL_GASTOS_OCIO) {
          await setDoc(doc(db, "gastos_ocio", String(item.id)), item);
        }
      } else {
        const list = [];
        snapshot.forEach((d) => list.push({ ...d.data(), id: d.id, fila: d.id }));
        list.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
        memoryState.gastosOcio = list;
        notifyListeners();
      }
    }, (err) => console.warn("Firestore gastos_ocio snapshot:", err.message));

    // 5. Compras TDC Nu
    const qTdc = query(collection(db, "compras_tdc"));
    onSnapshot(qTdc, async (snapshot) => {
      if (snapshot.empty && memoryState.comprasTdc.length === INITIAL_COMPRAS_TDC.length) {
        for (const item of INITIAL_COMPRAS_TDC) {
          await setDoc(doc(db, "compras_tdc", String(item.id)), item);
        }
      } else {
        const list = [];
        snapshot.forEach((d) => list.push({ ...d.data(), id: d.id, fila: d.id }));
        list.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
        memoryState.comprasTdc = list;
        notifyListeners();
      }
    }, (err) => console.warn("Firestore compras_tdc snapshot:", err.message));

    // 6. Histórico Quincenas Gastos
    const qHistG = query(collection(db, "historico_quincenas_gastos"));
    onSnapshot(qHistG, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => list.push({ ...d.data(), id: d.id }));
      list.sort((a, b) => (b.fecha_cierre || '').localeCompare(a.fecha_cierre || ''));
      memoryState.historicoGastos = list;
      notifyListeners();
    }, (err) => console.warn("Firestore historico_quincenas_gastos snapshot:", err.message));

    // 7. Histórico Quincenas Futuro
    const qHistF = query(collection(db, "historico_quincenas_futuro"));
    onSnapshot(qHistF, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => list.push({ ...d.data(), id: d.id }));
      list.sort((a, b) => (b.fecha_cierre || '').localeCompare(a.fecha_cierre || ''));
      memoryState.historicoFuturo = list;
      notifyListeners();
    }, (err) => console.warn("Firestore historico_quincenas_futuro snapshot:", err.message));

  } catch (error) {
    console.warn("Error al inicializar Firestore:", error);
  }
}

// Iniciar escuchadores inmediatamente al importar
initFirestoreListeners();

/**
 * Suscribirse a cambios en tiempo real desde cualquier componente
 */
export function subscribeFinancialData(callback) {
  listeners.add(callback);
  // Llamada inicial inmediata con datos actuales
  callback({
    gastos: computeGastos(memoryState.configGastos, memoryState.gastosDiarios, memoryState.historicoGastos),
    futuro: computeFuturo(
      memoryState.configFuturo,
      memoryState.configGastos,
      memoryState.gastosOcio,
      memoryState.comprasTdc,
      memoryState.gastosDiarios,
      memoryState.historicoFuturo,
      memoryState.historicoGastos
    ),
    historialGastos: memoryState.historicoGastos,
    historialFuturo: memoryState.historicoFuturo
  });
  return () => listeners.delete(callback);
}

// ─────────────────────────────────────────────────────────────────────────────
// OPERACIONES DE GASTOS BÁSICOS
// ─────────────────────────────────────────────────────────────────────────────

export async function getGastos() {
  return computeGastos(memoryState.configGastos, memoryState.gastosDiarios, memoryState.historicoGastos);
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

  // Guardar en Firestore
  const docRef = await addDoc(collection(db, "gastos_diarios"), docData);
  const newRecord = { ...docData, id: docRef.id, fila: docRef.id };
  memoryState.gastosDiarios = [newRecord, ...memoryState.gastosDiarios];

  // Si fue con TDC Nu, registrar automáticamente en compras_tdc
  if (metodo_pago === 'TDC Nu') {
    await addTDC({
      fecha,
      monto,
      concepto,
      categoria: 'Básicos',
      tipo: 'Gasto Diario',
      apartado: 'Sí (En Cajita)',
      estado: 'Pendiente',
      origen_tipo: 'gasto_diario',
      origen_id: docRef.id
    });
  }

  notifyListeners();
  return { status: "success", id: docRef.id, message: "Gasto registrado correctamente" };
}

export async function deleteGasto(id) {
  const idStr = String(id);
  await deleteDoc(doc(db, "gastos_diarios", idStr));
  memoryState.gastosDiarios = memoryState.gastosDiarios.filter(r => String(r.id) !== idStr);
  notifyListeners();
  return { status: "success", message: "Gasto eliminado correctamente" };
}

export async function saveConfigGastos(data) {
  const updated = {
    ...memoryState.configGastos,
    ...data,
    updated_at: new Date().toISOString()
  };
  await setDoc(doc(db, "config_gastos", "main"), updated);
  memoryState.configGastos = updated;
  notifyListeners();
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
  await setDoc(doc(db, "config_gastos", "main"), updated);
  memoryState.configGastos = updated;
  notifyListeners();
  return { status: "success", aportaciones_directas: finalVal };
}

export async function limpiarRegistroGastos() {
  const batch = writeBatch(db);
  const snap = await getDocs(collection(db, "gastos_diarios"));
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  memoryState.gastosDiarios = [];
  notifyListeners();
  return { status: "success", message: "Registro diario limpiado" };
}

export async function cerrarQuincenaGastos(data) {
  const current = computeGastos(memoryState.configGastos, memoryState.gastosDiarios, memoryState.historicoGastos);
  const res = current.resumen;

  const cierreData = {
    periodo: data.periodo || `Quincena ${new Date().toLocaleDateString()}`,
    mes: data.mes || new Date().toLocaleString('es-MX', { month: 'long' }),
    anio: data.anio || new Date().getFullYear(),
    fecha_cierre: data.fecha_cierre || new Date().toISOString().split('T')[0],
    presupuesto: res.presupuesto_total,
    gastos_fijos: res.total_gastos_fijos,
    gasto_real: res.gasto_total_real,
    remanente: res.remanente_total,
    ahorro_moto_80: res.excedente_80_moto,
    refuerzo_gustos_20: res.excedente_20_salidas,
    num_movimientos: memoryState.gastosDiarios.length,
    detalle_json: JSON.stringify({
      registros: memoryState.gastosDiarios,
      desglose_categorias: res,
      monto_copias: res.monto_copias,
      monto_imprevistos: res.monto_imprevistos
    }),
    created_at: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, "historico_quincenas_gastos"), cierreData);
  memoryState.historicoGastos = [{ ...cierreData, id: docRef.id }, ...memoryState.historicoGastos];

  // Limpiar gastos diarios activos para el siguiente período
  await limpiarRegistroGastos();
  notifyListeners();
  return { status: "success", message: "Quincena archivada en el histórico exitosamente" };
}

export async function getHistorialGastos() {
  // Estructurar histórico consolidado por meses para el Estado de Cuenta
  const cierres = memoryState.historicoGastos;
  const mesesMap = {};

  for (const c of cierres) {
    const key = `${c.mes} ${c.anio}`;
    if (!mesesMap[key]) {
      mesesMap[key] = {
        mes_anio: key,
        mes: c.mes,
        anio: c.anio,
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
      if (Array.isArray(det.registros)) {
        for (const r of det.registros) {
          m.transacciones.push({ ...r, quincena: c.periodo });
        }
      }
    } catch (e) {}
  }

  const meses = Object.values(mesesMap);
  return {
    status: "success",
    cierres,
    meses
  };
}

export async function borrarCierreGastos(id) {
  const idStr = String(id);
  await deleteDoc(doc(db, "historico_quincenas_gastos", idStr));
  memoryState.historicoGastos = memoryState.historicoGastos.filter(c => String(c.id) !== idStr);
  notifyListeners();
  return { status: "success", message: "Quincena eliminada del histórico" };
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
    memoryState.historicoGastos
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
  const newRecord = { ...docData, id: docRef.id, fila: docRef.id };
  memoryState.gastosOcio = [newRecord, ...memoryState.gastosOcio];

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

  notifyListeners();
  return { status: "success", id: docRef.id, message: "Gasto de ocio registrado" };
}

export async function deleteGastoOcio(id) {
  const idStr = String(id);
  await deleteDoc(doc(db, "gastos_ocio", idStr));
  memoryState.gastosOcio = memoryState.gastosOcio.filter(r => String(r.id) !== idStr);
  notifyListeners();
  return { status: "success", message: "Gasto de ocio eliminado" };
}

export async function updateAportacionFuturo(tipo, monto) {
  const val = round2(monto);
  const updated = { ...memoryState.configFuturo, updated_at: new Date().toISOString() };
  if (tipo === 'cetes') updated.cetes_aportado_activo = val;
  else if (tipo === 'emergencia') updated.emergencia_aportado_activo = val;
  else if (tipo === 'retiro') updated.retiro_aportado_activo = val;

  await setDoc(doc(db, "config_futuro", "main"), updated);
  memoryState.configFuturo = updated;
  notifyListeners();
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
    memoryState.historicoGastos
  );

  const ocio = current.otros_fondos.ocio;
  const emg = current.otros_fondos.emergencia;
  const ret = current.otros_fondos.retiro;
  const cet = current.otros_fondos.cetes;
  const caj = current.otros_fondos.cajita_turbo;

  const cierreData = {
    periodo: data.periodo || `Quincena ${new Date().toLocaleDateString()}`,
    mes: data.mes || new Date().toLocaleString('es-MX', { month: 'long' }),
    anio: data.anio || new Date().getFullYear(),
    fecha_cierre: data.fecha_cierre || new Date().toISOString().split('T')[0],
    presupuesto_ocio: ocio.presupuesto,
    gasto_ocio: ocio.gasto_real,
    remanente_ocio: ocio.remanente,
    aporte_emergencia: emg.aportado,
    aporte_retiro: ret.aportado,
    aporte_cetes: cet.aportado,
    total_cajita_cierre: caj.gran_total,
    num_movimientos: memoryState.gastosOcio.length,
    detalle_json: JSON.stringify({
      registros_ocio: memoryState.gastosOcio
    }),
    created_at: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, "historico_quincenas_futuro"), cierreData);
  memoryState.historicoFuturo = [{ ...cierreData, id: docRef.id }, ...memoryState.historicoFuturo];

  // Limpiar gastos de ocio para la siguiente quincena
  const batch = writeBatch(db);
  const snap = await getDocs(collection(db, "gastos_ocio"));
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  memoryState.gastosOcio = [];

  notifyListeners();
  return { status: "success", message: "Quincena de Futuro archivada" };
}

export async function getHistorialFuturo() {
  return {
    status: "success",
    historial: memoryState.historicoFuturo
  };
}

export async function borrarCierreFuturo(id) {
  const idStr = String(id);
  await deleteDoc(doc(db, "historico_quincenas_futuro", idStr));
  memoryState.historicoFuturo = memoryState.historicoFuturo.filter(c => String(c.id) !== idStr);
  notifyListeners();
  return { status: "success", message: "Quincena de Futuro eliminada" };
}

export async function ajustarCajitaTurbo(data) {
  const updated = {
    ...memoryState.configFuturo,
    updated_at: new Date().toISOString()
  };

  if (data.saldo_real_ajustado !== undefined) {
    updated.saldo_real_ajustado = data.saldo_real_ajustado != null ? round2(data.saldo_real_ajustado) : null;
  }
  if (data.rendimiento_real_nu !== undefined) {
    updated.rendimiento_real_nu = round2(data.rendimiento_real_nu);
  }

  await setDoc(doc(db, "config_futuro", "main"), updated);
  memoryState.configFuturo = updated;
  notifyListeners();
  return { status: "success", message: "Cajita Turbo conciliada correctamente" };
}

// ─────────────────────────────────────────────────────────────────────────────
// OPERACIONES DE TARJETA DE CRÉDITO NU (TDC)
// ─────────────────────────────────────────────────────────────────────────────

export async function addTDC(data) {
  const docData = {
    fecha: data.fecha || new Date().toISOString().split('T')[0],
    monto: round2(data.monto),
    concepto: data.concepto || "",
    categoria: data.categoria || "Básicos",
    tipo: data.tipo || "Gasto Diario",
    apartado: data.apartado || "Sí (En Cajita)",
    estado: data.estado || "Pendiente",
    origen_tipo: data.origen_tipo || null,
    origen_id: data.origen_id || null,
    created_at: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, "compras_tdc"), docData);
  const newRecord = { ...docData, id: docRef.id, fila: docRef.id };
  memoryState.comprasTdc = [newRecord, ...memoryState.comprasTdc];
  notifyListeners();
  return { status: "success", id: docRef.id, message: "Compra TDC registrada" };
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
  memoryState.comprasTdc = memoryState.comprasTdc.map(c => String(c.id) === idStr ? { ...c, ...updatedFields } : c);
  notifyListeners();
  return { status: "success", message: "Compra TDC actualizada" };
}

export async function deleteTDC(id) {
  const idStr = String(id);
  await deleteDoc(doc(db, "compras_tdc", idStr));
  memoryState.comprasTdc = memoryState.comprasTdc.filter(c => String(c.id) !== idStr);
  notifyListeners();
  return { status: "success", message: "Compra TDC eliminada" };
}

export async function payTDC() {
  const batch = writeBatch(db);
  for (const c of memoryState.comprasTdc) {
    if (c.estado !== 'Liquidado') {
      const docRef = doc(db, "compras_tdc", String(c.id));
      batch.update(docRef, { estado: 'Liquidado' });
    }
  }
  await batch.commit();

  memoryState.comprasTdc = memoryState.comprasTdc.map(c => ({ ...c, estado: 'Liquidado' }));
  notifyListeners();
  return { status: "success", message: "Tarjeta Nu liquidada (Totalero)" };
}

export async function saveConfigFuturo(data) {
  const updated = {
    ...memoryState.configFuturo,
    ...data,
    updated_at: new Date().toISOString()
  };
  await setDoc(doc(db, "config_futuro", "main"), updated);
  memoryState.configFuturo = updated;
  notifyListeners();
  return { status: "success", message: "Configuración de Futuro guardada" };
}
