/**
 * financialEngine.js — Motor de cálculos matemáticos y financieros en cliente.
 * Garantiza paridad matemática 100% con las fórmulas bancarias y de Excel.
 */

// Utilidad para redondear a 2 decimales
export const round2 = (val) => Math.round((Number(val) || 0) * 100) / 100;

export function getDiaSemana(fechaStr) {
  if (!fechaStr) return 'Lunes';
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  try {
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return dias[d.getDay()];
    }
    return dias[new Date(fechaStr).getDay()] || 'Lunes';
  } catch (e) {
    return 'Lunes';
  }
}

/**
 * Calcula todo el estado financiero de Gastos Básicos.
 */
export function computeGastos(config = {}, registros = [], historico = []) {
  const presupuesto_asignado = Number(config.presupuesto_asignado ?? 2500);
  const monto_combi = Number(config.monto_combi ?? 376);
  const monto_comida = Number(config.monto_comida ?? 180);
  const monto_copias = Number(config.monto_copias ?? 50);
  const monto_imprevistos = Number(config.monto_imprevistos ?? 200);
  const meta_moto = Number(config.meta_moto ?? 35000);
  const dias_libres_cuatri = Number(config.dias_libres_cuatri ?? 25);
  const quincenas_cuatri = Number(config.quincenas_cuatri ?? 8);
  const aportaciones_directas = Number(config.aportaciones_directas_moto ?? 0);

  // Agrupar por categoría
  const gastos_por_cat = {};
  for (const r of registros) {
    const cat = r.categoria || 'Otros';
    gastos_por_cat[cat] = (gastos_por_cat[cat] || 0) + (Number(r.monto) || 0);
  }

  const gasto_total_real = round2(registros.reduce((sum, r) => sum + (Number(r.monto) || 0), 0));
  const remanente_total = Math.max(0, round2(presupuesto_asignado - gasto_total_real));
  const pct_consumido = presupuesto_asignado > 0 ? Math.round((gasto_total_real / presupuesto_asignado) * 1000) / 10 : 0;

  const total_fijos = round2(monto_combi + monto_comida + monto_copias + monto_imprevistos);
  const efectivo_a_retirar = round2(monto_combi + monto_comida);
  const presupuesto_efectivo_base = round2(monto_combi + monto_comida);

  const gasto_combi = gastos_por_cat["🚌 Pasajes Combi (Efectivo)"] || 0;
  const gasto_comida = gastos_por_cat["🥪 Comidas en Escuela (Efectivo)"] || 0;
  const gasto_copias = gastos_por_cat["📄 Copias, Material & Papelería"] || 0;
  const gasto_imprevistos = gastos_por_cat["🛡️ Imprevistos / Por si acaso"] || 0;

  const gasto_copias_efectivo = round2(
    registros.filter(r => (r.categoria || '').includes("Copias") && r.metodo_pago === "Efectivo")
             .reduce((sum, r) => sum + (Number(r.monto) || 0), 0)
  );
  const gasto_copias_digital = round2(
    registros.filter(r => (r.categoria || '').includes("Copias") && r.metodo_pago !== "Efectivo")
             .reduce((sum, r) => sum + (Number(r.monto) || 0), 0)
  );

  let sobrante_combi = 0;
  let sobrante_comida = 0;
  let sobrante_efectivo_mano = 0;
  let efectivo_neto_retirar = presupuesto_efectivo_base;
  let sacar_combi = monto_combi;
  let sacar_comida = monto_comida;

  if (gasto_combi > 0 || gasto_comida > 0) {
    sobrante_combi = Math.max(0, round2(monto_combi - gasto_combi));
    sobrante_comida = Math.max(0, round2(monto_comida - gasto_comida));
    sobrante_efectivo_mano = round2(sobrante_combi + sobrante_comida);
    efectivo_neto_retirar = Math.max(0, round2(presupuesto_efectivo_base - sobrante_efectivo_mano));
    sacar_combi = Math.max(0, round2(monto_combi - sobrante_combi));
    sacar_comida = Math.max(0, round2(monto_comida - sobrante_comida));
  }

  const saldo_copias_nu = Math.max(0, round2(monto_copias - gasto_copias));
  const fondear_copias = Math.max(0, round2(monto_copias - saldo_copias_nu));
  const saldo_imprevistos_nu = Math.max(0, round2(monto_imprevistos - gasto_imprevistos));
  const fondear_imprevistos = Math.max(0, round2(monto_imprevistos - saldo_imprevistos_nu));

  const proximo_presupuesto_efectivo_base = round2(monto_combi + monto_comida + monto_copias);
  const proximo_sacar_copias = monto_copias;
  const proximo_efectivo_neto_retirar = round2(sacar_combi + sacar_comida + proximo_sacar_copias);

  const excedente_fijo = Math.max(0, round2(presupuesto_asignado - total_fijos));
  const excedente_80_moto = round2(excedente_fijo * 0.80);
  const excedente_20_salidas = round2(excedente_fijo * 0.20);

  // Categorías
  const categorias_def = [
    {
      categoria: "🚌 Pasajes Combi (Efectivo)",
      mecanica: "$32 diarios x 10 días hábiles de escuela",
      presupuesto: monto_combi,
      pct: presupuesto_asignado > 0 ? Math.round((monto_combi / presupuesto_asignado) * 1000) / 10 : 0
    },
    {
      categoria: "🥪 Comidas en Escuela (Efectivo)",
      mecanica: "Comidas ligeras en días escolares",
      presupuesto: monto_comida,
      pct: presupuesto_asignado > 0 ? Math.round((monto_comida / presupuesto_asignado) * 1000) / 10 : 0
    },
    {
      categoria: "📄 Copias, Material & Papelería",
      mecanica: "Material escolar e impresiones",
      presupuesto: monto_copias,
      pct: presupuesto_asignado > 0 ? Math.round((monto_copias / presupuesto_asignado) * 1000) / 10 : 0
    },
    {
      categoria: "🛡️ Imprevistos / Por si acaso",
      mecanica: "Fondo de contingencia escolar",
      presupuesto: monto_imprevistos,
      pct: presupuesto_asignado > 0 ? Math.round((monto_imprevistos / presupuesto_asignado) * 1000) / 10 : 0
    },
    {
      categoria: "🛡️ Excedente 80%: Fondo Emergencia / Moto",
      mecanica: "Ahorro acelerado para compra de moto de contado",
      presupuesto: excedente_80_moto,
      pct: presupuesto_asignado > 0 ? Math.round((excedente_80_moto / presupuesto_asignado) * 1000) / 10 : 0
    },
    {
      categoria: "🍕 Excedente 20%: Refuerzo Gustos / Salidas",
      mecanica: "Refuerzo para ocio y salidas de fin de semana",
      presupuesto: excedente_20_salidas,
      pct: presupuesto_asignado > 0 ? Math.round((excedente_20_salidas / presupuesto_asignado) * 1000) / 10 : 0
    }
  ];

  const categorias = categorias_def.map(cat_info => {
    const real = gastos_por_cat[cat_info.categoria] || 0;
    const rem = Math.max(0, round2(cat_info.presupuesto - real));
    const pct_c = cat_info.presupuesto > 0 ? Math.round((real / cat_info.presupuesto) * 1000) / 10 : 0;
    let semaforo = "🟢 Sin consumo";
    if (pct_c === 0) semaforo = "🟢 Sin consumo";
    else if (pct_c <= 75) semaforo = "🟢 En Presupuesto";
    else if (pct_c <= 100) semaforo = "🟡 Cuidado";
    else semaforo = "🔴 Excedido";

    return {
      categoria: cat_info.categoria,
      mecanica: cat_info.mecanica,
      presupuesto: cat_info.presupuesto,
      pct: cat_info.pct,
      gasto_real: real,
      remanente: rem,
      pct_consumido: pct_c,
      semaforo
    };
  });

  // Simulador Moto
  const ahorro_acumulado_historico = round2(historico.reduce((sum, h) => sum + (Number(h.ahorro_moto_80) || 0), 0));
  const total_ahorrado_moto = round2(ahorro_acumulado_historico + aportaciones_directas);

  const costo_diario_combi_escolar = 32.0;
  const costo_diario_comida = monto_comida / 10.0;
  const costo_diario_escolar = costo_diario_combi_escolar + costo_diario_comida;
  const ahorro_extra_vacaciones = round2(dias_libres_cuatri * costo_diario_escolar);

  const ahorro_cuatri = round2((excedente_80_moto * quincenas_cuatri) + ahorro_extra_vacaciones);
  const cuatris_necesarios = ahorro_cuatri > 0 ? round2(meta_moto / ahorro_cuatri) : 0;
  const meses_estimados = Math.round(cuatris_necesarios * 4 * 10) / 10;

  const simulador_moto = {
    meta_total: meta_moto,
    ahorro_extra_vacaciones,
    dias_libres_cuatri,
    costo_diario_escolar,
    excedente_quincenal_80: excedente_80_moto,
    quincenas_cuatri,
    ahorro_por_cuatrimestre: ahorro_cuatri,
    cuatris_estimados: cuatris_necesarios,
    meses_estimados,
    aportaciones_directas,
    ahorro_acumulado_historico,
    total_ahorrado_acumulado: total_ahorrado_moto,
    pct_meta_cumplido: meta_moto > 0 ? Math.round((total_ahorrado_moto / meta_moto) * 1000) / 10 : 0
  };

  return {
    status: 'success',
    resumen: {
      presupuesto_total: presupuesto_asignado,
      gasto_total_real,
      remanente_total,
      pct_consumido,
      total_gastos_fijos: total_fijos,
      efectivo_a_retirar,
      presupuesto_efectivo_base,
      sobrante_efectivo_mano,
      efectivo_neto_retirar,
      sobrante_combi,
      sobrante_comida,
      sacar_combi,
      sacar_comida,
      saldo_copias_nu,
      fondear_copias,
      saldo_imprevistos_nu,
      fondear_imprevistos,
      proximo_presupuesto_efectivo_base,
      proximo_sacar_copias,
      proximo_efectivo_neto_retirar,
      gasto_copias_efectivo,
      gasto_copias_digital,
      monto_combi,
      monto_comida,
      monto_copias,
      monto_imprevistos,
      excedente_base_fijo: excedente_fijo,
      excedente_80_moto,
      excedente_20_salidas
    },
    categorias,
    registros,
    simulador_moto
  };
}

/**
 * Calcula todo el estado del Plan a Futuro y Cajita Turbo Nu.
 */
export function computeFuturo(
  configFuturo = {},
  configGastos = {},
  registrosOcio = [],
  comprasTdc = [],
  registrosGastos = [],
  historicoFuturo = [],
  historicoGastos = []
) {
  const ingreso_base = Number(configFuturo.ingreso_base ?? 5000);
  const tasa_nu = Number(configFuturo.tasa_nu ?? 0.13);
  const tasa_cetes = Number(configFuturo.tasa_cetes ?? 0.0645);
  const tasa_afore = Number(configFuturo.tasa_afore ?? 0.085);
  const pct_p1 = Number(configFuturo.pct_p1 ?? 0.05);
  const pct_p2 = Number(configFuturo.pct_p2 ?? 0.50);
  const pct_p7 = Number(configFuturo.pct_p7 ?? 0.30);
  const pct_p3 = Number(configFuturo.pct_p3 ?? 0.10);
  const pct_p6 = Number(configFuturo.pct_p6 ?? 0.05);
  const tdc_limite = Number(configFuturo.tdc_limite ?? 500);
  const tdc_corte = Number(configFuturo.tdc_corte ?? 23);
  const tdc_pago = Number(configFuturo.tdc_pago ?? 3);
  const cetes_aportado = Number(configFuturo.cetes_aportado_activo ?? 250);
  const cetes_estado = String(configFuturo.cetes_estado || 'Aportado (Cetesdirecto)');
  const emergencia_aportado = Number(configFuturo.emergencia_aportado_activo ?? 500);
  const retiro_aportado = Number(configFuturo.retiro_aportado_activo ?? 250);
  const rendimiento_real_nu = Number(configFuturo.rendimiento_real_nu ?? 0);
  const saldo_real_ajustado = configFuturo.saldo_real_ajustado != null ? Number(configFuturo.saldo_real_ajustado) : null;

  // 1. Distribución
  const distribucion = {
    p1_involuntario: { pct: pct_p1, quincenal: ingreso_base * pct_p1, mensual: ingreso_base * pct_p1 * 2, destino: "Cetesdirecto (3 Meses)" },
    p2_basicos:      { pct: pct_p2, quincenal: ingreso_base * pct_p2, mensual: ingreso_base * pct_p2 * 2, destino: "Nu Cajita Básicos (13%) -> TDC / Débito" },
    p7_ocio:         { pct: pct_p7, quincenal: ingreso_base * pct_p7, mensual: ingreso_base * pct_p7 * 2, destino: "Nu Cajita Ocio (13%) -> Débito Directo" },
    p3_emergencia:   { pct: pct_p3, quincenal: ingreso_base * pct_p3, mensual: ingreso_base * pct_p3 * 2, destino: "Nu Cajita Emergencia (Meta 3 Meses)" },
    p6_retiro:       { pct: pct_p6, quincenal: ingreso_base * pct_p6, mensual: ingreso_base * pct_p6 * 2, destino: "AFORE XXI Banorte (Art. 151 LISR)" }
  };

  // 2. CETES 25 años
  const aporte_cetes_anual = (ingreso_base * pct_p1 * 2) * 12;
  const cetes_tabla = [];
  for (let yr = 1; yr <= 25; yr++) {
    const fv_cetes = aporte_cetes_anual * (((Math.pow(1 + tasa_cetes, yr) - 1) / tasa_cetes)) * (1 + tasa_cetes);
    const ahorro_bolsa = aporte_cetes_anual * yr;
    cetes_tabla.push({
      anio: `Año ${yr}`,
      ahorro_bolsa: round2(ahorro_bolsa),
      interes_acumulado: round2(fv_cetes - ahorro_bolsa),
      saldo_total: round2(fv_cetes)
    });
  }

  // 3. TDC Nu
  const formatted_tdc = comprasTdc.map(c => ({ ...c, fila: c.id }));
  const deuda_actual = round2(formatted_tdc.filter(c => c.estado !== 'Liquidado').reduce((sum, c) => sum + (Number(c.monto) || 0), 0));
  const saldo_disponible = Math.max(0, round2(tdc_limite - deuda_actual));
  const pct_uso_credito = tdc_limite > 0 ? Math.round((deuda_actual / tdc_limite) * 1000) / 10 : 0;

  const hoy = new Date();
  const dia_hoy = hoy.getDate();
  const mes_hoy = hoy.getMonth() + 1;
  const anio_hoy = hoy.getFullYear();

  let proximo_corte = '';
  let proximo_pago = '';
  if (dia_hoy <= tdc_corte) {
    proximo_corte = `${tdc_corte}/${mes_hoy}/${anio_hoy}`;
    const mes_pago = mes_hoy < 12 ? mes_hoy + 1 : 1;
    const anio_pago = mes_hoy < 12 ? anio_hoy : anio_hoy + 1;
    proximo_pago = `${tdc_pago}/${mes_pago}/${anio_pago}`;
  } else {
    const mes_corte = mes_hoy < 12 ? mes_hoy + 1 : 1;
    const anio_corte = mes_hoy < 12 ? anio_hoy : anio_hoy + 1;
    proximo_corte = `${tdc_corte}/${mes_corte}/${anio_corte}`;
    const mes_pago = mes_corte < 12 ? mes_corte + 1 : 1;
    const anio_pago = mes_corte < 12 ? anio_corte : anio_corte + 1;
    proximo_pago = `${tdc_pago}/${mes_pago}/${anio_pago}`;
  }
  const dias_restantes_corte = dia_hoy <= tdc_corte ? (tdc_corte - dia_hoy) : (30 - dia_hoy + tdc_corte);

  // 4. Fondo de Emergencia
  const aporte_emergencia_mensual = ingreso_base * pct_p3 * 2;
  const meta_emergencia = (ingreso_base * pct_p2 * 2) * 3;
  const fe_tabla = [];
  let saldo_fe = 0.0;
  const tasa_mensual_nu = tasa_nu / 12.0;
  for (let m = 1; m <= 24; m++) {
    const interes_m = saldo_fe * tasa_mensual_nu;
    saldo_fe = saldo_fe + aporte_emergencia_mensual + interes_m;
    fe_tabla.push({
      mes: `Mes ${m}`,
      aporte: round2(aporte_emergencia_mensual),
      rendimiento_mes: round2(interes_m),
      saldo_acumulado: round2(saldo_fe),
      pct_meta: meta_emergencia > 0 ? Math.min(100.0, Math.round((saldo_fe / meta_emergencia) * 1000) / 10) : 100.0
    });
  }

  // 5. Retiro SAT
  const aporte_retiro_anual = (ingreso_base * pct_p6 * 2) * 12;
  const sat_tabla = [];
  let saldo_afore = 0.0;
  for (let yr = 1; yr <= 25; yr++) {
    const devolucion_sat = aporte_retiro_anual * 0.15;
    const rend_afore = saldo_afore * tasa_afore;
    saldo_afore = saldo_afore + aporte_retiro_anual + rend_afore;
    sat_tabla.push({
      anio: `Año ${yr}`,
      ahorro_bolsa: round2(aporte_retiro_anual * yr),
      devuelto_sat: round2(devolucion_sat),
      saldo_afore: round2(saldo_afore),
      ganancia_neta: round2(saldo_afore - (aporte_retiro_anual * yr)),
      efecto_mult: yr > 0 ? Math.round((saldo_afore / (aporte_retiro_anual * yr)) * 10) / 10 : 1.0
    });
  }

  // 6. Fondos de Ocio y Cajita Turbo Nu
  const hist_rem_ocio = round2(historicoFuturo.reduce((sum, h) => sum + (Number(h.remanente_ocio) || 0), 0));
  const hist_emg = round2(historicoFuturo.reduce((sum, h) => sum + (Number(h.aporte_emergencia) || 0), 0));

  const aporte_emergencia_quincenal = round2(ingreso_base * pct_p3);
  const saldo_emergencia = Math.max(emergencia_aportado, round2(hist_emg + aporte_emergencia_quincenal));

  const presupuesto_ocio_base = round2(ingreso_base * pct_p7);
  const presupuesto_ocio = round2(presupuesto_ocio_base + hist_rem_ocio);
  const formatted_ocio = registrosOcio.map(r => ({ ...r, fila: r.id }));
  const gasto_real_ocio = round2(formatted_ocio.reduce((sum, r) => sum + (Number(r.monto) || 0), 0));
  const remanente_ocio = Math.max(0, round2(presupuesto_ocio - gasto_real_ocio));
  const pct_consumido_ocio = presupuesto_ocio > 0 ? Math.round((gasto_real_ocio / presupuesto_ocio) * 1000) / 10 : 0;

  // Gastos digitales en Cajita Nu
  const presupuesto_gastos = Number(configGastos.presupuesto_asignado ?? 2500);
  const m_combi = Number(configGastos.monto_combi ?? 376);
  const m_comida = Number(configGastos.monto_comida ?? 180);
  const m_copias = Number(configGastos.monto_copias ?? 50);
  const m_imprevistos = Number(configGastos.monto_imprevistos ?? 200);
  const aporte_dir_moto = Number(configGastos.aportaciones_directas_moto ?? 0);

  const fijos_gastos = round2(m_combi + m_comida + m_copias + m_imprevistos);
  const excedente_fijo_gastos = Math.max(0, round2(presupuesto_gastos - fijos_gastos));
  const monto_moto_80 = round2(excedente_fijo_gastos * 0.80);
  const monto_salidas_20 = round2(excedente_fijo_gastos * 0.20);

  const hist_moto = round2(historicoGastos.reduce((sum, h) => sum + (Number(h.ahorro_moto_80) || 0), 0));
  let hist_salidas = 0;
  let hist_imprevistos = 0;
  let hist_copias = 0;

  for (const h of historicoGastos) {
    try {
      const det = typeof h.detalle_json === 'string' ? JSON.parse(h.detalle_json) : (h.detalle_json || {});
      const cat_g = det.desglose_categorias || {};
      const g_cop = Number(cat_g["📄 Copias, Material & Papelería"] || 0);
      const g_imp = Number(cat_g["🛡️ Imprevistos / Por si acaso"] || 0);
      const g_sal = Number(cat_g["🍕 Excedente 20%: Refuerzo Gustos / Salidas"] || 0);
      hist_copias += Math.max(0, Number(det.monto_copias ?? m_copias) - g_cop);
      hist_imprevistos += Math.max(0, Number(det.monto_imprevistos ?? m_imprevistos) - g_imp);
      hist_salidas += Math.max(0, Number(h.refuerzo_gustos_20 || 0) - g_sal);
    } catch (e) {
      hist_salidas += Number(h.refuerzo_gustos_20 || 0);
    }
  }

  // Filtrar gastos digitales
  const gasto_real_copias = round2(
    registrosGastos.filter(r => (r.categoria || '').includes("Copias") && r.metodo_pago !== "Efectivo")
                   .reduce((sum, r) => sum + (Number(r.monto) || 0), 0)
  );
  const gasto_real_imprevistos = round2(
    registrosGastos.filter(r => (r.categoria || '').includes("Imprevistos") && r.metodo_pago !== "Efectivo")
                   .reduce((sum, r) => sum + (Number(r.monto) || 0), 0)
  );
  const gasto_real_salidas_20 = round2(
    registrosGastos.filter(r => (r.categoria || '').includes("Excedente 20%") && r.metodo_pago !== "Efectivo")
                   .reduce((sum, r) => sum + (Number(r.monto) || 0), 0)
  );
  const gasto_real_moto_80 = round2(
    registrosGastos.filter(r => (r.categoria || '').includes("Excedente 80%") && r.metodo_pago !== "Efectivo")
                   .reduce((sum, r) => sum + (Number(r.monto) || 0), 0)
  );

  const saldo_copias = Math.max(0, round2(hist_copias + m_copias - gasto_real_copias));
  const saldo_imprevistos = Math.max(0, round2(hist_imprevistos + m_imprevistos - gasto_real_imprevistos));
  const saldo_moto_80 = Math.max(0, round2(hist_moto + monto_moto_80 + aporte_dir_moto - gasto_real_moto_80));
  const saldo_salidas_20 = Math.max(0, round2(hist_salidas + monto_salidas_20 - gasto_real_salidas_20));
  const total_digital_gastos = round2(saldo_copias + saldo_imprevistos + saldo_moto_80 + saldo_salidas_20);

  const total_futuro_cajita = round2(remanente_ocio + saldo_emergencia);
  const capital_base_cajita = round2(total_futuro_cajita + total_digital_gastos);

  let gran_total_cajita = capital_base_cajita;
  let rendimientos_ganados_nu = 0;
  if (saldo_real_ajustado !== null && saldo_real_ajustado > 0) {
    gran_total_cajita = round2(saldo_real_ajustado);
    rendimientos_ganados_nu = Math.max(0, round2(gran_total_cajita - capital_base_cajita));
  } else {
    rendimientos_ganados_nu = round2(rendimiento_real_nu);
    gran_total_cajita = round2(capital_base_cajita + rendimientos_ganados_nu);
  }

  const rendimiento_anual_cajita = round2(gran_total_cajita * tasa_nu);
  const rendimiento_mensual_cajita = round2(rendimiento_anual_cajita / 12.0);

  return {
    status: 'success',
    dashboard_maestro: {
      ingreso_base_quincenal: ingreso_base,
      ingreso_base_mensual: ingreso_base * 2,
      distribucion
    },
    cetes: {
      aporte_quincenal: ingreso_base * pct_p1,
      aporte_anual: aporte_cetes_anual,
      tasa_anual: tasa_cetes,
      tabla: cetes_tabla
    },
    tdc_nu: {
      limite_credito: tdc_limite,
      deuda_actual,
      saldo_disponible,
      pct_uso_credito,
      dias_restantes_corte,
      fecha_corte_prox: proximo_corte,
      fecha_pago_prox: proximo_pago,
      dia_corte_config: tdc_corte,
      dia_pago_config: tdc_pago,
      compras: formatted_tdc
    },
    fondo_emergencia: {
      meta_total: meta_emergencia,
      aporte_mensual: aporte_emergencia_mensual,
      tabla: fe_tabla
    },
    retiro_sat: {
      aporte_quincenal: ingreso_base * pct_p6,
      aporte_anual: aporte_retiro_anual,
      tasa_anual_afore: tasa_afore,
      tabla: sat_tabla
    },
    otros_fondos: {
      cetes: {
        presupuesto: ingreso_base * pct_p1,
        aportado: cetes_aportado,
        estado: cetes_estado
      },
      emergencia: {
        presupuesto: ingreso_base * pct_p3,
        aportado: saldo_emergencia,
        meta: meta_emergencia
      },
      retiro: {
        presupuesto: ingreso_base * pct_p6,
        aportado: retiro_aportado
      },
      ocio: {
        presupuesto: presupuesto_ocio,
        gasto_real: gasto_real_ocio,
        remanente: remanente_ocio,
        pct_consumido: pct_consumido_ocio,
        registros: formatted_ocio
      },
      cajita_turbo: {
        gran_total: gran_total_cajita,
        capital_base: capital_base_cajita,
        rendimientos_ganados: rendimientos_ganados_nu,
        saldo_real_ajustado,
        rendimiento_anual: rendimiento_anual_cajita,
        rendimiento_mensual: rendimiento_mensual_cajita,
        total_futuro: total_futuro_cajita,
        total_gastos: total_digital_gastos,
        desglose: {
          fondo_emergencia: saldo_emergencia,
          ocio: remanente_ocio,
          copias: saldo_copias,
          imprevistos: saldo_imprevistos,
          moto_80: saldo_moto_80,
          salidas_20: saldo_salidas_20,
          rendimientos_ganados: rendimientos_ganados_nu
        }
      }
    },
    config: {
      ingreso_base,
      tasa_nu,
      tasa_cetes,
      tasa_afore,
      pct_p1,
      pct_p2,
      pct_p7,
      pct_p3,
      pct_p6,
      tdc_limite,
      tdc_corte,
      tdc_pago,
      cetes_aportado_activo: cetes_aportado,
      emergencia_aportado_activo: emergencia_aportado,
      retiro_aportado_activo: retiro_aportado,
      rendimiento_real_nu,
      saldo_real_ajustado
    }
  };
}
