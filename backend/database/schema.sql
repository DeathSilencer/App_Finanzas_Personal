-- =============================================================================
-- ESQUEMA DE BASE DE DATOS SQLITE: SISTEMA DE CONTROL FINANCIERO PERSONAL
-- Archivo: finanzas.db
-- =============================================================================

PRAGMA foreign_keys = ON;

-- 1. Configuración de Gastos Básicos (Celdas Amarillas & Simulador Moto)
CREATE TABLE IF NOT EXISTS config_gastos (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    presupuesto_asignado REAL NOT NULL DEFAULT 2500.0,
    monto_combi REAL NOT NULL DEFAULT 320.0,
    monto_comida REAL NOT NULL DEFAULT 180.0,
    monto_copias REAL NOT NULL DEFAULT 50.0,
    monto_imprevistos REAL NOT NULL DEFAULT 200.0,
    meta_moto REAL NOT NULL DEFAULT 35000.0,
    dias_libres_cuatri INTEGER NOT NULL DEFAULT 25,
    quincenas_cuatri INTEGER NOT NULL DEFAULT 8,
    aportaciones_directas_moto REAL NOT NULL DEFAULT 0.0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bitácora de Gastos Diarios Básicos (filas de Registro Diario)
CREATE TABLE IF NOT EXISTS gastos_diarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    dia TEXT NOT NULL,
    monto REAL NOT NULL,
    categoria TEXT NOT NULL,
    concepto TEXT NOT NULL,
    metodo_pago TEXT NOT NULL DEFAULT 'Efectivo',
    retirado TEXT NOT NULL DEFAULT 'Sí',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Histórico de Quincenas Cerradas de Gastos Básicos
CREATE TABLE IF NOT EXISTS historico_quincenas_gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    periodo TEXT NOT NULL,
    mes TEXT NOT NULL,
    anio INTEGER NOT NULL,
    fecha_cierre TEXT NOT NULL,
    presupuesto REAL NOT NULL,
    gastos_fijos REAL NOT NULL,
    gasto_real REAL NOT NULL,
    remanente REAL NOT NULL,
    ahorro_moto_80 REAL NOT NULL,
    refuerzo_gustos_20 REAL NOT NULL,
    num_movimientos INTEGER NOT NULL DEFAULT 0,
    detalle_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Configuración Maestra del Plan a Futuro & Regla 50/30/10/5/5
CREATE TABLE IF NOT EXISTS config_futuro (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    ingreso_base REAL NOT NULL DEFAULT 5000.0,
    tasa_nu REAL NOT NULL DEFAULT 0.13,
    tasa_cetes REAL NOT NULL DEFAULT 0.0645,
    tasa_afore REAL NOT NULL DEFAULT 0.085,
    pct_p1 REAL NOT NULL DEFAULT 0.05,
    pct_p2 REAL NOT NULL DEFAULT 0.50,
    pct_p7 REAL NOT NULL DEFAULT 0.30,
    pct_p3 REAL NOT NULL DEFAULT 0.10,
    pct_p6 REAL NOT NULL DEFAULT 0.05,
    tdc_limite REAL NOT NULL DEFAULT 4000.0,
    tdc_corte INTEGER NOT NULL DEFAULT 23,
    tdc_pago INTEGER NOT NULL DEFAULT 3,
    cetes_aportado_activo REAL NOT NULL DEFAULT 250.0,
    cetes_estado TEXT NOT NULL DEFAULT 'Aportado (Cetesdirecto)',
    emergencia_aportado_activo REAL NOT NULL DEFAULT 500.0,
    retiro_aportado_activo REAL NOT NULL DEFAULT 250.0,
    rendimiento_real_nu REAL NOT NULL DEFAULT 0.0,
    saldo_real_ajustado REAL DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bitácora de Gastos de Ocio (Sub-contabilidad Cajita Turbo Nu)
CREATE TABLE IF NOT EXISTS gastos_ocio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    dia TEXT NOT NULL,
    monto REAL NOT NULL,
    categoria TEXT NOT NULL,
    concepto TEXT NOT NULL,
    metodo_pago TEXT NOT NULL DEFAULT 'Débito Nu',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Compras y Movimientos en Tarjeta de Crédito Nu (Control TDC)
CREATE TABLE IF NOT EXISTS compras_tdc (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    monto REAL NOT NULL,
    concepto TEXT NOT NULL,
    categoria TEXT NOT NULL DEFAULT 'Básicos',
    tipo TEXT NOT NULL DEFAULT 'Gasto Diario',
    apartado TEXT NOT NULL DEFAULT 'Sí (En Cajita)',
    estado TEXT NOT NULL DEFAULT 'Pendiente',
    origen_tipo TEXT,
    origen_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Histórico de Quincenas Cerradas de Futuro (Ocio, Cajita Nu & Cetes)
CREATE TABLE IF NOT EXISTS historico_quincenas_futuro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    periodo TEXT NOT NULL,
    mes TEXT NOT NULL,
    anio INTEGER NOT NULL,
    fecha_cierre TEXT NOT NULL,
    presupuesto_ocio REAL NOT NULL,
    gasto_ocio REAL NOT NULL,
    remanente_ocio REAL NOT NULL,
    aporte_emergencia REAL NOT NULL,
    aporte_retiro REAL NOT NULL,
    aporte_cetes REAL NOT NULL,
    total_cajita_cierre REAL NOT NULL,
    num_movimientos INTEGER NOT NULL DEFAULT 0,
    detalle_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
