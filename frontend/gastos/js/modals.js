/**
 * gastos/js/modals.js — Control de todos los modales de la página de gastos
 * Requiere: api.js (para currentData)
 */

// ──────────────────────────────────────────────────────────────────────────────
// Modal: Cerrar Quincena
// ──────────────────────────────────────────────────────────────────────────────
function openCerrarQuincenaModal() {
    if (!currentData || !currentData.resumen) return;
    const r = currentData.resumen;

    const pres      = r.presupuesto_asignado || 2500;
    const gastado   = r.total_gastado || 0;
    const remanente = r.remanente_total !== undefined ? r.remanente_total : Math.max(0, pres - gastado);
    const motoReal  = remanente * 0.80;
    const salidasReal = remanente * 0.20;

    document.getElementById('cq-prev-presupuesto').innerText = fmt(pres);
    document.getElementById('cq-prev-gastado').innerText     = fmt(gastado);
    document.getElementById('cq-prev-remanente').innerText   = fmt(remanente);
    document.getElementById('cq-prev-moto').innerText        = fmt(motoReal);
    document.getElementById('cq-prev-salidas').innerText     = fmt(salidasReal);
    document.getElementById('cq-prev-num-reg').innerText     = `${currentData.registros.length} movimientos registrados`;

    const fijosBase      = r.gastos_operativos || 750;
    const excedenteBase  = Math.max(0, pres - fijosBase);
    const extraAhorro    = Math.max(0, remanente - excedenteBase);
    const noteEl         = document.getElementById('cq-prev-extra-note');
    if (noteEl) {
        if (extraAhorro > 0) {
            noteEl.innerHTML = `🎉 <b class="text-emerald-300">¡Ahorraste ${fmt(extraAhorro)} extra</b> por no gastar el 100% de tus básicos! Se sumó automáticamente: +${fmt(extraAhorro * 0.80)} a la Moto y +${fmt(extraAhorro * 0.20)} a Salidas.`;
        } else {
            noteEl.innerText = `💡 Todo lo no gastado en gastos básicos se reparte automáticamente: 80% Moto y 20% Salidas.`;
        }
    }

    const today       = new Date();
    const diaMes      = today.getDate();
    const monthNames  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    
    const currMIdx    = today.getMonth();
    const currMonth   = monthNames[currMIdx];
    const currYear    = today.getFullYear();
    
    const prevMIdx    = (currMIdx - 1 + 12) % 12;
    const prevMonth   = monthNames[prevMIdx];
    const prevYear    = currMIdx === 0 ? currYear - 1 : currYear;

    const selectMes = document.getElementById('cq-in-mes');
    if (selectMes) {
        selectMes.innerHTML = `
            <option value="${currMonth}" selected>${currMonth} ${currYear} (Mes Actual)</option>
            <option value="${prevMonth}">${prevMonth} ${prevYear} (Mes Anterior)</option>
        `;
    }

    // Auto-cálculo: si es entre 1 y 15 = 1ra Quincena, si es entre 16 y 31 = 2da Quincena
    const ultDiaMes = new Date(currYear, currMIdx + 1, 0).getDate();
    const periodoSugerido = diaMes <= 15
        ? `1ra Quincena (1-15 ${currMonth} ${currYear})`
        : `2da Quincena (16-${ultDiaMes} ${currMonth} ${currYear})`;

    document.getElementById('cq-in-periodo').value = periodoSugerido;
    document.getElementById('modal-cerrar-quincena').classList.remove('hidden');
    lucide.createIcons();
}

function onCerrarQuincenaMesChange() {
    const selectMes = document.getElementById('cq-in-mes');
    if (!selectMes) return;
    const mesElegido = selectMes.value;
    const today = new Date();
    const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    
    const currMIdx  = today.getMonth();
    const currMonth = monthNames[currMIdx];
    const currYear  = today.getFullYear();
    const prevMIdx  = (currMIdx - 1 + 12) % 12;
    const prevMonth = monthNames[prevMIdx];
    const prevYear  = currMIdx === 0 ? currYear - 1 : currYear;

    let anioFinal = currYear;
    let mIdxFinal = currMIdx;
    let diaMes = today.getDate();

    if (mesElegido === prevMonth) {
        anioFinal = prevYear;
        mIdxFinal = prevMIdx;
        diaMes = 16; // Si es mes anterior por olvido, por defecto sugerir 2da quincena
    }

    const ultDia = new Date(anioFinal, mIdxFinal + 1, 0).getDate();
    const periodo = diaMes <= 15
        ? `1ra Quincena (1-15 ${mesElegido} ${anioFinal})`
        : `2da Quincena (16-${ultDia} ${mesElegido} ${anioFinal})`;

    document.getElementById('cq-in-periodo').value = periodo;
}

function closeCerrarQuincenaModal() {
    document.getElementById('modal-cerrar-quincena').classList.add('hidden');
}

// ──────────────────────────────────────────────────────────────────────────────
// Modal: Borrar Cierre de Quincena
// ──────────────────────────────────────────────────────────────────────────────
function openDeleteCierreModal(id, periodo) {
    if (!periodo && typeof historialData !== 'undefined' && historialData && historialData.meses) {
        for (const m of historialData.meses) {
            const match = m.quincenas.find(q => q.id === id);
            if (match) {
                periodo = match.periodo;
                break;
            }
        }
    }
    document.getElementById('delete-cierre-id-target').value = id;
    document.getElementById('delete-cierre-texto').innerText =
        `¿Deseas eliminar "${periodo || 'esta quincena'}" del Histórico de Quincenas en Excel? Esta acción no se puede deshacer.`;
    document.getElementById('modal-delete-cierre').classList.remove('hidden');
    lucide.createIcons();
}

function closeDeleteCierreModal() {
    document.getElementById('modal-delete-cierre').classList.add('hidden');
}

// ──────────────────────────────────────────────────────────────────────────────
// Modal: Limpiar Registro Diario
// ──────────────────────────────────────────────────────────────────────────────
function openLimpiarRegistroModal() {
    document.getElementById('modal-limpiar-registro').classList.remove('hidden');
    lucide.createIcons();
}

function closeLimpiarRegistroModal() {
    document.getElementById('modal-limpiar-registro').classList.add('hidden');
}

// ──────────────────────────────────────────────────────────────────────────────
// Modal: Editar Gasto
// ──────────────────────────────────────────────────────────────────────────────
function openEditModal(fila) {
    const reg = currentData.registros.find(r => r.fila === fila);
    if (!reg) return;

    document.getElementById('edit-fila').value      = reg.fila;
    document.getElementById('edit-fecha').value     = reg.fecha;
    document.getElementById('edit-monto').value     = reg.monto;
    document.getElementById('edit-categoria').value = reg.categoria;
    document.getElementById('edit-concepto').value  = reg.concepto;
    document.getElementById('edit-metodo').value    = reg.metodo  || 'Efectivo';
    document.getElementById('edit-retirado').value  = reg.retirado|| 'Sí (Efectivo)';

    const today = new Date();
    const minDate = new Date();
    minDate.setDate(today.getDate() - 7);
    const formatYMD = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const editFechaEl = document.getElementById('edit-fecha');
    if (editFechaEl) {
        editFechaEl.max = formatYMD(today);
        editFechaEl.min = formatYMD(minDate);
    }

    document.getElementById('modal-edit-gasto').classList.remove('hidden');
    lucide.createIcons();
}

function closeEditModal() {
    document.getElementById('modal-edit-gasto').classList.add('hidden');
}

// ──────────────────────────────────────────────────────────────────────────────
// Modal: Eliminar Gasto
// ──────────────────────────────────────────────────────────────────────────────
function openDeleteModal(fila) {
    const reg = currentData.registros.find(r => r.fila === fila);
    if (!reg) return;

    document.getElementById('delete-fila-target').value  = fila;
    document.getElementById('delete-modal-texto').innerText =
        `¿Deseas eliminar el registro #${reg.id} (${fmt(reg.monto)} - ${reg.categoria}) de tu archivo Excel?`;

    document.getElementById('modal-delete-gasto').classList.remove('hidden');
    lucide.createIcons();
}

function closeDeleteModal() {
    document.getElementById('modal-delete-gasto').classList.add('hidden');
}

// ──────────────────────────────────────────────────────────────────────────────
// Tab switcher
// ──────────────────────────────────────────────────────────────────────────────
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'text-white');
        btn.classList.add('text-slate-400');
    });
    document.getElementById(tabId).classList.remove('hidden');
    const activeBtn = document.getElementById('btn-' + tabId);
    if (activeBtn) {
        activeBtn.classList.add('active', 'text-white');
        activeBtn.classList.remove('text-slate-400');
    }
    // Cargar historial si se selecciona el tab de Estado de Cuenta
    if (tabId === 'tab-estado-cuenta' && historialData === null) {
        loadHistorialData();
    }
    lucide.createIcons();
}
