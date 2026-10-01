/* sire_constancias.js - Constancias de Recepción del SIRE (RVIE / RCE) y cierre
 * de la simulación.
 *
 * Flujo:
 *   1. Al aceptar la propuesta, rvie.js / rce.js llaman guardarSnapshot() con los
 *      comprobantes aceptados (incluye lo que el alumno haya agregado o corregido).
 *   2. Al generar los registros, rvie.js llama registrarGeneracion(): se crea una
 *      constancia por registro con correlativo, fecha y totales.
 *   3. En "Información de Gestión > Constancias de Recepción" renderPanel() lista
 *      las constancias y "Ver Constancia" descarga el PDF (formato SUNAT).
 *   4. "Terminar simulación" muestra mostrarCierre(): tres caminos de salida.
 *
 * Todo se guarda con SimStore (claves sire_*), así que va por usuario + RUC.
 * Se carga en rvie.html y rce.html ANTES de rvie.js / rce.js.
 */
(function () {
    'use strict';

    const CLAVE_SNAP  = 'sire_constancia_snap';   // totales de la propuesta aceptada, por registro
    const CLAVE_LISTA = 'sire_constancias';       // constancias generadas
    const CLAVE_CORR  = 'sire_constancia_corr';   // último correlativo usado

    function leerJSON(clave, def) {
        try {
            const v = window.SimStore ? SimStore.getItem(clave) : sessionStorage.getItem(clave);
            return v ? JSON.parse(v) : def;
        } catch (e) { return def; }
    }
    function guardarJSON(clave, valor) {
        try {
            const v = JSON.stringify(valor);
            if (window.SimStore) SimStore.setItem(clave, v); else sessionStorage.setItem(clave, v);
        } catch (e) { /* sin almacenamiento: se pierde al recargar */ }
    }

    // ------------------------------------------------------------ datos base
    /** Empresa elegida en la Clave SOL (puerta 2). */
    function empresa() {
        let e = null;
        try { e = JSON.parse(sessionStorage.getItem('sunat_empresa') || 'null'); } catch (err) {}
        const ruc = (e && e.ruc) || (window.SimStore && SimStore.rucActivo && SimStore.rucActivo()) || '';
        return { ruc: String(ruc || ''), razon: (e && (e.razon_social || e.razonSocial)) || '' };
    }

    /** Persona que hace la simulación: el nombre que escribió en la Clave SOL (o USER). */
    function persona() {
        let u = {};
        try { u = JSON.parse(sessionStorage.getItem('sunat_auth') || '{}') || {}; } catch (e) {}
        let estudiante = '';
        try { estudiante = (sessionStorage.getItem('taxlab_estudiante') || '').trim(); } catch (e) {}
        return {
            nombre: estudiante || 'USER',
            usuario: u.usuario || '',
            rol: u.rol || ''
        };
    }

    /** Recuerda desde qué aplicativo se aceptó la propuesta (para "Permanecer en ..."). */
    function marcarOrigen(registro) {
        try { sessionStorage.setItem('sire_origen', String(registro).toLowerCase()); } catch (e) {}
    }

    // ------------------------------------------------------------- totales
    const num = v => parseFloat(v) || 0;
    const r2 = v => Math.round(v * 100) / 100;

    function totalesRvie(filas) {
        const t = { exp: 0, bi: 0, dsctoBi: 0, igv: 0, dsctoIgv: 0, exo: 0, ina: 0, isc: 0,
                    biIvap: 0, ivap: 0, icbper: 0, otros: 0, total: 0 };
        (filas || []).forEach(f => {
            t.exp += num(f.valor_facturado_export); t.bi += num(f.bi_gravada);
            t.dsctoBi += num(f.dscto_bi); t.igv += num(f.igv_ipm); t.dsctoIgv += num(f.dscto_igv_ipm);
            t.exo += num(f.mto_exonerado); t.ina += num(f.mto_inafecto); t.isc += num(f.isc);
            t.biIvap += num(f.bi_grav_ivap); t.ivap += num(f.ivap); t.icbper += num(f.icbper);
            t.otros += num(f.otros_tributos); t.total += num(f.total_cp);
        });
        Object.keys(t).forEach(k => { t[k] = r2(t[k]); });
        return t;
    }

    function totalesRce(filas) {
        const t = { biDg: 0, igvDg: 0, biDgng: 0, igvDgng: 0, biDng: 0, igvDng: 0, ng: 0,
                    isc: 0, icbper: 0, otros: 0, total: 0, noDomiciliados: 0 };
        (filas || []).forEach(f => {
            t.biDg += num(f.bi_gravada); t.igvDg += num(f.igv_ipm);
            t.biDgng += num(f.bi_gravada_dgng); t.igvDgng += num(f.igv_ipm_dgng);
            t.biDng += num(f.bi_gravada_dng); t.igvDng += num(f.igv_ipm_dng);
            t.ng += num(f.adquisiciones_no_gravadas); t.isc += num(f.isc); t.icbper += num(f.icbper);
            t.otros += num(f.otros_tributos_cargos); t.total += num(f.total_cp);
        });
        Object.keys(t).forEach(k => { t[k] = r2(t[k]); });
        return t;
    }

    /** Guarda lo aceptado de un registro ('rvie' | 'rce') para su futura constancia. */
    function guardarSnapshot(registro, periodo, filas) {
        const reg = String(registro).toLowerCase();
        const snap = leerJSON(CLAVE_SNAP, {});
        snap[reg] = {
            periodo: periodo,
            cantidad: (filas || []).length,
            totales: reg === 'rce' ? totalesRce(filas) : totalesRvie(filas)
        };
        guardarJSON(CLAVE_SNAP, snap);
        marcarOrigen(reg);
    }

    /** Crea las constancias de la generación. estado = { rvie: 'YYYY-MM', rce: 'YYYY-MM' } */
    function registrarGeneracion(estado) {
        if (!estado || (!estado.rvie && !estado.rce)) return null;
        const ahora = new Date();
        const p2 = n => String(n).padStart(2, '0');
        let corr = parseInt(leerJSON(CLAVE_CORR, 8), 10) || 8;
        corr += 1;
        guardarJSON(CLAVE_CORR, corr);
        const correlativo = ahora.getFullYear() + '02' + String(corr).padStart(8, '0');
        const fecha = p2(ahora.getDate()) + '/' + p2(ahora.getMonth() + 1) + '/' + ahora.getFullYear();
        const hora = p2(ahora.getHours()) + ':' + p2(ahora.getMinutes()) + ':' + p2(ahora.getSeconds());

        const emp = empresa();
        const snap = leerJSON(CLAVE_SNAP, {});
        const lista = leerJSON(CLAVE_LISTA, []);
        ['rce', 'rvie'].forEach(reg => {
            if (!estado[reg]) return;
            const s = (snap[reg] && snap[reg].periodo === estado[reg]) ? snap[reg] : null;
            lista.unshift({
                registro: reg.toUpperCase(),
                periodo: estado[reg],
                correlativo: correlativo,
                fecha: fecha,
                hora: hora,
                ruc: emp.ruc,
                razon: emp.razon,
                anotacion: 'Propuesta Aceptada',
                cantidad: s ? s.cantidad : null,       // null: se completa desde la base al ver la constancia
                totales: s ? s.totales : null
            });
            delete snap[reg];
        });
        guardarJSON(CLAVE_LISTA, lista);
        guardarJSON(CLAVE_SNAP, snap);
        return correlativo;
    }

    function listar(registro) {
        const reg = registro ? String(registro).toUpperCase() : null;
        const emp = empresa();
        return leerJSON(CLAVE_LISTA, []).filter(c =>
            (!reg || c.registro === reg) && (!emp.ruc || !c.ruc || c.ruc === emp.ruc));
    }

    // Si la constancia no trae totales (aceptación antigua), se calculan desde la base
    async function completarDesdeBase(c) {
        if (c.totales && c.cantidad != null) return c;
        const cli = (typeof authSupabaseClient !== 'undefined' && authSupabaseClient) ? authSupabaseClient : null;
        const per = parseInt(String(c.periodo).replace('-', ''), 10);
        if (!cli || !c.ruc || !per) return Object.assign({}, c, { cantidad: c.cantidad || 0, totales: c.totales || {} });
        try {
            if (c.registro === 'RCE') {
                const { data } = await cli.from('registro_compras').select('*').eq('RUC', parseInt(c.ruc, 10)).eq('Periodo', per);
                const filas = (data || []).map(d => ({
                    bi_gravada: d['BI Gravado DG'], igv_ipm: d['IGV / IPM DG'],
                    bi_gravada_dgng: d['BI Gravado DGNG'], igv_ipm_dgng: d['IGV / IPM DGNG'],
                    bi_gravada_dng: d['BI Gravado DNG'], igv_ipm_dng: d['IGV / IPM DNG'],
                    adquisiciones_no_gravadas: d['Valor Adq. NG'], isc: d['ISC'], icbper: d['ICBPER'],
                    otros_tributos_cargos: d['Otros Trib/ Cargos'], total_cp: d['Total CP']
                }));
                return Object.assign({}, c, { cantidad: filas.length, totales: totalesRce(filas) });
            }
            const { data } = await cli.from('registro_ventas').select('*').eq('Ruc', parseInt(c.ruc, 10)).eq('Periodo', per);
            const filas = (data || []).map(d => ({
                valor_facturado_export: d['Valor Facturado Exportación'], bi_gravada: d['BI Gravada'],
                dscto_bi: d['Dscto BI'], igv_ipm: d['IGV / IPM'], dscto_igv_ipm: d['Dscto IGV / IPM'],
                mto_exonerado: d['Mto Exonerado'], mto_inafecto: d['Mto Inafecto'], isc: d['ISC'],
                bi_grav_ivap: d['BI Grav IVAP'], ivap: d['IVAP'], icbper: d['ICBPER'],
                otros_tributos: d['Otros Tributos'], total_cp: d['Total CP']
            }));
            return Object.assign({}, c, { cantidad: filas.length, totales: totalesRvie(filas) });
        } catch (e) {
            return Object.assign({}, c, { cantidad: c.cantidad || 0, totales: c.totales || {} });
        }
    }

    // ------------------------------------------------------------------ PDF
    const fmt = v => (Number(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    async function descargarPDF(constancia) {
        if (typeof window.jspdf === 'undefined') {
            alert('No se pudo cargar la librería para generar el PDF. Revisa tu conexión a internet y vuelve a intentarlo.');
            return;
        }
        const c = await completarDesdeBase(constancia);
        const t = c.totales || {};
        const esRce = c.registro === 'RCE';
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        // Encabezado en texto (sin imagen: el PDF queda liviano)
        doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(12, 86, 145);
        doc.text('SUNAT', 18, 18);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(0, 0, 0);
        doc.text(esRce ? 'Constancia de Recepción del Registro de Compras Electrónico'
                       : 'Constancia de Recepción del Registro de Ventas e Ingresos', 55, 24);

        let y = 34;
        function seccion(titulo) {
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(0, 0, 0);
            doc.text(titulo, 18, y); y += 6;
        }
        function campo(etiqueta, valor) {
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(0, 0, 0);
            doc.text(etiqueta, 18, y);
            doc.setFont('helvetica', 'normal');
            doc.text(String(valor == null ? '' : valor), 90, y);
            y += 5.2;
        }

        const per = String(c.periodo || '');
        const anio = per.slice(0, 4), mes = per.slice(5, 7);
        seccion('Transacción');
        campo('Nombre:', esRce ? 'Generación del Registro de Compras Electrónico(RCE)' : 'Generación del RVIE');
        campo('Nro. de Operación:', String(c.correlativo).slice(0, 4) + '-' + String(c.correlativo).slice(4));
        campo('Fecha y hora:', c.fecha + ' ' + c.hora);
        y += 3;
        seccion('Datos del Contribuyente');
        campo('Número de RUC:', c.ruc || '—');
        campo('Nombre o Razón Social:', c.razon || '—');
        y += 3;
        seccion('Datos del Registro');
        campo('Registro:', esRce ? 'Registro de Compras Electrónico' : 'RVIE');
        campo('Periodo:', anio + '/' + mes);
        campo('Anotación', c.anotacion || 'Propuesta Aceptada');
        campo('Cantidad de registros:', c.cantidad || 0);
        y += 4;

        // Tabla genérica de dos columnas con ajuste de texto
        function tabla(cab1, cab2, filas, anchoDesc) {
            const x = 18, ancho = 175, xDiv = x + anchoDesc;
            doc.setFillColor(225, 225, 225);
            doc.rect(x, y, ancho, 6, 'F');
            doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.2);
            doc.rect(x, y, ancho, 6, 'S'); doc.line(xDiv, y, xDiv, y + 6);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
            doc.text(cab1, x + anchoDesc / 2, y + 4.2, { align: 'center' });
            doc.text(cab2, xDiv + (ancho - anchoDesc) / 2, y + 4.2, { align: 'center' });
            y += 6;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
            filas.forEach(f => {
                const lineas = doc.splitTextToSize(f[0], anchoDesc - 4);
                const alto = Math.max(5.2, lineas.length * 3.4 + 2);
                doc.rect(x, y, ancho, alto, 'S'); doc.line(xDiv, y, xDiv, y + alto);
                doc.text(lineas, x + 2, y + 3.7);
                doc.text(String(f[1]), x + ancho - 2, y + alto / 2 + 1.2, { align: 'right' });
                y += alto;
            });
        }

        if (esRce) {
            doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
            doc.text('Detalle de Resúmenes', 18, y); y += 2;
            // Código | Descripción | Cantidad (tres columnas)
            const x = 18, w1 = 25, w2 = 120, w3 = 30;
            doc.setFillColor(225, 225, 225); doc.rect(x, y, w1 + w2 + w3, 6, 'F');
            doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.2);
            doc.rect(x, y, w1 + w2 + w3, 6, 'S'); doc.line(x + w1, y, x + w1, y + 6); doc.line(x + w1 + w2, y, x + w1 + w2, y + 6);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
            doc.text('Código', x + w1 / 2, y + 4.2, { align: 'center' });
            doc.text('Descripción', x + w1 + w2 / 2, y + 4.2, { align: 'center' });
            doc.text('Cant. Registros', x + w1 + w2 + w3 / 2, y + 4.2, { align: 'center' });
            y += 6;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
            [['080400', 'Registro de Compras.', c.cantidad || 0],
             ['080500', 'Registro de Compras - información de operaciones con sujetos no domiciliados.', t.noDomiciliados || 0]
            ].forEach(f => {
                const lineas = doc.splitTextToSize(f[1], w2 - 4);
                const alto = Math.max(5.2, lineas.length * 3.4 + 2);
                doc.rect(x, y, w1 + w2 + w3, alto, 'S'); doc.line(x + w1, y, x + w1, y + alto); doc.line(x + w1 + w2, y, x + w1 + w2, y + alto);
                doc.text(f[0], x + 2, y + 3.7);
                doc.text(lineas, x + w1 + 2, y + 3.7);
                doc.text(String(f[2]), x + w1 + w2 + w3 - 2, y + 3.7, { align: 'right' });
                y += alto;
            });
            y += 6;
            doc.setFontSize(9); doc.text('Datos Totales', 18, y); y += 2;
            tabla('Descripción', 'Totales S/', [
                ['Monto Total de la Base imponible de las adquisiciones gravadas que dan derecho a crédito fiscal y/o saldo a favor por exportación, destinadas exclusivamente a operaciones gravadas y/o de exportación.', fmt(t.biDg)],
                ['Monto Total del IGV y/o IPM destinado a operac. Gravadas y/o Exp.', fmt(t.igvDg)],
                ['Monto Total de la Base imponible de las adquisiciones gravadas que dan derecho a crédito fiscal y/o saldo a favor por exportación, destinadas a operaciones gravadas y/o de exportación y a operaciones no gravadas.', fmt(t.biDgng)],
                ['Monto Total del IGV y/o IPM de adq. Grav. Dest a operac. Grav y/o Exp. y No Grav.', fmt(t.igvDgng)],
                ['Monto Total de la Base imponible de las adquisiciones gravadas que no dan derecho a crédito fiscal y/o saldo a favor por exportación, por no estar destinadas a operaciones gravadas y/o de exportación.', fmt(t.biDng)],
                ['Monto Total del IGV y/o IPM de adq. Grav. que no dan derecho a crédito fiscal.', fmt(t.igvDng)],
                ['Monto Total de adquisiciones no gravadas.', fmt(t.ng)],
                ['Monto Total del ISC, en los casos en que el sujeto pueda utilizarlo como deducción.', fmt(t.isc)],
                ['Monto Total del Impuesto al Consumo de las Bolsas de Plástico.', fmt(t.icbper)],
                ['Monto Total de otros conceptos, Tributos y cargos que no formen parte de la base imponible.', fmt(t.otros)],
                ['Importe Total de las adquisiciones registradas según comprobante de pago.', fmt(t.total)],
                ['Impuestos Materia de Beneficio Ley 31053.', fmt(0)]
            ], 145);
        } else {
            doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
            doc.text('Datos Totales', 18, y); y += 2;
            tabla('Descripción', 'Monto', [
                ['Monto Total facturado de la exportación.', fmt(t.exp)],
                ['Monto Total de la base imponible de la operación gravada.', fmt(t.bi)],
                ['Sumatoria de descuentos de base imponible.', fmt(t.dsctoBi)],
                ['Monto Total del IGV y/o IPM.', fmt(t.igv)],
                ['Sumatoria de descuentos de IGV.', fmt(t.dsctoIgv)],
                ['Monto Total de la operación exonerada.', fmt(t.exo)],
                ['Monto Total de la operación inafecta.', fmt(t.ina)],
                ['Monto Total del ISC.', fmt(t.isc)],
                ['Monto Total de la base imponible del IVAP.', fmt(t.biIvap)],
                ['Monto Total del IVAP.', fmt(t.ivap)],
                ['Sumatoria de Impuesto al Consumo Bolsas de Plástico.', fmt(t.icbper)],
                ['Monto Total de otros tributos y cargos que no forman parte de la base imponible.', fmt(t.otros)],
                ['Monto Total del comprobante de pago.', fmt(t.total)]
            ], 145);
        }

        y += 10;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(0, 0, 0);
        doc.text('Gracias por cumplir con sus obligaciones tributarias.', 105, y, { align: 'center' });

        const libro = esRce ? '00080400011120' : '00140400011120';
        doc.save('LE' + (c.ruc || '') + anio + mes + libro + '.pdf');
    }

    // ---------------------------------------------------------- panel (UI)
    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    const aYYYYMM = s => String(s || '').replace(/\D/g, '').slice(0, 6);   // '2026/08' -> '202608'

    /**
     * Pinta "Consulta Constancia de Recepción" dentro de `contenedor`.
     * opts.onRegresar: qué hacer al pulsar "Regresar" (volver al menú).
     */
    function renderPanel(contenedor, registro, opts) {
        if (!contenedor) return;
        opts = opts || {};
        const reg = String(registro).toUpperCase();
        const todas = listar(reg);
        const ultimo = todas[0] ? todas[0].periodo.replace('-', '/') : (function () {
            const d = new Date(); return d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0');
        })();

        contenedor.innerHTML = `
            <div class="content-header-blue" style="margin-bottom:16px;">
                <h2>Consulta Constancia de Recepción</h2>
            </div>
            <div class="search-form-container" style="padding:12px 16px;">
                <div class="search-title">Buscar por:</div>
                <div class="ig-search-grid">
                    <div class="ig-search-field">
                        <label>Período Inicio:</label>
                        <div class="input-icon-wrapper">
                            <input type="text" class="ig-input sc-ini" value="${ultimo}" placeholder="AAAA/MM">
                            <i class="far fa-calendar-alt"></i>
                        </div>
                    </div>
                    <div class="ig-search-field">
                        <label>Período Fin:</label>
                        <div class="input-icon-wrapper">
                            <input type="text" class="ig-input sc-fin" value="${ultimo}" placeholder="AAAA/MM">
                            <i class="far fa-calendar-alt"></i>
                        </div>
                    </div>
                    <div class="ig-search-actions">
                        <button type="button" class="btn-search sc-buscar"><i class="fas fa-search"></i> Buscar</button>
                        <button type="button" class="btn-clear sc-limpiar"><i class="fas fa-sync-alt"></i> Limpiar</button>
                    </div>
                </div>
            </div>
            <div class="results-container" style="margin-top:12px; padding:0 16px 16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; font-size:13px;">
                    <span>mostrar:
                        <select class="sc-mostrar" style="padding:2px 6px;"><option>20</option><option>50</option></select>
                        registros</span>
                    <button type="button" class="btn-search sc-descargar" disabled style="opacity:.55;"><i class="fas fa-download"></i> Descargar</button>
                </div>
                <div class="table-responsive">
                    <table class="summary-table" style="width:100%;">
                        <thead>
                            <tr>
                                <th>Período</th><th>Correlativo</th><th>RUC</th><th>Nombre o Razón Social</th>
                                <th>Nombre de Registro</th><th>Constancia</th><th>Fecha de Generación</th><th>Selección</th>
                            </tr>
                        </thead>
                        <tbody class="sc-tbody"></tbody>
                    </table>
                </div>
                <div class="sc-info" style="font-size:12.5px; color:#555; padding:10px 0;"></div>
                <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:12.5px; color:#333;">
                    <div><strong>Nota</strong><br>-${reg}: Constancia de Recepción ${reg}</div>
                    <button type="button" class="btn-search sc-regresar">Regresar</button>
                </div>
            </div>`;

        const $ = sel => contenedor.querySelector(sel);
        let visibles = [];

        function pintar() {
            const ini = aYYYYMM($('.sc-ini').value) || '000000';
            const fin = aYYYYMM($('.sc-fin').value) || '999999';
            const max = parseInt($('.sc-mostrar').value, 10) || 20;
            const filtradas = listar(reg).filter(c => {
                const p = aYYYYMM(c.periodo);
                return p >= ini && p <= fin;
            });
            visibles = filtradas.slice(0, max);
            const tb = $('.sc-tbody');
            if (!visibles.length) {
                tb.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:14px; color:#666;">No se encontraron constancias para el periodo indicado. ' +
                    'Primero acepta la propuesta y genera el registro en "Generación de Registros".</td></tr>';
            } else {
                tb.innerHTML = visibles.map((c, i) => `
                    <tr>
                        <td>${esc(aYYYYMM(c.periodo))}</td>
                        <td>${esc(c.correlativo)}</td>
                        <td>${esc(c.ruc)}</td>
                        <td>${esc(c.razon)}</td>
                        <td>${esc(c.registro)}</td>
                        <td><a href="#" class="sc-ver" data-i="${i}" style="color:#0b5ed7; text-decoration:underline;">Ver Constancia</a></td>
                        <td>${esc(c.fecha)}</td>
                        <td style="text-align:center;"><input type="checkbox" class="sc-check" data-i="${i}"></td>
                    </tr>`).join('');
            }
            $('.sc-info').textContent = 'Mostrando del ' + (visibles.length ? 1 : 0) + ' al ' + visibles.length +
                ' de un total de ' + filtradas.length + ' registros';
            actualizarDescargar();
        }

        function actualizarDescargar() {
            const algun = !!contenedor.querySelector('.sc-check:checked');
            const b = $('.sc-descargar');
            b.disabled = !algun;
            b.style.opacity = algun ? '1' : '.55';
        }

        $('.sc-buscar').addEventListener('click', pintar);
        $('.sc-mostrar').addEventListener('change', pintar);
        $('.sc-limpiar').addEventListener('click', () => {
            $('.sc-ini').value = ''; $('.sc-fin').value = '';
            $('.sc-tbody').innerHTML = ''; $('.sc-info').textContent = '';
            visibles = []; actualizarDescargar();
        });
        $('.sc-regresar').addEventListener('click', () => {
            contenedor.style.display = 'none';
            if (typeof opts.onRegresar === 'function') opts.onRegresar();
        });
        contenedor.addEventListener('change', e => { if (e.target.classList.contains('sc-check')) actualizarDescargar(); });
        contenedor.addEventListener('click', e => {
            const ver = e.target.closest('.sc-ver');
            if (ver) {
                e.preventDefault();
                const c = visibles[parseInt(ver.getAttribute('data-i'), 10)];
                if (c) descargarPDF(c);
            }
        });
        $('.sc-descargar').addEventListener('click', async () => {
            const marcados = Array.from(contenedor.querySelectorAll('.sc-check:checked'))
                .map(ch => visibles[parseInt(ch.getAttribute('data-i'), 10)]).filter(Boolean);
            for (const c of marcados) await descargarPDF(c);
        });

        contenedor.style.display = 'block';
        pintar();
    }

    // ------------------------------------------------- cierre de simulación
    function mostrarCierre() {
        let origen = 'rvie';
        try { origen = sessionStorage.getItem('sire_origen') || 'rvie'; } catch (e) {}
        const esRce = origen === 'rce';
        const destinoQuedarse = esRce ? 'rce.html' : 'rvie.html';
        const nombreQuedarse = esRce ? 'Permanecer en el RCE' : 'Permanecer en el RVIE';

        let ov = document.getElementById('sire-cierre-ov');
        if (ov) ov.remove();
        ov = document.createElement('div');
        ov.id = 'sire-cierre-ov';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:100001;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Roboto,Arial,sans-serif;';
        const btn = 'width:100%;padding:10px 14px;font-size:12.5px;border:none;border-radius:5px;cursor:pointer;color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;';
        ov.innerHTML = `
            <div style="width:450px;max-width:100%;background:#fff;border:1px solid #5cb85c;border-radius:6px;box-shadow:0 4px 15px rgba(0,0,0,.25);text-align:center;overflow:hidden;">
                <div style="background:#f8fff8;border-bottom:1px solid #dff0d8;padding:12px;display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:#3c763d;font-weight:bold;font-size:13px;">¡Simulación Completada!</span>
                    <button type="button" data-act="cerrar" style="border:none;background:transparent;font-size:18px;cursor:pointer;color:#999;">&times;</button>
                </div>
                <div style="padding:26px 22px;display:flex;flex-direction:column;align-items:center;gap:12px;background:linear-gradient(180deg,#f4fbf4 0%,#fff 65%);">
                    <div style="width:82px;height:82px;background:radial-gradient(circle at 32% 30%,#eaffea,#d3f0d3);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 22px rgba(76,174,76,.38);border:3px solid #b6e2b6;">
                        <i class="fas fa-check-circle" style="color:#43a047;font-size:54px;"></i>
                    </div>
                    <h2 style="font-size:18px;font-weight:800;color:#2e7d32;margin:4px 0 0;letter-spacing:.5px;">¡SIMULACIÓN REALIZADA CON ÉXITO!</h2>
                    <p style="font-size:12px;color:#555;margin:4px 6px 0;line-height:1.55;">
                        Se descargó el reporte de la simulación en PDF. Las constancias de recepción quedan en
                        <strong>Información de Gestión &gt; Constancias de Recepción</strong>. ¿A dónde quieres ir ahora?
                    </p>
                </div>
                <div style="padding:15px;border-top:1px dotted #dff0d8;background:#f8fff8;display:flex;flex-direction:column;gap:8px;">
                    <button type="button" data-ir="${destinoQuedarse}" style="${btn}background:#004B91;"><i class="fas fa-file-invoice"></i> ${nombreQuedarse.toUpperCase()}</button>
                    <button type="button" data-ir="tramites.html" style="${btn}background:#5cb85c;"><i class="fas fa-list"></i> VOLVER A MIS TRÁMITES Y CONSULTAS</button>
                    <button type="button" data-ir="sol.html" style="${btn}background:#1E395B;"><i class="fas fa-home"></i> VOLVER A MENÚ INICIAL</button>
                </div>
            </div>`;
        document.body.appendChild(ov);
        ov.addEventListener('click', e => {
            const ir = e.target.closest('[data-ir]');
            if (ir) { window.location.href = ir.getAttribute('data-ir'); return; }
            if (e.target.closest('[data-act="cerrar"]') || e.target === ov) ov.remove();
        });
    }

    window.SireConstancias = {
        empresa: empresa,
        persona: persona,
        marcarOrigen: marcarOrigen,
        guardarSnapshot: guardarSnapshot,
        registrarGeneracion: registrarGeneracion,
        listar: listar,
        descargarPDF: descargarPDF,
        renderPanel: renderPanel,
        mostrarCierre: mostrarCierre
    };
})();
