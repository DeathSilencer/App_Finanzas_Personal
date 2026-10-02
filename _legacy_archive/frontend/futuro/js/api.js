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
            renderGeneralCajita();
            renderRegistrosOcio();
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

/**
 * Registra un gasto de ocio desde el formulario.
 */
async function handleAddGastoOcio(e) {
    e.preventDefault();
    const payload = {
        fecha:     document.getElementById('ocio-in-fecha').value,
        monto:     parseFloat(document.getElementById('ocio-in-monto').value),
        categoria: document.getElementById('ocio-in-categoria').value,
        concepto:  document.getElementById('ocio-in-concepto').value,
        metodo:    document.getElementById('ocio-in-metodo').value
    };

    try {
        const res  = await fetch('/api/futuro/gasto_ocio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast(`✅ ${data.message}`, "success");
            document.getElementById('ocio-in-monto').value = '';
            document.getElementById('ocio-in-concepto').value = '';
            await loadFuturoData();
        } else {
            showToast(data.message || "Error al registrar gasto", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión con el servidor", "error");
    }
}

/**
 * Botón rápido para agregar gasto de ocio en 1 clic.
 */
async function handleQuickAddOcio(monto, categoria, concepto) {
    const today = new Date().toISOString().split('T')[0];
    const payload = {
        fecha:     today,
        monto:     monto,
        categoria: categoria,
        concepto:  concepto,
        metodo:    "Débito Nu"
    };

    try {
        const res = await fetch('/api/futuro/gasto_ocio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast(`⚡ ${data.message}`, "success");
            await loadFuturoData();
        } else {
            showToast(data.message || "Error al registrar", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión", "error");
    }
}

/**
 * Guarda el ajuste de aportación activa (cetes, emergencia, retiro)
 */
async function handleConfirmarAjusteAporte() {
    const tipo = document.getElementById('ajuste-aporte-tipo').value;
    const monto = parseFloat(document.getElementById('ajuste-aporte-monto').value);

    if (isNaN(monto) || monto < 0) {
        showToast("⚠️ Ingresa un monto válido", "warning");
        return;
    }

    try {
        const res = await fetch('/api/futuro/aportacion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo, monto })
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast(`✅ ${data.message}`, "success");
            closeAjusteAporteModal();
            await loadFuturoData();
        } else {
            showToast(data.message || "Error al actualizar", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión", "error");
    }
}

/**
 * Cierra la quincena en Plan a Futuro y archiva los datos en Excel.
 */
async function handleConfirmarCierreFuturo() {
    const periodo = document.getElementById('cqf-periodo').value.trim();
    const fecha = document.getElementById('cqf-fecha').value;
    const anio = parseInt(document.getElementById('cqf-anio').value);

    if (!periodo) {
        showToast("⚠️ Ingresa el nombre del período", "warning");
        return;
    }

    try {
        const res = await fetch('/api/futuro/cerrar_quincena', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ periodo, fecha_cierre: fecha, anio })
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast(data.message, "success");
            closeCerrarQuincenaFuturoModal();
            await loadFuturoData();
            await loadHistorialFuturoData();
        } else {
            showToast(data.message || "Error al cerrar quincena", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión al cerrar quincena", "error");
    }
}

/**
 * Carga el historial de quincenas de futuro desde el servidor.
 */
async function loadHistorialFuturoData() {
    try {
        const res = await fetch('/api/futuro/historial');
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            window.historialFuturoData = data.cierres || [];
            renderHistorialFuturo(window.historialFuturoData);
        } else {
            showToast("Error al cargar historial de futuro", "error");
        }
    } catch (err) {
        console.error("Error al cargar historial:", err);
    }
}

