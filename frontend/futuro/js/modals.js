/**
 * futuro/js/modals.js — Control de modales para la página de Plan Financiero a Futuro
 * Requiere: api.js (para fData), tdc-reminder.js (para fmt)
 */

// ──────────────────────────────────────────────────────────────────────────────
// Modal: Editar Compra TDC
// ──────────────────────────────────────────────────────────────────────────────
function openEditTDCModal(fila) {
    if (!fData || !fData.tdc || !fData.tdc.compras) return;
    const compra = fData.tdc.compras.find(c => c.fila === fila);
    if (!compra) return;

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    setVal('edit-tdc-fila',      compra.fila);
    setVal('edit-tdc-fecha',     compra.fecha);
    setVal('edit-tdc-monto',     compra.monto);
    setVal('edit-tdc-concepto',  compra.concepto);
    setVal('edit-tdc-categoria', compra.categoria || 'Básicos');
    setVal('edit-tdc-apartado',  compra.apartado || 'Sí (En Cajita)');
    setVal('edit-tdc-estado',    compra.estado || 'Pendiente');

    const modal = document.getElementById('modal-edit-tdc');
    if (modal) modal.classList.remove('hidden');
    lucide.createIcons();
}

function closeEditTDCModal() {
    const modal = document.getElementById('modal-edit-tdc');
    if (modal) modal.classList.add('hidden');
}

// ──────────────────────────────────────────────────────────────────────────────
// Modal: Eliminar Compra TDC
// ──────────────────────────────────────────────────────────────────────────────
function openDeleteTDCModal(fila) {
    if (!fData || !fData.tdc || !fData.tdc.compras) return;
    const compra = fData.tdc.compras.find(c => c.fila === fila);
    if (!compra) return;

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    setVal('delete-tdc-fila-target', fila);
    const textoEl = document.getElementById('delete-tdc-texto');
    if (textoEl) {
        textoEl.innerText = `¿Deseas eliminar "${compra.concepto}" (${fmt(compra.monto)}) de tu Control TDC Nu en Excel?`;
    }

    const modal = document.getElementById('modal-delete-tdc');
    if (modal) modal.classList.remove('hidden');
    lucide.createIcons();
}

function closeDeleteTDCModal() {
    const modal = document.getElementById('modal-delete-tdc');
    if (modal) modal.classList.add('hidden');
}

// ──────────────────────────────────────────────────────────────────────────────
// Modal: Eliminar Gasto de Ocio
// ──────────────────────────────────────────────────────────────────────────────
function openDeleteOcioModal(fila, concepto, monto) {
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    setVal('delete-ocio-fila-target', fila);
    const textoEl = document.getElementById('delete-ocio-texto');
    if (textoEl) {
        textoEl.innerText = `¿Deseas eliminar "${concepto}" (${fmt(monto)}) de tu Bitácora de Ocio en Excel?`;
    }

    const modal = document.getElementById('modal-delete-ocio');
    if (modal) modal.classList.remove('hidden');
    lucide.createIcons();
}

function closeDeleteOcioModal() {
    const modal = document.getElementById('modal-delete-ocio');
    if (modal) modal.classList.add('hidden');
}

async function confirmarEliminarOcio() {
    const fila = parseInt(document.getElementById('delete-ocio-fila-target').value);
    if (!fila) return;

    try {
        const res = await fetch('/api/futuro/delete_gasto_ocio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fila })
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast("🗑️ Gasto de ocio eliminado", "warning");
            closeDeleteOcioModal();
            await loadFuturoData();
        } else {
            showToast(data.message || "Error al eliminar gasto", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión al eliminar", "error");
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Modal: Cerrar Quincena Futuro
// ──────────────────────────────────────────────────────────────────────────────
function openCerrarQuincenaFuturoModal() {
    if (!fData || !fData.otros_fondos) return;
    const of = fData.otros_fondos;
    const ocio = of.ocio || {};
    const cajita = of.cajita_turbo || {};

    const elGastado = document.getElementById('modal-cqf-gastado');
    const elRem = document.getElementById('modal-cqf-remanente');
    const elCajitaTot = document.getElementById('modal-cqf-cajita-total');

    if (elGastado) elGastado.innerText = fmt(ocio.gasto_real || 0);
    if (elRem) elRem.innerText = fmt(ocio.remanente || 1500);
    if (elCajitaTot) elCajitaTot.innerText = fmt(cajita.gran_total || 2000);

    const now = new Date();
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const quincenaNum = now.getDate() <= 15 ? "1ra" : "2da";
    const defaultNombre = `${quincenaNum} Quincena ${meses[now.getMonth()]} ${now.getFullYear()}`;

    const inPeriodo = document.getElementById('cqf-periodo');
    const inFecha = document.getElementById('cqf-fecha');
    const inAnio = document.getElementById('cqf-anio');

    if (inPeriodo) inPeriodo.value = defaultNombre;
    if (inFecha) inFecha.value = now.toISOString().split('T')[0];
    if (inAnio) inAnio.value = now.getFullYear();

    const modal = document.getElementById('modal-cerrar-quincena-futuro');
    if (modal) modal.classList.remove('hidden');
    lucide.createIcons();
}

function closeCerrarQuincenaFuturoModal() {
    const modal = document.getElementById('modal-cerrar-quincena-futuro');
    if (modal) modal.classList.add('hidden');
}

// ──────────────────────────────────────────────────────────────────────────────
// Modal: Ajuste de Aportación Activa (Emergencia, Retiro, Cetes)
// ──────────────────────────────────────────────────────────────────────────────
function openAjusteAporteModal(tipo) {
    if (!fData || !fData.otros_fondos) return;
    const of = fData.otros_fondos;

    const inTipo = document.getElementById('ajuste-aporte-tipo');
    const inMonto = document.getElementById('ajuste-aporte-monto');
    const elTitulo = document.getElementById('ajuste-aporte-titulo');
    const elDesc = document.getElementById('ajuste-aporte-desc');

    if (inTipo) inTipo.value = tipo;

    let montoActual = 0;
    let nombreFondo = "";
    if (tipo === "cetes") {
        montoActual = (of.cetes && of.cetes.aportado) ? of.cetes.aportado : 250;
        nombreFondo = "🔒 Ahorro Involuntario (Cetesdirecto)";
        if (elDesc) elDesc.innerText = "Declara el monto transferido a tu cuenta de Cetesdirecto.";
    } else if (tipo === "emergencia") {
        montoActual = (of.emergencia && of.emergencia.aportado) ? of.emergencia.aportado : 500;
        nombreFondo = "🛡️ Fondo de Emergencia (Cajita Nu)";
        if (elDesc) elDesc.innerText = "Asigna el monto resguardado para emergencias en la Cajita Turbo.";
    } else if (tipo === "retiro") {
        montoActual = (of.retiro && of.retiro.aportado) ? of.retiro.aportado : 250;
        nombreFondo = "🚀 Retiro Deducible SAT (AFORE)";
        if (elDesc) elDesc.innerText = "Asigna el monto resguardado para aportación voluntaria deducible.";
    }

    if (elTitulo) elTitulo.innerText = `Ajustar: ${nombreFondo}`;
    if (inMonto) inMonto.value = montoActual;

    const modal = document.getElementById('modal-ajuste-aporte');
    if (modal) modal.classList.remove('hidden');
    lucide.createIcons();
}

function closeAjusteAporteModal() {
    const modal = document.getElementById('modal-ajuste-aporte');
    if (modal) modal.classList.add('hidden');
}

function verDetalleQuincenaFuturo(id) {
    if (!window.historialFuturoData) return;
    const item = window.historialFuturoData.find(c => c.id === id);
    if (!item) return;

    const detalle = item.detalle || {};
    const regs = detalle.registros_ocio || [];
    let msg = `📜 DETALLE: ${item.periodo} (Cierre: ${item.fecha_cierre})\n`;
    msg += `-------------------------------------------------\n`;
    msg += `• Presupuesto Ocio: ${fmt(item.presupuesto_ocio)}\n`;
    msg += `• Gasto Real Ocio: ${fmt(item.gasto_ocio)}\n`;
    msg += `• Remanente Resguardado: ${fmt(item.remanente_ocio)}\n`;
    msg += `• Aporte Fondo Emergencia: ${fmt(item.aporte_emergencia)}\n`;
    msg += `• Aporte Retiro SAT: ${fmt(item.aporte_retiro)}\n`;
    msg += `• Aporte Cetesdirecto: ${fmt(item.aporte_cetes)}\n`;
    msg += `• Gran Total en Cajita Nu: ${fmt(item.total_cajita_cierre)}\n\n`;
    msg += `🍕 Gastos de Ocio Archivados (${regs.length}):\n`;

    if (regs.length === 0) {
        msg += "  (No se registraron gastos de ocio en este período)\n";
    } else {
        regs.forEach((r, idx) => {
            msg += `  ${idx + 1}. [${r.fecha}] ${r.concepto} - ${fmt(r.monto)} (${r.metodo})\n`;
        });
    }

    alert(msg);
}

