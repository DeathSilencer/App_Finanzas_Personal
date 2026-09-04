"""
backend/routes/futuro_db_routes.py — Controladores de Plan Financiero a Futuro y Cajita Turbo Nu respaldados por SQLite.
Rendimiento instantáneo, paridad matemática 100% y cero bloqueos de Excel.
"""

import json
from datetime import datetime, date
from database.db import get_connection, row_to_dict, rows_to_dict_list
from helpers.excel_helpers import get_dia_semana, safe_float, safe_int


def handle_get_futuro(handler):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # 1. Configuración Maestra
        cursor.execute("SELECT * FROM config_futuro WHERE id = 1")
        cfg = row_to_dict(cursor.fetchone())
        if not cfg:
            cfg = {
                "ingreso_base": 5000.0,
                "tasa_nu": 0.13,
                "tasa_cetes": 0.0645,
                "tasa_afore": 0.085,
                "pct_p1": 0.05,
                "pct_p2": 0.50,
                "pct_p7": 0.30,
                "pct_p3": 0.10,
                "pct_p6": 0.05,
                "tdc_limite": 4000.0,
                "tdc_corte": 23,
                "tdc_pago": 3,
                "cetes_aportado_activo": 250.0,
                "cetes_estado": "Aportado (Cetesdirecto)",
                "emergencia_aportado_activo": 500.0,
                "retiro_aportado_activo": 250.0
            }

        ingreso_base = float(cfg["ingreso_base"])
        tasa_nu = float(cfg["tasa_nu"])
        tasa_cetes = float(cfg["tasa_cetes"])
        tasa_afore = float(cfg["tasa_afore"])
        pct_p1 = float(cfg["pct_p1"])
        pct_p2 = float(cfg["pct_p2"])
        pct_p7 = float(cfg["pct_p7"])
        pct_p3 = float(cfg["pct_p3"])
        pct_p6 = float(cfg["pct_p6"])
        tdc_limite = float(cfg["tdc_limite"])
        tdc_corte = int(cfg["tdc_corte"])
        tdc_pago = int(cfg["tdc_pago"])
        cetes_aportado = float(cfg["cetes_aportado_activo"])
        cetes_estado = str(cfg["cetes_estado"])
        emergencia_aportado = float(cfg["emergencia_aportado_activo"])
        retiro_aportado = float(cfg["retiro_aportado_activo"])
        rendimiento_real_nu = float(cfg.get("rendimiento_real_nu") or 0.0)
        saldo_real_ajustado = float(cfg["saldo_real_ajustado"]) if cfg.get("saldo_real_ajustado") is not None else None

        # 2. Distribución de Ingresos
        distribucion = {
            "p1_involuntario": { "pct": pct_p1, "quincenal": ingreso_base * pct_p1, "mensual": ingreso_base * pct_p1 * 2, "destino": "Cetesdirecto (3 Meses)" },
            "p2_basicos":      { "pct": pct_p2, "quincenal": ingreso_base * pct_p2, "mensual": ingreso_base * pct_p2 * 2, "destino": "Nu Cajita Básicos (13%) -> TDC / Débito" },
            "p7_ocio":         { "pct": pct_p7, "quincenal": ingreso_base * pct_p7, "mensual": ingreso_base * pct_p7 * 2, "destino": "Nu Cajita Ocio (13%) -> Débito Directo" },
            "p3_emergencia":   { "pct": pct_p3, "quincenal": ingreso_base * pct_p3, "mensual": ingreso_base * pct_p3 * 2, "destino": "Nu Cajita Emergencia (Meta 3 Meses)" },
            "p6_retiro":       { "pct": pct_p6, "quincenal": ingreso_base * pct_p6, "mensual": ingreso_base * pct_p6 * 2, "destino": "AFORE XXI Banorte (Art. 151 LISR)" }
        }

        # 3. CETES tabla a 25 años
        aporte_cetes_anual = (ingreso_base * pct_p1 * 2) * 12
        cetes_tabla = []
        for yr in range(1, 26):
            fv_cetes = aporte_cetes_anual * (((1 + tasa_cetes)**yr - 1) / tasa_cetes) * (1 + tasa_cetes)
            ahorro_bolsa = aporte_cetes_anual * yr
            cetes_tabla.append({
                "anio": f"Año {yr}",
                "ahorro_bolsa": round(ahorro_bolsa, 2),
                "interes_acumulado": round(fv_cetes - ahorro_bolsa, 2),
                "saldo_total": round(fv_cetes, 2)
            })

        # 4. TDC Nu — Compras y Cálculos
        cursor.execute("SELECT * FROM compras_tdc ORDER BY id DESC")
        compras_tdc = rows_to_dict_list(cursor.fetchall())
        for c in compras_tdc:
            c["fila"] = c["id"]  # Compatibilidad con frontend que use 'fila'

        deuda_actual = sum(c["monto"] for c in compras_tdc if c.get("estado") != "Liquidado")
        saldo_disponible = max(0.0, tdc_limite - deuda_actual)
        pct_uso_credito = round((deuda_actual / tdc_limite) * 100, 1) if tdc_limite > 0 else 0.0

        # Fechas TDC
        hoy = date.today()
        dia_hoy = hoy.day
        if dia_hoy <= tdc_corte:
            proximo_corte = f"{tdc_corte}/{hoy.month}/{hoy.year}"
            mes_pago = hoy.month + 1 if hoy.month < 12 else 1
            anio_pago = hoy.year if hoy.month < 12 else hoy.year + 1
            proximo_pago = f"{tdc_pago}/{mes_pago}/{anio_pago}"
        else:
            mes_corte = hoy.month + 1 if hoy.month < 12 else 1
            anio_corte = hoy.year if hoy.month < 12 else hoy.year + 1
            proximo_corte = f"{tdc_corte}/{mes_corte}/{anio_corte}"
            mes_pago = mes_corte + 1 if mes_corte < 12 else 1
            anio_pago = anio_corte if mes_corte < 12 else anio_corte + 1
            proximo_pago = f"{tdc_pago}/{mes_pago}/{anio_pago}"

        dias_restantes_corte = (tdc_corte - dia_hoy) if dia_hoy <= tdc_corte else (30 - dia_hoy + tdc_corte)

        # 5. Fondo de Emergencia a 24 meses
        aporte_emergencia_mensual = ingreso_base * pct_p3 * 2
        meta_emergencia = (ingreso_base * pct_p2 * 2) * 3  # 3 meses de básicos
        fe_tabla = []
        saldo_fe = 0.0
        tasa_mensual_nu = tasa_nu / 12.0
        for m in range(1, 25):
            interes_m = saldo_fe * tasa_mensual_nu
            saldo_fe = saldo_fe + aporte_emergencia_mensual + interes_m
            fe_tabla.append({
                "mes": f"Mes {m}",
                "aporte": round(aporte_emergencia_mensual, 2),
                "rendimiento_mes": round(interes_m, 2),
                "saldo_acumulado": round(saldo_fe, 2),
                "pct_meta": min(100.0, round((saldo_fe / meta_emergencia) * 100, 1)) if meta_emergencia > 0 else 100.0
            })

        # 6. Retiro SAT / AFORE a 25 años
        aporte_retiro_anual = (ingreso_base * pct_p6 * 2) * 12
        sat_tabla = []
        saldo_afore = 0.0
        for yr in range(1, 26):
            devolucion_sat = aporte_retiro_anual * 0.15  # Tasa ISR estimada
            rend_afore = saldo_afore * tasa_afore
            saldo_afore = saldo_afore + aporte_retiro_anual + rend_afore
            sat_tabla.append({
                "anio": f"Año {yr}",
                "ahorro_bolsa": round(aporte_retiro_anual * yr, 2),
                "devuelto_sat": round(devolucion_sat, 2),
                "saldo_afore": round(saldo_afore, 2),
                "ganancia_neta": round(saldo_afore - (aporte_retiro_anual * yr), 2),
                "efecto_mult": round(saldo_afore / (aporte_retiro_anual * yr), 1) if yr > 0 else 1.0
            })

        # 7. Bitácora de Ocio y Sub-contabilidad Cajita Turbo Nu
        cursor.execute("SELECT * FROM gastos_ocio ORDER BY id ASC")
        registros_ocio = rows_to_dict_list(cursor.fetchall())
        for r in registros_ocio:
            r["fila"] = r["id"]  # Compatibilidad con frontend

        # 7.1 Fondos históricos archivados en historico_quincenas_futuro (Acumulativo)
        cursor.execute("""
            SELECT 
                COALESCE(SUM(remanente_ocio), 0.0) as hist_rem_ocio,
                COALESCE(SUM(aporte_emergencia), 0.0) as hist_emg
            FROM historico_quincenas_futuro
        """)
        row_hf = cursor.fetchone()
        hist_rem_ocio = float(row_hf["hist_rem_ocio"] or 0.0) if row_hf else 0.0
        hist_emg = float(row_hf["hist_emg"] or 0.0) if row_hf else 0.0

        # Fondo de Emergencia: Aporte activo acumulado (suma quincenas cerradas + activa)
        aporte_emergencia_quincenal = ingreso_base * pct_p3
        saldo_emergencia = max(emergencia_aportado, round(hist_emg + aporte_emergencia_quincenal, 2))

        # Presupuesto Ocio: Presupuesto base nuevo ($1,500) + Remanente no gastado acumulado
        presupuesto_ocio_base = ingreso_base * pct_p7
        presupuesto_ocio = round(presupuesto_ocio_base + hist_rem_ocio, 2)
        gasto_real_ocio = sum(r["monto"] for r in registros_ocio)
        remanente_ocio = max(0.0, round(presupuesto_ocio - gasto_real_ocio, 2))
        pct_consumido_ocio = round((gasto_real_ocio / presupuesto_ocio) * 100, 1) if presupuesto_ocio > 0 else 0.0

        # 8. Fondos Digitales de Gastos Básicos resguardados en Cajita Nu (Acumulativo de quincenas)
        cursor.execute("SELECT * FROM config_gastos WHERE id = 1")
        row_cfg_gastos = cursor.fetchone()
        cfg_g = row_to_dict(row_cfg_gastos) if row_cfg_gastos else {}
        presupuesto_gastos = float(cfg_g.get("presupuesto_asignado", 2500.0))
        m_combi = float(cfg_g.get("monto_combi", 376.0))
        m_comida = float(cfg_g.get("monto_comida", 180.0))
        m_copias = float(cfg_g.get("monto_copias", 50.0))
        m_imprevistos = float(cfg_g.get("monto_imprevistos", 200.0))
        aporte_dir_moto = float(cfg_g.get("aportaciones_directas_moto", 0.0))

        fijos_gastos = m_combi + m_comida + m_copias + m_imprevistos
        excedente_fijo_gastos = max(0.0, presupuesto_gastos - fijos_gastos)
        monto_moto_80 = round(excedente_fijo_gastos * 0.80, 2)
        monto_salidas_20 = round(excedente_fijo_gastos * 0.20, 2)

        # Fondos históricos archivados en historico_quincenas_gastos
        cursor.execute("""
            SELECT 
                ahorro_moto_80,
                refuerzo_gustos_20,
                detalle_json
            FROM historico_quincenas_gastos
        """)
        rows_hg = cursor.fetchall()
        hist_moto = sum(float(r["ahorro_moto_80"] or 0.0) for r in rows_hg)
        hist_salidas = 0.0
        hist_imprevistos = 0.0
        hist_copias = 0.0
        for r in rows_hg:
            try:
                det = json.loads(r["detalle_json"]) if r["detalle_json"] else {}
                cat_g = det.get("desglose_categorias", {})
                g_cop = float(cat_g.get("📄 Copias, Material & Papelería", 0.0))
                g_imp = float(cat_g.get("🛡️ Imprevistos / Por si acaso", 0.0))
                g_sal = float(cat_g.get("🍕 Excedente 20%: Refuerzo Gustos / Salidas", 0.0))
                hist_copias += max(0.0, float(det.get("monto_copias", m_copias)) - g_cop)
                hist_imprevistos += max(0.0, float(det.get("monto_imprevistos", m_imprevistos)) - g_imp)
                hist_salidas += max(0.0, float(r["refuerzo_gustos_20"] or 0.0) - g_sal)
            except Exception:
                hist_salidas += float(r["refuerzo_gustos_20"] or 0.0)

        cursor.execute("SELECT categoria, monto, metodo_pago FROM gastos_diarios")
        reg_gastos = cursor.fetchall()
        # Solo los gastos pagados con dinero digital (Débito Nu o no Efectivo) reducen el saldo de Cajita Nu.
        # Si se pagó con 'Efectivo', el dinero salió de la cartera física en mano, por lo que NO se descuenta de Nu.
        gasto_real_copias = sum(float(r["monto"]) for r in reg_gastos if "Copias" in r["categoria"] and r["metodo_pago"] != "Efectivo")
        gasto_real_imprevistos = sum(float(r["monto"]) for r in reg_gastos if "Imprevistos" in r["categoria"] and r["metodo_pago"] != "Efectivo")
        gasto_real_salidas_20 = sum(float(r["monto"]) for r in reg_gastos if "Excedente 20%" in r["categoria"] and r["metodo_pago"] != "Efectivo")
        gasto_real_moto_80 = sum(float(r["monto"]) for r in reg_gastos if "Excedente 80%" in r["categoria"] and r["metodo_pago"] != "Efectivo")

        saldo_copias = max(0.0, round(hist_copias + m_copias - gasto_real_copias, 2))
        saldo_imprevistos = max(0.0, round(hist_imprevistos + m_imprevistos - gasto_real_imprevistos, 2))
        saldo_moto_80 = max(0.0, round(hist_moto + monto_moto_80 + aporte_dir_moto - gasto_real_moto_80, 2))
        saldo_salidas_20 = max(0.0, round(hist_salidas + monto_salidas_20 - gasto_real_salidas_20, 2))
        # En la quincena actual, Copias sigue en Cajita Nu (6 fondos activos).
        total_digital_gastos = round(saldo_copias + saldo_imprevistos + saldo_moto_80 + saldo_salidas_20, 2)

        # Sub-contabilidad de la Única Cajita Turbo de Nu (13% anual)
        # DESCONTADOS CETES ($250) Y AFORE BANORTE ($250) ya que están en plataformas externas.
        total_futuro_cajita = round(remanente_ocio + saldo_emergencia, 2)
        capital_base_cajita = round(total_futuro_cajita + total_digital_gastos, 2)

        # Sincronización con el saldo real de la App Nu y Rendimientos Acreditados
        if saldo_real_ajustado is not None and saldo_real_ajustado > 0:
            gran_total_cajita = round(saldo_real_ajustado, 2)
            rendimientos_ganados_nu = max(0.0, round(gran_total_cajita - capital_base_cajita, 2))
        else:
            rendimientos_ganados_nu = round(rendimiento_real_nu, 2)
            gran_total_cajita = round(capital_base_cajita + rendimientos_ganados_nu, 2)

        rendimiento_mensual_cajita = round(gran_total_cajita * (tasa_nu / 12.0), 2)
        rendimiento_anual_cajita = round(gran_total_cajita * tasa_nu, 2)

        presupuesto_efectivo_actual = round(m_combi + m_comida, 2)
        proximo_presupuesto_efectivo = round(m_combi + m_comida + m_copias, 2)

        porciones_cajita = {
            "emergencia": {
                "presupuesto": saldo_emergencia,
                "gasto_real": 0.0,
                "monto": saldo_emergencia,
                "pct": round((saldo_emergencia / gran_total_cajita) * 100, 1) if gran_total_cajita > 0 else 0.0,
                "etiqueta": "Fondo de Emergencia (Intocable)",
                "origen": "Plan a Futuro • Acumulativo"
            },
            "ocio": {
                "presupuesto": presupuesto_ocio,
                "gasto_real": gasto_real_ocio,
                "monto": remanente_ocio,
                "pct": round((remanente_ocio / gran_total_cajita) * 100, 1) if gran_total_cajita > 0 else 0.0,
                "etiqueta": "Ocio & Estilo de Vida (Disponible)",
                "origen": "Plan a Futuro • Acumulativo"
            },
            "moto_80": {
                "presupuesto": round(hist_moto + monto_moto_80, 2),
                "gasto_real": gasto_real_moto_80,
                "monto": saldo_moto_80,
                "pct": round((saldo_moto_80 / gran_total_cajita) * 100, 1) if gran_total_cajita > 0 else 0.0,
                "etiqueta": "Fondo Acelerador Moto (80%)",
                "origen": "Gastos Básicos • Acumulativo"
            },
            "salidas_20": {
                "presupuesto": round(hist_salidas + monto_salidas_20, 2),
                "gasto_real": gasto_real_salidas_20,
                "monto": saldo_salidas_20,
                "pct": round((saldo_salidas_20 / gran_total_cajita) * 100, 1) if gran_total_cajita > 0 else 0.0,
                "etiqueta": "Refuerzo Gustos / Salidas (20%)",
                "origen": "Gastos Básicos • Acumulativo"
            },
            "imprevistos": {
                "presupuesto": round(hist_imprevistos + m_imprevistos, 2),
                "gasto_real": gasto_real_imprevistos,
                "monto": saldo_imprevistos,
                "pct": round((saldo_imprevistos / gran_total_cajita) * 100, 1) if gran_total_cajita > 0 else 0.0,
                "etiqueta": "Colchón de Imprevistos",
                "origen": "Gastos Básicos • Acumulativo"
            },
            "copias": {
                "presupuesto": round(hist_copias + m_copias, 2),
                "gasto_real": gasto_real_copias,
                "monto": saldo_copias,
                "pct": round((saldo_copias / gran_total_cajita) * 100, 1) if gran_total_cajita > 0 else 0.0,
                "etiqueta": "Copias & Papelería (En Cajita)",
                "origen": "Gastos Básicos • Quincena Actual"
            }
        }

        # Si hay rendimientos ganados acreditados, sumarlos como porción proporcional
        if rendimientos_ganados_nu > 0:
            porciones_cajita["rendimientos"] = {
                "presupuesto": rendimientos_ganados_nu,
                "gasto_real": 0.0,
                "monto": rendimientos_ganados_nu,
                "pct": round((rendimientos_ganados_nu / gran_total_cajita) * 100, 1) if gran_total_cajita > 0 else 0.0,
                "etiqueta": "Rendimientos Ganados Nu (13%)",
                "origen": "Crecimiento Pasivo Diario"
            }

        cajita_turbo_info = {
            "gran_total": gran_total_cajita,
            "capital_base": capital_base_cajita,
            "rendimiento_real_ganado": rendimiento_real_nu,
            "rendimientos_ganados_nu": rendimientos_ganados_nu,
            "saldo_real_ajustado": saldo_real_ajustado,
            "rendimiento_mensual": rendimiento_mensual_cajita,
            "rendimiento_anual": rendimiento_anual_cajita,
            "tasa_anual": tasa_nu,
            "total_futuro": total_futuro_cajita,
            "total_gastos_digital": total_digital_gastos,
            "porciones": porciones_cajita,
            "gastos_digitales_detalle": {
                "copias": { "presupuesto": round(hist_copias + m_copias, 2), "gasto_real": gasto_real_copias, "saldo": saldo_copias },
                "imprevistos": { "presupuesto": round(hist_imprevistos + m_imprevistos, 2), "gasto_real": gasto_real_imprevistos, "saldo": saldo_imprevistos },
                "moto_80": { "presupuesto": round(hist_moto + monto_moto_80, 2), "gasto_real": gasto_real_moto_80, "saldo": saldo_moto_80 },
                "salidas_20": { "presupuesto": round(hist_salidas + monto_salidas_20, 2), "gasto_real": gasto_real_salidas_20, "saldo": saldo_salidas_20 }
            },
            "efectivo_cartera": {
                "presupuesto_actual": presupuesto_efectivo_actual,
                "monto_combi": m_combi,
                "monto_comida": m_comida,
                "proximo_presupuesto_total": proximo_presupuesto_efectivo,
                "monto_copias": m_copias,
                "desglose_actual": f"${m_combi:.2f} Pasajes + ${m_comida:.2f} Comidas",
                "desglose_proximo": f"${m_combi:.2f} Pasajes + ${m_comida:.2f} Comidas + ${m_copias:.2f} Copias Físicas"
            },
            "fondos_externos": {
                "cetes": { "nombre": "Cetesdirecto (3 Meses)", "monto": cetes_aportado, "destino": "Cetesdirecto Gubernamental" },
                "retiro": { "nombre": "AFORE XXI Banorte (Art. 151)", "monto": retiro_aportado, "destino": "AFORE XXI Banorte" },
                "total_externo": round(cetes_aportado + retiro_aportado, 2)
            }
        }

        otros_fondos = {
            "presupuesto_total": ingreso_base * (pct_p1 + pct_p7 + pct_p3 + pct_p6),
            "ocio": {
                "presupuesto": presupuesto_ocio,
                "gasto_real": gasto_real_ocio,
                "remanente": remanente_ocio,
                "pct_consumido": pct_consumido_ocio
            },
            "emergencia": {
                "presupuesto": ingreso_base * pct_p3,
                "aportado": emergencia_aportado
            },
            "retiro": {
                "presupuesto": ingreso_base * pct_p6,
                "aportado": retiro_aportado
            },
            "cetes": {
                "presupuesto": ingreso_base * pct_p1,
                "aportado": cetes_aportado,
                "estado": cetes_estado
            },
            "registros_ocio": registros_ocio,
            "cajita_turbo": cajita_turbo_info
        }

        conn.close()

        handler.send_json({
            "status": "success",
            "dashboard_maestro": {
                "ingreso_base_quincenal": ingreso_base,
                "ingreso_base_mensual": ingreso_base * 2,
                "distribucion": distribucion
            },
            "cetes": {
                "tasa_anual": tasa_cetes,
                "aporte_anual": aporte_cetes_anual,
                "tabla": cetes_tabla
            },
            "tdc": {
                "limite_credito": tdc_limite,
                "deuda_actual": deuda_actual,
                "saldo_disponible": saldo_disponible,
                "pct_uso": pct_uso_credito,
                "pago_para_no_generar_intereses": deuda_actual,
                "fecha_corte": f"Día {tdc_corte} de cada mes",
                "fecha_limite_pago": f"Día {tdc_pago} del mes siguiente",
                "proximo_corte": proximo_corte,
                "proximo_pago": proximo_pago,
                "dias_restantes_corte": dias_restantes_corte,
                "compras": compras_tdc
            },
            "fondo_emergencia": {
                "tasa_anual_nu": tasa_nu,
                "meta_total": meta_emergencia,
                "aporte_mensual": aporte_emergencia_mensual,
                "tabla": fe_tabla
            },
            "retiro_sat": {
                "tasa_anual_afore": tasa_afore,
                "aporte_anual": aporte_retiro_anual,
                "tabla": sat_tabla
            },
            "config": {
                "ingreso_base": ingreso_base,
                "tasa_nu": tasa_nu,
                "tasa_cetes": tasa_cetes,
                "tasa_afore": tasa_afore,
                "pct_p1": pct_p1,
                "pct_p2": pct_p2,
                "pct_p7": pct_p7,
                "pct_p3": pct_p3,
                "pct_p6": pct_p6,
                "tdc_limite": tdc_limite,
                "tdc_corte": tdc_corte,
                "tdc_pago": tdc_pago,
                "rendimiento_real_nu": rendimiento_real_nu,
                "saldo_real_ajustado": saldo_real_ajustado
            },
            "otros_fondos": otros_fondos
        })
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)


def handle_add_gasto_ocio(handler, data):
    try:
        fecha = str(data.get("fecha") or datetime.now().strftime("%Y-%m-%d"))
        monto = safe_float(data.get("monto"), 0.0)
        categoria = str(data.get("categoria") or "🍕 Salidas & Gustos")
        concepto = str(data.get("concepto") or "")
        metodo = str(data.get("metodo") or "Débito Nu")
        dia = get_dia_semana(fecha)

        if monto <= 0:
            handler.send_json({"status": "error", "message": "El monto debe ser mayor a $0.00"}, 400)
            return

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO gastos_ocio (fecha, dia, monto, categoria, concepto, metodo_pago)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (fecha, dia, monto, categoria, concepto, metodo))
        ocio_id = cursor.lastrowid

        # Si el método de pago es TDC Nu, registrar automáticamente en compras_tdc
        metodo_lower = metodo.lower()
        es_tdc = "tdc" in metodo_lower or "crédito" in metodo_lower or "credito" in metodo_lower
        if es_tdc:
            cursor.execute('''
                INSERT INTO compras_tdc (fecha, monto, concepto, categoria, tipo, apartado, estado, origen_tipo, origen_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'gastos_ocio', ?)
            ''', (fecha, monto, f"{concepto} ({categoria})", "Ocio", "Gasto Ocio", "Sí (En Cajita)", "Pendiente", ocio_id))

        conn.commit()
        conn.close()

        msg = f"¡Gasto de ocio de ${monto:.2f} registrado en SQLite!"
        if es_tdc:
            msg += " 💳 Compra agregada automáticamente a tu TDC Nu."
        handler.send_json({"status": "success", "message": msg, "id": ocio_id})
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)


def handle_delete_gasto_ocio(handler, data):
    try:
        gasto_id = safe_int(data.get("id") or data.get("fila"))
        if not gasto_id:
            handler.send_json({"status": "error", "message": "ID no proporcionado"}, 400)
            return

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM gastos_ocio WHERE id = ?", (gasto_id,))
        # Eliminar también la compra en compras_tdc si procedía de este gasto de ocio
        cursor.execute("DELETE FROM compras_tdc WHERE origen_tipo = 'gastos_ocio' AND origen_id = ?", (gasto_id,))
        conn.commit()
        conn.close()

        handler.send_json({"status": "success", "message": "Gasto de ocio eliminado correctamente."})
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)


def handle_update_aportacion_futuro(handler, data):
    try:
        tipo = data.get("tipo")
        monto = safe_float(data.get("monto"), 0.0)

        conn = get_connection()
        cursor = conn.cursor()

        if tipo == "cetes":
            cursor.execute("UPDATE config_futuro SET cetes_aportado_activo = ?, cetes_estado = 'Aportado (Cetesdirecto)' WHERE id = 1", (monto,))
            msg = f"Aportación de Cetesdirecto actualizada a ${monto:.2f}"
        elif tipo == "emergencia":
            cursor.execute("UPDATE config_futuro SET emergencia_aportado_activo = ? WHERE id = 1", (monto,))
            msg = f"Fondo de Emergencia actualizado a ${monto:.2f}"
        elif tipo == "retiro":
            cursor.execute("UPDATE config_futuro SET retiro_aportado_activo = ? WHERE id = 1", (monto,))
            msg = f"Aporte de Retiro SAT actualizado a ${monto:.2f}"
        else:
            handler.send_json({"status": "error", "message": "Tipo de fondo no reconocido"}, 400)
            conn.close()
            return

        conn.commit()
        conn.close()
        handler.send_json({"status": "success", "message": msg})
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)


def handle_cerrar_quincena_futuro(handler, data):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM config_futuro WHERE id = 1")
        cfg = row_to_dict(cursor.fetchone())

        pres_ocio_base = float(cfg["ingreso_base"]) * float(cfg["pct_p7"])
        emg = float(cfg["emergencia_aportado_activo"])
        ret = float(cfg["retiro_aportado_activo"])
        cet = float(cfg["cetes_aportado_activo"])

        # Considerar remanente histórico previo de ocio
        cursor.execute("SELECT COALESCE(SUM(remanente_ocio), 0.0) as s FROM historico_quincenas_futuro")
        prev_ocio_rem = float(cursor.fetchone()["s"] or 0.0)
        pres_ocio = pres_ocio_base + prev_ocio_rem

        cursor.execute("SELECT * FROM gastos_ocio ORDER BY id ASC")
        registros = rows_to_dict_list(cursor.fetchall())
        gasto_ocio = sum(r["monto"] for r in registros)
        rem_ocio = max(0.0, round(pres_ocio - gasto_ocio, 2))

        # En Cajita Turbo Nu SOLO se suma lo que realmente vive en Nu (ocio + emergencia).
        # Cetes y AFORE quedan descontados ya que están en plataformas externas.
        total_cajita_cierre = round(rem_ocio + emg, 2)

        now = datetime.now()
        meses_es = {
            "January":"Enero","February":"Febrero","March":"Marzo","April":"Abril",
            "May":"Mayo","June":"Junio","July":"Julio","August":"Agosto",
            "September":"Septiembre","October":"Octubre","November":"Noviembre","December":"Diciembre"
        }
        mes_nombre = meses_es.get(now.strftime("%B"), now.strftime("%B"))
        periodo = data.get("periodo") or f"{'1ra' if now.day <= 15 else '2da'} Quincena {mes_nombre} {now.year}"
        fecha_cierre = data.get("fecha_cierre", now.strftime("%Y-%m-%d"))
        anio = safe_int(data.get("anio", now.year))

        detalle_obj = {
            "presupuesto_ocio": pres_ocio,
            "presupuesto_ocio_base": pres_ocio_base,
            "remanente_anterior_ocio": prev_ocio_rem,
            "gasto_ocio": gasto_ocio,
            "remanente_ocio": rem_ocio,
            "aporte_emergencia": emg,
            "aporte_retiro": ret,
            "aporte_cetes": cet,
            "total_cajita": total_cajita_cierre,
            "registros_ocio": registros
        }

        cursor.execute('''
            INSERT INTO historico_quincenas_futuro (
                periodo, mes, anio, fecha_cierre, presupuesto_ocio,
                gasto_ocio, remanente_ocio, aporte_emergencia, aporte_retiro,
                aporte_cetes, total_cajita_cierre, num_movimientos, detalle_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            periodo, mes_nombre, anio, fecha_cierre, pres_ocio,
            gasto_ocio, rem_ocio, emg, ret, cet, total_cajita_cierre,
            len(registros), json.dumps(detalle_obj, ensure_ascii=False)
        ))

        # Resetear bitácora de ocio de la quincena cerrada
        cursor.execute("DELETE FROM gastos_ocio")

        # Sumar el nuevo aporte quincenal al Fondo de Emergencia para la nueva quincena
        nuevo_emg = round(emg + (float(cfg["ingreso_base"]) * float(cfg["pct_p3"])), 2)
        cursor.execute("UPDATE config_futuro SET emergencia_aportado_activo = ? WHERE id = 1", (nuevo_emg,))

        conn.commit()
        conn.close()

        handler.send_json({
            "status": "success",
            "message": f"🎉 ¡Quincena archivada! Remanente de ocio (${rem_ocio:.2f}) y nuevo aporte de emergencia sumados a tu Cajita Nu."
        })
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)


def handle_get_historial_futuro(handler):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM historico_quincenas_futuro ORDER BY id DESC")
        rows = rows_to_dict_list(cursor.fetchall())

        cierres = []
        for r in rows:
            try:
                det = json.loads(r["detalle_json"]) if r["detalle_json"] else {}
            except Exception:
                det = {}
            r["detalle"] = det
            cierres.append(r)

        conn.close()
        handler.send_json({"status": "success", "cierres": cierres})
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)


def handle_borrar_cierre_futuro(handler, data):
    try:
        cierre_id = safe_int(data.get("id"))
        if not cierre_id:
            handler.send_json({"status": "error", "message": "ID no proporcionado"}, 400)
            return

        conn = get_connection()
        cursor = conn.cursor()

        # Obtener la quincena a borrar
        cursor.execute("SELECT periodo, aporte_emergencia FROM historico_quincenas_futuro WHERE id = ?", (cierre_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            handler.send_json({"status": "error", "message": f"No se encontró la quincena #{cierre_id}"}, 404)
            return

        periodo_nombre = row["periodo"]
        emg_cerrado = float(row["aporte_emergencia"] or 0.0)

        # Ajustar fondo de emergencia acumulado en config_futuro
        cursor.execute("SELECT emergencia_aportado_activo FROM config_futuro WHERE id = 1")
        row_cfg = cursor.fetchone()
        if row_cfg:
            curr_emg = float(row_cfg["emergencia_aportado_activo"] or 500.0)
            nuevo_emg = max(500.0, round(curr_emg - emg_cerrado, 2))
            cursor.execute("UPDATE config_futuro SET emergencia_aportado_activo = ? WHERE id = 1", (nuevo_emg,))

        cursor.execute("DELETE FROM historico_quincenas_futuro WHERE id = ?", (cierre_id,))
        conn.commit()
        conn.close()

        handler.send_json({
            "status": "success",
            "message": f"🗑️ Quincena '{periodo_nombre}' eliminada del histórico de Plan a Futuro."
        })
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)


def handle_tdc_add(handler, data):
    try:
        fecha = str(data.get("fecha") or datetime.now().strftime("%Y-%m-%d"))
        monto = safe_float(data.get("monto"), 0.0)
        concepto = str(data.get("concepto") or "")
        categoria = str(data.get("categoria") or "Básicos")
        tipo = str(data.get("tipo") or "Gasto Diario")
        apartado = str(data.get("apartado") or "Sí (En Cajita)")
        estado = str(data.get("estado") or "Pendiente")

        if monto <= 0:
            handler.send_json({"status": "error", "message": "El monto debe ser mayor a $0.00"}, 400)
            return

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO compras_tdc (fecha, monto, concepto, categoria, tipo, apartado, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (fecha, monto, concepto, categoria, tipo, apartado, estado))
        conn.commit()
        conn.close()

        handler.send_json({"status": "success", "message": f"Compra de ${monto:.2f} registrada en TDC Nu."})
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)


def handle_tdc_edit(handler, data):
    try:
        compra_id = safe_int(data.get("id") or data.get("fila"))
        fecha = str(data.get("fecha") or datetime.now().strftime("%Y-%m-%d"))
        monto = safe_float(data.get("monto"), 0.0)
        concepto = str(data.get("concepto") or "")
        categoria = str(data.get("categoria") or "Básicos")
        tipo = str(data.get("tipo") or "Gasto Diario")
        apartado = str(data.get("apartado") or "Sí (En Cajita)")
        estado = str(data.get("estado") or "Pendiente")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE compras_tdc
            SET fecha = ?, monto = ?, concepto = ?, categoria = ?, tipo = ?, apartado = ?, estado = ?
            WHERE id = ?
        ''', (fecha, monto, concepto, categoria, tipo, apartado, estado, compra_id))
        conn.commit()
        conn.close()

        handler.send_json({"status": "success", "message": "Compra TDC actualizada."})
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)


def handle_tdc_delete(handler, data):
    try:
        compra_id = safe_int(data.get("id") or data.get("fila"))
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM compras_tdc WHERE id = ?", (compra_id,))
        conn.commit()
        conn.close()

        handler.send_json({"status": "success", "message": "Compra TDC eliminada."})
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)


def handle_tdc_pay(handler, data):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE compras_tdc SET estado = 'Liquidado' WHERE estado = 'Pendiente'")
        count = cursor.rowcount
        conn.commit()
        conn.close()

        handler.send_json({"status": "success", "message": f"¡{count} compras liquidadas! Tarjeta al corriente."})
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)


def handle_config_futuro(handler, data):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM config_futuro WHERE id = 1")
        cfg = row_to_dict(cursor.fetchone())

        ingreso = safe_float(data.get("ingreso_base"), cfg["ingreso_base"])
        t_nu = safe_float(data.get("tasa_nu"), cfg["tasa_nu"])
        t_cetes = safe_float(data.get("tasa_cetes"), cfg["tasa_cetes"])
        t_afore = safe_float(data.get("tasa_afore"), cfg["tasa_afore"])
        p1 = safe_float(data.get("pct_p1"), cfg["pct_p1"])
        p2 = safe_float(data.get("pct_p2"), cfg["pct_p2"])
        p7 = safe_float(data.get("pct_p7"), cfg["pct_p7"])
        p3 = safe_float(data.get("pct_p3"), cfg["pct_p3"])
        p6 = safe_float(data.get("pct_p6"), cfg["pct_p6"])
        tdc_lim = safe_float(data.get("tdc_limite"), cfg["tdc_limite"])
        tdc_cor = safe_int(data.get("tdc_corte"), cfg["tdc_corte"])
        tdc_pag = safe_int(data.get("tdc_pago"), cfg["tdc_pago"])

        cursor.execute('''
            UPDATE config_futuro SET
                ingreso_base = ?, tasa_nu = ?, tasa_cetes = ?, tasa_afore = ?,
                pct_p1 = ?, pct_p2 = ?, pct_p7 = ?, pct_p3 = ?, pct_p6 = ?,
                tdc_limite = ?, tdc_corte = ?, tdc_pago = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        ''', (ingreso, t_nu, t_cetes, t_afore, p1, p2, p7, p3, p6, tdc_lim, tdc_cor, tdc_pag))
        conn.commit()
        conn.close()

        handler.send_json({"status": "success", "message": "Parámetros maestros actualizados en la base de datos."})
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)


def handle_ajustar_cajita_turbo(handler, data):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM config_futuro WHERE id = 1")
        cfg = row_to_dict(cursor.fetchone())

        rendimiento_real = safe_float(data.get("rendimiento_real"), cfg.get("rendimiento_real_nu", 0.0))
        saldo_real = data.get("saldo_real")
        saldo_real_val = safe_float(saldo_real, None) if saldo_real not in (None, "", "null") else None

        cursor.execute('''
            UPDATE config_futuro SET
                rendimiento_real_nu = ?,
                saldo_real_ajustado = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        ''', (rendimiento_real, saldo_real_val))
        conn.commit()
        conn.close()

        handler.send_json({
            "status": "success",
            "message": "Saldo real y rendimientos de Cajita Turbo Nu sincronizados exitosamente.",
            "rendimiento_real": rendimiento_real,
            "saldo_real": saldo_real_val
        })
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)
