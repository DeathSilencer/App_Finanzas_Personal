"""
backend/routes/gastos_db_routes.py — Controladores de Gastos Básicos respaldados por SQLite.
Rendimiento instantáneo, paridad matemática 100% y cero bloqueos de Excel.
"""

import json
from datetime import datetime
from database.db import get_connection, row_to_dict, rows_to_dict_list
from helpers.excel_helpers import get_dia_semana, safe_float, safe_int


def handle_get_gastos(handler):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # 1. Configuración de Gastos Básicos
        cursor.execute("SELECT * FROM config_gastos WHERE id = 1")
        cfg = row_to_dict(cursor.fetchone())
        if not cfg:
            cfg = {
                "presupuesto_asignado": 2500.0,
                "monto_combi": 320.0,
                "monto_comida": 180.0,
                "monto_copias": 50.0,
                "monto_imprevistos": 200.0,
                "meta_moto": 35000.0,
                "dias_libres_cuatri": 25,
                "quincenas_cuatri": 8,
                "aportaciones_directas_moto": 0.0
            }

        presupuesto_asignado = float(cfg["presupuesto_asignado"])
        monto_combi = float(cfg["monto_combi"])
        monto_comida = float(cfg["monto_comida"])
        monto_copias = float(cfg["monto_copias"])
        monto_imprevistos = float(cfg["monto_imprevistos"])
        meta_moto = float(cfg["meta_moto"])
        dias_libres_cuatri = int(cfg["dias_libres_cuatri"])
        quincenas_cuatri = int(cfg["quincenas_cuatri"])
        aportaciones_directas = float(cfg["aportaciones_directas_moto"])

        # 2. Gastos Diarios Activos
        cursor.execute("SELECT * FROM gastos_diarios ORDER BY id DESC")
        registros = rows_to_dict_list(cursor.fetchall())

        # Agrupar gastos por categoría
        gastos_por_cat = {}
        for r in registros:
            cat = r["categoria"]
            gastos_por_cat[cat] = gastos_por_cat.get(cat, 0.0) + float(r["monto"])

        # 3. Sumas y Fórmulas
        gasto_total_real = sum(r["monto"] for r in registros)
        remanente_total = max(0.0, round(presupuesto_asignado - gasto_total_real, 2))
        pct_consumido = round((gasto_total_real / presupuesto_asignado) * 100, 1) if presupuesto_asignado > 0 else 0.0

        # Gastos Fijos
        total_fijos = monto_combi + monto_comida + monto_copias + monto_imprevistos
        efectivo_a_retirar = monto_combi + monto_comida

        # Excedente Base Fijo
        excedente_fijo = max(0.0, round(presupuesto_asignado - total_fijos, 2))
        excedente_80_moto = round(excedente_fijo * 0.80, 2)
        excedente_20_salidas = round(excedente_fijo * 0.20, 2)

        # Categorías del Dashboard
        categorias_def = [
            {
                "categoria": "🚌 Pasajes Combi (Efectivo)",
                "mecanica": "$32 diarios x 10 días hábiles de escuela",
                "presupuesto": monto_combi,
                "pct": round((monto_combi / presupuesto_asignado) * 100, 1) if presupuesto_asignado > 0 else 0.0,
            },
            {
                "categoria": "🥪 Comidas en Escuela (Efectivo)",
                "mecanica": "Comidas ligeras en días escolares",
                "presupuesto": monto_comida,
                "pct": round((monto_comida / presupuesto_asignado) * 100, 1) if presupuesto_asignado > 0 else 0.0,
            },
            {
                "categoria": "📄 Copias, Material & Papelería",
                "mecanica": "Material escolar e impresiones",
                "presupuesto": monto_copias,
                "pct": round((monto_copias / presupuesto_asignado) * 100, 1) if presupuesto_asignado > 0 else 0.0,
            },
            {
                "categoria": "🛡️ Imprevistos / Por si acaso",
                "mecanica": "Fondo de contingencia escolar",
                "presupuesto": monto_imprevistos,
                "pct": round((monto_imprevistos / presupuesto_asignado) * 100, 1) if presupuesto_asignado > 0 else 0.0,
            },
            {
                "categoria": "🛡️ Excedente 80%: Fondo Emergencia / Moto",
                "mecanica": "Ahorro acelerado para compra de moto de contado",
                "presupuesto": excedente_80_moto,
                "pct": round((excedente_80_moto / presupuesto_asignado) * 100, 1) if presupuesto_asignado > 0 else 0.0,
            },
            {
                "categoria": "🍕 Excedente 20%: Refuerzo Gustos / Salidas",
                "mecanica": "Refuerzo para ocio y salidas de fin de semana",
                "presupuesto": excedente_20_salidas,
                "pct": round((excedente_20_salidas / presupuesto_asignado) * 100, 1) if presupuesto_asignado > 0 else 0.0,
            }
        ]

        categorias = []
        for cat_info in categorias_def:
            cat_name = cat_info["categoria"]
            pres = cat_info["presupuesto"]
            real = gastos_por_cat.get(cat_name, 0.0)
            rem = max(0.0, round(pres - real, 2))
            pct_c = round((real / pres) * 100, 1) if pres > 0 else 0.0

            if pct_c == 0:
                semaforo = "🟢 Sin consumo"
            elif pct_c <= 75:
                semaforo = "🟢 En Presupuesto"
            elif pct_c <= 100:
                semaforo = "🟡 Cuidado"
            else:
                semaforo = "🔴 Excedido"

            categorias.append({
                "categoria": cat_name,
                "mecanica": cat_info["mecanica"],
                "presupuesto": pres,
                "pct": cat_info["pct"],
                "gasto_real": real,
                "remanente": rem,
                "pct_consumido": pct_c,
                "semaforo": semaforo
            })

        # 4. Histórico y Ahorro Moto Acumulado
        cursor.execute("SELECT SUM(ahorro_moto_80) as total_moto FROM historico_quincenas_gastos")
        row_moto = cursor.fetchone()
        ahorro_acumulado_historico = float(row_moto["total_moto"]) if row_moto and row_moto["total_moto"] else 0.0
        total_ahorrado_moto = round(ahorro_acumulado_historico + aportaciones_directas, 2)

        # 5. Simulador Moto
        # Ahorro extra vacaciones escolares: combi ($32/día) + comida ($18/día) = $50/día x 25 días hábiles = $1,250.00
        # (Los sábados de $28 con la novia se mantienen constantes todo el año)
        costo_diario_combi_escolar = 32.0
        costo_diario_comida = monto_comida / 10.0
        costo_diario_escolar = costo_diario_combi_escolar + costo_diario_comida
        ahorro_extra_vacaciones = round(dias_libres_cuatri * costo_diario_escolar, 2)

        ahorro_cuatri = round((excedente_80_moto * quincenas_cuatri) + ahorro_extra_vacaciones, 2)
        cuatris_necesarios = round(meta_moto / ahorro_cuatri, 2) if ahorro_cuatri > 0 else 0.0
        meses_estimados = round(cuatris_necesarios * 4, 1)

        simulador_moto = {
            "meta_total": meta_moto,
            "ahorro_extra_vacaciones": ahorro_extra_vacaciones,
            "dias_libres_cuatri": dias_libres_cuatri,
            "costo_diario_escolar": costo_diario_escolar,
            "excedente_quincenal_80": excedente_80_moto,
            "quincenas_cuatri": quincenas_cuatri,
            "ahorro_por_cuatrimestre": ahorro_cuatri,
            "cuatris_estimados": cuatris_necesarios,
            "meses_estimados": meses_estimados,
            "aportaciones_directas": aportaciones_directas,
            "ahorro_acumulado_historico": ahorro_acumulado_historico,
            "total_ahorrado_acumulado": total_ahorrado_moto,
            "pct_meta_cumplido": round((total_ahorrado_moto / meta_moto) * 100, 1) if meta_moto > 0 else 0.0
        }

        conn.close()

        handler.send_json({
            "status": "success",
            "resumen": {
                "presupuesto_total": presupuesto_asignado,
                "gasto_total_real": gasto_total_real,
                "remanente_total": remanente_total,
                "pct_consumido": pct_consumido,
                "total_gastos_fijos": total_fijos,
                "efectivo_a_retirar": efectivo_a_retirar,
                "monto_combi": monto_combi,
                "monto_comida": monto_comida,
                "monto_copias": monto_copias,
                "monto_imprevistos": monto_imprevistos,
                "excedente_base_fijo": excedente_fijo,
                "excedente_80_moto": excedente_80_moto,
                "excedente_20_salidas": excedente_20_salidas,
            },
            "categorias": categorias,
            "registros": registros,
            "simulador_moto": simulador_moto
        })
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)


def handle_add_gasto(handler, data):
    try:
        fecha = str(data.get("fecha") or datetime.now().strftime("%Y-%m-%d"))
        monto = safe_float(data.get("monto"), 0.0)
        categoria = str(data.get("categoria") or "Otros")
        concepto = str(data.get("concepto") or "")
        metodo = str(data.get("metodo") or "Efectivo")
        retirado = str(data.get("retirado") or "Sí (Efectivo)")
        dia = get_dia_semana(fecha)

        if monto <= 0:
            handler.send_json({"status": "error", "message": "El monto debe ser mayor a $0.00"}, 400)
            return

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO gastos_diarios (fecha, dia, monto, categoria, concepto, metodo_pago, retirado)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (fecha, dia, monto, categoria, concepto, metodo, retirado))
        conn.commit()
        conn.close()

        handler.send_json({"status": "success", "message": f"¡Gasto de ${monto:.2f} registrado exitosamente!"})
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al guardar gasto: {str(e)}"}, 500)


def handle_edit_gasto(handler, data):
    try:
        gasto_id = safe_int(data.get("id") or data.get("fila"))
        fecha = str(data.get("fecha") or datetime.now().strftime("%Y-%m-%d"))
        monto = safe_float(data.get("monto"), 0.0)
        categoria = str(data.get("categoria") or "Otros")
        concepto = str(data.get("concepto") or "")
        metodo = str(data.get("metodo") or "Efectivo")
        retirado = str(data.get("retirado") or "Sí")
        dia = get_dia_semana(fecha)

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE gastos_diarios
            SET fecha = ?, dia = ?, monto = ?, categoria = ?, concepto = ?, metodo_pago = ?, retirado = ?
            WHERE id = ?
        ''', (fecha, dia, monto, categoria, concepto, metodo, retirado, gasto_id))
        conn.commit()
        conn.close()

        handler.send_json({"status": "success", "message": "Gasto actualizado correctamente."})
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al actualizar gasto: {str(e)}"}, 500)


def handle_delete_gasto(handler, data):
    try:
        # Puede recibir 'id' o 'fila'
        gasto_id = safe_int(data.get("id"))
        if not gasto_id and "fila" in data:
            # En caso de que venga del cliente antiguo como fila de excel
            fila_val = safe_int(data.get("fila"))
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM gastos_diarios ORDER BY id ASC LIMIT 1 OFFSET ?", (max(0, fila_val - 11),))
            row = cursor.fetchone()
            gasto_id = row["id"] if row else None
            conn.close()

        if not gasto_id:
            handler.send_json({"status": "error", "message": "ID de registro no proporcionado"}, 400)
            return

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM gastos_diarios WHERE id = ?", (gasto_id,))
        conn.commit()
        conn.close()

        handler.send_json({"status": "success", "message": "Gasto eliminado exitosamente."})
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al borrar: {str(e)}"}, 500)


def handle_limpiar_registro(handler, data):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM gastos_diarios")
        conn.commit()
        conn.close()

        handler.send_json({"status": "success", "message": "Bitácora de gastos diarios reiniciada a $0.00."})
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)


def handle_config_gastos(handler, data):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM config_gastos WHERE id = 1")
        cfg = row_to_dict(cursor.fetchone())

        pres = safe_float(data.get("presupuesto_asignado"), cfg["presupuesto_asignado"])
        combi = safe_float(data.get("monto_combi"), cfg["monto_combi"])
        comida = safe_float(data.get("monto_comida"), cfg["monto_comida"])
        copias = safe_float(data.get("monto_copias"), cfg["monto_copias"])
        imprev = safe_float(data.get("monto_imprevistos"), cfg["monto_imprevistos"])
        meta = safe_float(data.get("meta_moto"), cfg["meta_moto"])
        dias = safe_int(data.get("dias_libres_num"), cfg["dias_libres_cuatri"])
        aporte_dir = safe_float(data.get("aportaciones_directas"), cfg["aportaciones_directas_moto"])
        quin = safe_int(data.get("quincenas_cuatri"), cfg["quincenas_cuatri"])

        cursor.execute('''
            UPDATE config_gastos SET
                presupuesto_asignado = ?, monto_combi = ?, monto_comida = ?,
                monto_copias = ?, monto_imprevistos = ?, meta_moto = ?,
                dias_libres_cuatri = ?, quincenas_cuatri = ?, aportaciones_directas_moto = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        ''', (pres, combi, comida, copias, imprev, meta, dias, quin, aporte_dir))
        conn.commit()
        conn.close()

        handler.send_json({"status": "success", "message": "¡Configuración guardada dinámicamente en la base de datos!"})
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al guardar configuración: {str(e)}"}, 500)


def handle_moto_aporte(handler, data):
    try:
        monto = safe_float(data.get("monto", 0.0))
        modo = data.get("modo", "sumar")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT aportaciones_directas_moto FROM config_gastos WHERE id = 1")
        row = cursor.fetchone()
        actual = float(row["aportaciones_directas_moto"]) if row else 0.0

        nuevo = (actual + monto) if modo == "sumar" else monto
        nuevo = max(0.0, round(nuevo, 2))

        cursor.execute("UPDATE config_gastos SET aportaciones_directas_moto = ? WHERE id = 1", (nuevo,))
        conn.commit()
        conn.close()

        handler.send_json({"status": "success", "message": f"Aportación de ${monto:.2f} registrada. Total directo: ${nuevo:.2f}"})
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)


def handle_cerrar_quincena(handler, data):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM config_gastos WHERE id = 1")
        cfg = row_to_dict(cursor.fetchone())
        presupuesto = float(cfg["presupuesto_asignado"])
        fijos = float(cfg["monto_combi"] + cfg["monto_comida"] + cfg["monto_copias"] + cfg["monto_imprevistos"])

        cursor.execute("SELECT * FROM gastos_diarios ORDER BY id ASC")
        registros = rows_to_dict_list(cursor.fetchall())

        gasto_real = sum(r["monto"] for r in registros)
        remanente = max(0.0, round(presupuesto - gasto_real, 2))

        excedente_fijo = max(0.0, round(presupuesto - fijos, 2))
        ahorro_moto = round(excedente_fijo * 0.80, 2)
        refuerzo_gustos = round(excedente_fijo * 0.20, 2)

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

        # Detalle de categorías para el histórico
        categorias_gasto = {}
        for r in registros:
            c = r["categoria"]
            categorias_gasto[c] = categorias_gasto.get(c, 0.0) + float(r["monto"])

        detalle_obj = {
            "presupuesto_asignado": presupuesto,
            "gastos_fijos": fijos,
            "gasto_real": gasto_real,
            "remanente": remanente,
            "ahorro_moto": ahorro_moto,
            "refuerzo_gustos": refuerzo_gustos,
            "movimientos": registros,
            "desglose_categorias": categorias_gasto
        }

        cursor.execute('''
            INSERT INTO historico_quincenas_gastos (
                periodo, mes, anio, fecha_cierre, presupuesto, gastos_fijos,
                gasto_real, remanente, ahorro_moto_80, refuerzo_gustos_20,
                num_movimientos, detalle_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            periodo, mes_nombre, anio, fecha_cierre, presupuesto, fijos,
            gasto_real, remanente, ahorro_moto, refuerzo_gustos,
            len(registros), json.dumps(detalle_obj, ensure_ascii=False)
        ))

        # Resetear bitácora
        cursor.execute("DELETE FROM gastos_diarios")
        conn.commit()
        conn.close()

        handler.send_json({
            "status": "success",
            "message": f"🎉 ¡Quincena cerrada y archivada! Aporte a Moto (80%): ${ahorro_moto:.2f} resguardado."
        })
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al cerrar quincena: {str(e)}"}, 500)


def handle_get_historial(handler):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM historico_quincenas_gastos ORDER BY id DESC")
        rows = rows_to_dict_list(cursor.fetchall())

        cierres = []
        for r in rows:
            try:
                det = json.loads(r["detalle_json"]) if r["detalle_json"] else {}
            except Exception:
                det = {}
            r["detalle"] = det
            cierres.append(r)

        meses_dict = {}
        for c in reversed(cierres):
            clave_mes = f"{c.get('mes', '')} {c.get('anio', '')}".strip() or "General"
            if clave_mes not in meses_dict:
                meses_dict[clave_mes] = {
                    "mes_anio": clave_mes,
                    "mes": c.get('mes', ''),
                    "anio": c.get('anio', 2026),
                    "ingreso_total": 0.0,
                    "gasto_real_total": 0.0,
                    "remanente_total": 0.0,
                    "ahorro_moto_total": 0.0,
                    "excedente_salidas_total": 0.0,
                    "num_quincenas": 0,
                    "quincenas": [],
                    "transacciones": []
                }
            m_entry = meses_dict[clave_mes]
            m_entry["ingreso_total"] += c.get("presupuesto", 0.0)
            m_entry["gasto_real_total"] += c.get("gasto_real", 0.0)
            m_entry["remanente_total"] += c.get("remanente", 0.0)
            m_entry["ahorro_moto_total"] += c.get("ahorro_moto_80", 0.0)
            m_entry["excedente_salidas_total"] += c.get("refuerzo_gustos_20", 0.0)
            m_entry["num_quincenas"] += 1
            m_entry["quincenas"].append(c)

            det = c.get("detalle", {})
            regs = det.get("movimientos") or det.get("registros") or []
            for reg in regs:
                r_copy = dict(reg)
                r_copy["quincena"] = c.get("periodo", "")
                m_entry["transacciones"].append(r_copy)

        conn.close()
        handler.send_json({
            "status": "success",
            "meses": list(meses_dict.values()),
            "cierres": cierres
        })
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)


def handle_borrar_cierre(handler, data):
    try:
        cierre_id = safe_int(data.get("id"))
        if not cierre_id:
            handler.send_json({"status": "error", "message": "ID no proporcionado"}, 400)
            return

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM historico_quincenas_gastos WHERE id = ?", (cierre_id,))
        conn.commit()
        conn.close()

        handler.send_json({"status": "success", "message": f"Cierre #{cierre_id} eliminado del histórico."})
    except Exception as e:
        handler.send_json({"status": "error", "message": str(e)}, 500)
