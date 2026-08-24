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
