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
