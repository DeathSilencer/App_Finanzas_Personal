/**
 * gastos/js/api.js — Funciones de comunicación con el servidor para gastos
 * Requiere: render.js, modals.js, toast.js, tdc-reminder.js
 */

// Estado global de datos
let currentData   = null;
let historialData = null;

/**
 * Carga todos los datos del dashboard de gastos desde el servidor.
 */
async function loadGastosData() {
    try {
        const res   = await fetch('/api/gastos');
        currentData = await res.json();

        if (res.ok && currentData.status === 'success') {
            renderResumen();
            renderQuickButtons();
            renderRegistros();
            renderSimuladorMoto();
            populateConfigForm();
            recalcLivePreview();
            lucide.createIcons();
        } else {
            showToast(currentData.message || "Error al conectar con Excel", "error");
        }

        // También carga los datos TDC para el widget lateral
        loadTDCReminderData();

    } catch (err) {
        console.error("Error al obtener datos:", err);
        showToast("⚠️ Servidor local no responde. Ejecuta iniciar_app.bat", "error");
    }
}

/**
 * Carga el historial de quincenas cerradas.
 */
async function loadHistorialData() {
    try {
        if (!currentData) {
            await loadGastosData();
        }
        const res     = await fetch('/api/gastos/historial');
        historialData = await res.json();

        if (res.ok && historialData.status === 'success') {
            populateMesesSelect();
            renderEstadoCuentaSeleccionado();
            lucide.createIcons();
        } else {
            showToast(historialData.message || "Error al cargar historial", "error");
        }
    } catch (err) {
        console.error("Error al cargar historial:", err);
        showToast("⚠️ Error al conectar con el historial", "error");
    }
}

/**
 * Carga los datos de TDC Nu desde /api/futuro para el widget lateral.
 */
async function loadTDCReminderData() {
    try {
        const resFut = await fetch('/api/futuro');
        const futData = await resFut.json();
        if (resFut.ok && futData.status === 'success') {
            updateTDCReminder(futData.tdc, futData.config);
        }
    } catch (e) {
        console.log("No se pudo cargar recordatorio TDC:", e);
    }
}

/**
 * Registra un gasto rápido desde los botones de acceso directo.
 */
async function quickAddGasto(monto, categoria, concepto) {
    const fecha   = new Date().toISOString().split('T')[0];
    const payload = { fecha, monto, categoria, concepto, metodo: 'Efectivo', retirado: 'Sí (Efectivo)' };

    try {
        const res  = await fetch('/api/gastos/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast(`✅ Gasto de $${monto} registrado en Excel`, "success");
            await loadGastosData();
        } else {
            showToast(data.message || "Error al guardar en Excel", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión con el servidor", "error");
    }
}

/**
 * Valida que la fecha esté entre hace 7 días y hoy.
 */
function validarFechaGasto(fechaStr) {
    if (!fechaStr) return { valida: false, msg: "Por favor selecciona una fecha." };
    const [y, m, d] = fechaStr.split('-').map(Number);
    const fecha = new Date(y, m - 1, d, 0, 0, 0);
    
    const today = new Date();
    const hoyMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const minDate = new Date();
    minDate.setDate(today.getDate() - 7);
    minDate.setHours(0, 0, 0, 0);

    if (fecha > hoyMidnight) {
        return { valida: false, msg: "⛔ No puedes registrar gastos en fechas futuras." };
    }
    if (fecha < minDate) {
        return { valida: false, msg: "⛔ Solo puedes registrar gastos de hasta una semana hacia atrás." };
    }
    return { valida: true };
}

/**
 * Maneja el envío del formulario de agregar gasto.
 */
async function handleAddGasto(e) {
    e.preventDefault();
    const fecha = document.getElementById('in-fecha').value;
    const check = validarFechaGasto(fecha);
    if (!check.valida) {
        showToast(check.msg, "error");
        return;
    }

    const payload = {
        fecha:     fecha,
        monto:     document.getElementById('in-monto').value,
        categoria: document.getElementById('in-categoria').value,
        concepto:  document.getElementById('in-concepto').value,
        metodo:    document.getElementById('in-metodo').value,
        retirado:  document.getElementById('in-retirado').value
    };

    try {
        const res  = await fetch('/api/gastos/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast("✅ Gasto registrado en Excel", "success");
            document.getElementById('in-monto').value   = '';
            document.getElementById('in-concepto').value = '';
            await loadGastosData();
        } else {
            showToast(data.message || "Error al guardar", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión con el servidor", "error");
    }
}

/**
 * Maneja el envío del formulario de editar gasto.
 */
async function handleEditSubmit(e) {
    e.preventDefault();
    const fecha = document.getElementById('edit-fecha').value;
    const check = validarFechaGasto(fecha);
    if (!check.valida) {
        showToast(check.msg, "error");
        return;
    }

    const payload = {
        fila:      document.getElementById('edit-fila').value,
        fecha:     fecha,
        monto:     document.getElementById('edit-monto').value,
        categoria: document.getElementById('edit-categoria').value,
        concepto:  document.getElementById('edit-concepto').value,
        metodo:    document.getElementById('edit-metodo').value,
        retirado:  document.getElementById('edit-retirado').value
    };

    try {
        const res  = await fetch('/api/gastos/edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast("✏️ Registro actualizado en Excel", "success");
            closeEditModal();
            await loadGastosData();
        } else {
            showToast(data.message || "Error al editar", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión", "error");
    }
}

/**
 * Confirma y ejecuta la eliminación de un gasto.
 */
async function confirmarEliminar() {
    const fila = parseInt(document.getElementById('delete-fila-target').value);
    if (!fila) return;

    try {
        const res  = await fetch('/api/gastos/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fila })
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast("🗑️ Registro eliminado y Excel reorganizado", "warning");
            closeDeleteModal();
            await loadGastosData();
        } else {
            showToast(data.message || "Error al borrar", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión", "error");
    }
}

/**
 * Guarda la configuración de celdas amarillas en Excel.
 */
async function handleGastosConfigSubmit(e) {
    e.preventDefault();
    const payload = {
        presupuesto_asignado: document.getElementById('cfg-g-presupuesto').value,
        monto_combi:          document.getElementById('cfg-g-combi').value,
        monto_comida:         document.getElementById('cfg-g-comida').value,
        monto_copias:         document.getElementById('cfg-g-copias').value,
        monto_imprevistos:    document.getElementById('cfg-g-imprevistos').value,
        meta_moto:            document.getElementById('cfg-g-meta-moto').value,
        dias_libres_num:      document.getElementById('cfg-g-dias-libres-num').value,
        aportaciones_directas:document.getElementById('cfg-g-aportaciones-directas')?.value || 0,
        quincenas_cuatri:     8
    };

    try {
        const res  = await fetch('/api/gastos/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast("⚙️ Configuración y fórmulas guardadas en Excel", "success");
            await loadGastosData();
        } else {
            showToast(data.message || "Error al guardar configuración", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión", "error");
    }
}

/**
 * Pone un monto rápido en el input de aporte a la moto.
 */
function setAporteMotoQuick(monto) {
    const input = document.getElementById('in-moto-aporte-monto');
    if (input) input.value = monto;
}

/**
 * Registra o suma una aportación directa a la meta de la moto.
 */
async function handleRegistrarAporteMoto(e) {
    e.preventDefault();
    const input = document.getElementById('in-moto-aporte-monto');
    const monto = parseFloat(input?.value || 0);
    if (monto <= 0) {
        showToast("Ingresa un monto válido mayor a $0", "error");
        return;
    }

    try {
        const res = await fetch('/api/gastos/moto_aporte', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monto, modo: 'sumar' })
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast(`🏍️ ¡+$${monto} sumados a la meta de la moto!`, "success");
            if (input) input.value = '';
            await loadGastosData();
        } else {
            showToast(data.message || "Error al registrar aportación", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión", "error");
    }
}

/**
 * Cierra la quincena actual y reinicia el registro.
 */
async function handleCerrarQuincenaSubmit(e) {
    e.preventDefault();
    const periodo = document.getElementById('cq-in-periodo').value;
    const mes     = document.getElementById('cq-in-mes').value;
    const today   = new Date();

    try {
        const res  = await fetch('/api/gastos/cerrar_quincena', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                periodo,
                mes,
                anio:         today.getFullYear(),
                fecha_cierre: today.toISOString().split('T')[0]
            })
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast(data.message, "success");
            closeCerrarQuincenaModal();
            await loadGastosData();
            await loadHistorialData();
        } else {
            showToast(data.message || "Error al cerrar quincena", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión con el servidor", "error");
    }
}

/**
 * Confirma el borrado de un cierre de quincena del histórico.
 */
async function confirmarBorrarCierre() {
    const id = parseInt(document.getElementById('delete-cierre-id-target').value);
    if (!id) return;

    try {
        const res  = await fetch('/api/gastos/borrar_cierre', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast(data.message || "🗑️ Cierre eliminado de Excel", "warning");
            closeDeleteCierreModal();
            await loadHistorialData();
            await loadGastosData();
        } else {
            showToast(data.message || "Error al borrar cierre", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión con el servidor", "error");
    }
}

/**
 * Confirma el limpiado del registro diario.
 */
async function confirmarLimpiarRegistro() {
    try {
        const res  = await fetch('/api/gastos/limpiar_registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast(data.message || "🧹 Registro diario reiniciado a $0.00", "warning");
            closeLimpiarRegistroModal();
            await loadGastosData();
        } else {
            showToast(data.message || "Error al limpiar registro", "error");
        }
    } catch (err) {
        showToast("⚠️ Error de conexión con el servidor", "error");
    }
}
