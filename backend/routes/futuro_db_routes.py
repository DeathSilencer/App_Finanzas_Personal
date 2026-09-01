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

        presupuesto_ocio = ingreso_base * pct_p7
        gasto_real_ocio = sum(r["monto"] for r in registros_ocio)
        remanente_ocio = max(0.0, round(presupuesto_ocio - gasto_real_ocio, 2))
        pct_consumido_ocio = round((gasto_real_ocio / presupuesto_ocio) * 100, 1) if presupuesto_ocio > 0 else 0.0

        # 8. Fondos Digitales de Gastos Básicos resguardados en Cajita Nu (no se retiran en cajero)
        cursor.execute("SELECT * FROM config_gastos WHERE id = 1")
        row_cfg_gastos = cursor.fetchone()
        cfg_g = row_to_dict(row_cfg_gastos) if row_cfg_gastos else {}
        presupuesto_gastos = float(cfg_g.get("presupuesto_asignado", 2500.0))
        m_combi = float(cfg_g.get("monto_combi", 376.0))
        m_comida = float(cfg_g.get("monto_comida", 180.0))
        m_copias = float(cfg_g.get("monto_copias", 50.0))
        m_imprevistos = float(cfg_g.get("monto_imprevistos", 200.0))

        fijos_gastos = m_combi + m_comida + m_copias + m_imprevistos
        excedente_fijo_gastos = max(0.0, presupuesto_gastos - fijos_gastos)
        monto_moto_80 = round(excedente_fijo_gastos * 0.80, 2)
        monto_salidas_20 = round(excedente_fijo_gastos * 0.20, 2)

        cursor.execute("SELECT categoria, monto FROM gastos_diarios")
        reg_gastos = cursor.fetchall()
        gasto_real_copias = sum(float(r["monto"]) for r in reg_gastos if "Copias" in r["categoria"])
        gasto_real_imprevistos = sum(float(r["monto"]) for r in reg_gastos if "Imprevistos" in r["categoria"])
        gasto_real_salidas_20 = sum(float(r["monto"]) for r in reg_gastos if "Excedente 20%" in r["categoria"])
        gasto_real_moto_80 = sum(float(r["monto"]) for r in reg_gastos if "Excedente 80%" in r["categoria"])

        saldo_copias = max(0.0, round(m_copias - gasto_real_copias, 2))
        saldo_imprevistos = max(0.0, round(m_imprevistos - gasto_real_imprevistos, 2))
        saldo_moto_80 = max(0.0, round(monto_moto_80 - gasto_real_moto_80, 2))
        saldo_salidas_20 = max(0.0, round(monto_salidas_20 - gasto_real_salidas_20, 2))
        total_digital_gastos = round(saldo_copias + saldo_imprevistos + saldo_moto_80 + saldo_salidas_20, 2)

        # Sub-contabilidad de la Única Cajita Turbo de Nu (13% anual)
        # Combina: Fondos de Plan a Futuro + Fondos Digitales de Gastos Básicos (no retirados en efectivo)
        total_futuro_cajita = round(remanente_ocio + emergencia_aportado + retiro_aportado, 2)
        gran_total_cajita = round(total_futuro_cajita + total_digital_gastos, 2)
        rendimiento_mensual_cajita = round(gran_total_cajita * (tasa_nu / 12.0), 2)
        rendimiento_anual_cajita = round(gran_total_cajita * tasa_nu, 2)

        cajita_turbo_info = {
            "gran_total": gran_total_cajita,
            "rendimiento_mensual": rendimiento_mensual_cajita,
            "rendimiento_anual": rendimiento_anual_cajita,
            "tasa_anual": tasa_nu,
            "total_futuro": total_futuro_cajita,
            "total_gastos_digital": total_digital_gastos,
            "porciones": {
                "emergencia": {
                    "presupuesto": emergencia_aportado,
                    "gasto_real": 0.0,
                    "monto": emergencia_aportado,
                    "pct": round((emergencia_aportado / gran_total_cajita) * 100, 1) if gran_total_cajita > 0 else 0.0,
                    "etiqueta": "Fondo de Emergencia (Intocable)",
                    "origen": "Plan a Futuro (Paso 3 • 10%)"
                },
                "ocio": {
                    "presupuesto": presupuesto_ocio,
                    "gasto_real": gasto_real_ocio,
                    "monto": remanente_ocio,
                    "pct": round((remanente_ocio / gran_total_cajita) * 100, 1) if gran_total_cajita > 0 else 0.0,
                    "etiqueta": "Ocio & Estilo de Vida (Disponible)",
                    "origen": "Plan a Futuro (Paso 7 • 30%)"
                },
                "retiro": {
                    "presupuesto": retiro_aportado,
                    "gasto_real": 0.0,
                    "monto": retiro_aportado,
                    "pct": round((retiro_aportado / gran_total_cajita) * 100, 1) if gran_total_cajita > 0 else 0.0,
                    "etiqueta": "Retiro Deducible SAT (Apartado)",
                    "origen": "Plan a Futuro (Paso 6 • 5%)"
                },
                "moto_80": {
                    "presupuesto": monto_moto_80,
                    "gasto_real": gasto_real_moto_80,
                    "monto": saldo_moto_80,
                    "pct": round((saldo_moto_80 / gran_total_cajita) * 100, 1) if gran_total_cajita > 0 else 0.0,
                    "etiqueta": "Fondo Acelerador Moto (80%)",
                    "origen": "Gastos Básicos (Excedente Base)"
                },
                "salidas_20": {
                    "presupuesto": monto_salidas_20,
                    "gasto_real": gasto_real_salidas_20,
                    "monto": saldo_salidas_20,
                    "pct": round((saldo_salidas_20 / gran_total_cajita) * 100, 1) if gran_total_cajita > 0 else 0.0,
                    "etiqueta": "Refuerzo Gustos / Salidas (20%)",
                    "origen": "Gastos Básicos (Excedente Base)"
                },
                "imprevistos": {
                    "presupuesto": m_imprevistos,
                    "gasto_real": gasto_real_imprevistos,
                    "monto": saldo_imprevistos,
                    "pct": round((saldo_imprevistos / gran_total_cajita) * 100, 1) if gran_total_cajita > 0 else 0.0,
                    "etiqueta": "Colchón de Imprevistos",
                    "origen": "Gastos Básicos (Fondo Digital)"
                },
                "copias": {
                    "presupuesto": m_copias,
                    "gasto_real": gasto_real_copias,
                    "monto": saldo_copias,
                    "pct": round((saldo_copias / gran_total_cajita) * 100, 1) if gran_total_cajita > 0 else 0.0,
                    "etiqueta": "Copias & Papelería",
                    "origen": "Gastos Básicos (Fondo Digital)"
                }
            },
            "gastos_digitales_detalle": {
                "copias": { "presupuesto": m_copias, "gasto_real": gasto_real_copias, "saldo": saldo_copias },
                "imprevistos": { "presupuesto": m_imprevistos, "gasto_real": gasto_real_imprevistos, "saldo": saldo_imprevistos },
                "moto_80": { "presupuesto": monto_moto_80, "gasto_real": gasto_real_moto_80, "saldo": saldo_moto_80 },
                "salidas_20": { "presupuesto": monto_salidas_20, "gasto_real": gasto_real_salidas_20, "saldo": saldo_salidas_20 }
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
                "tdc_pago": tdc_pago
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
        conn.commit()
        conn.close()

        handler.send_json({"status": "success", "message": f"¡Gasto de ocio de ${monto:.2f} registrado en SQLite!"})
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

        pres_ocio = float(cfg["ingreso_base"]) * float(cfg["pct_p7"])
        emg = float(cfg["emergencia_aportado_activo"])
        ret = float(cfg["retiro_aportado_activo"])
        cet = float(cfg["cetes_aportado_activo"])

        cursor.execute("SELECT * FROM gastos_ocio ORDER BY id ASC")
        registros = rows_to_dict_list(cursor.fetchall())
        gasto_ocio = sum(r["monto"] for r in registros)
        rem_ocio = max(0.0, round(pres_ocio - gasto_ocio, 2))
        total_cajita_cierre = round(rem_ocio + emg + ret, 2)

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

        # Resetear bitácora de ocio
        cursor.execute("DELETE FROM gastos_ocio")
        conn.commit()
        conn.close()

        handler.send_json({
            "status": "success",
            "message": f"🎉 ¡Quincena archivada con éxito! Remanente de ocio (${rem_ocio:.2f}) resguardado en Cajita Nu."
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
