"""
backend/database/db.py — Gestor de base de datos SQLite para App_Finanzas_Personal.
Proporciona conexiones seguras, transacciones ACID y utilidades de consulta.
"""

import sqlite3
import os

DB_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(DB_DIR))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
DB_PATH = os.path.join(DATA_DIR, "finanzas.db")
SCHEMA_PATH = os.path.join(DB_DIR, "schema.sql")


def get_connection(db_path=DB_PATH):
    """Retorna una conexión a SQLite con row_factory como sqlite3.Row para acceso por nombre."""
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")  # Write-Ahead Logging para lecturas y escrituras concurrentes ultra rápidas
    return conn


def init_db(db_path=DB_PATH):
    """Inicializa las tablas si no existen según schema.sql."""
    conn = get_connection(db_path)
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    with conn:
        conn.executescript(schema_sql)
    conn.close()


def row_to_dict(row):
    """Convierte un objeto sqlite3.Row a dict."""
    if row is None:
        return None
    return dict(row)


def rows_to_dict_list(rows):
    """Convierte una lista de sqlite3.Row a lista de dicts."""
    return [dict(r) for r in rows]
