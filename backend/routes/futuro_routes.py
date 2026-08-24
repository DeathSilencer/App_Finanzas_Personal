"""
futuro_routes.py — Handlers para la suite de Plan Financiero al Futuro
Maneja Dashboard Maestro, Cetes, Control TDC Nu, Fondo de Emergencia y Retiro SAT.
"""

import json
from datetime import datetime, date
import openpyxl

from config import PATH_FUTURO
from helpers.excel_helpers import (
    parse_fecha, safe_float, safe_int, load_wb_readonly, load_wb_write
)


def get_next_spotify_date(current_date: date) -> date:
    """Devuelve la fecha del próximo cargo de Spotify (día 12)."""
    if current_date.day < 12:
        return date(current_date.year, current_date.month, 12)
    else:
        next_m = current_date.month + 1 if current_date.month < 12 else 1
        next_y = current_date.year if current_date.month < 12 else current_date.year + 1
        return date(next_y, next_m, 12)


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/futuro  — Cargar todos los datos de Plan_Financiero_Futuro.xlsx
# ─────────────────────────────────────────────────────────────────────────────
def handle_get_futuro(handler):
    try:
        wb = load_wb_readonly(PATH_FUTURO)
        ws_dash = wb['Dashboard Maestro']
        ws_tdc  = wb['Control TDC Nu']

        # 1. Leer Parámetros Maestro
        ingreso_base = safe_float(ws_dash["B5"].value, 5000.0)
        tasa_nu      = safe_float(ws_dash["B6"].value, 0.13)
        tasa_cetes   = safe_float(ws_dash["B7"].value, 0.0645)
        tasa_afore   = safe_float(ws_dash["B8"].value, 0.085)

        pct_p1       = safe_float(ws_dash["B9"].value, 0.05)
        pct_p2       = safe_float(ws_dash["B10"].value, 0.50)
        pct_p7       = safe_float(ws_dash["B11"].value, 0.30)
        pct_p3       = safe_float(ws_dash["B12"].value, 0.10)
        pct_p6       = safe_float(ws_dash["B13"].value, 0.05)

        tdc_limite   = safe_float(ws_dash["B14"].value, 500.0)
        tdc_tasa     = safe_float(ws_dash["B15"].value, 0.999)
        tdc_corte    = safe_int(ws_dash["B16"].value, 23)
        tdc_pago     = safe_int(ws_dash["B17"].value, 3)

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

        # 4. TDC Nu — leer compras activas (filas 13 a 112)
        compras_tdc = []
        today = datetime.now().date()
        proximo_spotify = get_next_spotify_date(today)
        proximo_spotify_str = proximo_spotify.strftime("%d/%m/%Y")

        tiene_spotify_este_mes = False
        primera_fila_vacia = None

        for r in range(13, 113):
            monto    = ws_tdc.cell(row=r, column=3).value
            conc_val = str(ws_tdc.cell(row=r, column=4).value or "")
            fecha_val= ws_tdc.cell(row=r, column=2).value

            if "spotify" in conc_val.lower():
                # Comprobar si corresponde a este mes en curso
                tiene_spotify_este_mes = True

            if monto is not None and str(monto).strip() != "":
                try:
                    m_val = float(monto)
                    if m_val > 0:
                        compras_tdc.append({
                            "fila":      r,
                            "id":        ws_tdc.cell(row=r, column=1).value or (r - 12),
                            "fecha":     parse_fecha(fecha_val),
                            "monto":     m_val,
                            "concepto":  conc_val,
                            "categoria": str(ws_tdc.cell(row=r, column=5).value or "Básicos"),
                            "tipo":      str(ws_tdc.cell(row=r, column=6).value or "Gasto Diario"),
                            "apartado":  str(ws_tdc.cell(row=r, column=7).value or "Sí (En Cajita)"),
                            "estado":    str(ws_tdc.cell(row=r, column=8).value or "Pendiente")
                        })
                except (ValueError, TypeError):
                    pass
            else:
                if primera_fila_vacia is None:
                    primera_fila_vacia = r

        # Auto-registro de Spotify ÚNICAMENTE cuando hoy sea el día 12 exacto del mes y aún no esté en la tabla
        if today.day == 12 and not tiene_spotify_este_mes and primera_fila_vacia is not None and primera_fila_vacia <= 112:
            fila_spot = primera_fila_vacia
            spot_date_str = today.strftime("%Y-%m-%d")
            item_spotify = {
                "fila": fila_spot, "id": fila_spot - 12,
                "fecha": spot_date_str, "monto": 70.0,
                "concepto": "Suscripción Spotify", "categoria": "Ocio",
                "tipo": "Suscripción Recurrente", "apartado": "Sí (En Cajita)", "estado": "Pendiente"
            }
            compras_tdc.append(item_spotify)
            try:
                wb_write = load_wb_write(PATH_FUTURO)
                ws_w_tdc = wb_write['Control TDC Nu']
                ws_w_tdc.cell(row=fila_spot, column=1).value = fila_spot - 12
                ws_w_tdc.cell(row=fila_spot, column=2).value = spot_date_str
                ws_w_tdc.cell(row=fila_spot, column=3).value = 70.0
                ws_w_tdc.cell(row=fila_spot, column=4).value = "Suscripción Spotify"
                ws_w_tdc.cell(row=fila_spot, column=5).value = "Ocio"
                ws_w_tdc.cell(row=fila_spot, column=6).value = "Suscripción Recurrente"
                ws_w_tdc.cell(row=fila_spot, column=7).value = "Sí (En Cajita)"
                ws_w_tdc.cell(row=fila_spot, column=8).value = "Pendiente"
                wb_write.save(PATH_FUTURO)
            except PermissionError:
                pass

        tdc_deuda       = sum(c["monto"] for c in compras_tdc if c["estado"] == "Pendiente")
        interes_atraso  = (tdc_deuda * (tdc_tasa / 12)) * 1.16 if tdc_deuda > 0 else 0.0

        # 5. Fondo Emergencia
        aporte_fe_m = (ingreso_base * pct_p3) * 2
        meta_fe     = (ingreso_base * pct_p2 * 2) * 3
        tasa_nu_m   = tasa_nu / 12
        fe_tabla    = []
        saldo_fe    = 0.0
        interes_acum_fe = 0.0

        for m in range(1, 25):
            interes_m = saldo_fe * tasa_nu_m
            saldo_fe  = saldo_fe + aporte_fe_m + interes_m
            interes_acum_fe += interes_m
            fe_tabla.append({
                "mes": f"Mes {m}",
                "ahorro_bolsa": round(aporte_fe_m * m, 2),
                "interes_mes": round(interes_m, 2),
                "interes_acumulado": round(interes_acum_fe, 2),
                "saldo_total": round(saldo_fe, 2),
                "pct_meta": min(100, round((saldo_fe / meta_fe) * 100, 1)) if meta_fe > 0 else 100,
                "estado": "🏆 Meta Cumplida" if saldo_fe >= meta_fe else "En progreso"
            })

        # 6. Retiro & Beneficio Fiscal SAT
        aporte_retiro_anual = (ingreso_base * pct_p6 * 2) * 12
        tasa_isr_sat        = 0.1088
        devolucion_anual_sat= aporte_retiro_anual * tasa_isr_sat
        sat_tabla           = []
        saldo_afore         = 0.0

        for yr in range(1, 26):
            saldo_afore   = (saldo_afore + aporte_retiro_anual) * (1 + tasa_afore)
            ahorro_bolsa  = aporte_retiro_anual * yr
            total_dev_sat = devolucion_anual_sat * yr
            ganancia_neta = (saldo_afore + total_dev_sat) - ahorro_bolsa
            mult          = round((saldo_afore + total_dev_sat) / ahorro_bolsa, 2) if ahorro_bolsa > 0 else 1.0
            sat_tabla.append({
                "anio": f"Año {yr}",
                "ahorro_bolsa": round(ahorro_bolsa, 2),
                "devuelto_sat": round(total_dev_sat, 2),
                "saldo_afore": round(saldo_afore, 2),
                "ganancia_neta": round(ganancia_neta, 2),
                "efecto_mult": mult
            })

        handler.send_json({
            "status": "success",
            "config": {
                "ingreso_base": ingreso_base,
                "tasa_nu":      tasa_nu,
                "tasa_cetes":   tasa_cetes,
                "tasa_afore":   tasa_afore,
                "pct_p1":       pct_p1,
                "pct_p2":       pct_p2,
                "pct_p7":       pct_p7,
                "pct_p3":       pct_p3,
                "pct_p6":       pct_p6,
                "tdc_limite":   tdc_limite,
                "tdc_tasa":     tdc_tasa,
                "tdc_corte":    tdc_corte,
                "tdc_pago":     tdc_pago
            },
            "distribucion": distribucion,
            "cetes": {
                "aporte_quincenal":  ingreso_base * pct_p1,
                "aporte_anual":      aporte_cetes_anual,
                "tasa_anual":        tasa_cetes,
                "tabla":             cetes_tabla
            },
            "tdc": {
                "limite":               tdc_limite,
                "deuda_actual":         tdc_deuda,
                "disponible":           max(0.0, tdc_limite - tdc_deuda),
                "utilizacion_pct":      round((tdc_deuda / tdc_limite) * 100, 1) if tdc_limite > 0 else 0.0,
                "corte_dia":            tdc_corte,
                "pago_dia":             tdc_pago,
                "interes_atraso":       interes_atraso,
                "proximo_spotify_fecha":proximo_spotify_str,
                "proximo_spotify_monto":70.0,
                "compras":              list(reversed(compras_tdc))
            },
            "fondo_emergencia": {
                "aporte_quincenal": ingreso_base * pct_p3,
                "aporte_mensual":   aporte_fe_m,
                "meta_total":       meta_fe,
                "tasa_anual":       tasa_nu,
                "mes_meta":         14,
                "tabla":            fe_tabla
            },
            "retiro_sat": {
                "aporte_quincenal":  ingreso_base * pct_p6,
                "aporte_mensual":    ingreso_base * pct_p6 * 2,
                "aporte_anual":      aporte_retiro_anual,
                "tasa_isr":          tasa_isr_sat,
                "devolucion_anual":  devolucion_anual_sat,
                "tasa_afore":        tasa_afore,
                "tabla":             sat_tabla
            }
        })
    except PermissionError:
        handler.send_json({"status": "error", "message": "⚠️ Plan_Financiero_Futuro.xlsx está abierto en Microsoft Excel. Ciérralo para permitir el acceso."}, 423)
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al leer Excel: {str(e)}"}, 500)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/futuro/tdc_add  — Agregar compra TDC (filas 13 a 112)
# ─────────────────────────────────────────────────────────────────────────────
def handle_tdc_add(handler, data):
    try:
        wb     = load_wb_write(PATH_FUTURO)
        ws_tdc = wb['Control TDC Nu']

        target_row = None
        for r in range(13, 113):
            if ws_tdc.cell(row=r, column=3).value is None or str(ws_tdc.cell(row=r, column=3).value).strip() == "":
                target_row = r; break
        if target_row is None:
            target_row = 112

        fecha_input = data.get("fecha", datetime.now().strftime("%Y-%m-%d"))
        monto_val   = safe_float(data.get("monto", 0.0))

        ws_tdc.cell(row=target_row, column=1).value = target_row - 12
        ws_tdc.cell(row=target_row, column=2).value = fecha_input
        ws_tdc.cell(row=target_row, column=3).value = monto_val
        ws_tdc.cell(row=target_row, column=4).value = data.get("concepto", "Compra TDC")
        ws_tdc.cell(row=target_row, column=5).value = data.get("categoria", "Básicos")
        ws_tdc.cell(row=target_row, column=6).value = data.get("tipo", "Gasto Diario")
        ws_tdc.cell(row=target_row, column=7).value = data.get("apartado", "Sí (En Cajita)")
        ws_tdc.cell(row=target_row, column=8).value = "Pendiente"

        wb.save(PATH_FUTURO)
        handler.send_json({"status": "success", "fila": target_row, "message": f"Compra de ${monto_val:.2f} guardada en Excel"})
    except PermissionError:
        handler.send_json({"status": "error", "message": "⚠️ Plan_Financiero_Futuro.xlsx está abierto en Excel. Ciérralo para guardar."}, 423)
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al guardar compra: {str(e)}"}, 500)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/futuro/tdc_edit  — Editar compra TDC
# ─────────────────────────────────────────────────────────────────────────────
def handle_tdc_edit(handler, data):
    try:
        row_num = int(data.get("fila"))
        wb      = load_wb_write(PATH_FUTURO)
        ws_tdc  = wb['Control TDC Nu']

        ws_tdc.cell(row=row_num, column=2).value = data.get("fecha", datetime.now().strftime("%Y-%m-%d"))
        ws_tdc.cell(row=row_num, column=3).value = safe_float(data.get("monto", 0.0))
        ws_tdc.cell(row=row_num, column=4).value = data.get("concepto", "Compra TDC")
        ws_tdc.cell(row=row_num, column=5).value = data.get("categoria", "Básicos")
        ws_tdc.cell(row=row_num, column=6).value = data.get("tipo", "Gasto Diario")
        ws_tdc.cell(row=row_num, column=7).value = data.get("apartado", "Sí (En Cajita)")
        ws_tdc.cell(row=row_num, column=8).value = data.get("estado", "Pendiente")

        wb.save(PATH_FUTURO)
        handler.send_json({"status": "success", "message": f"Compra #{row_num-12} actualizada en Excel"})
    except PermissionError:
        handler.send_json({"status": "error", "message": "⚠️ Plan_Financiero_Futuro.xlsx está abierto en Excel. Ciérralo para editar."}, 423)
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al editar compra: {str(e)}"}, 500)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/futuro/tdc_delete  — Borrar compra TDC con reindexación (13 a 112)
# ─────────────────────────────────────────────────────────────────────────────
def handle_tdc_delete(handler, data):
    try:
        row_to_delete = int(data.get("fila"))
        wb     = load_wb_write(PATH_FUTURO)
        ws_tdc = wb['Control TDC Nu']

        active_records = []
        for r in range(13, 113):
            m = ws_tdc.cell(row=r, column=3).value
            if m is not None and str(m).strip() != "":
                try:
                    m_val = float(m)
                    if m_val > 0:
                        active_records.append({
                            "original_row": r,
                            "fecha":    ws_tdc.cell(row=r, column=2).value,
                            "monto":    m_val,
                            "concepto": ws_tdc.cell(row=r, column=4).value,
                            "categoria":ws_tdc.cell(row=r, column=5).value,
                            "tipo":     ws_tdc.cell(row=r, column=6).value,
                            "apartado": ws_tdc.cell(row=r, column=7).value,
                            "estado":   ws_tdc.cell(row=r, column=8).value
                        })
                except (ValueError, TypeError):
                    pass

        remaining = [rec for rec in active_records if rec["original_row"] != row_to_delete]

        for r in range(13, 113):
            ws_tdc.cell(row=r, column=1).value = r - 12
            for c in range(2, 9):
                ws_tdc.cell(row=r, column=c).value = None
            ws_tdc.cell(row=r, column=7).value = "Sí (En Cajita)"
            ws_tdc.cell(row=r, column=8).value = "Pendiente"

        for idx, rec in enumerate(remaining):
            curr = 13 + idx
            ws_tdc.cell(row=curr, column=1).value = idx + 1
            ws_tdc.cell(row=curr, column=2).value = rec["fecha"]
            ws_tdc.cell(row=curr, column=3).value = rec["monto"]
            ws_tdc.cell(row=curr, column=4).value = rec["concepto"]
            ws_tdc.cell(row=curr, column=5).value = rec["categoria"]
            ws_tdc.cell(row=curr, column=6).value = rec["tipo"]
            ws_tdc.cell(row=curr, column=7).value = rec["apartado"]
            ws_tdc.cell(row=curr, column=8).value = rec["estado"]

        wb.save(PATH_FUTURO)
        handler.send_json({"status": "success", "message": f"Compra #{row_to_delete-12} eliminada y lista reorganizada."})
    except PermissionError:
        handler.send_json({"status": "error", "message": "⚠️ Plan_Financiero_Futuro.xlsx está abierto en Excel. Ciérralo para borrar."}, 423)
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al borrar compra: {str(e)}"}, 500)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/futuro/tdc_pay  — Liquidar todas las compras TDC y reiniciar lista limpia
# ─────────────────────────────────────────────────────────────────────────────
def handle_tdc_pay(handler, data):
    try:
        wb     = load_wb_write(PATH_FUTURO)
        ws_tdc = wb['Control TDC Nu']

        # Limpiar todas las filas 13 a 112 para arrancar desde $0.00
        for r in range(13, 113):
            ws_tdc.cell(row=r, column=1).value = r - 12
            for c in range(2, 9):
                ws_tdc.cell(row=r, column=c).value = None
            ws_tdc.cell(row=r, column=7).value = "Sí (En Cajita)"
            ws_tdc.cell(row=r, column=8).value = "Pendiente"

        wb.save(PATH_FUTURO)
        handler.send_json({
            "status": "success",
            "message": "🎉 ¡Tarjeta de crédito liquidada al 100%! La lista se ha reiniciado en $0.00 para tu nuevo ciclo."
        })
    except PermissionError:
        handler.send_json({"status": "error", "message": "⚠️ Plan_Financiero_Futuro.xlsx está abierto en Excel. Ciérralo para liquidar y reiniciar la lista."}, 423)
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al liquidar TDC: {str(e)}"}, 500)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/futuro/config  — Actualizar parámetros maestros (celdas amarillas B5:B17)
# ─────────────────────────────────────────────────────────────────────────────
def handle_config_futuro(handler, data):
    try:
        wb      = load_wb_write(PATH_FUTURO)
        ws_dash = wb['Dashboard Maestro']

        if "ingreso_base"  in data: ws_dash["B5"].value  = safe_float(data["ingreso_base"])
        if "tasa_nu"       in data: ws_dash["B6"].value  = safe_float(data["tasa_nu"])
        if "tasa_cetes"    in data: ws_dash["B7"].value  = safe_float(data["tasa_cetes"])
        if "tasa_afore"    in data: ws_dash["B8"].value  = safe_float(data["tasa_afore"])
        if "pct_p1"        in data: ws_dash["B9"].value  = safe_float(data["pct_p1"])
        if "pct_p2"        in data: ws_dash["B10"].value = safe_float(data["pct_p2"])
        if "pct_p7"        in data: ws_dash["B11"].value = safe_float(data["pct_p7"])
        if "pct_p3"        in data: ws_dash["B12"].value = safe_float(data["pct_p3"])
        if "pct_p6"        in data: ws_dash["B13"].value = safe_float(data["pct_p6"])
        if "tdc_limite"    in data: ws_dash["B14"].value = safe_float(data["tdc_limite"])
        if "tdc_tasa"      in data: ws_dash["B15"].value = safe_float(data["tdc_tasa"])
        if "tdc_corte"     in data: ws_dash["B16"].value = safe_int(data["tdc_corte"])
        if "tdc_pago"      in data: ws_dash["B17"].value = safe_int(data["tdc_pago"])

        wb.save(PATH_FUTURO)
        handler.send_json({"status": "success", "message": "Parámetros maestros actualizados en Plan_Financiero_Futuro.xlsx"})
    except PermissionError:
        handler.send_json({"status": "error", "message": "⚠️ Plan_Financiero_Futuro.xlsx está abierto en Excel. Ciérralo para guardar configuración."}, 423)
    except Exception as e:
        handler.send_json({"status": "error", "message": f"Error al guardar configuración: {str(e)}"}, 500)
