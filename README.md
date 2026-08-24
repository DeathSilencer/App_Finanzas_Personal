# 💰 App Finanzas Personal — Documentación Técnica Integral

> **Sistema Integral de Gestión Patrimonial, Control de Gastos Básicos y Planificación Financiera a Futuro.**
> Conectado en tiempo real con Microsoft Excel (`Control_Gastos_Basicos.xlsx` y `Plan_Financiero_Futuro.xlsx`), con arquitectura desacoplada, diseño responsivo, automatizaciones inteligentes y generación de Estados de Cuenta Institucionales.

---

## 🏛️ 1. Arquitectura General del Sistema

El sistema está construido siguiendo una arquitectura limpia y desacoplada de dos capas:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (SPA Modular)                        │
│   • HTML5 Semántico + Tailwind CSS CDN + Lucide Icons                  │
│   • Vanilla JavaScript ES6+ Modular (Sin dependencias pesadas ni node) │
│   • Estilos de Impresión Formal Institucional (@media print)           │
├────────────────────────────────────────────────────────────────────────┤
│                           HTTP / REST API                              │
│   • Endpoints GET / POST en JSON UTF-8 (Puerto 8085)                   │
├────────────────────────────────────────────────────────────────────────┤
│                       BACKEND (Python Standalone)                      │
│   • http.server nativo multiruta (Sin dependencias de Flask/Django)    │
│   • openpyxl para lectura y escritura atómica en libros de Excel       │
├────────────────────────────────────────────────────────────────────────┤
│                         PERSISTENCIA (Excel)                           │
│   • Control_Gastos_Basicos.xlsx (Gastos, Quincenas, Simulador Moto)    │
│   • Plan_Financiero_Futuro.xlsx (TDC Nu 100 filas, Fondos, Retiro)     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 2. Estructura Completa de Archivos y Carpetas

```
App_Finanzas_Personal/
│
├── backend/
│   ├── config.py                      # Configuración central (puerto 8085, rutas a archivos Excel)
│   ├── server.py                      # Servidor HTTP multiruta y despachador de endpoints
│   ├── helpers/
│   │   ├── __init__.py
│   │   └── excel_helpers.py           # Utilidades openpyxl (lectura readonly, escritura segura, casteo de tipos)
│   └── routes/
│       ├── __init__.py
│       ├── gastos_routes.py           # Lógica y endpoints de Control de Gastos Básicos e Histórico
│       └── futuro_routes.py           # Lógica y endpoints de Plan a Futuro y Control TDC Nu (100 filas)
│
├── data/                              # Copias de seguridad y plantillas de libros de Excel
│   ├── Control_Gastos_Basicos.xlsx
│   └── Plan_Financiero_Futuro.xlsx
│
├── frontend/
│   ├── index.html                     # Portal de bienvenida (Hub de navegación entre módulos)
│   ├── shared/
│   │   ├── css/
│   │   │   └── base.css               # Estilos globales, glassmorphism, temas oscuros y scrollbars
│   │   └── js/
│   │       ├── toast.js               # Sistema centralizado de notificaciones toast flotantes
│   │       └── tdc-reminder.js        # Widget inteligente lateral con alertas de corte y pago TDC Nu
│   ├── gastos/
│   │   ├── index.html                 # Dashboard modular de Gastos Básicos y Estado de Cuenta Formal
│   │   ├── css/
│   │   │   └── gastos.css             # Estilos específicos de gastos y reglas @media print institucionales
│   │   └── js/
│   │       ├── api.js                 # Cliente HTTP fetch para todos los endpoints de gastos
│   │       ├── modals.js              # Gestión de modales (Cerrar Quincena, Editar, Eliminar)
│   │       ├── navigation.js          # Control de pestañas y sincronización
│   │       └── render.js              # Renderizado dinámico del DOM, tablas, KPIs y Estado de Cuenta
│   └── futuro/
│       ├── index.html                 # Dashboard modular de Plan a Futuro y TDC Nu
│       ├── css/
│       │   └── futuro.css             # Estilos específicos de futuro y tablas de inversión
│       └── js/
│           ├── api.js                 # Cliente HTTP fetch para endpoints de futuro
│           ├── modals.js              # Modales de agregar/editar compra TDC y abonos
│           ├── render.js              # Renderizado de CETES, Fondos de Ahorro y Retiro
│           └── tdc.js                 # Gestión de bitácora TDC Nu, liquidación y Spotify
│
├── iniciar_app.bat                    # Lanzador rápido en Windows (doble clic)
├── .gitignore                         # Exclusiones de Git
└── README.md                          # Esta documentación técnica
```

---

## ⚙️ 3. Reglas de Negocio y Lógica Financiera

### 💸 A. Control de Gastos Básicos y Cajita Turbo Nu (13% Anual)
* **Presupuesto Quincenal Base:** Celda `B4` (ej. `$2,500.00 MXN`).
* **Efectivo Físico Retirado:** 
  - Pasajes Combi (`C8`, ej. `$320.00`) + Comidas Escuela (`C9`, ej. `$180.00`) = `$500.00 MXN` por quincena (`B10`).
  - **Regla del Efectivo:** Este dinero se retira en efectivo en el cajero para el uso diario de lunes a viernes, por lo que **NUNCA genera rendimiento bancario**.
* **Gastos Digitales Resguardados en Cajita Nu:**
  - Copias & Papelería (`C10`, ej. `$100.00`) e Imprevistos (`C11`, ej. `$150.00`). Permanecen en la cuenta digital Nu.
* **Excedente Base & Distribución Automática:**
  - Excedente Total (`B14`) = Presupuesto Asignado (`B4`) - Gastos Operativos Fijos (`B8`).
  - **Fondo Acelerador Moto (80%):** Celda `B15` (`Excedente * 0.80`).
  - **Fondo Salidas y Gustos (20%):** Celda `B16` (`Excedente * 0.20`).
* **Ahorro Extra por No Gastar el 100%:**
  - Todo remanente no consumido en pasajes, comidas, copias o imprevistos se suma automáticamente al remanente real y se distribuye 80% a la Moto y 20% a Salidas.
* **Cálculo de Rendimiento Real en Cajita Turbo Nu (13% Anual):**
  $$\text{Capital Digital en Nu} = \max(0, \text{Saldo Remanente Total} - \text{Efectivo Retirado})$$
  $$\text{Rendimiento Mensual Estimado} = \text{Capital Digital en Nu} \times \left(\frac{0.13}{12}\right)$$
  *(Se excluye el efectivo retirado físicamente y se calcula con exactitud matemática).*

---

### 📅 B. Automatización y Restricciones de Quincenas
* **Nombres Automáticos de Período:**
  - Si el día actual es del **1 al 15**: se asigna `1ra Quincena (1-15 [Mes] [Año])` (ej. `1ra Quincena (1-15 Agosto 2026)`).
  - Si el día actual es del **16 al 31**: se asigna `2da Quincena (16-[ÚltimoDía] [Mes] [Año])` (ej. `2da Quincena (16-31 Agosto 2026)`).
* **Restricción de Meses:**
  - El modal de cierre está restringido a solo 2 opciones:
    1. **Mes Actual** (seleccionado por defecto).
    2. **Mes Anterior** (habilitado únicamente para cierres extemporáneos por olvido).
* **Cierre Atómico y Reinicio a $0.00:**
  - Al cerrar la quincena, se genera un registro consolidado en la hoja `Histórico de Quincenas` (con metadatos y payload JSON en columna 15) y se limpian las filas 11 a 110 de la hoja `Registro Diario` para arrancar la nueva quincena limpia en `$0.00`.

---

### 💳 C. Control TDC Nu & Suscripción Spotify
* **Capacidad Ampliada a 100 Compras:**
  - Rango de filas en Excel: **Filas 13 a 112** (Hoja `Control TDC Nu` de `Plan_Financiero_Futuro.xlsx`).
  - Fila 113: Celda de **TOTAL** con fórmula `=SUM(C13:C112)`.
* **Liquidación Total ("Pagar Tarjeta"):**
  - Al presionar *Pagar Tarjeta*, se vacían completamente todas las compras pasadas (filas 13 a 112), reseteando la bitácora a `$0.00` de deuda y 0 compras para el nuevo ciclo de facturación.
* **Cargo Programado de Spotify ($70.00 MXN):**
  - La suscripción a Spotify ($70) **solo se añade como cargo/deuda en la bitácora a partir del día 12 del mes**.
  - Si la fecha actual es anterior al día 12 y la tarjeta fue liquidada, la deuda arranca en `$0.00` y se muestra la fecha del próximo cargo programado (`12/[Mes]/[Año]`).
* **Widget Flotante Lateral Inteligente:**
  - Informa en tiempo real: Deuda Actual, Saldo Disponible, Fecha de Corte (Día 23), Fecha Límite de Pago (Día 3 del siguiente mes) y alerta de Totalero.

---

### 🖨️ D. Estado de Cuenta Institucional y Formato Impreso
* **Diseño Formal Estructurado:**
  - **`a` Encabezado:** Marco formal con título `ESTADO DE CUENTA`, período en mayúsculas, fecha de emisión y número de página.
  - **`b` y `c` Metadatos:** Titular (*David*), Plan Financiero (*Plan Maestro 50/30/10/5/5 • Cajita Turbo Nu 13%*), divisa y estado auditado.
  - **`d` Resumen de Movimientos:** Balance en 4 columnas (*Concepto*, *Presupuesto Asignado*, *Gasto Real*, *Remanente / Saldo*).
  - **`e` Barra Enmarcada de Totales:** Resumen destacado con borde sólido.
  - **`f` Comparativa vs Mes Anterior & Rendimientos:**
    - Variación en `$`, `%` y diagnóstico de gasto vs mes previo.
    - Crecimiento de remanente y Tasa de Eficiencia de Ahorro.
    - **Rendimiento Mensual Estimado en Cajita Turbo Nu (13% anual)** sobre capital digital resguardado.
  - **`g` Desglose por Categoría:** Presupuesto, real, saldo y semáforos de control.
  - **`h` Quincenas Consolidadas:** Detalle quincena por quincena.
  - **`i` Bitácora Exhaustiva:** Folio por folio de cada movimiento individual.
  - **`j` Nota de Auditoría:** Pie de página legal y de sincronización.
* **Aislamiento Hermético en `@media print`:**
  - Utiliza reglas CSS estrictas (`body > *:not(main)`, `#tab-estado-cuenta > *:not(#print-estado-cuenta)`) para que al presionar **"Imprimir / Guardar PDF"** (`Ctrl + P`) **única y exclusivamente** se imprima el Estado de Cuenta formal, con márgenes exactos y sin ningún elemento web o botones.

---

## 📡 4. Catálogo Completo de Endpoints API

### 📊 Endpoints de Gastos (`/api/gastos`)

| Método | Ruta | Descripción | Payload / Parámetros |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/gastos` | Obtiene el resumen actual, categorías, registros activos y simulador moto. | Ninguno |
| `GET` | `/api/gastos/historial` | Obtiene el historial de quincenas archivadas y meses consolidados. | Ninguno |
| `POST` | `/api/gastos/add` | Agrega un nuevo gasto a la hoja `Registro Diario`. | `{"fecha": "YYYY-MM-DD", "monto": 50, "categoria": "...", "concepto": "...", "metodo": "Efectivo", "retirado": "Sí"}` |
| `POST` | `/api/gastos/edit` | Edita un gasto existente por número de fila. | `{"fila": 11, "fecha": "...", "monto": 50, ...}` |
| `POST` | `/api/gastos/delete` | Elimina un gasto y compacta las filas en Excel. | `{"fila": 11}` |
| `POST` | `/api/gastos/config` | Actualiza presupuesto, gastos fijos y parámetros de la moto. | `{"presupuesto": 2500, "combi": 320, "comida": 180, ...}` |
| `POST` | `/api/gastos/cerrar_quincena` | Archiva la quincena actual en el histórico y limpia el registro. | `{"periodo": "1ra Quincena...", "mes": "Agosto"}` |
| `POST` | `/api/gastos/limpiar_registro` | Vacía la hoja `Registro Diario` sin archivar. | `{}` |
| `POST` | `/api/gastos/borrar_cierre` | Elimina un cierre del histórico por su ID. | `{"id": 1}` |

---

### 📈 Endpoints de Plan a Futuro y TDC Nu (`/api/futuro`)

| Método | Ruta | Descripción | Payload / Parámetros |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/futuro` | Obtiene CETES, Fondos, Retiro, Dashboard y bitácora TDC Nu (100 filas). | Ninguno |
| `POST` | `/api/futuro/tdc_add` | Registra una compra en la bitácora de TDC Nu (filas 13-112). | `{"fecha": "YYYY-MM-DD", "concepto": "...", "monto": 150, "msi": "No", "quincenas": 1}` |
| `POST` | `/api/futuro/tdc_edit` | Modifica una compra existente en TDC Nu. | `{"fila": 13, "fecha": "...", "concepto": "...", "monto": 150, ...}` |
| `POST` | `/api/futuro/tdc_delete` | Elimina una compra de TDC Nu y compacta la lista. | `{"fila": 13}` |
| `POST` | `/api/futuro/tdc_pay` | Liquida la tarjeta: limpia filas 13 a 112 y resetea a `$0.00`. | `{}` |
| `POST` | `/api/futuro/config` | Actualiza límites de crédito, aportes de CETES y fondos de retiro. | `{"limite_credito": 2000, ...}` |

---

## 🚀 5. Puesta en Marcha y Ejecución

### Requisitos Previos:
- Python 3.10 o superior.
- Librería `openpyxl`:
  ```bash
  pip install openpyxl
  ```

### Iniciar en Local:
1. **Opción Rápida:** Doble clic sobre [`iniciar_app.bat`](file:///d:/Armando/$1%20Corel/DOCUMENTOS/Planes%20financieros%20a%20futuro%20y%20diario/App_Finanzas_Personal/iniciar_app.bat).
2. **Opción por Terminal:**
   ```bash
   cd "d:\Armando\$1 Corel\DOCUMENTOS\Planes financieros a futuro y diario\App_Finanzas_Personal\backend"
   python server.py
   ```
3. Acceder en el navegador a:
   - **Hub Principal:** `http://localhost:8085/`
   - **Control de Gastos Básicos:** `http://localhost:8085/gastos/`
   - **Plan Financiero al Futuro:** `http://localhost:8085/futuro/`

---

## 🔒 6. Reglas Críticas para Ingenieros / Mantenimiento

1. **Limpieza de Celdas en openpyxl:**
   - ❌ NUNCA usar `ws.cell(r, c, value=None)`.
   - ✅ SIEMPRE usar `ws.cell(row=r, column=c).value = None`.
2. **Capacidad de Filas en Excel:**
   - `Control TDC Nu`: Filas **13 a 112** (Capacidad: 100 compras). Fila 113 es TOTAL `=SUM(C13:C112)`.
   - `Registro Diario`: Filas **11 a 110** (Capacidad: 100 gastos diarios).
3. **Manejo de Bloqueos de Archivo (Error 423):**
   - Si el usuario tiene abierto el archivo `.xlsx` en Microsoft Excel de escritorio, el backend captura `PermissionError` y retorna código HTTP 423 con un mensaje amigable solicitando cerrar el archivo para permitir la escritura atómica.
4. **Despliegue en la Nube:**
   - La carpeta `frontend/` es 100% estática (HTML/CSS/JS nativo) y puede alojarse directamente en **Firebase Hosting**, **Netlify** o **Vercel**.
   - La carpeta `backend/` puede ejecutarse como un microservicio en **Google Cloud Run**, **Render** o convertirse en **Cloud Functions**.
