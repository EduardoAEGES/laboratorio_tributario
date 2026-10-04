// =============================================================================
// FV 710 · Información Complementaria: pestañas ITAN y NIIF
// -----------------------------------------------------------------------------
// ITAN: "¿Ha presentado el Formulario Virtual - PDT 648 del ITAN?"
//   · Si  -> la casilla 131 (Pagos del ITAN) se pone verde y abre su detalle
//            por mes (abril del ejercicio a junio del siguiente).
//   · No  -> la casilla 131 queda gris, en cero y sin detalle.
//   La 131 se aplica contra el saldo de la casilla 506: lo que alcanza baja la
//   deuda de la casilla 139 y lo que sobra va a la casilla 279 (Saldo del ITAN
//   no aplicado como crédito). El cálculo vive en calculateCreditos() y
//   calculateDeuda() de dashboard.html.
// NIIF: normas contables que usa la empresa, fecha de transición y año de
//   adecuación, como en el formulario de SUNAT.
// Todo queda en campos del formulario, así viaja con el guardado automático
// del avance (fv710_movil.js). Se carga al final de dashboard.html.
// =============================================================================
(function () {
    'use strict';

    const ESTILO_GRIS = 'background-color: #f5f5f5 !important; border: 1px solid #ccc !important;';

    // ------------------------------------------------------------ marcado
    function botonesNav(anterior, siguiente) {
        return '<div style="display:flex;justify-content:center;gap:18px;margin-top:28px;">' +
            '<button type="button" class="btn-prev-sunat" data-ir="' + anterior + '" style="padding:8px 14px;border:1px solid #999;background:#fff;border-radius:4px;cursor:pointer;font-size:15px;"><i class="fas fa-chevron-left"></i> Anterior</button>' +
            '<button type="button" class="btn-next-blue" data-ir="' + siguiente + '" style="padding:8px 14px;border:none;background:#0b5cad;color:#fff;border-radius:4px;cursor:pointer;font-size:15px;">Siguiente <i class="fas fa-chevron-right"></i></button>' +
            '</div>';
    }

    const HTML_ITAN =
        '<div class="informativa-content-area" id="inf-comp-itan-content" style="display:none;padding:30px 20px;">' +
            '<div style="display:flex;flex-wrap:wrap;gap:20px 60px;align-items:flex-start;font-size:15px;color:#333;">' +
                '<div style="flex:1 1 360px;max-width:680px;line-height:1.5;">¿Ha presentado el Formulario Virtual - PDT 648 del Impuesto Temporal a los Activos Netos - ITAN ?</div>' +
                '<div style="display:flex;flex-direction:column;gap:12px;">' +
                    '<label style="cursor:pointer;"><input type="radio" name="itan-presento" value="si" style="margin-right:8px;">Si</label>' +
                    '<label style="cursor:pointer;"><input type="radio" name="itan-presento" value="no" checked style="margin-right:8px;">No</label>' +
                '</div>' +
            '</div>' +
            '<p id="itan-ayuda" style="display:none;margin:18px 0 0;padding:10px 14px;background:#e8f5e9;border-left:4px solid #43a047;font-size:13px;color:#2e5e31;">' +
                'Se habilitó la casilla <strong>131 - Pagos del ITAN</strong> en <em>Sección Determinativa &rsaquo; Cred. Contra Imp. Renta</em>. ' +
                'Haz clic en ella para registrar lo pagado cada mes.</p>' +
            '<input type="hidden" id="itan-131-detalle" value="">' +
            botonesNav('constructoras', 'niif') +
        '</div>';

    function opcionesAnios() {
        let html = '<option value="">--Seleccionar--</option>';
        for (let y = 2026; y >= 2000; y--) html += '<option value="' + y + '">' + y + '</option>';
        return html;
    }

    const NORMAS = [
        ['completas', 'Normas Internacionales de Información Financiera - NIIF Completas.'],
        ['pyme', 'Norma Internacional de Información Financiera para Pequeñas y Medianas Entidades - NIIF para las PYME.'],
        ['npif', 'Norma Peruana de Información Financiera para las Microempresas - NPIF para Microempresas.'],
        ['noaplica', 'No aplica las NIIF.']
    ];

    const HTML_NIIF =
        '<div class="informativa-content-area" id="inf-comp-niif-content" style="display:none;padding:26px 20px;font-size:15px;color:#333;">' +
            '<p style="font-weight:bold;margin:0 0 10px;">1. ¿Cuáles son las normas contables que utiliza para registrar los hechos económicos, elaborar y presentar sus Estados Financieros? (a)</p>' +
            NORMAS.map(n => '<label style="display:block;margin:0 0 8px 20px;cursor:pointer;"><input type="radio" name="niif-norma" value="' + n[0] + '" style="margin-right:8px;">' + n[1] + '</label>').join('') +
            '<p style="font-weight:bold;margin:18px 0 6px;line-height:1.6;">(a) Resolución del Consejo Normativo de Contabilidad N° 003-2020-EF/30,<br>' +
                'Resolución del Consejo Normativo de Contabilidad N° 003-2022-EF/30,<br>' +
                'Resolución del Consejo Normativo de Contabilidad N° 001-2024-EF/30</p>' +
            '<div id="niif-pregunta-2">' +
                '<p style="font-weight:bold;margin:20px 0 12px;">2. ¿Cuál es la fecha en la que por primera vez adoptó la aplicación de las NIIF? NIIF 1 Adopción por Primera Vez de las NIIF.</p>' +
                '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px 30px;margin:0 0 12px 20px;">' +
                    '<label for="niif-fecha" style="width:300px;max-width:100%;">Fecha de transición a las NIIF:</label>' +
                    '<input type="date" id="niif-fecha" style="width:320px;max-width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:4px;font-size:15px;">' +
                '</div>' +
                '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px 30px;margin:0 0 0 20px;">' +
                    '<label for="niif-anio" style="width:300px;max-width:100%;">Año de adecuación a las NIIF:</label>' +
                    '<select id="niif-anio" style="width:320px;max-width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:4px;font-size:15px;">' + opcionesAnios() + '</select>' +
                '</div>' +
            '</div>' +
            botonesNav('itan', 'determinativa') +
        '</div>';

    const HTML_MODAL_131 =
        '<div id="modal131" class="modal-overlay" style="display:none;z-index:2500;">' +
            '<div class="modal-content" style="width:560px;">' +
                '<div class="modal-header"><span>Detalle de la Casilla 131</span>' +
                    '<i class="fas fa-times" data-m131="cerrar" style="cursor:pointer;"></i></div>' +
                '<div class="modal-body" style="padding:22px 36px;max-height:65vh;overflow-y:auto;">' +
                    '<p style="color:#333;font-size:17px;margin:0 0 16px;">Pagos del ITAN (No incluir monto compensado contra pagos a cta. de Rta.)</p>' +
                    '<div style="display:flex;margin-bottom:10px;font-size:14px;color:#444;">' +
                        '<div style="flex:1;">Mes en el que se efectuó el pago</div><div style="width:200px;">Monto Pagado</div></div>' +
                    '<div id="m131-filas"></div>' +
                    '<div style="display:flex;align-items:center;margin-top:16px;">' +
                        '<div style="flex:1;font-size:15px;color:#333;padding-left:50px;">Total casilla 131</div>' +
                        '<div class="currency-input highlight-blue" style="width:200px;height:36px;background:#e3f2fd !important;border:1px solid #90caf9;">' +
                            '<span>S/ </span><input type="text" id="m131-total" value="0" readonly style="text-align:right;background:transparent;font-weight:bold;"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer" style="justify-content:flex-end;gap:10px;padding:14px 36px;">' +
                    '<button type="button" class="btn-modal-cancel" data-m131="cerrar">Cancelar</button>' +
                    '<button type="button" class="btn-modal-save" data-m131="guardar">Guardar</button>' +
                '</div>' +
            '</div>' +
        '</div>';

    // ------------------------------------------------------------ utilidades
    const $ = id => document.getElementById(id);
    const numero = v => { const n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; };
    const miles = n => Math.round(n).toLocaleString('en-US');

    function ejercicio() {
        try { return parseInt(currentEjercicio, 10) || 2025; } catch (e) { return 2025; }
    }

    // Abril del ejercicio a junio del ejercicio siguiente (como en SUNAT)
    function mesesITAN() {
        const y = ejercicio(), out = [];
        for (let m = 4; m <= 12; m++) out.push(String(m).padStart(2, '0') + '-' + y);
        for (let m = 1; m <= 6; m++) out.push(String(m).padStart(2, '0') + '-' + (y + 1));
        return out;
    }

    function leerDetalle() {
        try { return JSON.parse(($('itan-131-detalle') || {}).value || '{}') || {}; } catch (e) { return {}; }
    }

    function presentoITAN() {
        const r = document.querySelector('input[name="itan-presento"]:checked');
        return !!(r && r.value === 'si');
    }

    function recalcular() {
        try { if (typeof recalcularDeterminativa710 === 'function') recalcularDeterminativa710(); else calculateCreditos(); } catch (e) {}
    }

    function avisarCambio(el) {
        // Para que el guardado automático (fv710_movil.js) registre el cambio
        if (el) el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // ------------------------------------------------------------ casilla 131
    function cajaC131() {
        const inp = $('cr-131');
        return inp ? inp.parentElement : null;
    }

    function aplicarEstadoITAN() {
        const caja = cajaC131(), inp = $('cr-131');
        if (!caja || !inp) return;
        const si = presentoITAN();
        const ayuda = $('itan-ayuda');
        if (ayuda) ayuda.style.display = si ? 'block' : 'none';
        if (si) {
            caja.classList.add('highlight-green');
            caja.setAttribute('style', 'cursor: pointer;');
            inp.style.cursor = 'pointer';
            caja.title = 'Clic para registrar los pagos del ITAN';
        } else {
            caja.classList.remove('highlight-green');
            caja.setAttribute('style', ESTILO_GRIS);
            inp.style.cursor = 'not-allowed';
            caja.title = 'Se habilita al marcar "Si" en Información Complementaria > ITAN';
            if (numero(inp.value) !== 0 || ($('itan-131-detalle') || {}).value) {
                inp.value = '0';
                $('itan-131-detalle').value = '';
                recalcular();
            }
        }
    }

    function abrirModal131() {
        if (!presentoITAN()) {
            alert('Para registrar los pagos del ITAN, primero marque "Si" en Sección Informativa > Información Complementaria > ITAN.');
            return;
        }
        const det = leerDetalle();
        $('m131-filas').innerHTML = mesesITAN().map((mes, i) =>
            '<div style="display:flex;align-items:center;margin-bottom:10px;">' +
                '<div style="flex:1;font-size:15px;color:#333;padding-left:90px;">' + mes + '</div>' +
                '<div class="currency-input" style="width:200px;height:38px;">' +
                    '<input type="text" inputmode="numeric" class="m131-monto" data-mes="' + mes + '" id="m131-' + i + '" value="' +
                    (det[mes] ? miles(det[mes]) : '') + '" placeholder="0" style="text-align:right;">' +
                    '<span style="margin-left:6px;">S/</span></div>' +
            '</div>').join('');
        totalModal();
        $('modal131').style.display = 'flex';
    }

    function totalModal() {
        let t = 0;
        document.querySelectorAll('#m131-filas .m131-monto').forEach(i => { t += numero(i.value); });
        $('m131-total').value = miles(t);
        return t;
    }

    function guardarModal131() {
        const det = {};
        let total = 0;
        document.querySelectorAll('#m131-filas .m131-monto').forEach(i => {
            const v = Math.round(numero(i.value));
            if (v < 0) return;
            if (v) { det[i.getAttribute('data-mes')] = v; total += v; }
        });
        $('itan-131-detalle').value = Object.keys(det).length ? JSON.stringify(det) : '';
        $('cr-131').value = miles(total);
        recalcular();
        avisarCambio($('cr-131'));
        cerrarModal131();
    }

    function cerrarModal131() {
        const m = $('modal131');
        if (m) m.style.display = 'none';
    }

    // ------------------------------------------------------------ pestañas
    function sincronizarPestanas() {
        const activa = document.querySelector('.infcomp-tab-item.active');
        const tab = activa ? activa.id.replace('infcomp-tab-', '') : 'general';
        const propias = { itan: 'inf-comp-itan-content', niif: 'inf-comp-niif-content', socios: 'inf-comp-socios-content', alquileres: 'inf-comp-alquileres-content' };
        Object.keys(propias).forEach(t => {
            const el = $(propias[t]);
            if (el) el.style.display = tab === t ? 'block' : 'none';
        });
        const otros = $('inf-comp-others-content');
        if (otros && propias[tab]) otros.style.display = 'none';
        if (tab === 'socios' && window.FV710Socios) FV710Socios.pintar();
        if (tab === 'alquileres' && window.FV710Alquileres) FV710Alquileres.pintar();
    }

    // "No aplica las NIIF": la pregunta 2 sigue a la vista pero gris y bloqueada (como en SUNAT)
    function aplicarNIIF() {
        const r = document.querySelector('input[name="niif-norma"]:checked');
        const bloquear = !!(r && r.value === 'noaplica');
        ['niif-fecha', 'niif-anio'].forEach(id => {
            const el = $(id);
            if (!el) return;
            el.disabled = bloquear;
            el.style.background = bloquear ? '#b5b5b5' : '#fff';
            el.style.cursor = bloquear ? 'not-allowed' : '';
            if (bloquear && el.value) { el.value = ''; avisarCambio(el); }
        });
    }

    function ir(destino) {
        if (destino === 'determinativa') {
            if (typeof showDeterminativaMessage === 'function') showDeterminativaMessage();
            else if (typeof switchSection === 'function') switchSection('determinativa');
            return;
        }
        if (typeof switchInfComp === 'function') switchInfComp(destino);
        const area = $('complementaria-content-area');
        if (area) area.scrollIntoView({ block: 'start' });
    }

    // ------------------------------------------------------------ montaje
    function montar() {
        const otros = $('inf-comp-others-content');
        if (!otros || $('inf-comp-itan-content')) return;
        otros.insertAdjacentHTML('afterend', HTML_ITAN + HTML_NIIF);
        document.body.insertAdjacentHTML('beforeend', HTML_MODAL_131);

        // Pestañas
        if (typeof window.switchInfComp === 'function') {
            const original = window.switchInfComp;
            window.switchInfComp = function () {
                const r = original.apply(this, arguments);
                sincronizarPestanas();
                return r;
            };
        }
        if (typeof window.switchSection === 'function') {
            const original = window.switchSection;
            window.switchSection = function () {
                const r = original.apply(this, arguments);
                sincronizarPestanas();
                return r;
            };
        }

        // Botones Anterior / Siguiente de ITAN y NIIF
        ['inf-comp-itan-content', 'inf-comp-niif-content'].forEach(id => {
            $(id).addEventListener('click', e => {
                const b = e.target.closest('button[data-ir]');
                if (b) ir(b.getAttribute('data-ir'));
            });
        });

        // Opciones (también responden cuando el guardado automático las restaura)
        document.querySelectorAll('input[name="itan-presento"]').forEach(r => r.addEventListener('change', aplicarEstadoITAN));
        document.querySelectorAll('input[name="niif-norma"]').forEach(r => r.addEventListener('change', aplicarNIIF));

        // Casilla 131
        const caja = cajaC131();
        if (caja) caja.addEventListener('click', abrirModal131);

        // Ventana de detalle
        const modal = $('modal131');
        modal.addEventListener('click', e => {
            const b = e.target.closest('[data-m131]');
            if (!b) return;
            if (b.getAttribute('data-m131') === 'guardar') guardarModal131(); else cerrarModal131();
        });
        modal.addEventListener('input', e => {
            if (e.target.classList.contains('m131-monto')) {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                totalModal();
            }
        });
        modal.addEventListener('focusout', e => {
            if (e.target.classList.contains('m131-monto') && e.target.value) e.target.value = miles(numero(e.target.value));
        });

        aplicarEstadoITAN();
        aplicarNIIF();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
    else montar();
})();
