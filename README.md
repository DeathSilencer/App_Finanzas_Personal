# 💎 App Finanzas Personal — Especificación Maestra y Arquitectura Oficial

> **Única Fuente de Verdad Técnica y Financiera para Humanos y Modelos de Inteligencia Artificial.**  
> Este documento define la visión, reglas de negocio, modelos matemáticos, esquema de datos y arquitectura de software del sistema. **Cualquier IA o desarrollador que trabaje en este proyecto DEBE basarse estrictamente en este archivo.**

---

## 🧭 1. Resumen Ejecutivo y Visión del Sistema

### ¿Qué es este sistema?
Es un **Sistema Operativo Financiero Personal** diseñado a la medida para gestionar con precisión de centavo el flujo de efectivo, ahorros, inversiones y deudas de una persona universitaria y trabajadora en México.

El sistema administra un presupuesto quincenal fijo (base: **\$5,000.00 MXN**, equivalente a **\$10,000.00 MXN mensuales**), automatizando:
1. **Retiro de Efectivo en Cajero (\$606.00/Q):** Cobertura diaria para pasajes de combi, comidas escolares y copias/papelería.
2. **Cajita Turbo Nu (Tasa Anual del 13% Compuesto):** Cuenta digital única donde conviven **5 fondos acumulativos** generando rendimientos pasivos 24/7.
3. **Tarjeta de Crédito Nu (TDC Nu):** Disciplina financiera 100% **totalera** (corte día 23, fecha límite de pago día 3, \$0.00 en intereses).
4. **Inversiones y Retiro Externos:** Inversión involuntaria quincenal a **CETES Directo** (\$250/Q) y **Afore / Retiro** (\$250/Q).
5. **Simulador Acelerador de Moto:** Plan cuatrimestral para comprar una motocicleta de contado (meta: **\$42,000.00 MXN**), impulsado por el excedente quincenal del 80% y los ahorros extra en días hábiles de vacaciones.

---

## 🏛️ 2. Arquitectura de Software Oficial (Stack Activo)

### ⚠️ AVISO DE OBSOLESCENCIA Y LIMPIEZA
Históricamente, el proyecto nació vinculado a hojas de cálculo en Excel (`.xlsx`) y scripts locales de Python (`backend/server.py`).  
**EL ENTORNO ACTUAL ES 100% SERVERLESS EN LA NUBE.**
* **Stack Oficial:** **React 18 + Vite + Tailwind CSS + Cloud Firestore (Firebase)**.
* **Hosting Oficial:** **Firebase Hosting** (`https://controlfinancierosites.web.app`).
* **Archivos Legados / Inactivos:** Las carpetas `backend/`, `frontend/` (versión HTML estática) y archivos `.xlsx` son históricos. Ninguna IA debe modificar ni reintroducir dependencias a esas carpetas. Todo el desarrollo se realiza en `react-app/`.

### Estructura de Capas
```
┌────────────────────────────────────────────────────────────────────────┐
│                        INTERFAZ DE USUARIO (SPA)                       │
│   • React 18 + Vite + Tailwind CSS + Lucide Icons                      │
│   • Ubicación: /react-app/src                                         │
│   • Componentes desacoplados (Gastos Básicos, Plan Futuro, Dashboards) │
├────────────────────────────────────────────────────────────────────────┤
│                       MOTOR FINANCIERO CENTRAL                         │
│   • Archivo: /react-app/src/services/financialEngine.js                │
│   • Funciones puras, deterministas y sin efectos secundarios          │
│   • ÚNICA FUENTE DE VERDAD MATEMÁTICA PARA TODA LA APLICACIÓN          │
├────────────────────────────────────────────────────────────────────────┤
│                     PERSISTENCIA Y NUBE (24/7)                         │
│   • Google Cloud Firestore (Base de datos NoSQL reactiva en tiempo real)│
│   • Firebase Hosting (Despliegue estático optimizado en /frontend_dist)│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 3. Reglas de Negocio y Modelos Matemáticos Exactos

El motor financiero (`financialEngine.js`) ejecuta el cálculo integral basándose en las siguientes 5 reglas patrimoniales:

### Regla 1: Distribución Quincenal del Ingreso Base (\$5,000.00 MXN)
| Concepto | Porcentaje | Presupuesto Quincenal | Destino / Modalidad |
| :--- | :---: | :---: | :--- |
| **Gastos Básicos** | 50.0% | **\$2,500.00** | Operación diaria, efectivo y ahorro acelerado moto |
| **Gustos & Ocio (Estilo de Vida)** | 30.0% | **\$1,500.00** | Acumulativo en Cajita Nu (salidas, gustos personales) |
| **Fondo de Emergencia** | 10.0% | **\$500.00** | Acumulativo en Cajita Nu (blindaje 3 meses: \$7,500) |
| **Inversión Involuntaria CETES** | 5.0% | **\$250.00** | Fuera de Nu (CETES Directo gubernamental) |
| **Afore / Retiro SAT** | 5.0% | **\$250.00** | Fuera de Nu (Cuenta de retiro individual) |
| **TOTAL QUINCENAL** | **100.0%** | **\$5,000.00** | **Cuadrado al centavo** |

---

### Regla 2: Desglose de Gastos Básicos (\$2,500.00 Quincenales)

Los \$2,500.00 se dividen de manera estricta entre **Efectivo Físico**, **Reserva Digital** y **Excedentes Automáticos**:

```
Presupuesto Gastos Básicos: $2,500.00
│
├── 1. EFECTIVO FÍSICO EN CARTERA (Retiro en Cajero Automático: $606.00)
│   ├── 🚌 Pasajes Combi:               $376.00 (10 días x $37.60 prom.)
│   ├── 🥪 Comidas Escuela:              $180.00 ($18 diarios)
│   └── 📄 Copias & Papelería:           $50.00 (Material escolar y copias)
│   * Nota: Este dinero NO está en Nu. Se retira físicamente el día de pago.
│
├── 2. RESERVA DE CONTINGENCIA EN CAJITA NU
│   └── 🛡️ Imprevistos Escolares:       $200.00 (Permanece en Cajita Nu al 13%)
│
└── 3. EXCEDENTE BASE CALCULADO ($2,500 - $606 - $200 = $1,694.00)
    ├── 🏍️ Acelerador Moto (80%):        $1,355.20 (Se resguarda en Cajita Nu)
    └── 🍦 Refuerzo Salidas (20%):       $338.80 (Se resguarda en Cuenta/Cajita Nu)
```

---

### Regla 3: Cajita Turbo Nu (Tasa Anual del 13.0%)

Nu únicamente permite tener **1 sola Cajita de ahorro**. Dentro de ella conviven de forma virtual y segregada exactamente **5 fondos legítimos**, más los rendimientos pasivos generados:

1. 🍕 **Fondo de Ocio / Estilo de Vida:** Aporte de \$1,500.00/Q + remanente no gastado de quincenas anteriores.
2. 🏍️ **Fondo Acelerador Moto (80%):** Aporte de \$1,355.20/Q + sobrantes acumulados de quincenas cerradas.
3. 🛡️ **Fondo de Emergencia:** Aporte de \$500.00/Q acumulativo hasta alcanzar la meta de \$7,500.00.
4. 🍦 **Refuerzo Salidas (20%):** Aporte de \$338.80/Q + remanentes de salidas no gastados.
5. 🛡️ **Colchón de Imprevistos:** Aporte de \$200.00/Q + remanente acumulado.

#### ⚠️ REGLA CRÍTICA DE COPIAS Y PAPELERÍA
* **Copias (\$50.00 quincenal) NO vive en Cajita Nu.** Se retira en efectivo junto con combi y comida (\$606 total).
* En el motor y en la base de datos, `saldo_copias_nu = $0.00`. Nunca debe mostrarse con saldo dentro de Nu a menos que exista un remanente atípico explícito.

#### Cálculo del Capital Base y Rendimientos Pasivos
$$\text{Capital Base Nu} = \text{Ocio} + \text{Moto (80\%)} + \text{Emergencia} + \text{Salidas (20\%)} + \text{Imprevistos}$$
$$\text{Rendimientos Ganados Nu} = \text{Saldo Real App Nu} - \text{Capital Base Nu}$$
$$\text{Gran Total Cajita Nu} = \text{Capital Base Nu} + \text{Rendimientos Ganados Nu}$$
$$\text{Rendimiento Mensual Estimado} = \text{Gran Total} \times \frac{0.13}{12}$$

---

### Regla 4: Tarjeta de Crédito Nu (Totalero al 100%)
* **Límite de Crédito:** Configurable (base: \$2,000.00 MXN).
* **Día de Corte:** Día **23** de cada mes.
* **Día Límite de Pago:** Día **3** del mes siguiente.
* **Principio Totalero:** Todo gasto realizado con TDC Nu debe pagarse en su totalidad antes del día 3.  
* **Asignación de Compras TDC:** Si una compra con TDC se categoriza (ej. en *Refuerzo Salidas* o *Imprevistos*), el motor resta automáticamente el saldo disponible de dicha categoría para que el usuario no gaste de más y tenga el dinero reservado para liquidar la tarjeta.

---

### Regla 5: Ciclo de Cierre de Quincena (Workflow de Transición)

El cierre de quincena es la operación que garantiza la acumulación patrimonial. Cuando el usuario hace clic en **"Cerrar Quincena Actual"**:
1. **Auditoría de Gastos:** Se totaliza lo gastado en la quincena activa (`gastos_diarios`).
2. **Repartición de Sobrantes:**
   * Si en Gastos Básicos no se gastó todo el presupuesto, el remanente real se destina automáticamente: **80% a Moto** y **20% a Salidas**.
   * En Ocio, todo lo que no se gastó pasa íntegro como ahorro acumulado a la siguiente quincena.
   * El Fondo de Emergencia suma sus **+\$500.00** blindados.
3. **Archivado Histórico:** Se crea un registro inmutable en la colección `historico_gastos` con el desglose exacto en JSON de todos los movimientos y saldos.
4. **Reseteo del Ciclo:** Se limpia la bitácora de `gastos_diarios` activa. La nueva quincena inicia en **\$0.00 gastados**, pero con todos los saldos de ahorro vivos en Cajita Nu incrementados.

---

### Regla 6: Simulador Acelerador de Moto (\$42,000.00 MXN)
* **Meta de Compra de Contado:** **\$42,000.00 MXN**.
* **Fuentes de Ahorro:**
  1. Excedente quincenal base del 80%: **\$1,355.20/Q** (\$2,710.40/mes).
  2. Aportaciones directas opcionales.
  3. **Ahorro Extra por Vacaciones Escolares:**
     * En cuatrimestres escolares, hay aproximadamente **25 días hábiles (Lunes a Viernes) sin clases**.
     * En cada día sin clases, el usuario no gasta sus pasajes (\$37.60) ni comida escolar (\$18.00), generando un ahorro extra de **+\$1,250.00** a **+\$1,390.00** por periodo vacacional, acelerando la compra de la motocicleta a menos de 3 cuatrimestres (~10 a 11 meses).

---

## 🗄️ 4. Esquema de Base de Datos (Cloud Firestore)

La base de datos utiliza 6 colecciones principales en Firestore:

```
cloud_firestore/
├── config_gastos/
│   └── main                # Configuración global de montos, límites y fechas
│       ├── presupuesto_asignado: number (2500)
│       ├── monto_combi: number (376)
│       ├── monto_comida: number (180)
│       ├── monto_copias: number (50)
│       ├── monto_imprevistos: number (200)
│       ├── meta_moto: number (42000)
│       ├── dias_libres_vacaciones: number (25)
│       ├── tdc_limite: number (2000)
│       ├── tdc_dia_corte: number (23)
│       ├── tdc_dia_pago: number (3)
│       └── aportaciones_directas_moto: number (0)
│
├── gastos_diarios/
│   └── {docId}             # Registros de gastos de la quincena activa
│       ├── fecha: string ("YYYY-MM-DD")
│       ├── monto: number
│       ├── categoria: string ("🚌 Pasajes Combi (Efectivo)", etc.)
│       ├── concepto: string
│       ├── metodo_pago: string ("Efectivo" | "Débito Nu" | "TDC Nu")
│       └── retirado_efectivo: string ("Sí (Efectivo)" | "En Cajita Nu")
│
├── historico_gastos/
│   └── {docId}             # Quincenas archivadas históricamente
│       ├── periodo: string ("Septiembre 2026 - 2da Quincena")
│       ├── mes: string ("Septiembre")
│       ├── fecha_cierre: string
│       ├── presupuesto: number
│       ├── gasto_real: number
│       ├── remanente: number
│       ├── ahorro_moto_80: number
│       ├── refuerzo_gustos_20: number
│       └── detalle_json: string (Snapshot completo de compras y desglose)
│
├── compras_tdc/
│   └── {docId}             # Bitácora de compras con Tarjeta de Crédito Nu
│       ├── fecha: string
│       ├── concepto: string
│       ├── monto: number
│       ├── categoria: string
│       ├── pagado: boolean
│       └── fecha_pago: string | null
│
├── gastos_futuro/
│   └── {docId}             # Registros específicos de Gastos de Ocio
│       ├── fecha: string
│       ├── concepto: string
│       ├── monto: number
│       └── metodo_pago: string
│
└── ajustes_cajita/
    └── current             # Conciliación de saldo real con la App Nu
        ├── saldo_real_ajustado: number (ej. 10322.26)
        ├── rendimientos_ganados_nu: number (ej. 110.76)
        └── updated_at: timestamp
```

---

## 💻 5. Estructura del Código Fuente (`/react-app`)

```
react-app/
├── src/
│   ├── components/
│   │   ├── basico/                  # Componentes de Gastos Básicos
│   │   │   ├── ResumenGastos.jsx    # KPIs, barra quincenal y tabla por categorías
│   │   │   ├── RegistroDiario.jsx   # Formulario y tabla de gastos de quincena activa
│   │   │   ├── EstadoCuenta.jsx     # Estado de cuenta mensual formal para imprimir
│   │   │   ├── SimuladorMoto.jsx    # Radar y avance de meta de moto de $42,000
│   │   │   └── ModalCerrarQuincena.jsx # Modal para archivar quincena y transferir
│   │   │
│   │   ├── futuro/                  # Componentes de Plan a Futuro y Nu
│   │   │   ├── GeneralCajitaTurbo.jsx # Consolidador de los 5 fondos en Nu y efectivo
│   │   │   ├── DashboardMaestro.jsx # Visión ejecutiva de las 5 reglas patrimoniales
│   │   │   ├── ControlTdc.jsx       # Bitácora y semáforo de corte/pago TDC Nu
│   │   │   ├── RegistroOcio.jsx     # Bitácora exclusiva de estilo de vida
│   │   │   ├── FondosRetiroCetes.jsx# Proyecciones CETES y Afore
│   │   │   └── HistoricoFuturo.jsx  # Historial y bitácora de quincenas cerradas
│   │   │
│   │   └── shared/                  # Componentes compartidos
│   │       ├── Navbar.jsx           # Navegación y selector de módulos
│   │       ├── Toast.jsx            # Notificaciones flotantes
│   │       └── TdcSideReminder.jsx  # Widget lateral flotante de TDC Nu
│   │
│   ├── services/
│   │   ├── firebase.js              # Inicialización del SDK Firebase v12
│   │   ├── firestoreService.js      # Operaciones CRUD en Cloud Firestore
│   │   └── financialEngine.js       # ⭐ MOTOR MATEMÁTICO ÚNICO Y CENTRAL
│   │
│   ├── utils/
│   │   └── formatters.js            # Formato de moneda ($X,XXX.XX) y fechas
│   │
│   ├── App.jsx                      # Orquestador principal de estado y vistas
│   ├── main.jsx                     # Punto de entrada Vite React
│   └── index.css                    # Clases globales Tailwind y temas dark glass
│
├── package.json                     # Dependencias (React, Vite, Lucide, Tailwind)
├── tailwind.config.js               # Configuración de diseño y paletas
└── vite.config.js                   # Configuración de compilación hacia ../frontend_dist
```

---

## ⚙️ 6. Guía de Ejecución y Comandos

Todos los comandos de terminal se ejecutan dentro de la carpeta `react-app/`:

```powershell
# 1. Instalar dependencias
cd react-app
npm install

# 2. Iniciar servidor de desarrollo local (Puerto 3000)
npm run dev

# 3. Compilar para producción (Genera archivos optimizados en /frontend_dist)
npm run build

# 4. Desplegar a Firebase Hosting en producción
npx firebase deploy --only hosting --project controlfinancierosites
```

---

## 🤖 7. Reglas Obligatorias para Agentes de Inteligencia Artificial

Cualquier IA que intervenga en este repositorio debe respetar estrictamente estos 5 principios:

1. **PROHIBIDO HARDCODEAR VALORES O FALLBACKS EN LA UI:**  
   Nunca coloques números fijos con `?? 26`, `?? 3361`, etc., en los componentes `.jsx`. Todo número debe provenir de `financialEngine.js` o de los datos de Firestore.
2. **ÚNICA FUENTE MATEMÁTICA:**  
   Cualquier cálculo de saldos, porcentajes, excedentes, amortizaciones o rendimientos debe programarse dentro de `react-app/src/services/financialEngine.js`. La interfaz de usuario es puramente presentacional.
3. **PRESERVACIÓN DEL EFECTIVO (\$606):**  
   Pasajes (\$376), Comida (\$180) y Copias (\$50) son **efectivo retirado en cajero**. NO forman parte del capital en Cajita Nu.
4. **INTEGRIDAD DE CAJITA NU (\$10,322.26 / 5 FONDOS):**  
   Cajita Nu contiene exclusivamente: Ocio, Acelerador Moto (80%), Emergencia, Salidas (20%) e Imprevistos, más sus rendimientos. Copias no debe añadirse a Cajita Nu.
5. **VERIFICACIÓN TRAS CAMBIOS:**  
   Tras modificar código en `react-app/`, siempre compila con `npm run build` para asegurar que no existan errores de sintaxis o imports rotos antes de entregar el resultado al usuario.

---
*Documento actualizado y certificado al 100% para la versión 2.0 Serverless de App Finanzas Personal.*
