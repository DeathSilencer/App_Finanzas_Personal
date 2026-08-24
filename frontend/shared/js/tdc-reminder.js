/**
 * tdc-reminder.js — Widget del recordatorio lateral de TDC Nu
 * Compartido entre gastos/ y futuro/
 * Requiere: toast.js cargado antes
 */

/**
 * Formateador de moneda MXN
 */
const fmt = (val) => '$' + parseFloat(val || 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

/**
 * Actualiza todos los elementos del widget lateral TDC.
 * @param {Object} tdcData  — Objeto tdc de /api/futuro
 * @param {Object} config   — Objeto config de /api/futuro
 */
function updateTDCReminder(tdcData, config) {
    if (!tdcData) return;

    const deuda      = tdcData.deuda_actual || 0;
    const limite     = tdcData.limite || 500;
    const disponible = tdcData.disponible !== undefined ? tdcData.disponible : Math.max(0, limite - deuda);
    const usoPct     = tdcData.utilizacion_pct || (limite > 0 ? ((deuda / limite) * 100).toFixed(1) : 0);
    const corteDia   = tdcData.corte_dia  || config?.tdc_corte || 23;
    const pagoDia    = tdcData.pago_dia   || config?.tdc_pago  || 3;

    const elDeuda      = document.getElementById('tdc-side-deuda');
    const elDisp       = document.getElementById('tdc-side-disponible');
    const elUso        = document.getElementById('tdc-side-uso');
    const elLimiteSub  = document.getElementById('tdc-side-limite-sub');
    const elPagoTot    = document.getElementById('tdc-side-pago-totalero');
    const elCorte      = document.getElementById('tdc-side-corte');
    const elPagoLim    = document.getElementById('tdc-side-pago-limite');
    const elDiasRest   = document.getElementById('tdc-side-dias-restantes');
    const elPillDeuda  = document.getElementById('tdc-pill-deuda');
    const elBadge      = document.getElementById('tdc-side-badge-status');

    if (elDeuda)     elDeuda.innerText    = fmt(deuda);
    if (elDisp)      elDisp.innerText     = fmt(disponible);
    if (elUso)       elUso.innerText      = `${usoPct}% de tu límite (${fmt(limite)})`;
    if (elLimiteSub) elLimiteSub.innerText = `Límite Total: ${fmt(limite)}`;
    if (elPagoTot)   elPagoTot.innerText  = fmt(deuda);
    if (elPillDeuda) elPillDeuda.innerText = fmt(deuda);

    const today       = new Date();
    const currentDay  = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear  = today.getFullYear();
    const monthNames   = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

    let nextCorte = new Date(currentYear, currentMonth, corteDia);
    if (currentDay > corteDia) nextCorte = new Date(currentYear, currentMonth + 1, corteDia);
    const diffDaysCorte = Math.max(0, Math.ceil((nextCorte - today) / (1000 * 60 * 60 * 24)));

    let nextPago = new Date(currentYear, currentMonth, pagoDia);
    if (currentDay > pagoDia) nextPago = new Date(currentYear, currentMonth + 1, pagoDia);
    const diffDaysPago = Math.max(0, Math.ceil((nextPago - today) / (1000 * 60 * 60 * 24)));

    if (elCorte)   elCorte.innerText   = `${corteDia} ${monthNames[nextCorte.getMonth()]} (${diffDaysCorte} días)`;
    if (elPagoLim) elPagoLim.innerText = `${pagoDia} ${monthNames[nextPago.getMonth()]} (${diffDaysPago} días)`;

    // Ventana de pago urgente: días 24 al 2
    const esVentanaPagoUrgente = (currentDay >= 24 || currentDay <= 2);

    if (elDiasRest) {
        if (deuda === 0) {
            elDiasRest.innerHTML = `🟢 <b class="text-emerald-300">¡Tu TDC está 100% limpia!</b> Sin compras pendientes ni intereses.`;
            if (elBadge) {
                elBadge.innerText   = "LIBRE DE DEUDA";
                elBadge.className   = "px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800";
            }
            toggleSideReminder(false);

        } else if (esVentanaPagoUrgente) {
            // DÍAS 24 A 2: NOTIFICACIÓN URGENTE ¡PAGAR YA!
            elDiasRest.innerHTML = `🚨 <b class="text-rose-400 font-black">¡PAGAR YA! Tu corte cerró el día 23.</b> Tienes hasta el <b>${pagoDia} de ${monthNames[nextPago.getMonth()]} (${diffDaysPago} días)</b> para liquidar <b class="text-amber-300">${fmt(deuda)}</b> y pagar <b>$0.00 de intereses</b>.`;
            if (elBadge) {
                elBadge.innerText = `🚨 PAGAR YA (${fmt(deuda)})`;
                elBadge.className = "px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-950 text-rose-300 border border-rose-600 animate-pulse shadow-lg shadow-rose-950";
            }
            setTimeout(() => toggleSideReminder(true), 500);

        } else {
            // DÍAS 3 A 23: CICLO EN CURSO, info discreta
            elDiasRest.innerHTML = `ℹ️ <b class="text-indigo-300">Llevas gastado ${fmt(deuda)}</b> en este período. Tu próximo corte es el <b>día 23 (${diffDaysCorte} días)</b>. Aún no vence tu fecha de pago.`;
            if (elBadge) {
                elBadge.innerText = `CICLO EN CURSO (${fmt(deuda)})`;
                elBadge.className = "px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-950 text-indigo-300 border border-indigo-800";
            }
            toggleSideReminder(false);
        }
    }
}

/**
 * Muestra u oculta el widget lateral TDC.
 * @param {boolean} show
 */
function toggleSideReminder(show) {
    const card = document.getElementById('tdc-side-reminder');
    const pill = document.getElementById('tdc-side-pill');
    if (!card) return;

    if (show) {
        card.classList.remove('translate-x-[-130%]', 'opacity-0');
        card.classList.add('translate-x-0', 'opacity-100');
        if (pill) pill.classList.add('hidden');
    } else {
        card.classList.remove('translate-x-0', 'opacity-100');
        card.classList.add('translate-x-[-130%]', 'opacity-0');
        if (pill) pill.classList.remove('hidden');
    }
    lucide.createIcons();
}
