// =============================================================================
// FV 648 · Impuesto Temporal a los Activos Netos (ITAN) — declaraciones.html
// -----------------------------------------------------------------------------
// Réplica del Formulario Virtual 648 de "Mis declaraciones y pagos":
//   1. Información General: Periodo (casilla 007, año) y Tipo de declaración (895).
//   2. Información Complementaria: acogimiento a la opción de acreditación,
//      cooperativas y reorganización de sociedades (tipo en la casilla 828).
//   3. Reorganización de Sociedades: solo si se marcó "Si".
//   4. Determinación de la Base Imponible: activo neto al 31/12 del ejercicio
//      anterior menos las deducciones del Art. 5° de la Ley 28424.
//   5. Determinación de la Deuda: 0 % hasta S/ 1,000,000 y 0.4 % por el
//      exceso; pago al contado o en 9 cuotas (abril a diciembre).
// Al presentar se muestra la constancia (con NPS si hay importe a pagar).
// El avance se guarda solo por ejercicio con SimStore (sire_fv648_<año>) y se
// borra con "Reiniciar simulación". Se carga al final de declaraciones.html.
// =============================================================================
(function () {
    'use strict';

    const UMBRAL = 1000000;      // primer tramo (tasa 0 %)
    const TASA = 0.004;          // 0.4 % por el exceso
    const TIPOS_REORG = [
        '1 EMPRESA ABSORVENTE',
        '2 EMPRESA CONSTITUIDA POR EFECTO DE LA FUSION',
        '3 EMPRESA ADQUIRIENTE DE BLOQUES PATRIMONIALES DE EMPRESAS ESCINDIDAS',
        '4 EMPRESA NUEVA ADQUIRIENTE DE BLOQUES PATRIMONIALES EN UN PROCESO DE ESCISION',
        '5 EMPRESA ESCINDIDA NO EXTINGUIDA CEDENTE DE UNO O MAS BLOQUES PATRIMONIALES'
    ];
    const DEDUCCIONES = [
        ['d1', 'Acciones, participaciones o derechos de capital de otras empresas sujetas al ITAN'],
        ['d2', 'Encaje exigible y provisiones específicas por riesgo crediticio (sistema financiero)'],
        ['d3', 'Maquinarias y equipos con antigüedad no mayor a tres (3) años'],
        ['d4', 'Acciones de empresas que no han iniciado operaciones productivas'],
        ['d5', 'Otras deducciones (Art. 5° de la Ley N° 28424)']
    ];
    const PESTANAS = ['general', 'complementaria', 'reorg', 'base', 'deuda'];

    const $ = id => document.getElementById(id);
    const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; };
    const miles = n => Math.round(n).toLocaleString('en-US');
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    // ---------------------------------------------------------------- estilos
    const CSS = `
        #view-0648 .f648-titulo { background:#9b9b9b; color:#fff; font-size:20px; padding:10px 14px; display:flex; align-items:center; gap:8px; margin:18px 0 0; }
        #view-0648 .f648-titulo .fa-star { margin-left:auto; color:#ddd; }
        #view-0648 .f648-tabs { display:flex; flex-wrap:wrap; border-bottom:1px solid #ddd; margin-top:24px; }
        #view-0648 .f648-tab { padding:9px 14px; background:#f0f0f0; color:#999; cursor:pointer; text-align:center; line-height:1.3; border:1px solid transparent; border-bottom:none; font-size:15px; }
        #view-0648 .f648-tab.active { background:#fff; color:#333; font-weight:700; border-color:#ddd; margin-bottom:-1px; }
        #view-0648 .f648-tab.bloqueada { cursor:not-allowed; opacity:.55; }
        #view-0648 .f648-panel { padding:22px 0 10px; }
        #view-0648 .f648-fs { border:1px solid #ddd; border-radius:4px; padding:16px 22px 18px; margin:0 0 22px; }
        #view-0648 .f648-fs legend { color:#999; font-size:16px; padding:0 10px; }
        #view-0648 .f648-fila { display:flex; flex-wrap:wrap; align-items:center; gap:10px 18px; }
        #view-0648 .f648-preg { flex:1 1 300px; min-width:0; font-size:15px; color:#333; line-height:1.45; }
        #view-0648 .f648-sino { display:flex; gap:clamp(30px, 9vw, 120px); font-weight:700; flex-wrap:wrap; }
        #view-0648 .f648-sino label { cursor:pointer; display:flex; align-items:center; gap:4px; }
        #view-0648 .f648-par { display:flex; align-items:stretch; min-width:0; max-width:100%; }
        #view-0648 .f648-fs { min-width:0; max-width:100%; box-sizing:border-box; }
        #view-0648 .f648-cod { background:#ececec; border:1px solid #ccc; border-right:none; padding:6px 10px; color:#555; font-size:15px; min-width:44px; text-align:center; }
        #view-0648 .f648-par input, #view-0648 .f648-par select { border:1px solid #ccc; padding:6px 10px; font-size:14px; min-width:0; }
        #view-0648 .f648-par input[readonly] { background:#ececec; }
        #view-0648 .f648-par .help-circle { margin-left:6px; align-self:center; }
        #view-0648 .f648-nav { display:flex; justify-content:center; gap:8px; margin:24px 0 10px; }
        #view-0648 .f648-btn { background:#337ab7; color:#fff; border:none; border-radius:3px; padding:8px 14px; font-size:15px; cursor:pointer; }
        #view-0648 .f648-btn:hover { background:#286090; }
        #view-0648 .f648-btn.sec { background:#fff; color:#333; border:1px solid #ccc; }
        #view-0648 .f648-casilla { display:flex; flex-wrap:wrap; align-items:center; gap:8px 18px; padding:12px 4px; border-bottom:1px solid #f0f0f0; }
        #view-0648 .f648-casilla > label { flex:1 1 300px; font-size:14.5px; color:#333; }
        #view-0648 .f648-casilla .f648-par input { width:180px; text-align:right; }
        #view-0648 .f648-casilla.total > label { font-weight:700; }
        #view-0648 .f648-casilla.total input { font-weight:700; background:#d9ebf7 !important; }
        #view-0648 .f648-error { display:none; margin:12px 0 0; padding:9px 12px; background:#fdecea; border-left:4px solid #d32f2f; color:#8a1c1c; font-size:13.5px; }
        #view-0648 .f648-tabla { width:100%; border-collapse:collapse; font-size:14px; }
        #view-0648 .f648-tabla th, #view-0648 .f648-tabla td { border-bottom:1px solid #e5e5e5; padding:8px; text-align:left; }
        #view-0648 .f648-tabla input { width:100%; box-sizing:border-box; border:1px solid #ccc; padding:6px 8px; font-size:14px; }
        .f648-anios { position:absolute; z-index:60; background:#fff; border:1px solid #ccc; border-radius:4px; box-shadow:0 6px 16px rgba(0,0,0,.18); padding:10px 12px; width:250px; }
        .f648-anios .cab { display:flex; align-items:center; justify-content:space-between; font-weight:700; margin-bottom:8px; }
        .f648-anios .cab i { cursor:pointer; padding:4px 8px; }
        .f648-anios .rej { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; }
        .f648-anios .a { text-align:center; padding:10px 0; border-radius:4px; cursor:pointer; font-size:15px; }
        .f648-anios .a:hover { background:#eaf3fa; }
        .f648-anios .a.fuera { color:#aaa; }
        .f648-anios .a.off { color:#ccc; cursor:not-allowed; background:none; }
        .f648-anios .a.sel { background:#0b5cad; color:#fff; }
        #view-0648 .f648-const { border:1px solid #ddd; border-radius:4px; padding:20px 24px; font-size:14.5px; background:#fff; }
        #view-0648 .f648-const h3 { margin:0 0 14px; color:#1E395B; }
        #view-0648 .f648-const table { border-collapse:collapse; width:100%; max-width:720px; margin-top:10px; }
        #view-0648 .f648-const td, #view-0648 .f648-const th { border:1px solid #bbb; padding:6px 10px; }
        #view-0648 .f648-const th { background:#4BACC6; text-align:left; font-weight:normal; }
        body.modo-movil #view-0648 .f648-sino { gap:40px; min-width:0; }
        body.modo-movil #view-0648 .f648-tab { flex:1 1 30%; font-size:12px; padding:8px 4px; }
        body.modo-movil #view-0648 .f648-casilla .f648-par input { width:auto; flex:1 1 auto; }
        body.modo-movil #view-0648 .f648-par { flex:1 1 100%; }
    `;

    // ---------------------------------------------------------------- marcado
    const ayuda = txt => '<span class="help-circle" onclick="alert(\'' + txt.replace(/'/g, "\\'") + '\');"><i class="fas fa-question"></i></span>';
    const sino = (nombre, si) =>
        '<div class="f648-sino"><label>Si <input type="radio" name="' + nombre + '" value="si"' + (si ? ' checked' : '') + '></label>' +
        '<label>No <input type="radio" name="' + nombre + '" value="no"' + (si ? '' : ' checked') + '></label></div>';
    const casilla = (etq, id, solo, extra) =>
        '<div class="f648-casilla' + (extra || '') + '"><label for="f648-' + id + '">' + etq + '</label>' +
        '<div class="f648-par"><input type="text" id="f648-' + id + '" inputmode="numeric" placeholder="0"' + (solo ? ' readonly' : '') + '></div></div>';
    const nav = (ant, sig, txtSig) =>
        '<div class="f648-nav">' +
            (ant ? '<button type="button" class="f648-btn sec" data-f648-ir="' + ant + '"><i class="fas fa-chevron-left"></i> Anterior</button>' : '') +
            '<button type="button" class="f648-btn" data-f648-ir="' + sig + '">' + (txtSig || 'Siguiente <i class="fas fa-chevron-right"></i>') + '</button>' +
        '</div>';

    function html() {
        return '' +
        '<div id="view-0648" style="display:none;">' +
            '<div class="aviso-amarillo" style="margin:0 0 16px;"><span class="aviso-text"><strong>Sr. Contribuyente,</strong> luego de llenar el formulario, asegúrese de agregarlo a la <strong>bandeja</strong>.</span><i class="fas fa-check check"></i></div>' +
            '<div class="f648-titulo">Formulario virtual N° 648 – Impuesto Temporal a los Activos Netos. <i class="fas fa-question-circle"></i><i class="fas fa-star"></i></div>' +
            '<div class="f648-tabs">' +
                '<div class="f648-tab active" data-f648-tab="general">Información<br>General</div>' +
                '<div class="f648-tab" data-f648-tab="complementaria">Información<br>Complementaria</div>' +
                '<div class="f648-tab" data-f648-tab="reorg">Reorganización<br>de Sociedades</div>' +
                '<div class="f648-tab" data-f648-tab="base">Determinación de<br>la Base Imponible</div>' +
                '<div class="f648-tab" data-f648-tab="deuda">Determinación<br>de la Deuda</div>' +
            '</div>' +

            // 1) Información General
            '<div class="f648-panel" id="f648-p-general">' +
                '<div class="fieldset-row" style="display:flex;flex-wrap:wrap;gap:30px;">' +
                    '<fieldset class="f648-fs" style="flex:1 1 380px;"><legend>Periodo</legend>' +
                        '<div class="f648-fila" style="justify-content:center;"><strong style="font-size:16px;">Periodo:</strong>' +
                        '<div class="f648-par" style="position:relative;"><span class="f648-cod">007</span>' +
                        '<input type="text" id="f648-anio" placeholder="aaaa" readonly style="width:270px;max-width:55vw;background:#ececec;cursor:pointer;">' +
                        ayuda('Seleccione el ejercicio por el que declara el ITAN. La base imponible es el activo neto al 31 de diciembre del ejercicio anterior.') +
                        '<div class="f648-anios" id="f648-anios" style="display:none;top:38px;left:44px;"></div></div></div>' +
                    '</fieldset>' +
                    '<fieldset class="f648-fs" style="flex:1 1 380px;"><legend>Tipo de Declaración:</legend>' +
                        '<div class="f648-fila" style="justify-content:center;"><strong style="font-size:16px;">Declaración:</strong>' +
                        '<div class="f648-par"><span class="f648-cod">895</span><select id="f648-tipo" style="width:300px;max-width:55vw;">' +
                            '<option value="">Seleccione tipo de declaración</option><option value="original">Original</option>' +
                            '<option value="sustitutoria">Sustitutoria</option><option value="rectificatoria">Rectificatoria</option></select>' +
                        ayuda('Original: primera declaración del ejercicio. Sustitutoria o Rectificatoria: corrige una declaración ya presentada.') + '</div></div>' +
                    '</fieldset>' +
                '</div>' +
                '<p class="f648-error" id="f648-err-general"></p>' +
                nav(null, 'complementaria') +
            '</div>' +

            // 2) Información Complementaria
            '<div class="f648-panel" id="f648-p-complementaria" style="display:none;">' +
                '<fieldset class="f648-fs"><legend>Acogimiento de la opción de acreditación</legend>' +
                    '<div class="f648-fila"><div class="f648-preg">¿Usted ha presentado el Anexo aprobado con el reglamento ITAN?</div>' + sino('f648-acredita') + '</div></fieldset>' +
                '<fieldset class="f648-fs"><legend>Cooperativas</legend>' +
                    '<div class="f648-fila"><div class="f648-preg">¿Es una cooperativa y goza de inafectación o exoneración parciales del Impuesto a la Renta relativas o rentas obtenidas por operaciones propias de su actividad?</div>' + sino('f648-coop') + '</div></fieldset>' +
                '<fieldset class="f648-fs"><legend>Reorganización de Sociedades</legend>' +
                    '<div class="f648-fila" style="padding-bottom:16px;border-bottom:1px solid #eee;"><div class="f648-preg">¿Usted ha participado de un proceso de reorganización de sociedades entre el 01/01/<span class="f648-ej">2026</span> y la fecha de presentación de esta declaración?</div>' + sino('f648-reorg') + '</div>' +
                    '<div class="f648-fila" style="padding-top:16px;"><div class="f648-preg" style="flex:0 1 340px;">Tipo de Reorganización:</div>' +
                        '<div class="f648-par" style="flex:1 1 260px;"><span class="f648-cod">828</span><select id="f648-tipo-reorg" style="flex:1;min-width:0;" disabled>' +
                        '<option value="">Seleccione Tipo de Reorganización...</option>' + TIPOS_REORG.map(t => '<option>' + t + '</option>').join('') + '</select>' +
                        ayuda('Indique en qué calidad participó en la reorganización (fusión o escisión).') + '</div></div>' +
                '</fieldset>' +
                '<p class="f648-error" id="f648-err-complementaria"></p>' +
                nav('general', 'reorg') +
            '</div>' +

            // 3) Reorganización de Sociedades
            '<div class="f648-panel" id="f648-p-reorg" style="display:none;">' +
                '<p style="font-size:14.5px;color:#333;margin:0 0 12px;">Registre las empresas que participaron en la reorganización y el activo neto transferido (+ recibido / − entregado) que se considera para la base imponible.</p>' +
                '<div style="overflow-x:auto;"><table class="f648-tabla" style="min-width:640px;"><thead><tr><th style="width:150px;">RUC</th><th>Razón Social</th><th style="width:170px;">Fecha de entrada en vigencia</th><th style="width:170px;">Activo neto transferido S/</th><th style="width:40px;"></th></tr></thead><tbody id="f648-reorg-filas"></tbody></table></div>' +
                '<button type="button" class="f648-btn" id="f648-reorg-agregar" style="margin-top:12px;"><i class="fas fa-plus"></i> Agregar empresa</button>' +
                '<input type="hidden" id="f648-reorg-lista" value="[]">' +
                '<p class="f648-error" id="f648-err-reorg"></p>' +
                nav('complementaria', 'base') +
            '</div>' +

            // 4) Determinación de la Base Imponible
            '<div class="f648-panel" id="f648-p-base" style="display:none;">' +
                casilla('Total del activo neto según Balance General al 31/12/<span class="f648-ej-ant">2025</span>', 'activo') +
                casilla('Ajuste por reorganización de sociedades (pestaña anterior)', 'ajuste-reorg', true) +
                '<div style="font-weight:700;color:#333;padding:16px 4px 4px;">Deducciones (Art. 5° de la Ley N° 28424)</div>' +
                DEDUCCIONES.map(d => casilla(d[1], d[0])).join('') +
                casilla('Total deducciones', 'total-ded', true, ' total') +
                casilla('BASE IMPONIBLE', 'base', true, ' total') +
                '<p class="f648-error" id="f648-err-base"></p>' +
                nav('reorg', 'deuda') +
            '</div>' +

            // 5) Determinación de la Deuda
            '<div class="f648-panel" id="f648-p-deuda" style="display:none;">' +
                casilla('Base imponible', 'deuda-base', true) +
                casilla('Tramo hasta S/ 1,000,000 · tasa 0 %', 'tramo1', true) +
                casilla('Exceso de S/ 1,000,000 · tasa 0.4 %', 'tramo2', true) +
                casilla('IMPUESTO TEMPORAL A LOS ACTIVOS NETOS', 'itan', true, ' total') +
                '<div class="f648-casilla"><label>Forma de pago</label><div class="f648-sino" style="gap:30px;font-weight:normal;">' +
                    '<label><input type="radio" name="f648-forma" value="contado" checked> Al contado (abril)</label>' +
                    '<label><input type="radio" name="f648-forma" value="cuotas"> En 9 cuotas (abril a diciembre)</label></div></div>' +
                casilla('Monto de la cuota (o pago al contado)', 'cuota', true, ' total') +
                casilla('Importe a pagar', 'pagar') +
                '<p class="f648-error" id="f648-err-deuda"></p>' +
                nav('base', 'presentar', '<i class="fas fa-paper-plane"></i> Presentar') +
            '</div>' +

            // Constancia
            '<div class="f648-panel" id="f648-p-constancia" style="display:none;"></div>' +
        '</div>';
    }

    // ---------------------------------------------------------------- estado
    function ejercicio() { return (($('f648-anio') || {}).value || '').trim(); }
    function radio(n) { const r = document.querySelector('input[name="' + n + '"]:checked'); return r ? r.value : ''; }
    function setRadio(n, v) { document.querySelectorAll('input[name="' + n + '"]').forEach(r => { r.checked = r.value === v; }); }
    function error(panel, msg) {
        const p = $('f648-err-' + panel);
        if (!p) return !msg;
        p.textContent = msg || '';
        p.style.display = msg ? 'block' : 'none';
        return !msg;
    }

    function listaReorg() {
        try { const v = JSON.parse($('f648-reorg-lista').value || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
    }

    // ---------------------------------------------------------------- cálculo
    function calcular() {
        const ajuste = listaReorg().reduce((s, r) => s + num(r.monto), 0);
        const activo = num($('f648-activo').value);
        const ded = DEDUCCIONES.reduce((s, d) => s + num($('f648-' + d[0]).value), 0);
        const base = Math.max(0, activo + ajuste - ded);
        const tramo2 = Math.max(0, base - UMBRAL) * TASA;
        const itan = Math.round(tramo2);
        const cuota = radio('f648-forma') === 'cuotas' ? Math.round(itan / 9) : itan;
        const pon = (id, v) => { $('f648-' + id).value = miles(v); };
        pon('ajuste-reorg', ajuste); pon('total-ded', ded); pon('base', base);
        pon('deuda-base', base); pon('tramo1', 0); pon('tramo2', tramo2); pon('itan', itan); pon('cuota', cuota);
        const imp = document.getElementById('importe-total');
        if (imp && $('view-0648').style.display !== 'none') imp.textContent = 's/. ' + num($('f648-pagar').value).toFixed(2);
        return { activo: activo, ajuste: ajuste, ded: ded, base: base, itan: itan, cuota: cuota };
    }

    // ---------------------------------------------------------------- pestañas
    let actual = 'general';

    function reorgActiva() { return radio('f648-reorg') === 'si'; }

    function validar(p) {
        if (p === 'general') {
            if (!ejercicio()) return error('general', 'Seleccione el Periodo (año del ejercicio que declara).');
            if (!$('f648-tipo').value) return error('general', 'Seleccione el tipo de declaración (casilla 895).');
            return error('general', '');
        }
        if (p === 'complementaria') {
            if (reorgActiva() && !$('f648-tipo-reorg').value) return error('complementaria', 'Seleccione el Tipo de Reorganización (casilla 828).');
            return error('complementaria', '');
        }
        if (p === 'reorg') {
            const malas = listaReorg().filter(r => !/^(10|15|17|20)\d{9}$/.test(r.ruc || '') || !r.razon || !r.fecha);
            if (reorgActiva() && !listaReorg().length) return error('reorg', 'Agregue al menos una empresa que participó en la reorganización.');
            if (malas.length) return error('reorg', 'Revise las empresas: cada una necesita un RUC válido de 11 dígitos, la razón social y la fecha de entrada en vigencia.');
            return error('reorg', '');
        }
        if (p === 'base') {
            if (!num($('f648-activo').value)) return error('base', 'Ingrese el total del activo neto según el Balance General al 31/12 del ejercicio anterior.');
            return error('base', '');
        }
        if (p === 'deuda') {
            const c = calcular(), pagar = num($('f648-pagar').value);
            if (pagar > c.itan) return error('deuda', 'El importe a pagar no puede ser mayor que el ITAN determinado (S/ ' + miles(c.itan) + ').');
            return error('deuda', '');
        }
        return true;
    }

    function mostrar(p) {
        if (p === 'reorg' && !reorgActiva()) p = PESTANAS.indexOf(actual) > PESTANAS.indexOf('reorg') ? 'complementaria' : 'base';
        actual = p;
        PESTANAS.concat('constancia').forEach(t => { const el = $('f648-p-' + t); if (el) el.style.display = t === p ? 'block' : 'none'; });
        document.querySelectorAll('#view-0648 .f648-tab').forEach(t => {
            t.classList.toggle('active', t.getAttribute('data-f648-tab') === p);
            t.classList.toggle('bloqueada', t.getAttribute('data-f648-tab') === 'reorg' && !reorgActiva());
        });
        $('view-0648').querySelector('.f648-tabs').style.display = p === 'constancia' ? 'none' : 'flex';
        if (typeof actualizarStepper === 'function') actualizarStepper(p === 'constancia' ? 3 : 1);
        if (p === 'deuda' || p === 'base') calcular();
        guardar();
    }

    // Avanza validando las pestañas intermedias (como SUNAT)
    function ir(destino) {
        if (destino === 'presentar') return presentar();
        const di = PESTANAS.indexOf(destino), ai = PESTANAS.indexOf(actual);
        if (di > ai) {
            for (let i = ai; i < di; i++) {
                const p = PESTANAS[i];
                if (p === 'reorg' && !reorgActiva()) continue;
                if (!validar(p)) { mostrar(p); return; }
            }
        }
        mostrar(destino);
    }

    // ---------------------------------------------------------------- selector de año
    let decada = Math.floor(new Date().getFullYear() / 10) * 10;
    function pintarAnios() {
        const caja = $('f648-anios'), hoy = new Date().getFullYear(), sel = ejercicio();
        let celdas = '';
        for (let y = decada - 1; y <= decada + 10; y++) {
            const fuera = y < decada || y > decada + 9, off = y > hoy || y < 2005;
            celdas += '<div class="a' + (fuera ? ' fuera' : '') + (off ? ' off' : '') + (String(y) === sel ? ' sel' : '') + '" data-anio="' + (off ? '' : y) + '">' + y + '</div>';
        }
        caja.innerHTML = '<div class="cab"><i class="fas fa-chevron-left" data-dec="-10"></i><span>' + decada + '-' + (decada + 9) + '</span><i class="fas fa-chevron-right" data-dec="10"></i></div><div class="rej">' + celdas + '</div>';
    }

    function elegirAnio(y) {
        const antes = ejercicio();
        $('f648-anio').value = y;
        $('f648-anios').style.display = 'none';
        if (!$('f648-tipo').value) $('f648-tipo').value = 'original';
        document.querySelectorAll('#view-0648 .f648-ej').forEach(e => { e.textContent = y; });
        document.querySelectorAll('#view-0648 .f648-ej-ant').forEach(e => { e.textContent = y - 1; });
        if (String(y) !== antes) restaurar(String(y));
        error('general', '');
    }

    // ---------------------------------------------------------------- reorganización
    function pintarReorg() {
        const filas = listaReorg();
        $('f648-reorg-filas').innerHTML = filas.length ? filas.map((r, i) =>
            '<tr><td><input data-r="' + i + '" data-k="ruc" maxlength="11" inputmode="numeric" value="' + esc(r.ruc) + '" placeholder="RUC"></td>' +
            '<td><input data-r="' + i + '" data-k="razon" maxlength="100" value="' + esc(r.razon) + '" placeholder="RAZÓN SOCIAL" style="text-transform:uppercase;"></td>' +
            '<td><input data-r="' + i + '" data-k="fecha" type="date" value="' + esc(r.fecha) + '"></td>' +
            '<td><input data-r="' + i + '" data-k="monto" inputmode="numeric" value="' + esc(r.monto) + '" placeholder="0" style="text-align:right;"></td>' +
            '<td><i class="fas fa-trash" data-quitar="' + i + '" title="Quitar" style="cursor:pointer;"></i></td></tr>').join('')
            : '<tr><td colspan="5" style="color:#777;">No hay registros disponibles</td></tr>';
    }
    function guardarReorg(arr) { $('f648-reorg-lista').value = JSON.stringify(arr); calcular(); guardar(); }

    // ---------------------------------------------------------------- presentar / constancia
    function rucActivo() {
        try { if (typeof rucDeclarante === 'function' && rucDeclarante()) return rucDeclarante(); } catch (e) {}
        try { return (JSON.parse(sessionStorage.getItem('sunat_empresa') || 'null') || {}).ruc || ''; } catch (e) { return ''; }
    }
    function razonActiva() {
        try { const e = JSON.parse(sessionStorage.getItem('sunat_empresa') || 'null'); if (e && e.razon_social) return e.razon_social; } catch (e) {}
        const s = document.querySelector('.user-info-right span');
        return s ? s.textContent.replace('Bienvenido,', '').trim() : '';
    }

    function presentar() {
        for (const p of PESTANAS) {
            if (p === 'reorg' && !reorgActiva()) continue;
            if (!validar(p)) { mostrar(p); return; }
        }
        const c = calcular();
        const pagar = num($('f648-pagar').value);
        const hoy = new Date();
        const f = d => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
        const orden = String(Math.floor(Math.random() * 9e9) + 1e9);
        const nps = pagar > 0 ? '0004' + String(Math.floor(Math.random() * 1e9)).padStart(9, '0') : '';
        const cuotas = radio('f648-forma') === 'cuotas';
        const tipo = $('f648-tipo').options[$('f648-tipo').selectedIndex].text;

        $('f648-p-constancia').innerHTML =
            '<div class="f648-const" id="f648-const-doc">' +
                '<h3>Constancia de Presentación - Formulario 0648</h3>' +
                '<p><strong>Número de Orden:</strong> ' + orden + ' &nbsp; · &nbsp; <strong>Fecha de presentación:</strong> ' + f(hoy) + ' ' + hoy.toLocaleTimeString('es-PE', { hour12: false }) + '</p>' +
                '<p><strong>RUC:</strong> ' + esc(rucActivo() || '-') + ' &nbsp; · &nbsp; <strong>Razón Social:</strong> ' + esc(razonActiva()) + '</p>' +
                '<p><strong>Periodo:</strong> ' + esc(ejercicio()) + ' &nbsp; · &nbsp; <strong>Tipo de declaración:</strong> ' + esc(tipo) + '</p>' +
                '<table><tr><th>Concepto</th><th style="text-align:right;">S/</th></tr>' +
                    '<tr><td>Activo neto al 31/12/' + (ejercicio() - 1) + '</td><td style="text-align:right;">' + miles(c.activo) + '</td></tr>' +
                    (c.ajuste ? '<tr><td>Ajuste por reorganización</td><td style="text-align:right;">' + miles(c.ajuste) + '</td></tr>' : '') +
                    '<tr><td>Deducciones</td><td style="text-align:right;">(' + miles(c.ded) + ')</td></tr>' +
                    '<tr><td>Base imponible</td><td style="text-align:right;">' + miles(c.base) + '</td></tr>' +
                    '<tr><td><strong>ITAN (0.4 % del exceso de S/ 1,000,000)</strong></td><td style="text-align:right;"><strong>' + miles(c.itan) + '</strong></td></tr>' +
                    '<tr><td>Forma de pago</td><td style="text-align:right;">' + (cuotas ? '9 cuotas de ' + miles(c.cuota) : 'Al contado') + '</td></tr>' +
                    '<tr><td>Importe pagado / a pagar con esta declaración</td><td style="text-align:right;">' + miles(pagar) + '</td></tr>' +
                '</table>' +
                (nps ? '<p style="margin-top:14px;"><strong>Número de Pago SUNAT (NPS):</strong> ' + nps + '. Págalo en bancos, agentes o banca por internet. <strong>IMPORTANTE:</strong> este documento no es una constancia de pago.</p>' : '') +
                (c.itan === 0 ? '<p style="margin-top:14px;color:#2e7d32;">La base imponible no supera S/ 1,000,000: no hay ITAN por pagar.</p>' : '') +
                '<p style="margin-top:14px;color:#555;">Lo pagado por ITAN se puede usar como crédito contra el Impuesto a la Renta en el FV 710 (casilla 131 - Pagos del ITAN).</p>' +
            '</div>' +
            '<div class="f648-nav"><button type="button" class="f648-btn sec" id="f648-imprimir"><i class="fas fa-print"></i> Imprimir</button>' +
            '<button type="button" class="f648-btn" id="f648-nueva"><i class="fas fa-chevron-left"></i> Volver al formulario</button></div>';
        const imp = document.getElementById('importe-total');
        if (imp) imp.textContent = 's/. 0.00';
        mostrar('constancia');
        window.scrollTo(0, 0);
    }

    function imprimirConstancia() {
        const doc = $('f648-const-doc');
        if (!doc) return;
        const w = window.open('', '_blank', 'width=900,height=700');
        if (!w) { window.print(); return; }
        w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Constancia 0648</title><style>body{font:14px Arial,sans-serif;padding:24px;color:#000}table{border-collapse:collapse;width:100%;max-width:720px}td,th{border:1px solid #999;padding:6px 10px}th{background:#4BACC6;text-align:left;font-weight:normal}h3{margin-top:0}</style></head><body>' + doc.innerHTML + '</body></html>');
        w.document.close();
        w.focus();
        setTimeout(() => w.print(), 300);
    }

    // ---------------------------------------------------------------- guardado del avance
    const CAMPOS = ['f648-tipo', 'f648-tipo-reorg', 'f648-reorg-lista', 'f648-activo', 'f648-pagar'].concat(DEDUCCIONES.map(d => 'f648-' + d[0]));
    const RADIOS = ['f648-acredita', 'f648-coop', 'f648-reorg', 'f648-forma'];
    const clave = y => 'sire_fv648_' + y;

    function leer(k) {
        try { const v = window.SimStore ? SimStore.getItem(k) : localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; }
    }
    function guardar() {
        const y = ejercicio();
        if (!y) return;
        const d = { valores: {}, radios: {}, pestana: actual === 'constancia' ? 'deuda' : actual };
        CAMPOS.forEach(id => { d.valores[id] = $(id).value; });
        RADIOS.forEach(n => { d.radios[n] = radio(n); });
        try {
            const v = JSON.stringify(d);
            if (window.SimStore) SimStore.setItem(clave(y), v); else localStorage.setItem(clave(y), v);
        } catch (e) { /* almacenamiento no disponible */ }
    }
    function restaurar(y) {
        const d = leer(clave(y));
        if (!d) return;
        Object.entries(d.valores || {}).forEach(([id, v]) => { if ($(id)) $(id).value = v; });
        Object.entries(d.radios || {}).forEach(([n, v]) => { if (v) setRadio(n, v); });
        aplicarReorg();
        pintarReorg();
        calcular();
    }

    function aplicarReorg() {
        const si = reorgActiva(), sel = $('f648-tipo-reorg');
        sel.disabled = !si;
        sel.style.background = si ? '#fff' : '#ececec';
        if (!si) sel.value = '';
        document.querySelectorAll('#view-0648 .f648-tab').forEach(t => {
            if (t.getAttribute('data-f648-tab') === 'reorg') t.classList.toggle('bloqueada', !si);
        });
    }

    // ---------------------------------------------------------------- montaje
    function montar() {
        const ref = $('view-1611');
        if (!ref || $('view-0648')) return;
        const st = document.createElement('style');
        st.textContent = CSS;
        document.head.appendChild(st);
        ref.insertAdjacentHTML('afterend', html());
        const v = $('view-0648');

        v.addEventListener('click', e => {
            const t = e.target;
            const tab = t.closest('[data-f648-tab]'), irA = t.closest('[data-f648-ir]');
            if (tab) {
                const p = tab.getAttribute('data-f648-tab');
                if (p === 'reorg' && !reorgActiva()) return;
                ir(p);
            } else if (irA) ir(irA.getAttribute('data-f648-ir'));
            else if (t.id === 'f648-anio') { pintarAnios(); $('f648-anios').style.display = 'block'; e.stopPropagation(); }
            else if (t.closest('#f648-anios')) {
                e.stopPropagation();
                const dec = t.getAttribute('data-dec'), a = t.getAttribute('data-anio');
                if (dec) { decada += parseInt(dec, 10); pintarAnios(); }
                else if (a) elegirAnio(parseInt(a, 10));
            }
            else if (t.closest('#f648-reorg-agregar')) { const arr = listaReorg(); arr.push({ ruc: '', razon: '', fecha: '', monto: '' }); guardarReorg(arr); pintarReorg(); }
            else if (t.closest('[data-quitar]')) { const arr = listaReorg(); arr.splice(parseInt(t.getAttribute('data-quitar'), 10), 1); guardarReorg(arr); pintarReorg(); }
            else if (t.closest('#f648-imprimir')) imprimirConstancia();
            else if (t.closest('#f648-nueva')) mostrar('deuda');
        });
        document.addEventListener('click', () => { const a = $('f648-anios'); if (a) a.style.display = 'none'; });

        v.addEventListener('input', e => {
            const t = e.target;
            if (t.matches('.f648-casilla input:not([readonly])')) t.value = t.value.replace(/[^0-9]/g, '');
            if (t.matches('#f648-reorg-filas input')) {
                const arr = listaReorg(), i = parseInt(t.getAttribute('data-r'), 10), k = t.getAttribute('data-k');
                if (k === 'ruc') t.value = t.value.replace(/\D/g, '');
                if (k === 'monto') t.value = t.value.replace(/[^0-9\-]/g, '');
                if (arr[i]) { arr[i][k] = k === 'razon' ? t.value.toUpperCase().replace(/,/g, ' ') : t.value; guardarReorg(arr); }
                return;
            }
            calcular();
            guardar();
        });
        v.addEventListener('change', e => {
            if (e.target.name === 'f648-reorg') aplicarReorg();
            calcular();
            guardar();
        });
        v.addEventListener('focusout', e => {
            const t = e.target;
            if (t.matches('.f648-casilla input:not([readonly])') && t.value) t.value = miles(num(t.value));
        });
        v.addEventListener('focusin', e => {
            const t = e.target;
            if (t.matches('.f648-casilla input:not([readonly])')) t.value = t.value.replace(/,/g, '');
        });

        // El menú lateral abre el FV 648
        const enlace = Array.from(document.querySelectorAll('.decl-tree a')).find(a => /Activos Netos - 0648/.test(a.textContent));
        if (enlace) {
            enlace.removeAttribute('onclick');
            enlace.parentElement.id = 'leaf-0648';
            enlace.addEventListener('click', e => { e.preventDefault(); if (typeof mostrarVista === 'function') mostrarVista('0648'); });
        }
        if (typeof window.mostrarVista === 'function') {
            const original = window.mostrarVista;
            window.mostrarVista = function (codigo) {
                const r = original.apply(this, arguments);
                v.style.display = codigo === '0648' ? 'block' : 'none';
                if (codigo === '0648') { mostrar(actual === 'constancia' ? 'general' : actual); window.scrollTo(0, 0); }
                return r;
            };
        }

        aplicarReorg();
        pintarReorg();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
    else montar();
})();
