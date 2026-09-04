/**
 * Servicios de comunicación HTTP con la API de finanzas (SQLite).
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Error HTTP ${res.status}`);
  }
  return data;
}

// ── Gastos Básicos ───────────────────────────────────────────────────────────
export const getGastos = () => request('/gastos');
export const addGasto = (data) => request('/gastos/add', { method: 'POST', body: JSON.stringify(data) });
export const deleteGasto = (id) => request('/gastos/delete', { method: 'POST', body: JSON.stringify({ id }) });
export const saveConfigGastos = (data) => request('/gastos/config', { method: 'POST', body: JSON.stringify(data) });
export const motoAporte = (monto, modo = 'sumar') => request('/gastos/moto_aporte', { method: 'POST', body: JSON.stringify({ monto, modo }) });
export const limpiarRegistroGastos = () => request('/gastos/limpiar_registro', { method: 'POST' });
export const cerrarQuincenaGastos = (data) => request('/gastos/cerrar_quincena', { method: 'POST', body: JSON.stringify(data) });
export const getHistorialGastos = () => request('/gastos/historial');
export const borrarCierreGastos = (id) => request('/gastos/borrar_cierre', { method: 'POST', body: JSON.stringify({ id }) });

// ── Plan a Futuro & Cajita Turbo Nu ──────────────────────────────────────────
export const getFuturo = () => request('/futuro');
export const addGastoOcio = (data) => request('/futuro/gasto_ocio', { method: 'POST', body: JSON.stringify(data) });
export const deleteGastoOcio = (id) => request('/futuro/delete_gasto_ocio', { method: 'POST', body: JSON.stringify({ id }) });
export const updateAportacionFuturo = (tipo, monto) => request('/futuro/aportacion', { method: 'POST', body: JSON.stringify({ tipo, monto }) });
export const cerrarQuincenaFuturo = (data) => request('/futuro/cerrar_quincena', { method: 'POST', body: JSON.stringify(data) });
export const getHistorialFuturo = () => request('/futuro/historial');
export const borrarCierreFuturo = (id) => request('/futuro/borrar_cierre', { method: 'POST', body: JSON.stringify({ id }) });
export const ajustarCajitaTurbo = (data) => request('/futuro/cajita/ajuste', { method: 'POST', body: JSON.stringify(data) });

// ── Tarjeta de Crédito Nu ───────────────────────────────────────────────────
export const addTDC = (data) => request('/futuro/tdc_add', { method: 'POST', body: JSON.stringify(data) });
export const editTDC = (data) => request('/futuro/tdc_edit', { method: 'POST', body: JSON.stringify(data) });
export const deleteTDC = (id) => request('/futuro/tdc_delete', { method: 'POST', body: JSON.stringify({ id }) });
export const payTDC = () => request('/futuro/tdc_pay', { method: 'POST' });
export const saveConfigFuturo = (data) => request('/futuro/config', { method: 'POST', body: JSON.stringify(data) });
