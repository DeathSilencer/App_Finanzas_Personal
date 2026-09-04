"""
server.py — Servidor HTTP principal de la App Finanzas Personal.
Sirve archivos estáticos del frontend y delega las rutas API a los módulos de routes/.
"""

import sys
import os
import json
import http.server

# Asegurar encoding UTF-8 en consola de Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

# Agregar el directorio backend al path de Python
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from config import PORT, FRONTEND_DIR
from routes.gastos_db_routes import (
    handle_get_gastos, handle_get_historial,
    handle_add_gasto, handle_edit_gasto, handle_delete_gasto,
    handle_config_gastos, handle_moto_aporte, handle_cerrar_quincena,
    handle_limpiar_registro, handle_borrar_cierre
)
from routes.futuro_db_routes import (
    handle_get_futuro, handle_tdc_add, handle_tdc_edit,
    handle_tdc_delete, handle_tdc_pay, handle_config_futuro,
    handle_add_gasto_ocio, handle_delete_gasto_ocio,
    handle_update_aportacion_futuro, handle_cerrar_quincena_futuro,
    handle_get_historial_futuro, handle_borrar_cierre_futuro,
    handle_ajustar_cajita_turbo
)


class FinanzasHandler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, fmt, *args):
        print(f"  [HTTP] {self.address_string()} - {fmt % args}")

    # ──────────────────────────────────────────────────────────────────────────
    # GET routing
    # ──────────────────────────────────────────────────────────────────────────
    def do_GET(self):
        path = self.path.split("?")[0]

        if path == "/api/gastos":
            handle_get_gastos(self)
        elif path == "/api/gastos/historial":
            handle_get_historial(self)
        elif path == "/api/futuro":
            handle_get_futuro(self)
        elif path == "/api/futuro/historial":
            handle_get_historial_futuro(self)
        else:
            # Servir SPA de React si existe index.html y la ruta no es un archivo estático directo
            clean_path = path.lstrip("/")
            file_path = os.path.join(FRONTEND_DIR, clean_path)
            if not os.path.exists(file_path) or os.path.isdir(file_path):
                index_file = os.path.join(FRONTEND_DIR, "index.html")
                if os.path.exists(index_file):
                    self.path = "/index.html"
            super().do_GET()

    # ──────────────────────────────────────────────────────────────────────────
    # POST routing
    # ──────────────────────────────────────────────────────────────────────────
    def do_POST(self):
        path = self.path.split("?")[0]
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body_raw = self.rfile.read(content_length) if content_length > 0 else b"{}"
            data = json.loads(body_raw.decode("utf-8")) if body_raw else {}
        except (json.JSONDecodeError, ValueError):
            data = {}

        routes_map = {
            "/api/gastos/add":             lambda: handle_add_gasto(self, data),
            "/api/gastos/edit":            lambda: handle_edit_gasto(self, data),
            "/api/gastos/delete":          lambda: handle_delete_gasto(self, data),
            "/api/gastos/config":          lambda: handle_config_gastos(self, data),
            "/api/gastos/moto_aporte":     lambda: handle_moto_aporte(self, data),
            "/api/gastos/cerrar_quincena": lambda: handle_cerrar_quincena(self, data),
            "/api/gastos/limpiar_registro":lambda: handle_limpiar_registro(self, data),
            "/api/gastos/borrar_cierre":   lambda: handle_borrar_cierre(self, data),
            "/api/futuro/tdc_add":         lambda: handle_tdc_add(self, data),
            "/api/futuro/tdc_edit":        lambda: handle_tdc_edit(self, data),
            "/api/futuro/tdc_delete":      lambda: handle_tdc_delete(self, data),
            "/api/futuro/tdc_pay":         lambda: handle_tdc_pay(self, data),
            "/api/futuro/config":          lambda: handle_config_futuro(self, data),
            "/api/futuro/gasto_ocio":      lambda: handle_add_gasto_ocio(self, data),
            "/api/futuro/delete_gasto_ocio": lambda: handle_delete_gasto_ocio(self, data),
            "/api/futuro/aportacion":      lambda: handle_update_aportacion_futuro(self, data),
            "/api/futuro/cerrar_quincena": lambda: handle_cerrar_quincena_futuro(self, data),
            "/api/futuro/borrar_cierre":   lambda: handle_borrar_cierre_futuro(self, data),
            "/api/futuro/cajita/ajuste":   lambda: handle_ajustar_cajita_turbo(self, data),
        }

        handler_fn = routes_map.get(path)
        if handler_fn:
            handler_fn()
        else:
            self.send_json({"status": "error", "message": f"Ruta no encontrada: {path}"}, 404)


# ─────────────────────────────────────────────────────────────────────────────
# Main — Iniciar servidor
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    server = http.server.ThreadingHTTPServer(("localhost", PORT), FinanzasHandler)

    print("=" * 60)
    print("  App Finanzas Personal - Servidor Local")
    print("=" * 60)
    print(f"  URL:      http://localhost:{PORT}/gastos/")
    print(f"  Futuro:   http://localhost:{PORT}/futuro/")
    print(f"  Frontend: {FRONTEND_DIR}")
    print("=" * 60)
    print("  Presiona Ctrl+C para detener el servidor.")
    print()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Servidor detenido.")
        server.server_close()
