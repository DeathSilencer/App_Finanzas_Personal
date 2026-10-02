"""
gastos_routes.py — Handlers de todas las rutas /api/gastos/*
Cada función recibe la instancia del handler HTTP y el body (dict) si aplica,
y llama a handler.send_json() con la respuesta.
"""

import json
import os
from datetime import datetime

from config import PATH_GASTOS
from helpers.excel_helpers import (
    load_wb_readonly, load_wb_write,
    parse_fecha, get_dia_semana,
    safe_float, safe_int
)


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/gastos  — Resumen principal, categorías, registros, simulador moto
# ─────────────────────────────────────────────────────────────────────────────
def handle_get_gastos(handler):
    try:
        if not os.path.exists(PATH_GASTOS):
            handler.send_json({"status": "error", "message": f"Archivo no encontrado: {PATH_GASTOS}"}, 404)
            return

        wb = load_wb_readonly(PATH_GASTOS)
        ws_dash = wb['Dashboard Gastos Básicos']
        ws_reg  = wb['Registro Diario']
        ws_moto = wb['Simulador Vacaciones & Moto']

        presupuesto_asignado = safe_float(ws_dash['B4'].value, 2500.0)
        m_combi        = safe_float(ws_dash['C8'].value,  320.0)
        m_comida       = safe_float(ws_dash['C9'].value,  180.0)
        m_copias       = safe_float(ws_dash['C10'].value, 100.0)
        m_imprevistos  = safe_float(ws_dash['C11'].value, 150.0)

        gastos_operativos   = m_combi + m_comida + m_copias + m_imprevistos
        excedente_bolsa     = max(0.0, presupuesto_asignado - gastos_operativos)
        m_excedente_moto    = round(excedente_bolsa * 0.80, 2)
        m_excedente_gustos  = round(excedente_bolsa * 0.20, 2)

        categorias_raw = [
            (8,  ws_dash['A8'].value  or "🚌 Pasajes Combi (Efectivo)",         ws_dash['B8'].value  or f"${m_combi/10:.2f} diarios x 10 días hábiles de escuela",          m_combi),
            (9,  ws_dash['A9'].value  or "🥪 Comidas en Escuela (Efectivo)",     ws_dash['B9'].value  or f"Comidas escolares (${m_comida:.2f} quincena)",                   m_comida),
            (10, ws_dash['A10'].value or "📄 Copias, Material & Papelería",      ws_dash['B10'].value or "Lecturas, trámites, impresiones escolares",                       m_copias),
            (11, ws_dash['A11'].value or "🛡️ Imprevistos / Por si acaso",        ws_dash['B11'].value or "Transporte extra, emergencias menores en calle",                  m_imprevistos),
            (12, "🛡️ Excedente 80%: Fondo Emergencia / Moto",                  "Acelerador de patrimonio al 13% en Nu (Calculado Auto 80%)",                               m_excedente_moto),
            (13, "🍕 Excedente 20%: Refuerzo Gustos / Salidas",                 "Colchón extra para fin de semana (Calculado Auto 20%)",                                    m_excedente_gustos)
        ]

        categorias = []
        for r_num, cat_name, mecanica, monto_q in categorias_raw:
            pct_total = (monto_q / presupuesto_asignado * 100) if presupuesto_asignado > 0 else 0
            categorias.append({
                "fila": r_num,
                "categoria": str(cat_name),
                "mecanica": str(mecanica),
                "presupuesto": monto_q,
                "pct_total": round(pct_total, 1)
            })

        efectivo_retirar = m_combi + m_comida
        en_cajita_nu     = max(0.0, presupuesto_asignado - efectivo_retirar)

        registros = []
        for r in range(11, 111):
            monto_cell = ws_reg.cell(row=r, column=4).value
            if monto_cell is not None and str(monto_cell).strip() != "":
                try:
                    m_val = float(monto_cell)
                    if m_val > 0:
                        registros.append({
                            "fila":      r,
                            "id":        ws_reg.cell(row=r, column=1).value or (r - 10),
                            "fecha":     parse_fecha(ws_reg.cell(row=r, column=2).value),
                            "dia":       str(ws_reg.cell(row=r, column=3).value or ""),
                            "monto":     m_val,
                            "categoria": str(ws_reg.cell(row=r, column=5).value or ""),
                            "concepto":  str(ws_reg.cell(row=r, column=6).value or ""),
                            "metodo":    str(ws_reg.cell(row=r, column=7).value or "Efectivo"),
                            "retirado":  str(ws_reg.cell(row=r, column=8).value or "Sí (Efectivo)")
                        })
                except (ValueError, TypeError):
                    pass

        total_gastado = sum(reg["monto"] for reg in registros)

        for cat in categorias:
            gasto_cat = sum(reg["monto"] for reg in registros if (
                ("Pasajes"       in reg["categoria"] and "Pasajes"       in cat["categoria"]) or
                ("Comidas"       in reg["categoria"] and "Comidas"       in cat["categoria"]) or
                ("Copias"        in reg["categoria"] and "Copias"        in cat["categoria"]) or
                ("Imprevistos"   in reg["categoria"] and "Imprevistos"   in cat["categoria"]) or
                ("Excedente 80%" in cat["categoria"] and "Excedente 80%" in reg["categoria"]) or
                ("Excedente 20%" in cat["categoria"] and "Excedente 20%" in reg["categoria"]) or
                (reg["categoria"].strip() == cat["categoria"].strip())
            ))
            remanente    = cat["presupuesto"] - gasto_cat
            pct_consumido = (gasto_cat / cat["presupuesto"]) * 100 if cat["presupuesto"] > 0 else 0

            if pct_consumido > 100:
                semaforo, badge_color = "🔴 EXCEDIDO",      "rose"
            elif pct_consumido >= 80:
                semaforo, badge_color = "🟡 ALERTA (+80%)", "amber"
            else:
                semaforo, badge_color = "🟢 EN CONTROL",    "emerald"

            cat["gasto_real"]    = gasto_cat
            cat["remanente"]     = remanente
            cat["pct_consumido"] = round(pct_consumido, 1)
            cat["semaforo"]      = semaforo
            cat["badge_color"]   = badge_color

        # Simulador Moto & Acelerador Patrimonial
        moto_meta       = safe_float(ws_moto['B4'].value, 35000.0)
        dias_libres_num = safe_float(ws_moto['E4'].value, 15.0)
        quincenas_cuatri= safe_float(ws_moto['E5'].value, 8.0)

        # Ahorro Real acumulado en quincenas archivadas (columna 11: Ahorro Moto 80%)
        ahorro_real_historico_moto = 0.0
        if 'Histórico de Quincenas' in wb.sheetnames:
            ws_hist = wb['Histórico de Quincenas']
            for r in range(2, ws_hist.max_row + 1):
                val_moto = ws_hist.cell(row=r, column=11).value
                if val_moto is not None:
                    ahorro_real_historico_moto += safe_float(val_moto, 0.0)

        # Aportaciones Directas Extra que el usuario metió a la moto (Celda B7)
        aportaciones_directas_moto = safe_float(ws_moto['B7'].value, 0.0) if ws_moto.max_row >= 7 else 0.0

        # Total Real Acumulado a la fecha
        total_real_acumulado_moto = round(ahorro_real_historico_moto + aportaciones_directas_moto, 2)
        faltante_meta = max(0.0, round(moto_meta - total_real_acumulado_moto, 2))
        pct_avance_real = round((total_real_acumulado_moto / moto_meta) * 100, 1) if moto_meta > 0 else 0.0

        # Gasto Diario Escolar Ahorrado en Vacaciones (Pasajes C8 + Comidas C9 + Copias C10) / 10 días
        gasto_diario_pasaje  = round(m_combi / 10.0, 2)
        gasto_diario_comida  = round(m_comida / 10.0, 2)
        gasto_diario_copias  = round(m_copias / 10.0, 2)
        gasto_diario_escolar = round((m_combi + m_comida + m_copias) / 10.0, 2)
        vacaciones_extra     = round(dias_libres_num * gasto_diario_escolar, 2)
        excedente_base_cuatri = round(m_excedente_moto * quincenas_cuatri, 2)
        ahorro_cuatri        = round(vacaciones_extra + excedente_base_cuatri, 2)

        cuatris_necesarios   = round(faltante_meta / ahorro_cuatri, 2) if ahorro_cuatri > 0 else 0.0
        meses_necesarios     = round(cuatris_necesarios * 4, 1)
        quincenas_necesarias = round(faltante_meta / (ahorro_cuatri / quincenas_cuatri), 1) if ahorro_cuatri > 0 else 0.0

        simulador_moto = {
            "meta": moto_meta,
            "dias_libres_num": dias_libres_num,
            "dias_libres_cuatrimestre": f"{int(dias_libres_num)} días hábiles",
            "gasto_diario_combi": gasto_diario_pasaje,
            "gasto_diario_comida": gasto_diario_comida,
            "gasto_diario_copias": gasto_diario_copias,
            "gasto_diario_escolar": gasto_diario_escolar,
            "gasto_diario_pasaje": gasto_diario_pasaje,
            "ahorro_extra_vacaciones": vacaciones_extra,
            "excedente_base_quincena": m_excedente_moto,
            "quincenas_cuatri": quincenas_cuatri,
            "excedente_base_cuatri": excedente_base_cuatri,
            "total_ahorro_cuatri": ahorro_cuatri,
            "ahorro_real_historico": round(ahorro_real_historico_moto, 2),
            "aportaciones_directas": round(aportaciones_directas_moto, 2),
            "total_real_acumulado": total_real_acumulado_moto,
            "faltante_meta": faltante_meta,
            "pct_avance_real": pct_avance_real,
            "cuatrimestres_necesarios": cuatris_necesarios,
            "meses_necesarios": meses_necesarios,
            "quincenas_necesarias": quincenas_necesarias,
            "cuatrimestres": [
                {"periodo": "Cuatrimestre 1 (Ene - Abr)", "semanas": "12 Semanas", "dias_libres": f"{int(dias_libres_num)} días hábiles",
                 "ahorro_extra": vacaciones_extra, "excedente_base": excedente_base_cuatri,
                 "total_ahorro": ahorro_cuatri,
                 "pct_meta": round((ahorro_cuatri / moto_meta) * 100, 1) if moto_meta > 0 else 0},
                {"periodo": "Cuatrimestre 2 (May - Ago)", "semanas": "12 Semanas", "dias_libres": f"{int(dias_libres_num)} días hábiles",
                 "ahorro_extra": vacaciones_extra, "excedente_base": excedente_base_cuatri,
                 "total_ahorro": ahorro_cuatri,
                 "pct_meta": round(((ahorro_cuatri * 2) / moto_meta) * 100, 1) if moto_meta > 0 else 0},
                {"periodo": "Cuatrimestre 3 (Sep - Dic)", "semanas": "12 Semanas", "dias_libres": f"{int(dias_libres_num)} días hábiles",
                 "ahorro_extra": vacaciones_extra, "excedente_base": excedente_base_cuatri,
                 "total_ahorro": ahorro_cuatri,
                 "pct_meta": round(((ahorro_cuatri * 3) / moto_meta) * 100, 1) if moto_meta > 0 else 0}
            ]
        }

        handler.send_json({
            "status": "success",
            "resumen": {
                "presupuesto_asignado": presupuesto_asignado,
                "monto_combi": m_combi, "monto_comida": m_comida,
                "monto_copias": m_copias, "monto_imprevistos": m_imprevistos,
                "gastos_operativos": gastos_operativos,
                "excedente_total": excedente_bolsa,
                "excedente_moto_80": m_excedente_moto,
                "excedente_gustos_20": m_excedente_gustos,
                "efectivo_retirar": efectivo_retirar,
                "en_cajita_nu": en_cajita_nu,
                "total_gastado": total_gastado,
                "remanente_total": presupuesto_asignado - total_gastado,
                "pct_consumido_total": round((total_gastado / presupuesto_asignado) * 100, 1) if presupuesto_asignado > 0 else 0
            },
            "categorias": categorias,
            "registros": list(reversed(registros)),
            "simulador_moto": simulador_moto
        })
    except PermissionError:
        handler.send_json({"status": "error", "message": "⚠️ Control_Gastos_Basicos.xlsx está abierto en Microsoft Excel. Ciérralo para permitir la lectura."}, 423)
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al leer Excel: {str(e)}"}, 500)


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/gastos/historial  — Historial de quincenas y estados de cuenta
# ─────────────────────────────────────────────────────────────────────────────
def handle_get_historial(handler):
    try:
        if not os.path.exists(PATH_GASTOS):
            handler.send_json({"status": "error", "message": "Archivo no encontrado"}, 404)
            return

        wb = load_wb_readonly(PATH_GASTOS)
        sheet_name = 'Histórico de Quincenas'
        if sheet_name not in wb.sheetnames:
            handler.send_json({"status": "success", "meses": [], "cierres": []})
            return

        ws_hist = wb[sheet_name]
        cierres = []

        for r in range(2, ws_hist.max_row + 1):
            id_cierre = ws_hist.cell(row=r, column=1).value
            if id_cierre is not None and str(id_cierre).strip() != "":
                try:
                    detalle_json = ws_hist.cell(row=r, column=15).value or "{}"
                    try:
                        detalle_obj = json.loads(str(detalle_json))
                    except:
                        detalle_obj = {}

                    cierres.append({
                        "fila": r,
                        "id": int(id_cierre),
                        "periodo": str(ws_hist.cell(row=r, column=2).value or ""),
                        "mes": str(ws_hist.cell(row=r, column=3).value or ""),
                        "anio": safe_int(ws_hist.cell(row=r, column=4).value, datetime.now().year),
                        "fecha_cierre": str(ws_hist.cell(row=r, column=5).value or ""),
                        "presupuesto": safe_float(ws_hist.cell(row=r, column=6).value),
                        "gastos_fijos": safe_float(ws_hist.cell(row=r, column=7).value),
                        "gasto_real": safe_float(ws_hist.cell(row=r, column=8).value),
                        "remanente": safe_float(ws_hist.cell(row=r, column=9).value),
                        "pct_consumido": safe_float(ws_hist.cell(row=r, column=10).value),
                        "ahorro_moto_80": safe_float(ws_hist.cell(row=r, column=11).value),
                        "excedente_salidas_20": safe_float(ws_hist.cell(row=r, column=12).value),
                        "efectivo_retirado": safe_float(ws_hist.cell(row=r, column=13).value),
                        "num_transacciones": safe_int(ws_hist.cell(row=r, column=14).value),
                        "detalle": detalle_obj
                    })
                except (ValueError, TypeError):
                    continue

        meses_dict = {}
        for c in reversed(cierres):
            clave_mes = f"{c['mes']} {c['anio']}"
            if clave_mes not in meses_dict:
                meses_dict[clave_mes] = {
                    "mes_anio": clave_mes, "mes": c['mes'], "anio": c['anio'],
                    "ingreso_total": 0.0, "gasto_real_total": 0.0, "remanente_total": 0.0,
                    "ahorro_moto_total": 0.0, "excedente_salidas_total": 0.0,
                    "num_quincenas": 0, "quincenas": [], "transacciones": []
                }
            m_entry = meses_dict[clave_mes]
            m_entry["ingreso_total"]          += c["presupuesto"]
            m_entry["gasto_real_total"]        += c["gasto_real"]
            m_entry["remanente_total"]         += c["remanente"]
            m_entry["ahorro_moto_total"]       += c["ahorro_moto_80"]
            m_entry["excedente_salidas_total"] += c["excedente_salidas_20"]
            m_entry["num_quincenas"]           += 1
            m_entry["quincenas"].append(c)
            if "registros" in c["detalle"]:
                for reg in c["detalle"]["registros"]:
                    reg_con_quincena = dict(reg)
                    reg_con_quincena["quincena"] = c["periodo"]
                    m_entry["transacciones"].append(reg_con_quincena)

        handler.send_json({
            "status": "success",
            "meses": list(meses_dict.values()),
            "cierres": list(reversed(cierres))
        })
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al leer historial: {str(e)}"}, 500)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/gastos/add  — Agregar gasto
# ─────────────────────────────────────────────────────────────────────────────
def handle_add_gasto(handler, data):
    try:
        wb     = load_wb_write(PATH_GASTOS)
        ws_reg = wb['Registro Diario']

        target_row = None
        for r in range(11, 111):
            m = ws_reg.cell(row=r, column=4).value
            if m is None:
                target_row = r; break
            try:
                if float(m) <= 0:
                    target_row = r; break
            except (ValueError, TypeError):
                target_row = r; break
        if target_row is None:
            target_row = ws_reg.max_row + 1

        fecha_input  = data.get("fecha", datetime.now().strftime("%Y-%m-%d"))
        dia_nombre   = get_dia_semana(fecha_input)
        monto_val    = safe_float(data.get("monto", 0.0))
        categoria_val = data.get("categoria", "🚌 Pasajes Combi (Efectivo)")
        concepto_val  = data.get("concepto", "Gasto diario")
        metodo_val    = data.get("metodo", "Efectivo")
        retirado_val  = data.get("retirado", "Sí (Efectivo)")

        ws_reg.cell(row=target_row, column=1, value=target_row - 10)
        ws_reg.cell(row=target_row, column=2, value=fecha_input)
        ws_reg.cell(row=target_row, column=3, value=dia_nombre)
        ws_reg.cell(row=target_row, column=4, value=monto_val)
        ws_reg.cell(row=target_row, column=5, value=categoria_val)
        ws_reg.cell(row=target_row, column=6, value=concepto_val)
        ws_reg.cell(row=target_row, column=7, value=metodo_val)
        ws_reg.cell(row=target_row, column=8, value=retirado_val)

        wb.save(PATH_GASTOS)
        handler.send_json({"status": "success", "fila": target_row, "message": f"Gasto de ${monto_val:.2f} guardado en Excel"})
    except PermissionError:
        handler.send_json({"status": "error", "message": "⚠️ Control_Gastos_Basicos.xlsx está abierto en Excel. Ciérralo para guardar."}, 423)
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al guardar: {str(e)}"}, 500)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/gastos/edit  — Editar gasto
# ─────────────────────────────────────────────────────────────────────────────
def handle_edit_gasto(handler, data):
    try:
        row_num   = int(data.get("fila"))
        wb        = load_wb_write(PATH_GASTOS)
        ws_reg    = wb['Registro Diario']
        fecha_input  = data.get("fecha", datetime.now().strftime("%Y-%m-%d"))
        dia_nombre   = get_dia_semana(fecha_input)
        monto_val    = safe_float(data.get("monto", 0.0))

        ws_reg.cell(row=row_num, column=2, value=fecha_input)
        ws_reg.cell(row=row_num, column=3, value=dia_nombre)
        ws_reg.cell(row=row_num, column=4, value=monto_val)
        ws_reg.cell(row=row_num, column=5, value=data.get("categoria", "🚌 Pasajes Combi (Efectivo)"))
        ws_reg.cell(row=row_num, column=6, value=data.get("concepto", "Gasto diario"))
        ws_reg.cell(row=row_num, column=7, value=data.get("metodo", "Efectivo"))
        ws_reg.cell(row=row_num, column=8, value=data.get("retirado", "Sí (Efectivo)"))

        wb.save(PATH_GASTOS)
        handler.send_json({"status": "success", "message": f"Registro #{row_num-10} actualizado en Excel"})
    except PermissionError:
        handler.send_json({"status": "error", "message": "⚠️ Control_Gastos_Basicos.xlsx está abierto en Excel. Ciérralo para editar."}, 423)
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al editar: {str(e)}"}, 500)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/gastos/delete  — Borrar gasto con reindexación
# ─────────────────────────────────────────────────────────────────────────────
def handle_delete_gasto(handler, data):
    try:
        row_to_delete = int(data.get("fila"))
        wb     = load_wb_write(PATH_GASTOS)
        ws_reg = wb['Registro Diario']

        active_records = []
        for r in range(11, 111):
            m = ws_reg.cell(row=r, column=4).value
            if m is not None and str(m).strip() != "":
                try:
                    m_val = float(m)
                    if m_val > 0:
                        active_records.append({
                            "original_row": r,
                            "fecha":    ws_reg.cell(row=r, column=2).value,
                            "dia":      ws_reg.cell(row=r, column=3).value,
                            "monto":    m_val,
                            "categoria":ws_reg.cell(row=r, column=5).value,
                            "concepto": ws_reg.cell(row=r, column=6).value,
                            "metodo":   ws_reg.cell(row=r, column=7).value,
                            "retirado": ws_reg.cell(row=r, column=8).value
                        })
                except (ValueError, TypeError):
                    pass

        remaining = [rec for rec in active_records if rec["original_row"] != row_to_delete]

        for r in range(11, 111):
            ws_reg.cell(row=r, column=1).value = r - 10
            for c in range(2, 8):
                ws_reg.cell(row=r, column=c).value = None
            ws_reg.cell(row=r, column=8).value = "Sí"

        for idx, rec in enumerate(remaining):
            curr = 11 + idx
            ws_reg.cell(row=curr, column=1, value=idx + 1)
            ws_reg.cell(row=curr, column=2, value=rec["fecha"])
            ws_reg.cell(row=curr, column=3, value=rec["dia"])
            ws_reg.cell(row=curr, column=4, value=rec["monto"])
            ws_reg.cell(row=curr, column=5, value=rec["categoria"])
            ws_reg.cell(row=curr, column=6, value=rec["concepto"])
            ws_reg.cell(row=curr, column=7, value=rec["metodo"])
            ws_reg.cell(row=curr, column=8, value=rec["retirado"])

        wb.save(PATH_GASTOS)
        handler.send_json({"status": "success", "message": f"Registro #{row_to_delete-10} eliminado y Excel reorganizado."})
    except PermissionError:
        handler.send_json({"status": "error", "message": "⚠️ Control_Gastos_Basicos.xlsx está abierto en Excel. Ciérralo para borrar."}, 423)
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al borrar: {str(e)}"}, 500)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/gastos/config  — Guardar configuración (celdas amarillas)
# ─────────────────────────────────────────────────────────────────────────────
def handle_config_gastos(handler, data):
    try:
        wb      = load_wb_write(PATH_GASTOS)
        ws_dash = wb['Dashboard Gastos Básicos']
        ws_moto = wb['Simulador Vacaciones & Moto']

        if "presupuesto_asignado" in data: ws_dash["B4"].value = safe_float(data["presupuesto_asignado"])
        if "monto_combi"         in data: ws_dash["C8"].value  = safe_float(data["monto_combi"])
        if "monto_comida"        in data: ws_dash["C9"].value  = safe_float(data["monto_comida"])
        if "monto_copias"        in data: ws_dash["C10"].value = safe_float(data["monto_copias"])
        if "monto_imprevistos"   in data: ws_dash["C11"].value = safe_float(data["monto_imprevistos"])

        ws_dash["A12"].value = "🛡️ Excedente 80%: Fondo Emergencia / Moto"
        ws_dash["C12"].value = '=($B$4-SUM(C8:C11))*0.8'
        ws_dash["A13"].value = "🍕 Excedente 20%: Refuerzo Gustos / Salidas"
        ws_dash["C13"].value = '=($B$4-SUM(C8:C11))*0.2'

        if "meta_moto"            in data: ws_moto["B4"].value = safe_float(data["meta_moto"])
        if "dias_libres_num"       in data: ws_moto["E4"].value = safe_float(data["dias_libres_num"])
        if "aportaciones_directas" in data: ws_moto["B7"].value = max(0.0, safe_float(data["aportaciones_directas"]))
        ws_moto["B5"].value = "=E4*('Dashboard Gastos Básicos'!C8/10)"
        ws_moto["B6"].value = "='Dashboard Gastos Básicos'!C12"
        ws_moto["E6"].value = "=SUM('Histórico de Quincenas'!K2:K100)"
        ws_moto["E7"].value = "=E6+B7"
        if "quincenas_cuatri" in data: ws_moto["E5"].value = safe_float(data["quincenas_cuatri"])

        wb.save(PATH_GASTOS)
        handler.send_json({"status": "success", "message": "¡Configuración guardada dinámicamente en Excel!"})
    except PermissionError:
        handler.send_json({"status": "error", "message": "⚠️ Control_Gastos_Basicos.xlsx está abierto en Microsoft Excel. Ciérralo para guardar."}, 423)
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al guardar configuración: {str(e)}"}, 500)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/gastos/moto_aporte  — Registrar o sumar aporte directo a la moto
# ─────────────────────────────────────────────────────────────────────────────
def handle_moto_aporte(handler, data):
    try:
        monto = safe_float(data.get("monto", 0.0))
        modo  = data.get("modo", "sumar")  # "sumar" o "fijar"
        wb    = load_wb_write(PATH_GASTOS)
        ws_moto = wb['Simulador Vacaciones & Moto']

        actual = safe_float(ws_moto['B7'].value, 0.0) if ws_moto.max_row >= 7 else 0.0
        nuevo  = (actual + monto) if modo == "sumar" else monto
        nuevo  = max(0.0, round(nuevo, 2))

        ws_moto['B7'].value = nuevo
        ws_moto['E7'].value = "=E6+B7"

        wb.save(PATH_GASTOS)
        handler.send_json({
            "status": "success",
            "total_aportado": nuevo,
            "message": f"¡Aportación de ${monto:.2f} registrada a la meta de la moto!"
        })
    except PermissionError:
        handler.send_json({"status": "error", "message": "⚠️ Control_Gastos_Basicos.xlsx está abierto en Excel. Ciérralo para guardar."}, 423)
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al registrar aportación: {str(e)}"}, 500)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/gastos/cerrar_quincena  — Cerrar quincena y reiniciar registro
# ─────────────────────────────────────────────────────────────────────────────
def handle_cerrar_quincena(handler, data):
    try:
        wb      = load_wb_write(PATH_GASTOS)
        ws_dash = wb['Dashboard Gastos Básicos']
        ws_reg  = wb['Registro Diario']

        sheet_hist = 'Histórico de Quincenas'
        if sheet_hist not in wb.sheetnames:
            ws_hist = wb.create_sheet(title=sheet_hist)
            headers = ["ID Cierre","Periodo","Mes","Año","Fecha Cierre",
                       "Presupuesto Asignado ($)","Gastos Fijos Total ($)","Gasto Real Total ($)",
                       "Remanente Ahorrado ($)","% Consumido","Ahorro Moto 80% ($)","Excedente Salidas 20% ($)",
                       "Efectivo Retirado ($)","Num Transacciones","Detalle Movimientos JSON"]
            for c_idx, h in enumerate(headers, 1):
                ws_hist.cell(row=1, column=c_idx, value=h)
        else:
            ws_hist = wb[sheet_hist]

        presupuesto_asignado = safe_float(ws_dash['B4'].value, 2500.0)
        m_combi       = safe_float(ws_dash['C8'].value,  320.0)
        m_comida      = safe_float(ws_dash['C9'].value,  180.0)
        m_copias      = safe_float(ws_dash['C10'].value, 100.0)
        m_imprevistos = safe_float(ws_dash['C11'].value, 150.0)
        gastos_fijos  = m_combi + m_comida + m_copias + m_imprevistos
        excedente_bolsa      = max(0.0, presupuesto_asignado - gastos_fijos)
        m_excedente_moto     = round(excedente_bolsa * 0.80, 2)
        m_excedente_gustos   = round(excedente_bolsa * 0.20, 2)
        efectivo_retirar     = m_combi + m_comida

        registros_actuales = []
        for r in range(11, 111):
            m_val_raw = ws_reg.cell(row=r, column=4).value
            if m_val_raw is not None and str(m_val_raw).strip() != "":
                try:
                    m_num = float(m_val_raw)
                    if m_num > 0:
                        registros_actuales.append({
                            "id":        ws_reg.cell(row=r, column=1).value or (r - 10),
                            "fecha":     parse_fecha(ws_reg.cell(row=r, column=2).value),
                            "dia":       str(ws_reg.cell(row=r, column=3).value or ""),
                            "monto":     m_num,
                            "categoria": str(ws_reg.cell(row=r, column=5).value or ""),
                            "concepto":  str(ws_reg.cell(row=r, column=6).value or ""),
                            "metodo":    str(ws_reg.cell(row=r, column=7).value or "Efectivo"),
                            "retirado":  str(ws_reg.cell(row=r, column=8).value or "Sí")
                        })
                except (ValueError, TypeError):
                    pass

        total_gastado = sum(reg["monto"] for reg in registros_actuales)
        remanente     = max(0.0, presupuesto_asignado - total_gastado)
        pct_consumido = round((total_gastado / presupuesto_asignado * 100), 1) if presupuesto_asignado > 0 else 0.0

        # El fondo moto y salidas reciben su excedente neto base presupuestado (sin sumar remanentes de pasajes/comidas)
        ahorro_moto_real       = m_excedente_moto
        excedente_salidas_real = m_excedente_gustos
        ahorro_extra_no_gastado = max(0.0, remanente - excedente_bolsa)

        categorias_desglose = {
            "Pasajes Combi":    sum(r["monto"] for r in registros_actuales if "Pasajes"       in r["categoria"]),
            "Comidas Escuela":  sum(r["monto"] for r in registros_actuales if "Comidas"       in r["categoria"]),
            "Copias & Material": sum(r["monto"] for r in registros_actuales if "Copias"        in r["categoria"]),
            "Imprevistos":      sum(r["monto"] for r in registros_actuales if "Imprevistos"   in r["categoria"]),
            "Excedente Moto":   sum(r["monto"] for r in registros_actuales if "Excedente 80%" in r["categoria"]),
            "Excedente Salidas": sum(r["monto"] for r in registros_actuales if "Excedente 20%" in r["categoria"])
        }

        detalle_cierre = {
            "presupuesto_asignado": presupuesto_asignado,
            "gastos_fijos": gastos_fijos,
            "total_gastado": total_gastado,
            "remanente": remanente,
            "ahorro_moto_real": ahorro_moto_real,
            "excedente_salidas_real": excedente_salidas_real,
            "ahorro_extra_no_gastado": ahorro_extra_no_gastado,
            "desglose_categorias": categorias_desglose,
            "registros": registros_actuales
        }

        now = datetime.now()
        meses_es = {"January":"Enero","February":"Febrero","March":"Marzo","April":"Abril",
                    "May":"Mayo","June":"Junio","July":"Julio","August":"Agosto",
                    "September":"Septiembre","October":"Octubre","November":"Noviembre","December":"Diciembre"}
        nombre_periodo = data.get("periodo", f"{'1ra' if now.day <= 15 else '2da'} Quincena - {now.strftime('%b %Y')}")
        mes_nombre     = meses_es.get(data.get("mes", now.strftime("%B")), data.get("mes", now.strftime("%B")))
        anio_val       = int(data.get("anio", now.year))
        fecha_cierre_val = data.get("fecha_cierre", now.strftime("%Y-%m-%d"))

        target_hist_row = None
        for r in range(2, 500):
            if ws_hist.cell(row=r, column=2).value is None or str(ws_hist.cell(row=r, column=2).value).strip() == "":
                target_hist_row = r; break
        if target_hist_row is None:
            target_hist_row = ws_hist.max_row + 1

        id_cierre_num = target_hist_row - 1
        ws_hist.cell(row=target_hist_row, column=1,  value=id_cierre_num)
        ws_hist.cell(row=target_hist_row, column=2,  value=nombre_periodo)
        ws_hist.cell(row=target_hist_row, column=3,  value=mes_nombre)
        ws_hist.cell(row=target_hist_row, column=4,  value=anio_val)
        ws_hist.cell(row=target_hist_row, column=5,  value=fecha_cierre_val)
        ws_hist.cell(row=target_hist_row, column=6,  value=presupuesto_asignado)
        ws_hist.cell(row=target_hist_row, column=7,  value=gastos_fijos)
        ws_hist.cell(row=target_hist_row, column=8,  value=total_gastado)
        ws_hist.cell(row=target_hist_row, column=9,  value=remanente)
        ws_hist.cell(row=target_hist_row, column=10, value=pct_consumido)
        ws_hist.cell(row=target_hist_row, column=11, value=ahorro_moto_real)
        ws_hist.cell(row=target_hist_row, column=12, value=excedente_salidas_real)
        ws_hist.cell(row=target_hist_row, column=13, value=efectivo_retirar)
        ws_hist.cell(row=target_hist_row, column=14, value=len(registros_actuales))
        ws_hist.cell(row=target_hist_row, column=15, value=json.dumps(detalle_cierre, ensure_ascii=False))

        # WIPE del Registro Diario
        max_r = max(120, ws_reg.max_row + 1)
        for r in range(11, max_r):
            ws_reg.cell(row=r, column=1).value = r - 10
            for c in range(2, 8):
                ws_reg.cell(row=r, column=c).value = None
            ws_reg.cell(row=r, column=8).value = "Sí"
        while ws_reg.max_row > 110:
            ws_reg.delete_rows(111, 1)

        wb.save(PATH_GASTOS)
        handler.send_json({
            "status": "success",
            "message": f"🎉 ¡{nombre_periodo} cerrada y archivada con éxito! Registro diario reiniciado para tu nueva quincena.",
            "cierre_guardado": {
                "id": id_cierre_num, "periodo": nombre_periodo,
                "mes": mes_nombre, "anio": anio_val,
                "total_gastado": total_gastado, "remanente": remanente
            }
        })
    except PermissionError:
        handler.send_json({"status": "error", "message": "⚠️ Control_Gastos_Basicos.xlsx está abierto en Excel. Ciérralo para realizar el cierre."}, 423)
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al cerrar quincena: {str(e)}"}, 500)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/gastos/limpiar_registro  — Limpiar registro diario a $0
# ─────────────────────────────────────────────────────────────────────────────
def handle_limpiar_registro(handler, data):
    try:
        wb     = load_wb_write(PATH_GASTOS)
        ws_reg = wb['Registro Diario']

        max_r = max(120, ws_reg.max_row + 1)
        for r in range(11, max_r):
            ws_reg.cell(row=r, column=1).value = r - 10
            for c in range(2, 8):
                ws_reg.cell(row=r, column=c).value = None
            ws_reg.cell(row=r, column=8).value = "Sí"
        while ws_reg.max_row > 110:
            ws_reg.delete_rows(111, 1)

        wb.save(PATH_GASTOS)
        handler.send_json({"status": "success", "message": "🧹 Registro diario reiniciado a $0.00 en Excel correctamente."})
    except PermissionError:
        handler.send_json({"status": "error", "message": "⚠️ Control_Gastos_Basicos.xlsx está abierto en Excel. Ciérralo para limpiar."}, 423)
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al limpiar registro: {str(e)}"}, 500)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/gastos/borrar_cierre  — Borrar un cierre de quincena
# ─────────────────────────────────────────────────────────────────────────────
def handle_borrar_cierre(handler, data):
    try:
        wb         = load_wb_write(PATH_GASTOS)
        sheet_hist = 'Histórico de Quincenas'
        if sheet_hist not in wb.sheetnames:
            handler.send_json({"status": "error", "message": "Hoja de histórico no encontrada"}, 404)
            return

        ws_hist      = wb[sheet_hist]
        target_id    = data.get("id")
        target_fila  = data.get("fila")
        row_to_delete = None

        if target_fila is not None:
            row_to_delete = int(target_fila)
        elif target_id is not None:
            t_id = int(target_id)
            for r in range(2, ws_hist.max_row + 1):
                val = ws_hist.cell(row=r, column=1).value
                if val is not None:
                    try:
                        if int(val) == t_id:
                            row_to_delete = r; break
                    except (ValueError, TypeError):
                        pass

        if row_to_delete is not None and 2 <= row_to_delete <= ws_hist.max_row:
            periodo_borrado = str(ws_hist.cell(row=row_to_delete, column=2).value or "Cierre")
            ws_hist.delete_rows(row_to_delete, 1)
            for r in range(2, ws_hist.max_row + 1):
                if ws_hist.cell(row=r, column=2).value is not None:
                    ws_hist.cell(row=r, column=1, value=r - 1)
            wb.save(PATH_GASTOS)
            handler.send_json({"status": "success", "message": f"🗑️ {periodo_borrado} eliminada del histórico de Excel correctamente."})
        else:
            handler.send_json({"status": "error", "message": "Cierre no encontrado en el histórico."}, 404)
    except PermissionError:
        handler.send_json({"status": "error", "message": "⚠️ Control_Gastos_Basicos.xlsx está abierto en Excel. Ciérralo para borrar el cierre."}, 423)
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al borrar cierre: {str(e)}"}, 500)
