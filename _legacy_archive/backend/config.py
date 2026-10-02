"""
config.py — Configuración central del proyecto.
Rutas relativas a la raíz del proyecto para máxima portabilidad.
"""

import os

# ─── Puerto del servidor ────────────────────────────────────────────────────
PORT = 8085

# ─── Directorios del proyecto ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))       # .../App_Finanzas_Personal/backend
PROJECT_ROOT = os.path.dirname(BASE_DIR)                   # .../App_Finanzas_Personal
PARENT_DIR = os.path.dirname(PROJECT_ROOT)                 # .../Planes financieros a futuro y diario
FRONTEND_DIST = os.path.join(PROJECT_ROOT, "frontend_dist")
FRONTEND_LEGACY = os.path.join(PROJECT_ROOT, "frontend")
FRONTEND_DIR = FRONTEND_DIST if os.path.exists(os.path.join(FRONTEND_DIST, "index.html")) else FRONTEND_LEGACY
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

# ─── Rutas a los archivos Excel dentro de la carpeta data ──────────────────
PATH_GASTOS = os.path.join(DATA_DIR, "Control_Gastos_Basicos.xlsx")
PATH_FUTURO = os.path.join(DATA_DIR, "Plan_Financiero_Futuro.xlsx")
