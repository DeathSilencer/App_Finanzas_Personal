/**
 * futuro/js/api.js — Comunicación con el servidor para Plan Financiero a Futuro
 * Requiere: render.js, tdc.js, modals.js, toast.js, tdc-reminder.js
 */

// Estado global
let fData = null;

/**
 * Carga todos los datos del plan financiero desde el servidor.
 */
async function loadFuturoData() {
    try {
        const res = await fetch('/api/futuro');
        fData = await res.json();

        if (res.ok && fData.status === 'success') {
            renderDashboardMaestro();
            renderCetes();
            renderTDC();
            renderFondoEmergencia();
            renderRetiroSAT();
            updateTDCReminder(fData.tdc, fData.config);
            lucide.createIcons();
        } else {
            showToast(fData.message || "Error al leer Plan_Financiero_Futuro.xlsx", "error");
        }
    } catch (err) {
        console.error("Error al conectar con /api/futuro:", err);
        showToast("⚠️ Servidor desconectado. Verifica que iniciar_app.bat esté corriendo.", "error");
    }
}

/**
 * Maneja el envío del formulario de agregar compra TDC.
 */
async function handleTDCAdd(e) {
    e.preventDefault();
    const payload = {
        fecha:     document.getElementById('tdc-in-fecha').value,
        monto:     document.getElementById('tdc-in-monto').value,
        concepto:  document.getElementById('tdc-in-concepto').value,
        categoria: document.getElementById('tdc-in-categoria').value,
        tipo:      'Gasto Diario',
        apartado:  document.getElementById('tdc-in-apartado').value
    };

    try {
        const res  = await fetch('/api/futuro/tdc_add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast("✅ Compra TDC guardada en Excel", "success");
            document.getElementById('tdc-in-monto').value   = '';
            document.getElementById('tdc-in-concepto').value = '';
            await loadFuturoData();
        } else {
            showToast(data.message || "Error al guardar compra", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión al guardar", "error");
    }
}

/**
 * Maneja el envío del formulario de edición de compra TDC.
 */
async function handleEditTDCSubmit(e) {
    e.preventDefault();
    const payload = {
        fila:      document.getElementById('edit-tdc-fila').value,
        fecha:     document.getElementById('edit-tdc-fecha').value,
        monto:     document.getElementById('edit-tdc-monto').value,
        concepto:  document.getElementById('edit-tdc-concepto').value,
        categoria: document.getElementById('edit-tdc-categoria').value,
        tipo:      'Gasto Diario',
        apartado:  document.getElementById('edit-tdc-apartado').value,
        estado:    document.getElementById('edit-tdc-estado').value
    };

    try {
        const res  = await fetch('/api/futuro/tdc_edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast("✏️ Compra TDC actualizada en Excel", "success");
            closeEditTDCModal();
            await loadFuturoData();
        } else {
            showToast(data.message || "Error al actualizar compra", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión al actualizar", "error");
    }
}

/**
 * Confirma y ejecuta la eliminación de una compra TDC.
 */
async function confirmarEliminarTDC() {
    const fila = parseInt(document.getElementById('delete-tdc-fila-target').value);
    if (!fila) return;

    try {
        const res  = await fetch('/api/futuro/tdc_delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fila })
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast("🗑️ Compra eliminada de Excel", "warning");
            closeDeleteTDCModal();
            await loadFuturoData();
        } else {
            showToast(data.message || "Error al eliminar compra", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión al eliminar", "error");
    }
}

/**
 * Liquida todas las compras TDC pendientes.
 */
async function handleLiquidateTDC() {
    if (confirm("¿Confirmas que liquidaste el 100% de la deuda Nu desde tu Cajita Básicos?")) {
        try {
            const res  = await fetch('/api/futuro/tdc_pay', { method: 'POST' });
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                showToast("🎉 ¡Todas las compras fueron liquidadas en Excel!", "success");
                await loadFuturoData();
            } else {
                showToast(data.message || "Error al liquidar TDC", "error");
            }
        } catch (err) {
            showToast("⚠️ Error de conexión", "error");
        }
    }
}

/**
 * Guarda los parámetros maestros en el Dashboard Maestro del Excel.
 */
async function handleMasterConfigSubmit(e) {
    e.preventDefault();
    const payload = {
        ingreso_base: document.getElementById('cfg-ingreso').value,
        tasa_nu:      document.getElementById('cfg-tasa-nu').value,
        tasa_cetes:   document.getElementById('cfg-tasa-cetes').value,
        tasa_afore:   document.getElementById('cfg-tasa-afore').value,
        pct_p1:       document.getElementById('cfg-pct-p1').value,
        pct_p2:       document.getElementById('cfg-pct-p2').value,
        pct_p7:       document.getElementById('cfg-pct-p7').value,
        pct_p3:       document.getElementById('cfg-pct-p3').value,
        pct_p6:       document.getElementById('cfg-pct-p6').value,
        tdc_limite:   document.getElementById('cfg-tdc-limite').value,
        tdc_corte:    document.getElementById('cfg-tdc-corte').value,
        tdc_pago:     document.getElementById('cfg-tdc-pago').value
    };

    try {
        const res  = await fetch('/api/futuro/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast("💾 Parámetros guardados directamente en Plan_Financiero_Futuro.xlsx", "success");
            await loadFuturoData();
        } else {
            showToast(data.message || "Error al guardar en Excel", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión con el servidor local", "error");
    }
}
