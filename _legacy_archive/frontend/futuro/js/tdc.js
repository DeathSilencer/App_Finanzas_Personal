/**
 * futuro/js/tdc.js — Renderizado específico del Control TDC Nu
 * Requiere: tdc-reminder.js (para fmt), window.fData
 */

/**
 * Renderiza la tabla de compras en TDC Nu y sus KPIs de estado.
 */
function renderTDC() {
    if (!fData || !fData.tdc) return;
    const tdc = fData.tdc;

    const elLimite = document.getElementById('tdc-stat-limite');
    const elDeuda  = document.getElementById('tdc-stat-deuda');
    const elDisp   = document.getElementById('tdc-stat-disp');
    const elUtil   = document.getElementById('tdc-stat-util');
    const elCorte  = document.getElementById('tdc-stat-corte');
    const elPago   = document.getElementById('tdc-stat-pago');
    const elMora   = document.getElementById('tdc-stat-mora');
    const elCount  = document.getElementById('tdc-badge-count');

    if (elLimite) elLimite.innerText = fmt(tdc.limite);
    if (elDeuda)  elDeuda.innerText  = fmt(tdc.deuda_actual);
    if (elDisp)   elDisp.innerText   = fmt(tdc.disponible);
    if (elUtil)   elUtil.innerText   = `${tdc.utilizacion_pct}%`;
    if (elCorte)  elCorte.innerText  = `Día ${tdc.corte_dia}`;
    if (elPago)   elPago.innerText   = `Día ${tdc.pago_dia}`;
    if (elMora)   elMora.innerText   = `+$${tdc.interes_atraso.toFixed(2)}`;
    if (elCount)  elCount.innerText  = `${tdc.compras.length} compras`;

    const elSpotDesc = document.getElementById('tdc-spotify-next-desc');
    if (elSpotDesc && tdc.proximo_spotify_fecha) {
        elSpotDesc.innerText = `Cada día 12 de mes (Próximo: ${tdc.proximo_spotify_fecha})`;
    }

    const tbody = document.getElementById('tbody-tdc');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (tdc.compras.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-500">No hay compras registradas en este ciclo.</td></tr>`;
        return;
    }

    tdc.compras.forEach(c => {
        const isPendiente = c.estado === 'Pendiente';
        const isRecurring = c.tipo === 'Suscripción Recurrente' || c.concepto.toLowerCase().includes('spotify');
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/40 transition";
        tr.innerHTML = `
            <td class="p-3 font-semibold text-slate-500">#${c.id}</td>
            <td class="p-3 text-slate-300 whitespace-nowrap">${c.fecha}</td>
            <td class="p-3 text-right font-bold text-white">${fmt(c.monto)}</td>
            <td class="p-3 text-slate-200">
                <div class="flex items-center space-x-1.5">
                    <span>${c.concepto}</span>
                    ${isRecurring ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-950 text-purple-300 border border-purple-800 shrink-0">🔁 Recurrente</span>' : ''}
                </div>
            </td>
            <td class="p-3 text-slate-400 text-xs">${c.categoria}</td>
            <td class="p-3 text-center">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isPendiente ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}">
                    ${c.estado}
                </span>
            </td>
            <td class="p-3 text-center whitespace-nowrap">
                <button onclick="openEditTDCModal(${c.fila})" class="p-1.5 hover:bg-purple-500/20 text-purple-400 rounded-lg transition mr-1" title="Editar en Excel">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                </button>
                <button onclick="openDeleteTDCModal(${c.fila})" class="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition" title="Borrar de Excel">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    lucide.createIcons();
}

/**
 * Tab switcher para la página de futuro.
 */
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'text-white');
        btn.classList.add('text-slate-400');
    });

    const activeContent = document.getElementById(tabId);
    if (activeContent) activeContent.classList.remove('hidden');

    const activeBtn = document.getElementById('btn-' + tabId);
    if (activeBtn) {
        activeBtn.classList.add('active', 'text-white');
        activeBtn.classList.remove('text-slate-400');
    }
    lucide.createIcons();
}
