/**
 * Función auxiliar para redondear a 2 decimales sin errores de punto flotante.
 */
function round2(val) {
    return Math.round((Number(val || 0) + Number.EPSILON) * 100) / 100;
}

/**
 * Renderiza el resumen KPI principal y la tabla de categorías.
 */
function renderResumen() {
    if (!currentData || !currentData.resumen) return;
    const r = currentData.resumen;

    const fijosTotal = r.gastos_operativos !== undefined ? r.gastos_operativos : (r.monto_combi + r.monto_comida + r.monto_copias + r.monto_imprevistos);
    const excedenteTotal = r.excedente_total !== undefined ? r.excedente_total : Math.max(0, r.presupuesto_asignado - fijosTotal);
    const excedenteMoto = r.excedente_moto_80 !== undefined ? r.excedente_moto_80 : excedenteTotal * 0.8;
    const excedenteGustos = r.excedente_gustos_20 !== undefined ? r.excedente_gustos_20 : excedenteTotal * 0.2;
    const efectivoRetirar = r.efectivo_retirar !== undefined ? r.efectivo_retirar : (r.monto_combi + r.monto_comida);

    // Cálculo dinámico de sobrantes y retiro neto quincenal en curso
    const presCombi = r.monto_combi || 320;
    const presComida = r.monto_comida || 180;
    const gastoCombi = (currentData.registros || []).filter(t => t.categoria.includes("Pasajes")).reduce((s, t) => s + t.monto, 0);
    const gastoComida = (currentData.registros || []).filter(t => t.categoria.includes("Comidas")).reduce((s, t) => s + t.monto, 0);
    const sobranteCombi = Math.max(0, presCombi - gastoCombi);
    const sobranteComida = Math.max(0, presComida - gastoComida);
    const sobranteEfectivoTotal = sobranteCombi + sobranteComida;
    const retiroNetoCombi = Math.max(0, presCombi - sobranteCombi);
    const retiroNetoComida = Math.max(0, presComida - sobranteComida);
    const retiroNetoTotalEfectivo = retiroNetoCombi + retiroNetoComida;

    document.getElementById('kpi-presupuesto').innerText = fmt(r.presupuesto_asignado);
    document.getElementById('kpi-fijos').innerText = fmt(fijosTotal);
    document.getElementById('kpi-gastado').innerText = fmt(r.total_gastado);
    document.getElementById('kpi-pct-gastado').innerText = `${r.pct_consumido_total}% consumido`;

    if (r.total_gastado > 0 && sobranteEfectivoTotal > 0) {
        document.getElementById('kpi-efectivo').innerText = fmt(retiroNetoTotalEfectivo);
        document.getElementById('kpi-efectivo-sub').innerText = `Base: ${fmt(efectivoRetirar)} | Sobrante: -${fmt(sobranteEfectivoTotal)} (${fmt(retiroNetoCombi)} Combi + ${fmt(retiroNetoComida)} Comidas)`;
    } else {
        document.getElementById('kpi-efectivo').innerText = fmt(efectivoRetirar);
        document.getElementById('kpi-efectivo-sub').innerText = `${fmt(presCombi)} Combi + ${fmt(presComida)} Comidas`;
    }

    document.getElementById('kpi-excedente').innerText = fmt(excedenteTotal);
    document.getElementById('kpi-excedente-sub').innerText = `80% Moto (${fmt(excedenteMoto)}) | 20% Salidas (${fmt(excedenteGustos)})`;

    const elTotalGastadoBar = document.getElementById('bar-total-gastado');
    if (elTotalGastadoBar) elTotalGastadoBar.innerText = `Total Gastado en la Quincena: ${fmt(r.total_gastado)}`;

    document.getElementById('bar-remanente').innerText = `Disponible: ${fmt(r.remanente_total)}`;
    document.getElementById('bar-fill').style.width = `${Math.min(100, r.pct_consumido_total)}%`;

    // Tabla de categorías con semáforo
    const tbody = document.getElementById('tbody-categorias');
    tbody.innerHTML = '';
    currentData.categorias.forEach(cat => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/40 transition";

        let badgeClass = "bg-emerald-950/80 text-emerald-300 border-emerald-700/60";
        let dotClass = "bg-emerald-400";
        let semaforoTexto = "EN CONTROL";

        if (cat.pct_consumido > 100) {
            badgeClass = "bg-rose-950/80 text-rose-300 border-rose-700/60";
            dotClass = "bg-rose-400 animate-pulse";
            semaforoTexto = "EXCEDIDO";
        } else if (cat.pct_consumido >= 80) {
            badgeClass = "bg-amber-950/80 text-amber-300 border-amber-700/60";
            dotClass = "bg-amber-400";
            semaforoTexto = "ALERTA (+80%)";
        }

        tr.innerHTML = `
            <td class="p-3.5 font-bold text-white">${cat.categoria}</td>
            <td class="p-3.5 text-xs text-slate-300">${cat.mecanica}</td>
            <td class="p-3.5 text-right font-semibold text-slate-200">${fmt(cat.presupuesto)}</td>
            <td class="p-3.5 text-center text-xs text-slate-400 font-medium">${cat.pct_total}%</td>
            <td class="p-3.5 text-right font-bold text-rose-400">${fmt(cat.gasto_real)}</td>
            <td class="p-3.5 text-right font-bold text-emerald-400">${fmt(cat.remanente)}</td>
            <td class="p-3.5 text-center font-bold ${cat.pct_consumido > 100 ? 'text-rose-400' : (cat.pct_consumido >= 80 ? 'text-amber-400' : 'text-emerald-400')}">
                ${cat.pct_consumido}%
            </td>
            <td class="p-3.5 text-center whitespace-nowrap">
                <span class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider border shadow-sm ${badgeClass}">
                    <span class="w-2 h-2 rounded-full ${dotClass}"></span>
                    <span>${semaforoTexto}</span>
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Renderiza los botones de gasto rápido con montos calculados dinámicamente.
 */
function renderQuickButtons() {
    if (!currentData || !currentData.resumen) return;
    const r = currentData.resumen;
    const container = document.getElementById('container-quick-buttons');
    if (!container) return;

    const mCombi = r.monto_combi || 350;
    const mComida = r.monto_comida || 200;
    const mCopias = r.monto_copias || 50;
    const mImprevistos = r.monto_imprevistos || 250;

    const combiDia = round2(mCombi / 10);
    const comidaDia = round2(mComida / 6);
    const copiasDia = round2(mCopias / 6);
    const imprevistoDia = round2(mImprevistos / 3);

    container.innerHTML = `
        <button onclick="quickAddGasto(${combiDia}, '🚌 Pasajes Combi (Efectivo)', 'Pasajes de Combi (Ida y Vuelta)')" class="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-left transition hover:scale-[1.02] flex flex-col justify-between">
            <span class="text-xs text-slate-300 font-semibold">🚌 Combi Diaria</span>
            <span class="text-base font-black text-indigo-400 mt-1">${fmt(combiDia)}</span>
        </button>
        <button onclick="quickAddGasto(${comidaDia}, '🥪 Comidas en Escuela (Efectivo)', 'Comida en cafetería')" class="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-left transition hover:scale-[1.02] flex flex-col justify-between">
            <span class="text-xs text-slate-300 font-semibold">🥪 Comida Escuela</span>
            <span class="text-base font-black text-emerald-400 mt-1">${fmt(comidaDia)}</span>
        </button>
        <button onclick="quickAddGasto(${copiasDia}, '📄 Copias, Material &amp; Papelería', 'Copias / Impresiones')" class="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-left transition hover:scale-[1.02] flex flex-col justify-between">
            <span class="text-xs text-slate-300 font-semibold">📄 Copias / Papelería</span>
            <span class="text-base font-black text-blue-400 mt-1">${fmt(copiasDia)}</span>
        </button>
        <button onclick="quickAddGasto(${imprevistoDia}, '🛡️ Imprevistos / Por si acaso', 'Gasto no planeado')" class="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-left transition hover:scale-[1.02] flex flex-col justify-between">
            <span class="text-xs text-slate-300 font-semibold">🛡️ Imprevisto</span>
            <span class="text-base font-black text-amber-400 mt-1">${fmt(imprevistoDia)}</span>
        </button>
    `;
}

/**
 * Renderiza la tabla de registros de gastos del período actual.
 */
function renderRegistros() {
    if (!currentData) return;
    const tbody = document.getElementById('tbody-registros');
    tbody.innerHTML = '';
    document.getElementById('badge-total-registros').innerText = `${currentData.registros.length} registros`;

    if (currentData.registros.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-500">No hay gastos registrados en esta quincena. ¡Comienza una nueva quincena limpia!</td></tr>`;
        return;
    }

    currentData.registros.forEach(reg => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/40 transition";
        tr.innerHTML = `
            <td class="p-3 font-semibold text-slate-500">#${reg.id}</td>
            <td class="p-3 text-slate-300 whitespace-nowrap">${reg.fecha}</td>
            <td class="p-3 text-slate-400">${reg.dia}</td>
            <td class="p-3 text-right font-bold text-white">${fmt(reg.monto)}</td>
            <td class="p-3 text-slate-300 text-xs">${reg.categoria}</td>
            <td class="p-3 text-slate-300">${reg.concepto}</td>
            <td class="p-3 text-slate-400 text-xs">${reg.metodo}</td>
            <td class="p-3 text-center whitespace-nowrap">
                <button onclick="openEditModal(${reg.fila})" class="p-1.5 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition mr-1" title="Editar en Excel">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                </button>
                <button onclick="openDeleteModal(${reg.fila})" class="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition" title="Borrar de Excel">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Renderiza el simulador de moto con datos dinámicos.
 */
function renderSimuladorMoto() {
    if (!currentData || !currentData.simulador_moto) return;
    const s = currentData.simulador_moto;

    const navMotoMeta = document.getElementById('nav-moto-meta');
    if (navMotoMeta) navMotoMeta.innerText = fmt(s.meta);

    // Header y KPIs Superiores
    const elKpiMeta = document.getElementById('moto-kpi-meta');
    if (elKpiMeta) elKpiMeta.innerText = fmt(s.meta);

    const elKpiDias = document.getElementById('moto-kpi-dias');
    if (elKpiDias) elKpiDias.innerText = s.dias_libres_cuatrimestre;

    const elKpiVac = document.getElementById('moto-kpi-vacaciones-extra');
    if (elKpiVac) elKpiVac.innerText = `+${fmt(s.ahorro_extra_vacaciones)}`;

    const elKpiExc = document.getElementById('moto-kpi-excedente-q');
    if (elKpiExc) elKpiExc.innerText = fmt(s.excedente_base_quincena);

    const elTiempo = document.getElementById('moto-tiempo');
    if (elTiempo) elTiempo.innerText = `${s.cuatrimestres_necesarios} Cuatris`;

    const elMeses = document.getElementById('moto-meses');
    if (elMeses) elMeses.innerText = `(~${s.meses_necesarios} meses / ${s.quincenas_necesarias} quincenas)`;

    // Tarjetas de Progreso Real
    const elCardMeta = document.getElementById('moto-card-meta');
    if (elCardMeta) elCardMeta.innerText = fmt(s.meta);

    const elCardAcum = document.getElementById('moto-card-acumulado');
    if (elCardAcum) elCardAcum.innerText = fmt(s.total_real_acumulado);

    const elCardPct = document.getElementById('moto-card-pct');
    if (elCardPct) elCardPct.innerText = `${s.pct_avance_real}% conseguido (Histórico: ${fmt(s.ahorro_real_historico)} + Aportes: ${fmt(s.aportaciones_directas)})`;
    const elCardFalt = document.getElementById('moto-card-faltante');
    if (elCardFalt) elCardFalt.innerText = fmt(s.faltante_meta);

    const elCardQuinSub = document.getElementById('moto-card-quincenas-sub');
    if (elCardQuinSub) elCardQuinSub.innerText = `${s.quincenas_necesarias} quincenas restantes`;

    const elCardVac = document.getElementById('moto-card-vacaciones');
    if (elCardVac) elCardVac.innerText = `+${fmt(s.ahorro_extra_vacaciones)}`;

    const elCardVacSub = document.getElementById('moto-card-vacaciones-sub');
    if (elCardVacSub) elCardVacSub.innerText = `${s.dias_libres_num} días x ${fmt(s.gasto_diario_escolar || 60)}/día (Combi + Comidas + Copias)`;

    const lblAportes = document.getElementById('lbl-moto-aportes-directos');
    if (lblAportes) lblAportes.innerText = fmt(s.aportaciones_directas);

    // Textos explicativos
    const alertDiario = document.getElementById('moto-alert-costo-diario');
    if (alertDiario) {
        alertDiario.innerText = `${fmt(s.gasto_diario_combi)} de combi + ${fmt(s.gasto_diario_comida)} de comida + ${fmt(s.gasto_diario_copias)} de copias = ${fmt(s.gasto_diario_escolar || 60)}/día`;
    }
    const alertVacCalc = document.getElementById('moto-alert-vacaciones-calc');
    if (alertVacCalc) {
        alertVacCalc.innerText = `${s.dias_libres_num} días x ${fmt(s.gasto_diario_escolar || 60)}/día = +${fmt(s.ahorro_extra_vacaciones)} de ahorro extra`;
    }

    // Tabla Cuatrimestral
    const tbody = document.getElementById('tbody-simulador-moto');
    if (tbody) {
        tbody.innerHTML = '';
        s.cuatrimestres.forEach(c => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-800/40 transition";
            tr.innerHTML = `
                <td class="p-3.5 font-bold text-white">${c.periodo}</td>
                <td class="p-3.5 text-center text-slate-300">${c.semanas}</td>
                <td class="p-3.5 text-center text-indigo-400 font-semibold">${c.dias_libres}</td>
                <td class="p-3.5 text-right font-medium text-emerald-400">+ ${fmt(c.ahorro_extra)}</td>
                <td class="p-3.5 text-right text-slate-300">${fmt(c.excedente_base)}</td>
                <td class="p-3.5 text-right font-bold text-white">${fmt(c.total_ahorro)}</td>
                <td class="p-3.5 text-center">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${c.pct_meta >= 100 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-indigo-950 text-indigo-300 border border-indigo-800'}">
                        ${c.pct_meta}%
                    </span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

/**
 * Rellena el formulario de configuración con los valores actuales del Excel.
 */
function populateConfigForm() {
    if (!currentData) return;
    document.getElementById('cfg-g-presupuesto').value = currentData.resumen.presupuesto_asignado;

    currentData.categorias.forEach(cat => {
        if (cat.categoria.includes("Pasajes")) document.getElementById('cfg-g-combi').value = cat.presupuesto;
        else if (cat.categoria.includes("Comidas")) document.getElementById('cfg-g-comida').value = cat.presupuesto;
        else if (cat.categoria.includes("Copias")) document.getElementById('cfg-g-copias').value = cat.presupuesto;
        else if (cat.categoria.includes("Imprevistos")) document.getElementById('cfg-g-imprevistos').value = cat.presupuesto;
    });

    const sm = currentData.simulador_moto;
    if (sm) {
        document.getElementById('cfg-g-meta-moto').value = sm.meta;
        document.getElementById('cfg-g-dias-libres-num').value = sm.dias_libres_num || 15;
        const inAportes = document.getElementById('cfg-g-aportaciones-directas');
        if (inAportes) inAportes.value = sm.aportaciones_directas || 0;
    }
}

/**
 * Recalcula en vivo los valores en el panel de configuración según los inputs.
 */
function recalcLivePreview() {
    const pres = parseFloat(document.getElementById('cfg-g-presupuesto').value || 0);
    const combi = parseFloat(document.getElementById('cfg-g-combi').value || 0);
    const comida = parseFloat(document.getElementById('cfg-g-comida').value || 0);
    const copias = parseFloat(document.getElementById('cfg-g-copias').value || 0);
    const imprevistos = parseFloat(document.getElementById('cfg-g-imprevistos').value || 0);
    const diasLibres = parseFloat(document.getElementById('cfg-g-dias-libres-num').value || 0);

    const fijos = combi + comida + copias + imprevistos;
    const bolsa = Math.max(0, pres - fijos);
    const moto80 = bolsa * 0.80;
    const gustos20 = bolsa * 0.20;
    
    // Gasto diario escolar ahorrado en vacaciones: Combi + Comidas + Copias (Imprevistos se mantiene activo)
    const costoDiarioEscolar = (combi + comida + copias) / 10;
    const ahorroVac = diasLibres * costoDiarioEscolar;

    document.getElementById('prev-gastos-fijos').innerText = fmt(fijos);
    document.getElementById('prev-excedente-moto').innerText = fmt(moto80);
    document.getElementById('prev-excedente-gustos').innerText = fmt(gustos20);
    document.getElementById('prev-vacaciones-extra').innerText = fmt(ahorroVac);
    document.getElementById('prev-vacaciones-sub').innerText = `${diasLibres} días x ${fmt(costoDiarioEscolar)}/día (Combi + Comidas + Copias)`;
}

/**
 * Rellena el selector de meses del estado de cuenta.
 */
function populateMesesSelect() {
    const select = document.getElementById('select-mes-historial');
    if (!select) return;
    select.innerHTML = '';

    if (!historialData || !historialData.meses || historialData.meses.length === 0) {
        const opt = document.createElement('option');
        opt.value = "";
        opt.innerText = "Sin cierres previos archivados";
        select.appendChild(opt);
        return;
    }

    historialData.meses.forEach((m, idx) => {
        const opt = document.createElement('option');
        opt.value = m.mes_anio;
        opt.innerText = `${m.mes_anio} (${m.num_quincenas} quincena${m.num_quincenas > 1 ? 's' : ''})`;
        if (idx === 0) opt.selected = true;
        select.appendChild(opt);
    });
}

function renderEstadoCuentaSeleccionado() {
    const select = document.getElementById('select-mes-historial');
    const mesSeleccionado = select ? select.value : "";
    const tbodyQ = document.getElementById('ec-tbody-quincenas-tabla');
    const tbodyC = document.getElementById('ec-tbody-categorias-desglose');
    const tbodyM = document.getElementById('ec-tbody-movimientos-tabla');
    const tbodyResumen = document.getElementById('ec-tbody-resumen-movimientos');
    const tbodyComp = document.getElementById('ec-tbody-comparativa-mes');
    const tbodyCompensacion = document.getElementById('ec-tbody-compensacion-retiro');
    const containerCompensacionDetalle = document.getElementById('ec-container-compensacion-detalle');

    if (tbodyQ) tbodyQ.innerHTML = '';
    if (tbodyC) tbodyC.innerHTML = '';
    if (tbodyM) tbodyM.innerHTML = '';
    if (tbodyResumen) tbodyResumen.innerHTML = '';
    if (tbodyComp) tbodyComp.innerHTML = '';
    if (tbodyCompensacion) tbodyCompensacion.innerHTML = '';
    if (containerCompensacionDetalle) containerCompensacionDetalle.innerHTML = '';

    if (!historialData || !historialData.meses || historialData.meses.length === 0 || !mesSeleccionado) {
        const today = new Date();
        const todayStr = today.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const todayShort = today.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' });
        const elEmision = document.getElementById('ec-p-emision');
        const elFechaH = document.getElementById('ec-p-fecha-header');
        if (elEmision) elEmision.innerText = `al Día ${todayStr}`;
        if (elFechaH) elFechaH.innerText = todayShort;

        document.getElementById('ec-ingreso').innerText = "$0.00";
        document.getElementById('ec-gastado').innerText = "$0.00";
        document.getElementById('ec-remanente').innerText = "$0.00";
        document.getElementById('ec-moto').innerText = "$0.00";
        document.getElementById('ec-salidas-sub').innerText = "Salidas (20%): $0.00";
        document.getElementById('ec-quincenas-badge').innerText = "0 quincenas cerradas";
        document.getElementById('ec-pct-gastado').innerText = "0% del ingreso mensual";
        const badgeM = document.getElementById('ec-p-badge-movimientos');
        if (badgeM) badgeM.innerText = "0 movimientos";

        const noDataHtml = `<tr><td colspan="10" class="p-6 text-center text-slate-500 font-semibold">No hay quincenas archivadas en el histórico. Cierra una quincena para ver el estado de cuenta formal.</td></tr>`;
        if (tbodyQ) tbodyQ.innerHTML = noDataHtml;
        if (tbodyC) tbodyC.innerHTML = noDataHtml;
        if (tbodyM) tbodyM.innerHTML = noDataHtml;
        if (tbodyResumen) tbodyResumen.innerHTML = noDataHtml;
        if (tbodyComp) tbodyComp.innerHTML = noDataHtml;
        if (tbodyCompensacion) tbodyCompensacion.innerHTML = noDataHtml;
        return;
    }

    const currIdx = historialData.meses.findIndex(m => m.mes_anio === mesSeleccionado);
    if (currIdx === -1) return;
    const mData = historialData.meses[currIdx];
    const prevMonth = currIdx + 1 < historialData.meses.length ? historialData.meses[currIdx + 1] : null;

    // Obtener la fecha del estado de cuenta (última fecha de cierre del mes o fecha actual)
    let fechaEstadoCuenta = "";
    if (mData.quincenas && mData.quincenas.length > 0) {
        const ultQuincena = mData.quincenas[0]; // La más reciente
        fechaEstadoCuenta = ultQuincena.fecha_cierre || "";
    }
    if (!fechaEstadoCuenta) {
        const today = new Date();
        fechaEstadoCuenta = today.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    const elEmision = document.getElementById('ec-p-emision');
    const elFechaH = document.getElementById('ec-p-fecha-header');
    if (elEmision) elEmision.innerText = `al Día ${fechaEstadoCuenta}`;
    if (elFechaH) elFechaH.innerText = fechaEstadoCuenta;

    const pctGastadoMes = mData.ingreso_total > 0 ? ((mData.gasto_real_total / mData.ingreso_total) * 100).toFixed(1) : 0;

    // KPIs Pantalla
    document.getElementById('ec-ingreso').innerText = fmt(mData.ingreso_total);
    document.getElementById('ec-gastado').innerText = fmt(mData.gasto_real_total);
    document.getElementById('ec-remanente').innerText = fmt(mData.remanente_total);
    document.getElementById('ec-moto').innerText = fmt(mData.ahorro_moto_total);
    document.getElementById('ec-salidas-sub').innerText = `Salidas (20%): ${fmt(mData.excedente_salidas_total)}`;
    document.getElementById('ec-quincenas-badge').innerText = `${mData.num_quincenas} quincena${mData.num_quincenas > 1 ? 's' : ''} consolidada${mData.num_quincenas > 1 ? 's' : ''}`;
    document.getElementById('ec-pct-gastado').innerText = `${pctGastadoMes}% del ingreso mensual`;

    // Encabezado Documento Institucional
    const elPeriodoH = document.getElementById('ec-p-periodo');
    const elSaldoB = document.getElementById('ec-p-saldo-banner');
    const badgeM = document.getElementById('ec-p-badge-movimientos');
    if (elPeriodoH) elPeriodoH.innerText = mData.mes_anio.toUpperCase();
    if (elSaldoB) elSaldoB.innerText = `${fmt(mData.remanente_total)} MXN`;
    if (badgeM) badgeM.innerText = `${mData.transacciones.length} movimientos`;

    // Totales en barra enmarcada (e)
    const elTotPres = document.getElementById('ec-tot-presupuesto');
    const elTotGast = document.getElementById('ec-tot-gasto');
    const elTotSald = document.getElementById('ec-tot-saldo');
    if (elTotPres) elTotPres.innerText = fmt(mData.ingreso_total);
    if (elTotGast) elTotGast.innerText = `-${fmt(mData.gasto_real_total)}`;
    if (elTotSald) elTotSald.innerText = fmt(mData.remanente_total);

    // ─────────────────────────────────────────────────────────────────────────
    // Cálculos Dinámicos de Presupuestos desde Excel (Sin Hardcodear)
    // ─────────────────────────────────────────────────────────────────────────
    const numQ = mData.num_quincenas || 1;
    const mCombi = currentData?.resumen?.monto_combi || 0;
    const mComida = currentData?.resumen?.monto_comida || 0;
    const mCopias = currentData?.resumen?.monto_copias || 0;
    const mImprevistos = currentData?.resumen?.monto_imprevistos || 0;

    // Presupuesto consolidado de efectivo (Pasajes + Comidas)
    const efectivoRetirarTotal = (mCombi + mComida) * numQ;
    const efectivoGastoReal = mData.transacciones.filter(t =>
        t.categoria.includes("Pasajes") || t.categoria.includes("Comidas")
    ).reduce((sum, t) => sum + t.monto, 0);
    const efectivoRemanente = Math.max(0, efectivoRetirarTotal - efectivoGastoReal);

    // Gastos digitales en Cajita (Copias + Imprevistos)
    const digitalesPresupuesto = (mCopias + mImprevistos) * numQ;
    const digitalesGastoReal = mData.transacciones.filter(t =>
        t.categoria.includes("Copias") || t.categoria.includes("Imprevistos")
    ).reduce((sum, t) => sum + t.monto, 0);
    const digitalesRemanente = Math.max(0, digitalesPresupuesto - digitalesGastoReal);

    // Fondos Excedentes (Moto 80% y Salidas 20% exactos)
    const motoPresupuesto = mData.ahorro_moto_total;
    const gustosPresupuesto = mData.excedente_salidas_total;

    // Saldo que REALMENTE genera rendimiento al 13% en Cajita Turbo Nu
    const saldoEnCajitaTurboNu = Math.max(0, mData.remanente_total - efectivoRetirarTotal);
    const rendCajitaNuMensual = saldoEnCajitaTurboNu * (0.13 / 12);

    // ─────────────────────────────────────────────────────────────────────────
    // SECCIÓN d: RESUMEN DE INGRESOS Y GASTOS DEL PERÍODO
    // ─────────────────────────────────────────────────────────────────────────
    if (tbodyResumen) {
        tbodyResumen.innerHTML = '';
        const itemsResumen = [
            {
                concepto: "1010  PRESUPUESTO TOTAL ASIGNADO (INGRESOS)",
                presupuesto: mData.ingreso_total,
                gasto: 0,
                saldo: mData.ingreso_total,
                isHeader: true
            },
            {
                concepto: "2010  EFECTIVO RETIRADO (Pasajes Combi + Comidas Escuela — No genera rend.)",
                presupuesto: efectivoRetirarTotal,
                gasto: efectivoGastoReal,
                saldo: efectivoRemanente
            },
            {
                concepto: "2020  GASTOS DIGITALES EN CAJITA (Copias & Imprevistos — Cajita Nu 13%)",
                presupuesto: digitalesPresupuesto,
                gasto: digitalesGastoReal,
                saldo: digitalesRemanente
            },
            {
                concepto: "3010  FONDO ACELERADOR MOTO (80% Excedente Base — Cajita Nu 13%)",
                presupuesto: motoPresupuesto,
                gasto: 0,
                saldo: motoPresupuesto
            },
            {
                concepto: "4010  FONDO REFUERZO SALIDAS Y GUSTOS (20% Excedente Base — Débito Nu)",
                presupuesto: gustosPresupuesto,
                gasto: mData.transacciones.filter(t => t.categoria.includes("Excedente 20%")).reduce((s, t) => s + t.monto, 0),
                saldo: gustosPresupuesto
            }
        ];

        itemsResumen.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-bold ${item.isHeader ? 'text-slate-900 bg-slate-100' : 'text-slate-700'}">${item.concepto}</td>
                <td class="text-right ec-blue">${fmt(item.presupuesto)}</td>
                <td class="text-right ${item.gasto > 0 ? 'ec-red' : 'text-slate-400'}">${item.gasto > 0 ? '-' + fmt(item.gasto) : '$0.00'}</td>
                <td class="text-right ec-green">${fmt(item.saldo)}</td>
            `;
            tbodyResumen.appendChild(tr);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECCIÓN f: COMPARATIVA CON MES ANTERIOR & RENDIMIENTO FINANCIERO
    // ─────────────────────────────────────────────────────────────────────────
    if (tbodyComp) {
        tbodyComp.innerHTML = '';
        if (prevMonth) {
            const deltaGasto = mData.gasto_real_total - prevMonth.gasto_real_total;
            const pctGasto = prevMonth.gasto_real_total > 0 ? ((deltaGasto / prevMonth.gasto_real_total) * 100).toFixed(1) : 0;

            const deltaRem = mData.remanente_total - prevMonth.remanente_total;
            const pctRem = prevMonth.remanente_total > 0 ? ((deltaRem / prevMonth.remanente_total) * 100).toFixed(1) : 0;

            const tasaCurr = mData.ingreso_total > 0 ? ((mData.remanente_total / mData.ingreso_total) * 100).toFixed(1) : 0;
            const tasaPrev = prevMonth.ingreso_total > 0 ? ((prevMonth.remanente_total / prevMonth.ingreso_total) * 100).toFixed(1) : 0;
            const deltaTasa = (tasaCurr - tasaPrev).toFixed(1);

            const efectivoRetirarPrev = (mCombi + mComida) * prevMonth.num_quincenas;
            const saldoNuPrev = Math.max(0, prevMonth.remanente_total - efectivoRetirarPrev);
            const rendNuPrev = saldoNuPrev * (0.13 / 12);

            const compRows = [
                {
                    indicador: "💳 Gasto Real Total Ejecutado",
                    prev: fmt(prevMonth.gasto_real_total),
                    curr: fmt(mData.gasto_real_total),
                    delta: (deltaGasto >= 0 ? "+" : "") + fmt(deltaGasto),
                    pct: (pctGasto >= 0 ? "+" : "") + `${pctGasto}%`,
                    diag: deltaGasto <= 0 ? "🟢 Disminuyó el gasto (Mayor ahorro generado)" : "🔴 Aumentó el gasto vs mes anterior",
                    isGood: deltaGasto <= 0
                },
                {
                    indicador: "💰 Saldo Remanente / Ahorrado Total",
                    prev: fmt(prevMonth.remanente_total),
                    curr: fmt(mData.remanente_total),
                    delta: (deltaRem >= 0 ? "+" : "") + fmt(deltaRem),
                    pct: (pctRem >= 0 ? "+" : "") + `${pctRem}%`,
                    diag: deltaRem >= 0 ? "🟢 Crecimiento positivo de capital" : "🟡 Menor remanente que el mes previo",
                    isGood: deltaRem >= 0
                },
                {
                    indicador: "📈 Tasa de Eficiencia de Ahorro",
                    prev: `${tasaPrev}%`,
                    curr: `${tasaCurr}%`,
                    delta: (deltaTasa >= 0 ? "+" : "") + `${deltaTasa}%`,
                    pct: `${tasaCurr}%`,
                    diag: tasaCurr >= 50 ? "🏆 Nivel de ahorro óptimo (>50% de ingresos protegidos)" : "🟢 Nivel de ahorro saludable",
                    isGood: true
                },
                {
                    indicador: "🟣 Rendimiento Cajita Turbo Nu (13% Anual)",
                    prev: fmt(rendNuPrev),
                    curr: fmt(rendCajitaNuMensual),
                    delta: (rendCajitaNuMensual >= rendNuPrev ? "+" : "") + fmt(rendCajitaNuMensual - rendNuPrev),
                    pct: "13.0% Anual",
                    diag: `Generando +${fmt(rendCajitaNuMensual)} MXN/mes sobre saldo digital (${fmt(saldoEnCajitaTurboNu)}) restando efectivo retirado`,
                    isGood: true
                }
            ];

            compRows.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="font-bold text-slate-900">${row.indicador}</td>
                    <td class="text-right text-slate-600 font-semibold">${row.prev}</td>
                    <td class="text-right font-bold text-slate-900">${row.curr}</td>
                    <td class="text-right font-black ${row.isGood ? 'ec-green' : 'ec-red'}">${row.delta}</td>
                    <td class="text-center font-bold ${row.isGood ? 'ec-green' : 'ec-red'}">${row.pct}</td>
                    <td class="text-left text-xs font-semibold text-slate-700">${row.diag}</td>
                `;
                tbodyComp.appendChild(tr);
            });
        } else {
            const compRowsFirst = [
                {
                    indicador: "💳 Gasto Real vs Presupuesto Asignado",
                    prev: fmt(mData.ingreso_total),
                    curr: fmt(mData.gasto_real_total),
                    delta: `-${fmt(mData.remanente_total)}`,
                    pct: `${pctGastadoMes}% Consumido`,
                    diag: mData.remanente_total > 0 ? "🟢 Ahorro del 100% de la bolsa no consumida" : "🟡 Gasto al 100% del presupuesto",
                    isGood: true
                },
                {
                    indicador: "💰 Saldo Remanente Total",
                    prev: "$0.00 (Línea Base)",
                    curr: fmt(mData.remanente_total),
                    delta: `+${fmt(mData.remanente_total)}`,
                    pct: "100%",
                    diag: "🏆 Primer período consolidado exitosamente en el histórico",
                    isGood: true
                },
                {
                    indicador: "🟣 Rendimiento Cajita Turbo Nu (13% Anual)",
                    prev: "$0.00",
                    curr: fmt(rendCajitaNuMensual),
                    delta: `+${fmt(rendCajitaNuMensual)}/mes`,
                    pct: "13.0% Anual",
                    diag: `Generando +${fmt(rendCajitaNuMensual)} MXN/mes sobre saldo digital (${fmt(saldoEnCajitaTurboNu)}) restando efectivo retirado`,
                    isGood: true
                }
            ];

            compRowsFirst.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="font-bold text-slate-900">${row.indicador}</td>
                    <td class="text-right text-slate-500">${row.prev}</td>
                    <td class="text-right font-bold text-slate-900">${row.curr}</td>
                    <td class="text-right font-black ec-green">${row.delta}</td>
                    <td class="text-center font-bold text-indigo-700">${row.pct}</td>
                    <td class="text-left text-xs font-semibold text-slate-700">${row.diag}</td>
                `;
                tbodyComp.appendChild(tr);
            });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECCIÓN g: DESGLOSE CONSOLIDADO POR CATEGORÍA
    // ─────────────────────────────────────────────────────────────────────────
    if (tbodyC) {
        tbodyC.innerHTML = '';
        const catNombres = [
            "🚌 Pasajes Combi (Efectivo)",
            "🥪 Comidas en Escuela (Efectivo)",
            "📄 Copias, Material & Papelería",
            "🛡️ Imprevistos / Por si acaso",
            "🛡️ Excedente 80%: Fondo Emergencia / Moto",
            "🍕 Excedente 20%: Refuerzo Gustos / Salidas"
        ];
        const catPresupuestosBase = {
            "🚌 Pasajes Combi (Efectivo)": mCombi * numQ,
            "🥪 Comidas en Escuela (Efectivo)": mComida * numQ,
            "📄 Copias, Material & Papelería": mCopias * numQ,
            "🛡️ Imprevistos / Por si acaso": mImprevistos * numQ,
            "🛡️ Excedente 80%: Fondo Emergencia / Moto": motoPresupuesto,
            "🍕 Excedente 20%: Refuerzo Gustos / Salidas": gustosPresupuesto
        };

        catNombres.forEach(catName => {
            const gastoCat = mData.transacciones.filter(t =>
                (catName.includes("Pasajes") && t.categoria.includes("Pasajes")) ||
                (catName.includes("Comidas") && t.categoria.includes("Comidas")) ||
                (catName.includes("Copias") && t.categoria.includes("Copias")) ||
                (catName.includes("Imprevistos") && t.categoria.includes("Imprevistos")) ||
                (catName.includes("Excedente 80%") && t.categoria.includes("Excedente 80%")) ||
                (catName.includes("Excedente 20%") && t.categoria.includes("Excedente 20%"))
            ).reduce((sum, t) => sum + t.monto, 0);

            const presCat = catPresupuestosBase[catName] || 0;
            const remCat = Math.max(0, presCat - gastoCat);
            const pctCat = presCat > 0 ? ((gastoCat / presCat) * 100).toFixed(1) : 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-bold text-slate-900">${catName}</td>
                <td class="text-right ec-blue">${fmt(presCat)}</td>
                <td class="text-right ${gastoCat > 0 ? 'ec-red' : 'text-slate-400'}">${gastoCat > 0 ? '-' + fmt(gastoCat) : '$0.00'}</td>
                <td class="text-right ec-green">${fmt(remCat)}</td>
                <td class="text-center font-bold ${pctCat > 100 ? 'ec-red' : 'text-slate-800'}">${pctCat}%</td>
                <td class="text-center whitespace-nowrap">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${pctCat > 100 ? 'bg-red-100 text-red-900 border border-red-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}">
                        ${pctCat > 100 ? '🔴 Excedido' : '🟢 En Control'}
                    </span>
                </td>
            `;
            tbodyC.appendChild(tr);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECCIÓN h: RECOMENDACIÓN INTELIGENTE DE RETIRO Y FONDOS (COMPENSACIÓN)
    // ─────────────────────────────────────────────────────────────────────────
    if (tbodyCompensacion) {
        const baseQCombi = mCombi;
        const baseQComida = mComida;
        const baseQCopias = mCopias;
        const baseQImprevistos = mImprevistos;
        const baseQMoto = round2(motoPresupuesto / numQ);
        const baseQSalidas = round2(gustosPresupuesto / numQ);

        const catData = [
            {
                nombre: "🚌 Pasajes Combi (Efectivo)",
                tipo: "Efectivo Físico",
                isEfectivo: true,
                presBaseQ: baseQCombi,
                presTotal: baseQCombi * mData.num_quincenas,
                gasto: mData.transacciones.filter(t => t.categoria.includes("Pasajes")).reduce((s, t) => s + t.monto, 0)
            },
            {
                nombre: "🥪 Comidas en Escuela (Efectivo)",
                tipo: "Efectivo Físico",
                isEfectivo: true,
                presBaseQ: baseQComida,
                presTotal: baseQComida * mData.num_quincenas,
                gasto: mData.transacciones.filter(t => t.categoria.includes("Comidas")).reduce((s, t) => s + t.monto, 0)
            },
            {
                nombre: "📄 Copias, Material & Papelería",
                tipo: "Digital (Cajita Nu)",
                isEfectivo: false,
                presBaseQ: baseQCopias,
                presTotal: baseQCopias * mData.num_quincenas,
                gasto: mData.transacciones.filter(t => t.categoria.includes("Copias")).reduce((s, t) => s + t.monto, 0)
            },
            {
                nombre: "🛡️ Imprevistos / Por si acaso",
                tipo: "Digital (Cajita Nu)",
                isEfectivo: false,
                presBaseQ: baseQImprevistos,
                presTotal: baseQImprevistos * mData.num_quincenas,
                gasto: mData.transacciones.filter(t => t.categoria.includes("Imprevistos")).reduce((s, t) => s + t.monto, 0)
            },
            {
                nombre: "🛡️ Excedente 80%: Fondo Moto",
                tipo: "Inversión (Cajita Nu)",
                isEfectivo: false,
                presBaseQ: baseQMoto,
                presTotal: baseQMoto * mData.num_quincenas,
                gasto: 0
            },
            {
                nombre: "🍕 Excedente 20%: Refuerzo Salidas",
                tipo: "Digital / Débito Nu",
                isEfectivo: false,
                presBaseQ: baseQSalidas,
                presTotal: baseQSalidas * mData.num_quincenas,
                gasto: mData.transacciones.filter(t => t.categoria.includes("Excedente 20%")).reduce((s, t) => s + t.monto, 0)
            }
        ];

        let totSobranteEfectivoQ = 0;
        let totRetiroNetoEfectivoQ = 0;
        let totPresBaseEfectivoQ = 0;

        catData.forEach(item => {
            const sobranteTotal = Math.max(0, item.presTotal - item.gasto);
            const sobranteQ = Math.min(item.presBaseQ, round2(sobranteTotal / mData.num_quincenas));
            const montoNetoQ = (item.isEfectivo || item.nombre.includes("Copias") || item.nombre.includes("Imprevistos"))
                ? Math.max(0, item.presBaseQ - sobranteQ)
                : item.presBaseQ;
            const ahorroQ = item.presBaseQ - montoNetoQ;

            if (item.isEfectivo) {
                totPresBaseEfectivoQ += item.presBaseQ;
                totSobranteEfectivoQ += sobranteQ;
                totRetiroNetoEfectivoQ += montoNetoQ;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-bold text-slate-900">${item.nombre}</td>
                <td class="text-center font-semibold text-[10px] ${item.isEfectivo ? 'text-emerald-800' : 'text-indigo-800'}">${item.tipo}</td>
                <td class="text-right ec-blue">${fmt(item.presBaseQ)}</td>
                <td class="text-right ${item.gasto > 0 ? 'ec-red' : 'text-slate-400'}">${item.gasto > 0 ? '-' + fmt(item.gasto) : '$0.00'}</td>
                <td class="text-right font-black ec-green">${fmt(sobranteQ)}</td>
                <td class="text-right font-black ${item.isEfectivo ? 'text-emerald-700' : 'text-indigo-900'}">${fmt(montoNetoQ)}</td>
                <td class="text-right font-bold ${ahorroQ > 0 ? 'ec-green' : 'text-slate-400'}">${ahorroQ > 0 ? '+' + fmt(ahorroQ) : '$0.00'}</td>
            `;
            tbodyCompensacion.appendChild(tr);
        });

        // Detalle y recomendaciones específicas en el contenedor
        if (containerCompensacionDetalle) {
            const combiItem = catData[0];
            const comidaItem = catData[1];
            const copiasItem = catData[2];
            const impItem = catData[3];

            const sobCombi = Math.min(baseQCombi, round2(Math.max(0, combiItem.presTotal - combiItem.gasto) / mData.num_quincenas));
            const sobComida = Math.min(baseQComida, round2(Math.max(0, comidaItem.presTotal - comidaItem.gasto) / mData.num_quincenas));
            const sobCopias = Math.min(baseQCopias, round2(Math.max(0, copiasItem.presTotal - copiasItem.gasto) / mData.num_quincenas));
            const sobImp = Math.min(baseQImprevistos, round2(Math.max(0, impItem.presTotal - impItem.gasto) / mData.num_quincenas));

            const sacarCombi = Math.max(0, baseQCombi - sobCombi);
            const sacarComida = Math.max(0, baseQComida - sobComida);
            const fondearCopias = Math.max(0, baseQCopias - sobCopias);
            const fondearImp = Math.max(0, baseQImprevistos - sobImp);

            containerCompensacionDetalle.innerHTML = `
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-300 pb-2.5">
                    <div class="p-2 bg-white rounded-lg border border-slate-200">
                        <p class="text-[10px] text-slate-500 font-extrabold uppercase">Presupuesto Efectivo Base:</p>
                        <p class="text-base font-black text-slate-900 mt-0.5">${fmt(totPresBaseEfectivoQ)}</p>
                        <p class="text-[9px] text-slate-500">(${fmt(baseQCombi)} Combi + ${fmt(baseQComida)} Comidas)</p>
                    </div>
                    <div class="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                        <p class="text-[10px] text-emerald-800 font-extrabold uppercase">Sobrante que Tienes en Mano:</p>
                        <p class="text-base font-black text-emerald-700 mt-0.5">-${fmt(totSobranteEfectivoQ)}</p>
                        <p class="text-[9px] text-emerald-700">Ahorro de retiro físico</p>
                    </div>
                    <div class="p-2 bg-indigo-50 rounded-lg border border-indigo-300 shadow-sm">
                        <p class="text-[10px] text-indigo-900 font-extrabold uppercase">🏦 EFECTIVO NETO A RETIRAR ESTA QUINCENA:</p>
                        <p class="text-base font-black text-indigo-700 mt-0.5">${fmt(totRetiroNetoEfectivoQ)}</p>
                        <p class="text-[9px] text-indigo-700 font-bold">Monto exacto para el cajero</p>
                    </div>
                </div>
                <div class="space-y-1 pt-1 text-[11px] text-slate-700">
                    <p class="font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>💡</span>
                        <span>Instrucción Exacta de Retiro y Fondeo para el Próximo Día de Pago:</span>
                    </p>
                    <ul class="list-disc list-inside space-y-0.5 pl-1 text-[10.5px]">
                        <li><b>🚌 Pasajes Combi:</b> Retirar <b class="text-emerald-800">${fmt(sacarCombi)}</b> en cajero ${sobCombi > 0 ? `(en lugar de ${fmt(baseQCombi)}, porque ya cuentas con <b>${fmt(sobCombi)}</b> de remanente en mano)` : `(monto base completo)`}.</li>
                        <li><b>🥪 Comidas Escuela:</b> Retirar <b class="text-emerald-800">${fmt(sacarComida)}</b> en cajero ${sobComida > 0 ? `(en lugar de ${fmt(baseQComida)}, porque ya cuentas con <b>${fmt(sobComida)}</b> de remanente en mano)` : `(monto base completo)`}.</li>
                        <li><b>📄 Copias & Papelería:</b> Cuentas con <b>${fmt(sobCopias)}</b> resguardados en Cajita Nu ${fondearCopias > 0 ? `(solo requieres asignar <b>${fmt(fondearCopias)}</b> adicionales)` : `(saldo íntegro cubierto)`}.</li>
                        <li><b>🛡️ Imprevistos:</b> Cuentas con <b>${fmt(sobImp)}</b> resguardados en Cajita Nu ${fondearImp > 0 ? `(solo requieres asignar <b>${fmt(fondearImp)}</b> adicionales)` : `(saldo íntegro cubierto)`}.</li>
                    </ul>
                </div>
            `;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECCIÓN i: RESUMEN DE QUINCENAS CONSOLIDADAS
    // ─────────────────────────────────────────────────────────────────────────
    if (tbodyQ) {
        mData.quincenas.forEach(q => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-bold text-slate-900">${q.periodo}</td>
                <td class="text-center text-slate-600 font-medium">${q.fecha_cierre}</td>
                <td class="text-right ec-blue">${fmt(q.presupuesto)}</td>
                <td class="text-right text-slate-600">${fmt(q.gastos_fijos)}</td>
                <td class="text-right ec-red">${q.gasto_real > 0 ? '-' + fmt(q.gasto_real) : '$0.00'}</td>
                <td class="text-right ec-green">${fmt(q.remanente)}</td>
                <td class="text-right font-black text-indigo-900">${fmt(q.ahorro_moto_80)}</td>
                <td class="text-center font-semibold text-slate-700">${q.num_transacciones} reg.</td>
                <td class="text-center whitespace-nowrap no-print">
                    <button onclick="openDeleteCierreModal(${q.id})" class="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-[10px] font-bold transition">
                        Eliminar
                    </button>
                </td>
            `;
            tbodyQ.appendChild(tr);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECCIÓN i: BITÁCORA DETALLADA DE MOVIMIENTOS
    // ─────────────────────────────────────────────────────────────────────────
    if (tbodyM) {
        if (mData.transacciones.length === 0) {
            tbodyM.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-500 font-semibold">No se registraron gastos individuales en las quincenas archivadas.</td></tr>`;
        } else {
            mData.transacciones.forEach((tx, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="text-center font-bold text-slate-500">#${idx + 1}</td>
                    <td class="text-slate-800 font-medium whitespace-nowrap">${tx.fecha}</td>
                    <td class="font-bold text-slate-700 whitespace-nowrap">${tx.quincena || mData.mes_anio}</td>
                    <td class="font-bold text-slate-900">${tx.concepto}</td>
                    <td class="text-slate-600 text-[10px]">${tx.categoria}</td>
                    <td class="text-slate-600 text-[10px]">${tx.metodo}</td>
                    <td class="text-right font-black ec-red">-${fmt(tx.monto)}</td>
                `;
                tbodyM.appendChild(tr);
            });
        }
    }

    lucide.createIcons();
}

/**
 * Imprimir / Guardar PDF exclusivamente el Estado de Cuenta
 */
function printEstadoCuenta() {
    if (typeof switchTab === 'function') {
        switchTab('tab-estado-cuenta');
    }
    renderEstadoCuentaSeleccionado();

    const select = document.getElementById('select-mes-historial');
    const mesSeleccionado = select ? select.value : "";
    const mData = historialData?.meses?.find(m => m.mes_anio === mesSeleccionado);

    let fechaEstadoCuenta = "";
    if (mData?.quincenas && mData.quincenas.length > 0) {
        fechaEstadoCuenta = mData.quincenas[0].fecha_cierre || "";
    }
    if (!fechaEstadoCuenta) {
        const today = new Date();
        fechaEstadoCuenta = today.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    const fechaLimpia = fechaEstadoCuenta.replace(/\//g, '-');
    const periodoLimpio = (mesSeleccionado || 'Estado_Cuenta').replace(/\s+/g, '_');
    const originalTitle = document.title;
    document.title = `Estado_de_Cuenta_${periodoLimpio}_(${fechaLimpia})`;

    setTimeout(() => {
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 1000);
    }, 150);
}

/**
 * Helper: redondeo a 2 decimales.
 */
function round2(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}


