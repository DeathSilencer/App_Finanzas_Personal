"""
excel_helpers.py — Funciones utilitarias reutilizables para operaciones con Excel.
"""

import openpyxl
from datetime import datetime


def load_wb_readonly(path):
    """Carga un workbook en modo solo lectura (data_only=True)."""
    return openpyxl.load_workbook(path, data_only=True)


def load_wb_write(path):
    """Carga un workbook para escritura."""
    return openpyxl.load_workbook(path)


def parse_fecha(cell_val):
    """Convierte una celda de fecha de Excel a string 'YYYY-MM-DD'."""
    if isinstance(cell_val, datetime):
        return cell_val.strftime("%Y-%m-%d")
    return str(cell_val or "")


def get_dia_semana(fecha_str):
    """Retorna el nombre del día de la semana en español dado 'YYYY-MM-DD'."""
    dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    try:
        fecha_obj = datetime.strptime(fecha_str, "%Y-%m-%d")
        return dias[fecha_obj.weekday()]
    except (ValueError, TypeError):
        return "Lunes"


def safe_float(val, default=0.0):
    """Convierte un valor a float de forma segura."""
    try:
        return float(val or default)
    except (ValueError, TypeError):
        return default


def safe_int(val, default=0):
    """Convierte un valor a int de forma segura."""
    try:
        return int(val or default)
    except (ValueError, TypeError):
        return default
