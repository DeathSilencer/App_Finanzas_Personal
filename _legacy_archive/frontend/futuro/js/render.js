/**
 * futuro/js/render.js — Funciones de renderizado del DOM para Plan Financiero a Futuro
 * Requiere: tdc-reminder.js (para fmt), window.fData
 */

/**
 * Renderiza el dashboard maestro con la distribución de ingreso.
 */
function renderDashboardMaestro() {
    if (!fData) return;
    const c = fData.config;
    const d = fData.distribucion;

    // KPIs
    const elIngreso = document.getElementById('m-kpi-ingreso');
    const elNu      = document.getElementById('m-kpi-nu');
    const elCetes   = document.getElementById('m-kpi-cetes');
    const elAfore   = document.getElementById('m-kpi-afore');

    if (elIngreso) elIngreso.innerText = fmt(c.ingreso_base);
    if (elNu)      elNu.innerText      = (c.tasa_nu * 100).toFixed(2) + '%';
    if (elCetes)   elCetes.innerText   = (c.tasa_cetes * 100).toFixed(2) + '%';
    if (elAfore)   elAfore.innerText   = (c.tasa_afore * 100).toFixed(2) + '%';

    // Distribution Table
    const setDist = (p, obj) => {
        const elPct = document.getElementById(`dist-pct-${p}`);
        const elQ   = document.getElementById(`dist-q-${p}`);
        const elM   = document.getElementById(`dist-m-${p}`);
        if (elPct) elPct.innerText = (obj.pct * 100).toFixed(1) + '%';
        if (elQ)   elQ.innerText   = fmt(obj.quincenal);
        if (elM)   elM.innerText   = fmt(obj.mensual);
    };

    setDist('p1', d.p1_involuntario);
    setDist('p2', d.p2_basicos);
    setDist('p7', d.p7_ocio);
    setDist('p3', d.p3_emergencia);
    setDist('p6', d.p6_retiro);

    // Inputs en formulario de configuración
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    setVal('cfg-ingreso',    c.ingreso_base);
    setVal('cfg-tasa-nu',    c.tasa_nu);
    setVal('cfg-tasa-cetes', c.tasa_cetes);
    setVal('cfg-tasa-afore', c.tasa_afore);
    setVal('cfg-pct-p1',     c.pct_p1);
    setVal('cfg-pct-p2',     c.pct_p2);
    setVal('cfg-pct-p7',     c.pct_p7);
    setVal('cfg-pct-p3',     c.pct_p3);
    setVal('cfg-pct-p6',     c.pct_p6);
    setVal('cfg-tdc-limite', c.tdc_limite);
    setVal('cfg-tdc-corte',  c.tdc_corte);
    setVal('cfg-tdc-pago',   c.tdc_pago);
}

/**
 * Renderiza la tabla de evolución a 25 años de CETES.
 */
function renderCetes() {
    if (!fData || !fData.cetes) return;
    const cetes = fData.cetes;
    const elQ = document.getElementById('cetes-kpi-q');
    if (elQ) elQ.innerText = fmt(cetes.aporte_quincenal);

    const tbody = document.getElementById('tbody-cetes');
    if (!tbody) return;
    tbody.innerHTML = '';

    cetes.tabla.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/40 transition";
        tr.innerHTML = `
            <td class="p-3.5 font-bold text-white">${row.anio}</td>
            <td class="p-3.5 text-right font-medium text-slate-300">${fmt(row.ahorro_bolsa)}</td>
            <td class="p-3.5 text-right font-bold text-blue-400">+ ${fmt(row.interes_acumulado)}</td>
            <td class="p-3.5 text-right font-black text-emerald-400 text-sm">${fmt(row.saldo_total)}</td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Renderiza el fondo de emergencia (tabla 24 meses).
 */
function renderFondoEmergencia() {
    if (!fData || !fData.fondo_emergencia) return;
    const fe = fData.fondo_emergencia;
    const elMeta = document.getElementById('fe-kpi-meta');
    if (elMeta) elMeta.innerText = fmt(fe.meta_total);

    const tbody = document.getElementById('tbody-fe');
    if (!tbody) return;
    tbody.innerHTML = '';

    fe.tabla.forEach(row => {
        const isCumplida = row.saldo_total >= fe.meta_total;
        const tr = document.createElement('tr');
        tr.className = `hover:bg-slate-800/40 transition ${isCumplida ? 'bg-emerald-950/20' : ''}`;
        tr.innerHTML = `
            <td class="p-3.5 font-bold text-white">${row.mes}</td>
            <td class="p-3.5 text-right text-slate-300">${fmt(row.ahorro_bolsa)}</td>
            <td class="p-3.5 text-right font-semibold text-teal-300">+ ${fmt(row.interes_mes)}</td>
            <td class="p-3.5 text-right font-bold text-teal-400">+ ${fmt(row.interes_acumulado)}</td>
            <td class="p-3.5 text-right font-black text-emerald-400 text-sm">${fmt(row.saldo_total)}</td>
            <td class="p-3.5 text-center font-bold ${row.pct_meta >= 100 ? 'text-emerald-400' : 'text-slate-300'}">${row.pct_meta}%</td>
            <td class="p-3.5 text-center">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${isCumplida ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400 border border-slate-700'}">
                    ${row.estado}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Renderiza la tabla de retiro SAT/AFORE (25 años).
 */
function renderRetiroSAT() {
    if (!fData || !fData.retiro_sat) return;
    const sat = fData.retiro_sat;
    const elAporte = document.getElementById('sat-kpi-aporte');
    if (elAporte) elAporte.innerText = fmt(sat.aporte_anual) + ' MXN';

    const tbody = document.getElementById('tbody-sat');
    if (!tbody) return;
    tbody.innerHTML = '';

    sat.tabla.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/40 transition";
        tr.innerHTML = `
            <td class="p-3.5 font-bold text-white">${row.anio}</td>
            <td class="p-3.5 text-right text-slate-300">${fmt(row.ahorro_bolsa)}</td>
            <td class="p-3.5 text-right font-bold text-teal-400">+ ${fmt(row.devuelto_sat)}</td>
            <td class="p-3.5 text-right font-black text-emerald-400">${fmt(row.saldo_afore)}</td>
            <td class="p-3.5 text-right font-bold text-indigo-300">${fmt(row.ganancia_neta)}</td>
            <td class="p-3.5 text-center font-bold text-amber-400">${row.efecto_mult}x</td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Renderiza la pestaña General & Cajita Turbo Nu.
 */
function renderGeneralCajita() {
    if (!fData || !fData.otros_fondos) return;
    const of = fData.otros_fondos;
    const cajita = of.cajita_turbo || {};
    const ocio = of.ocio || {};
    const emg = of.emergencia || {};
    const ret = of.retiro || {};
    const cetes = of.cetes || {};

    // Hero Cajita
    const elGranTotal = document.getElementById('cajita-gran-total');
    const elRendMensual = document.getElementById('cajita-rend-mensual');
    const elRendAnual = document.getElementById('cajita-rend-anual-calc');

    if (elGranTotal) elGranTotal.innerText = fmt(cajita.gran_total || 2000);
    if (elRendMensual) elRendMensual.innerText = `+${fmt(cajita.rendimiento_mensual || 21.67)}/mes`;
    if (elRendAnual) elRendAnual.innerText = `Estimado: ~${fmt((cajita.gran_total || 2000) * 0.13)}/año`;

    // Proporciones barra
    const pOcio = (cajita.porciones && cajita.porciones.ocio) ? cajita.porciones.ocio.pct : 62.5;
    const pEmg = (cajita.porciones && cajita.porciones.emergencia) ? cajita.porciones.emergencia.pct : 25;
    const pRet = (cajita.porciones && cajita.porciones.retiro) ? cajita.porciones.retiro.pct : 12.5;

    const barOcio = document.getElementById('cajita-bar-ocio');
    const barEmg = document.getElementById('cajita-bar-emergencia');
    const barRet = document.getElementById('cajita-bar-retiro');

    if (barOcio) barOcio.style.width = `${pOcio}%`;
    if (barEmg) barEmg.style.width = `${pEmg}%`;
    if (barRet) barRet.style.width = `${pRet}%`;

    const elSummary = document.getElementById('cajita-proporcion-summary');
    if (elSummary) elSummary.innerText = `${pOcio}% Ocio • ${pEmg}% Emergencia • ${pRet}% Retiro`;

    const txtOcio = document.getElementById('cajita-txt-ocio');
    const txtEmg = document.getElementById('cajita-txt-emergencia');
    const txtRet = document.getElementById('cajita-txt-retiro');

    if (txtOcio) txtOcio.innerText = fmt(ocio.remanente || 1250);
    if (txtEmg) txtEmg.innerText = fmt(emg.aportado || 500);
    if (txtRet) txtRet.innerText = fmt(ret.aportado || 250);

    // Cards
    const cardOcioDisp = document.getElementById('card-ocio-disp');
    const cardOcioPres = document.getElementById('card-ocio-pres');
    const cardOcioGast = document.getElementById('card-ocio-gastado');
    const cardOcioStatus = document.getElementById('card-ocio-status');

    if (cardOcioDisp) cardOcioDisp.innerText = fmt(ocio.remanente || 1250);
    if (cardOcioPres) cardOcioPres.innerText = fmt(ocio.presupuesto || 1500);
    if (cardOcioGast) cardOcioGast.innerText = fmt(ocio.gasto_real || 250);
    if (cardOcioStatus) cardOcioStatus.innerText = `🟢 ${fmt(ocio.remanente || 1250)} Disponible`;

    const cardFeAportado = document.getElementById('card-fe-aportado');
    if (cardFeAportado) cardFeAportado.innerText = fmt(emg.aportado || 500);

    const cardRetiroAportado = document.getElementById('card-retiro-aportado');
    if (cardRetiroAportado) cardRetiroAportado.innerText = fmt(ret.aportado || 250);

    const cardCetesAportado = document.getElementById('card-cetes-aportado');
    const cardCetesEstado = document.getElementById('card-cetes-estado');
    if (cardCetesAportado) cardCetesAportado.innerText = fmt(cetes.aportado || 250);
    if (cardCetesEstado) {
        cardCetesEstado.innerHTML = `<i data-lucide="check-circle" class="w-3 h-3"></i><span>${cetes.estado || 'Aportado (Cetes)'}</span>`;
    }

    // Tabla inferior
    const tbOcioGastado = document.getElementById('tb-ocio-gastado');
    const tbOcioDisp = document.getElementById('tb-ocio-disponible');
    const tbTotalFondos = document.getElementById('tb-total-fondos-calc');

    if (tbOcioGastado) tbOcioGastado.innerText = `-${fmt(ocio.gasto_real || 250)}`;
    if (tbOcioDisp) tbOcioDisp.innerText = fmt(ocio.remanente || 1250);
    if (tbTotalFondos) tbTotalFondos.innerText = fmt((cajita.gran_total || 2000) + (cetes.aportado || 250));
}

/**
 * Renderiza los botones rápidos de ocio (1 Clic)
 */
function renderQuickOcioButtons() {
    const container = document.getElementById('container-quick-ocio-buttons');
    if (!container) return;

    const quickItems = [
        { monto: 45, label: "☕ Café / Snack", cat: "🍕 Salidas & Gustos", concepto: "Café / Snack" },
        { monto: 150, label: "🍔 Comida Fuera", cat: "🍔 Comida Fuera / Restaurantes", concepto: "Comida en restaurante" },
        { monto: 120, label: "🎬 Cine / Dulcería", cat: "🎬 Cine & Entretenimiento", concepto: "Boletos de cine" },
        { monto: 250, label: "🎮 Videojuego / App", cat: "🎮 Videojuegos & Digital", concepto: "Compra digital / juego" },
        { monto: 350, label: "🍻 Salida Fin de Sem.", cat: "🍕 Salidas & Gustos", concepto: "Salida fin de semana" },
        { monto: 60, label: "🛒 Antojo / Tiendita", cat: "🍕 Salidas & Gustos", concepto: "Antojo / Oxxo" }
    ];

    container.innerHTML = quickItems.map(item => `
        <button onclick="handleQuickAddOcio(${item.monto}, '${item.cat}', '${item.concepto}')" class="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-left transition hover:scale-[1.02] flex flex-col justify-between">
            <span class="text-xs text-slate-300 font-semibold truncate">${item.label}</span>
            <span class="text-base font-black text-amber-400 mt-1">${fmt(item.monto)}</span>
        </button>
    `).join('');
}

/**
 * Renderiza la pestaña de Registro de Ocio & Gastos
 */
function renderRegistrosOcio() {
    if (!fData || !fData.otros_fondos) return;
    const of = fData.otros_fondos;
    const ocio = of.ocio || {};
    const cajita = of.cajita_turbo || {};
    const registros = of.registros_ocio || [];

    // KPIs
    const elPres = document.getElementById('ocio-kpi-presupuesto');
    const elGast = document.getElementById('ocio-kpi-gastado');
    const elPct = document.getElementById('ocio-kpi-pct');
    const elDisp = document.getElementById('ocio-kpi-disponible');
    const elCajita = document.getElementById('ocio-kpi-cajita');

    if (elPres) elPres.innerText = fmt(ocio.presupuesto || 1500);
    if (elGast) elGast.innerText = fmt(ocio.gasto_real || 0);
    if (elPct) elPct.innerText = `${ocio.pct_consumido || 0}% consumido`;
    if (elDisp) elDisp.innerText = fmt(ocio.remanente || 1500);
    if (elCajita) elCajita.innerText = fmt(cajita.gran_total || 2000);

    // Barra
    const barGastBadge = document.getElementById('ocio-bar-gastado-badge');
    const barDispBadge = document.getElementById('ocio-bar-disponible-badge');
    const barFill = document.getElementById('ocio-bar-fill');

    if (barGastBadge) barGastBadge.innerText = `Gastado: ${fmt(ocio.gasto_real || 0)}`;
    if (barDispBadge) barDispBadge.innerText = `Disponible: ${fmt(ocio.remanente || 1500)}`;
    if (barFill) barFill.style.width = `${Math.min(100, ocio.pct_consumido || 0)}%`;

    renderQuickOcioButtons();

    // Tabla de registros
    const tbody = document.getElementById('tbody-registros-ocio');
    const badgeCount = document.getElementById('badge-total-registros-ocio');
    if (badgeCount) badgeCount.innerText = `${registros.length} registros`;

    if (!tbody) return;
    tbody.innerHTML = '';

    if (registros.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-500">No hay gastos de ocio registrados en esta quincena.</td></tr>`;
        return;
    }

    registros.forEach(r => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/40 transition";
        tr.innerHTML = `
            <td class="p-3 font-semibold text-slate-500">#${r.id}</td>
            <td class="p-3 text-slate-300 whitespace-nowrap">${r.fecha}</td>
            <td class="p-3 text-slate-400">${r.dia}</td>
            <td class="p-3 text-right font-black text-rose-400">${fmt(r.monto)}</td>
            <td class="p-3 text-amber-300 font-medium">${r.categoria}</td>
            <td class="p-3 text-white font-medium">${r.concepto}</td>
            <td class="p-3 text-slate-300">${r.metodo}</td>
            <td class="p-3 text-center">
                <button onclick="openDeleteOcioModal(${r.fila}, '${r.concepto.replace(/'/g, "\\'")}', ${r.monto})" class="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition" title="Eliminar gasto">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    lucide.createIcons();
}

/**
 * Renderiza la tabla del histórico de quincenas de futuro
 */
function renderHistorialFuturo(cierres) {
    const tbody = document.getElementById('tbody-historial-futuro');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!cierres || cierres.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="p-8 text-center text-slate-500">No hay quincenas archivadas en Histórico Quincenas Futuro aún.</td></tr>`;
        return;
    }

    cierres.forEach(c => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/40 transition";
        tr.innerHTML = `
            <td class="p-3 font-semibold text-slate-500">#${c.id}</td>
            <td class="p-3 font-bold text-white whitespace-nowrap">${c.periodo}</td>
            <td class="p-3 text-center text-slate-400 whitespace-nowrap">${c.fecha_cierre}</td>
            <td class="p-3 text-right text-slate-300">${fmt(c.presupuesto_ocio)}</td>
            <td class="p-3 text-right font-semibold text-rose-400">${fmt(c.gasto_ocio)}</td>
            <td class="p-3 text-right font-black text-emerald-400">${fmt(c.remanente_ocio)}</td>
            <td class="p-3 text-right text-teal-300">${fmt(c.aporte_emergencia)}</td>
            <td class="p-3 text-right text-indigo-300">${fmt(c.aporte_retiro)}</td>
            <td class="p-3 text-right text-blue-300">${fmt(c.aporte_cetes)}</td>
            <td class="p-3 text-right font-black text-purple-300 text-sm">${fmt(c.total_cajita_cierre)}</td>
            <td class="p-3 text-center">
                <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    ${c.num_movimientos} movs
                </span>
            </td>
            <td class="p-3 text-center">
                <button onclick="verDetalleQuincenaFuturo(${c.id})" class="px-2 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold transition">
                    Ver
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    lucide.createIcons();
}

