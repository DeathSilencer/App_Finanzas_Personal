/**
 * seedData.js — Datos iniciales extraídos directamente de SQLite (data/finanzas.db).
 * Se utilizan para inicializar Firestore si las colecciones están vacías.
 */

export const INITIAL_CONFIG_GASTOS = {
  presupuesto_asignado: 2500.0,
  monto_combi: 376.0,
  monto_comida: 180.0,
  monto_copias: 50.0,
  monto_imprevistos: 200.0,
  meta_moto: 35000.0,
  dias_libres_cuatri: 25,
  quincenas_cuatri: 8,
  aportaciones_directas_moto: 0.0,
  updated_at: "2026-09-01 04:00:39"
};

export const INITIAL_GASTOS_DIARIOS = [
  {
    id: "53",
    fecha: "2026-09-01",
    dia: "Martes",
    monto: 32.0,
    categoria: "🚌 Pasajes Combi (Efectivo)",
    concepto: "Combi ida y regreso",
    metodo_pago: "Efectivo",
    retirado: "Sí (Efectivo)"
  },
  {
    id: "56",
    fecha: "2026-09-02",
    dia: "Miércoles",
    monto: 32.0,
    categoria: "🚌 Pasajes Combi (Efectivo)",
    concepto: "Combi ida y regreso",
    metodo_pago: "Efectivo",
    retirado: "Sí (Efectivo)"
  },
  {
    id: "57",
    fecha: "2026-09-03",
    dia: "Jueves",
    monto: 32.0,
    categoria: "🚌 Pasajes Combi (Efectivo)",
    concepto: "Combi ida y regreso",
    metodo_pago: "Efectivo",
    retirado: "Sí (Efectivo)"
  },
  {
    id: "61",
    fecha: "2026-09-03",
    dia: "Jueves",
    monto: 16.0,
    categoria: "📄 Copias, Material & Papelería",
    concepto: "Pintura y cartulina",
    metodo_pago: "Débito Nu",
    retirado: "En Cajita Nu"
  },
  {
    id: "71",
    fecha: "2026-09-04",
    dia: "Viernes",
    monto: 152.0,
    categoria: "🥪 Comidas en Escuela (Efectivo)",
    concepto: "Pago Constancia e Historial",
    metodo_pago: "Efectivo",
    retirado: "Sí (Efectivo)"
  },
  {
    id: "72",
    fecha: "2026-09-03",
    dia: "Jueves",
    monto: 8.0,
    categoria: "📄 Copias, Material & Papelería",
    concepto: "Copias urgentes",
    metodo_pago: "Efectivo",
    retirado: "Sí (Efectivo)"
  }
];

export const INITIAL_CONFIG_FUTURO = {
  ingreso_base: 5000.0,
  tasa_nu: 0.13,
  tasa_cetes: 0.0645,
  tasa_afore: 0.085,
  pct_p1: 0.05,
  pct_p2: 0.5,
  pct_p7: 0.3,
  pct_p3: 0.1,
  pct_p6: 0.05,
  tdc_limite: 500.0,
  tdc_corte: 23,
  tdc_pago: 3,
  cetes_aportado_activo: 250.0,
  cetes_estado: "Aportado (Cetesdirecto)",
  emergencia_aportado_activo: 500.0,
  retiro_aportado_activo: 250.0,
  rendimiento_real_nu: 5.88,
  saldo_real_ajustado: 3682.95,
  updated_at: "2026-09-04 14:08:39"
};

export const INITIAL_GASTOS_OCIO = [
  {
    id: "10",
    fecha: "2026-09-01",
    dia: "Martes",
    monto: 150.0,
    categoria: "🎮 Videojuegos & Digital",
    concepto: "Pago juego",
    metodo_pago: "Débito Nu"
  },
  {
    id: "11",
    fecha: "2026-09-01",
    dia: "Martes",
    monto: 100.0,
    categoria: "✨ Otros Gustos",
    concepto: "Pago mama",
    metodo_pago: "Débito Nu"
  }
];

export const INITIAL_COMPRAS_TDC = [
  {
    id: "6",
    fecha: "2026-09-12",
    monto: 79.0,
    concepto: "Pago Spotify Mensual",
    categoria: "Ocio",
    tipo: "Gasto Diario",
    apartado: "Sí (En Cajita)",
    estado: "Pendiente"
  }
];
