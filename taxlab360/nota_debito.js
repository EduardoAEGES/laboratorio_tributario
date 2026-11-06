// ============================================================================
// nota_debito.js · Emisión de Nota de Débito Electrónica (SEE - SOL)
// ----------------------------------------------------------------------------
// Réplica de SUNAT: Comprobantes de pago > SEE - SOL > Factura Electrónica >
// Emitir Nota de Débito. Tipos (catálogo 10):
//   01 Intereses por Mora  -> monto directo, sin IGV
//   02 Aumento en el Valor -> se elige el ítem de la factura y se captura el
//                             aumento unitario; lleva IGV 18 %
//   03 Penalidad           -> monto directo, sin IGV; se identifica con la
//                             factura de referencia O con el documento del
//                             receptor (no ambos)
// La factura de referencia se busca entre las de la EMPRESA ACTIVA con las
// mismas funciones de la nota de crédito (cargarFacturasParaNota /
// facturaParaNota de tramites.html): las del caso en el Registro de Ventas y
// las emitidas por el alumno.
// Al emitir: correlativo propio por serie, botón de descarga PDF y registro en
// "Mis comprobantes" (mis_comprobantes.js).
// ============================================================================
(function () {
    'use strict';

    var TIPOS = {
        mora: { cod: '01', txt: 'Intereses por Mora', titulo: 'INTERESES POR MORA', igv: false },
        aumento: { cod: '02', txt: 'Aumento en el Valor', titulo: 'AUMENTO EN EL VALOR', igv: true },
        penalidad: { cod: '03', txt: 'Penalidad', titulo: 'PENALIDAD', igv: false }
    };
    var TASA_IGV = 0.18;
    var S = null;          // estado de la nota en edición

    function $(id) { return document.getElementById(id); }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function r2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }
    function fmt(n) { return (window.fmtMiles ? window.fmtMiles(n) : r2(n).toFixed(2)); }
    function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^\d.-]/g, '')); return isNaN(n) ? 0 : n; }
    function hoy() { var d = new Date(); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear(); }
    function emisor() { return window.currentEmisorData || {}; }
    function unidadTxt(u) {
        u = String(u || '').toUpperCase();
        return { NIU: 'UNIDAD', ZZ: 'SERVICIO', KGM: 'KILOGRAMO', '': 'UNIDAD' }[u] || u;
    }

    var BOTON = 'display:inline-flex;align-items:center;gap:5px;padding:3px 10px;font-size:12px;border:1px solid #A6A6A6;' +
        'border-radius:3px;background:#fff;cursor:pointer;color:#333;';
    function boton(id, fn, ic, col, txt) {
        return '<button type="button" id="' + id + '" onclick="' + fn + '" style="' + BOTON + '"><i class="fas ' + ic +
            '" style="color:' + col + ';"></i> ' + txt + '</button>';
    }
    function cabecera(titulo) {
        return '<div style="background:#2E8BC9;color:#fff;padding:5px 12px;font-weight:bold;font-size:18px;text-align:center;' +
            'border:1.5px solid #4F81BD;border-bottom:none;">' + titulo + '</div>';
    }
    function fila(etq, control, extraTd) {
        return '<tr><td class="question-cell" style="width:40%;">' + etq + '</td><td class="separator-cell" style="width:2%;">:</td>' +
            '<td class="control-cell" style="width:58%;"' + (extraTd || '') + '>' + control + '</td></tr>';
    }

    // ------------------------------------------------------------------ vista
    function asegurarVista() {
        if ($('emitir-nd-wrapper')) return;
        var w = document.createElement('div');
        w.className = 'emitir-factura-wrapper';
        w.id = 'emitir-nd-wrapper';
        w.style.display = 'none';
        // Menú lateral: copia del de la nota de crédito, con Nota de Débito activa
        var asideNC = document.querySelector('#emitir-nota-credito-wrapper aside.factura-sidebar');
        var aside = asideNC ? asideNC.cloneNode(true) : document.createElement('aside');
        if (!asideNC) aside.className = 'factura-sidebar';
        aside.querySelectorAll('[onclick]').forEach(function (a) {
            var oc = a.getAttribute('onclick');
            if (/^\s*alert\(/.test(oc) || /^\s*return false;?\s*$/.test(oc)) return;        // avisos: se quedan igual
            var resto = oc.replace(/hideEmitirNotaCredito\(\);\s*/g, '');
            a.setAttribute('onclick', /^\s*return false;?\s*$/.test(resto)
                ? 'NotaDebito.salir(); return false;'                                      // "Ir al inicio" y similares
                : 'NotaDebito.ocultar(); ' + resto);                                       // abre otra opción
        });
        aside.querySelectorAll('li').forEach(function (li) {
            var a = li.querySelector(':scope > a'); if (!a) return;
            var t = a.textContent.trim();
            if (/^Emitir Nota de Crédito/.test(t)) {
                li.classList.remove('active-factura');
                li.innerHTML = '<a href="#" onclick="NotaDebito.ocultar(); showEmitirNotaCredito(); return false;">Emitir Nota de Crédito</a>';
            } else if (/^Emitir Nota de Débito/.test(t)) {
                li.classList.add('active-factura');
                li.innerHTML = '<a href="#" onclick="return false;">Emitir Nota de Débito <i class="fas fa-chevron-right" style="font-size: 10px;"></i></a>';
            }
        });
        w.innerHTML = '<div class="factura-layout"></div>';
        w.firstChild.appendChild(aside);
        var main = document.createElement('main');
        main.className = 'factura-content';
        main.innerHTML = '<div class="factura-form-container" id="nd-main" style="max-width:1000px;"></div>';
        w.firstChild.appendChild(main);
        var ref = $('emitir-nota-credito-wrapper');
        ref.parentNode.insertBefore(w, ref.nextSibling);
    }

    function pintar(html) { $('nd-main').innerHTML = html; window.scrollTo(0, 0); }

    function mostrarWrapper() {
        asegurarVista();
        ['tramites-content-container', 'emitir-factura-wrapper', 'emitir-boleta-wrapper', 'emitir-nota-credito-wrapper', 'rxh-wrapper'].forEach(function (id) {
            if ($(id)) $(id).style.display = 'none';
        });
        $('emitir-nd-wrapper').style.display = 'block';
    }

    function ocultar() { if ($('emitir-nd-wrapper')) $('emitir-nd-wrapper').style.display = 'none'; }
    function salir() {
        ocultar();
        if ($('tramites-content-container')) $('tramites-content-container').style.display = 'flex';
        window.scrollTo(0, 0);
    }

    // ------------------------------------------------------------------ paso 1
    function nuevo() {
        return { tipo: '', serie: emisor().serie_factura || 'E001', correlativo: '', motivo: '', monto: '',
                 docTipo: '', docNum: '', docNombre: '', factura: null, aumentos: {} };
    }

    function opcionesTipo(sel) {
        return '<option value=""></option>' + Object.keys(TIPOS).map(function (k) {
            return '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + TIPOS[k].txt + '</option>';
        }).join('');
    }

    function paso1() {
        var t = S.tipo, pen = t === 'penalidad';
        var docOpts = [['', ''], ['1', 'DOC. NACIONAL DE IDENTIDAD'], ['4', 'CARNET DE EXTRANJERIA'], ['6', 'REG. UNICO DE CONTRIBUYENTES'], ['7', 'PASAPORTE']]
            .map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === S.docTipo ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');
        pintar(cabecera('Emisión Notas de Débito Electrónicas') +
            '<div class="factura-table-border-wrapper"><table class="factura-form-table">' +
            fila('Tipo de Nota de Débito', '<select id="nd-tipo" class="factura-select" style="width:320px;max-width:100%;" onchange="NotaDebito.cambioTipo()">' + opcionesTipo(t) + '</select>') +
            fila('Número de FE respecto de la cual se emite la Nota de Débito' + (pen ? ' (*)' : ''),
                '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><input type="text" id="nd-series" class="factura-input-text" readonly value="' + esc(S.serie) +
                '" style="width:90px;background:#EEE;color:#777;"> <span>-</span> <input type="text" id="nd-correlativo" class="factura-input-text" value="' + esc(S.correlativo) +
                '" style="width:110px;" oninput="NotaDebito.cambioFactura()"> ' + boton('nd-ver', 'NotaDebito.verFactura()', 'fa-check', '#c00', 'Ver Factura') + '</div>') +
            (pen
                ? fila('Seleccione el Tipo de documento y el número de documento del Cliente, Adquiriente o Usuario',
                       '<select id="nd-doc-tipo" class="factura-select" style="width:320px;max-width:100%;" onchange="NotaDebito.cambioDocTipo()">' + docOpts + '</select>') +
                  fila('Consigne el Número de Documento del Cliente, Adquiriente o Usuario',
                       '<input type="text" id="nd-doc-num" class="factura-input-text" maxlength="15" value="' + esc(S.docNum) + '" style="width:190px;" oninput="NotaDebito.cambioFactura()" onblur="NotaDebito.buscarReceptor()">') +
                  fila('Consigne Apellidos y Nombres del Cliente, o Denominación o Razón Social cuando corresponda',
                       '<input type="text" id="nd-doc-nombre" class="factura-input-text" readonly value="' + esc(S.docNombre) + '" style="width:100%;max-width:600px;background:#EEE;">')
                : '') +
            fila('Motivo o sustento por el cual se emite la Nota de Débito',
                '<input type="text" id="nd-motivo" class="factura-input-text" maxlength="250" value="' + esc(S.motivo) + '" style="width:100%;max-width:600px;">') +
            (t === 'mora' || t === 'penalidad'
                ? fila(TIPOS[t].txt, '<input type="text" id="nd-monto" class="factura-input-text" inputmode="decimal" value="' + esc(S.monto) + '" style="width:190px;text-align:right;">')
                : '') +
            (pen ? '<tr><td colspan="3" style="font-size:11.5px;background:#fff;line-height:1.45;">(*) Para la emisión de una <b>Nota de Débito por Penalidad</b>, ' +
                   'debe ingresar la factura de referencia o el tipo de documento y número de documento del Receptor, pero no de los dos a la vez. En el caso de ' +
                   'ingresar la factura de referencia se recuperarán automáticamente los datos del comprobante.</td></tr>' : '') +
            '</table><div id="nd-msg" style="padding:0 8px;"></div></div>' +
            '<div class="factura-buttons-row">' + boton('nd-cont', 'NotaDebito.continuar()', 'fa-arrow-alt-circle-right', '#006699', 'Continuar') +
            boton('nd-canc', 'NotaDebito.salir()', 'fa-times-circle', '#cc0000', 'Cancelar') + '</div>');
        aplicarExclusion();
    }

    function leer1() {
        S.tipo = $('nd-tipo').value;
        S.correlativo = ($('nd-correlativo').value || '').trim();
        S.motivo = ($('nd-motivo').value || '').trim();
        if ($('nd-monto')) S.monto = $('nd-monto').value;
        if ($('nd-doc-tipo')) { S.docTipo = $('nd-doc-tipo').value; S.docNum = $('nd-doc-num').value.trim(); S.docNombre = $('nd-doc-nombre').value.trim(); }
    }

    // Penalidad: factura O receptor, no ambos
    function aplicarExclusion() {
        if (S.tipo !== 'penalidad' || !$('nd-doc-tipo')) return;
        var conFactura = !!($('nd-correlativo').value || '').trim();
        ['nd-doc-tipo', 'nd-doc-num'].forEach(function (id) { $(id).disabled = conFactura; });
        $('nd-correlativo').disabled = !conFactura && !!($('nd-doc-num').value || '').trim();
    }

    function mensaje(html, tipo) {
        var el = $('nd-msg'); if (!el) return;
        el.innerHTML = html ? '<div style="margin:8px 0;padding:8px 10px;border-radius:3px;font-size:12px;' +
            (tipo === 'warn' ? 'background:#FFF6E0;color:#7C4A03;border:1px solid #F3D08A;' : 'background:#FDECEA;color:#8A1C1C;border:1px solid #F5C2C0;') +
            '">' + html + '</div>' : '';
    }

    async function buscarReceptor() {
        var tipo = $('nd-doc-tipo').value, n = $('nd-doc-num').value.trim(), nom = $('nd-doc-nombre');
        aplicarExclusion();
        nom.value = ''; nom.readOnly = true; nom.style.background = '#EEE';
        if (!tipo || !n) return;
        var nombre = '';
        if (tipo === '6' && /^\d{11}$/.test(n) && typeof resolverRuc === 'function') {
            try { var info = await resolverRuc(n); if (info && info.ok) nombre = info.razon_social; } catch (e) {}
        }
        if (nombre) { nom.value = nombre; mensaje(''); }
        else {
            nom.readOnly = false; nom.style.background = '#FFF6E0'; nom.focus();
            mensaje('El documento ' + esc(n) + ' no figura en el padrón del laboratorio. Escriba el nombre o la razón social del receptor.', 'warn');
        }
    }

    async function verFactura() {
        leer1();
        if (!S.correlativo) { alert('Debe ingresar el número de correlativo de la factura.'); return; }
        if (typeof cargarFacturasParaNota === 'function') await cargarFacturasParaNota();
        var f = facturaParaNota(S.correlativo, 'nd-series');
        if (!f) { avisoFacturaNoEncontrada(S.correlativo, 'nd-series'); return; }
        populateVerFacturaModal(f, S.correlativo);
    }

    async function continuar() {
        leer1();
        var t = TIPOS[S.tipo];
        if (!t) { alert('Seleccione el Tipo de Nota de Débito.'); return; }
        var conReceptor = S.tipo === 'penalidad' && !S.correlativo && S.docNum;
        if (!S.correlativo && !conReceptor) {
            alert(S.tipo === 'penalidad' ? 'Ingrese la factura de referencia o el documento del receptor.' : 'Debe ingresar el número correlativo de la factura vinculada.');
            return;
        }
        if (S.correlativo) {
            if (typeof cargarFacturasParaNota === 'function') await cargarFacturasParaNota();
            S.factura = facturaParaNota(S.correlativo, 'nd-series');
            if (!S.factura) { avisoFacturaNoEncontrada(S.correlativo, 'nd-series'); return; }
        } else {
            if (!S.docTipo) { alert('Seleccione el tipo de documento del receptor.'); return; }
            if (!S.docNombre) { alert('Consigne los apellidos y nombres o la razón social del receptor.'); return; }
            S.factura = null;
        }
        if (!S.motivo) { alert('Debe ingresar el motivo o sustento de la Nota de Débito.'); return; }
        if (S.tipo === 'aumento') { S.aumentos = S.aumentos || {}; return seleccion(); }
        if (!(num(S.monto) > 0)) { alert('Ingrese el monto de ' + t.txt + ' (mayor que cero).'); return; }
        preliminar(false);
    }

    // ------------------------------------------------------------------ Aumento en el valor: ítems
    function seleccion() {
        var f = S.factura, items = f.items || [];
        var filas = items.map(function (it, i) {
            var sel = S.aumentos[i] != null && num(S.aumentos[i]) > 0;
            var st = sel ? 'color:#0000CC;font-weight:bold;' : '';
            return '<tr style="border-bottom:1px solid #eee;"><td style="text-align:center;padding:6px;"><a href="#" onclick="NotaDebito.captura(' + i + '); return false;" ' +
                'title="Capturar el aumento"><i class="fas fa-pencil-alt" style="color:#e6a700;font-size:15px;"></i></a></td>' +
                '<td style="text-align:center;' + st + '">' + esc(unidadTxt(it.unidad)) + '</td><td style="text-align:center;' + st + '">' + esc(it.cantidad) + '</td>' +
                '<td style="' + st + '">' + esc(it.descripcion) + '</td><td style="text-align:right;' + st + '">' + esc(sel ? fmt(S.aumentos[i]) : it.valorUnitario) + '</td></tr>';
        }).join('');
        pintar(cabecera('Notas de Débito') +
            '<div class="factura-table-border-wrapper"><table class="factura-form-table">' +
            fila('Tipo de Nota de Débito', esc(TIPOS.aumento.txt)) +
            fila('Número de FE respecto de la cual se emite la Nota de Débito',
                '<span style="display:inline-block;background:#EEE;border:1px solid #ccc;padding:2px 8px;width:90px;">' + esc(S.serie) + '</span> ' +
                '<span style="display:inline-block;background:#EEE;border:1px solid #ccc;padding:2px 8px;width:110px;">' + esc(S.correlativo) + '</span> ' +
                boton('nd-ver2', 'NotaDebito.verFactura()', 'fa-check', '#c00', 'Ver Factura')) +
            fila('Motivo o sustento por el cual se emitirá la Nota de Débito', '<span style="display:block;background:#EEE;border:1px solid #ccc;padding:2px 8px;">' + esc(S.motivo) + '</span>') +
            '</table><div style="font-size:12px;padding:6px 8px;">Seleccione el Item de la Factura Electrónica</div>' +
            '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#EAEAEA;">' +
            '<th style="padding:5px;width:110px;">Selección de Items</th><th style="width:110px;">Unidad Medida</th><th style="width:80px;">Cantidad</th>' +
            '<th style="text-align:left;">Descripción</th><th style="text-align:right;width:110px;">Valor Unitario</th></tr>' + filas + '</table></div>' +
            '<div id="nd-msg" style="padding:0 8px;"></div></div>' +
            '<div class="factura-buttons-row" style="justify-content:space-between;">' + boton('nd-ret', 'NotaDebito.retroceder1()', 'fa-arrow-alt-circle-left', '#006699', 'Retroceder') +
            boton('nd-cont2', 'NotaDebito.continuar2()', 'fa-arrow-alt-circle-right', '#006699', 'Continuar') +
            boton('nd-canc2', 'NotaDebito.salir()', 'fa-times-circle', '#cc0000', 'Cancelar') + '</div>');
    }

    function captura(i) {
        var it = S.factura.items[i];
        cerrarCaptura();
        var ov = document.createElement('div');
        ov.id = 'nd-captura';
        ov.style.cssText = 'position:fixed;inset:0;z-index:100003;background:rgba(255,255,255,.55);display:flex;align-items:center;justify-content:center;padding:16px;';
        var ro = 'class="factura-input-text" readonly style="width:100%;background:#EEE;color:#777;"';
        ov.innerHTML = '<div style="background:#fff;border:1px solid #999;box-shadow:0 10px 30px rgba(0,0,0,.25);width:100%;max-width:600px;font-size:12.5px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid #ddd;font-weight:bold;">' +
            'Captura ND - Aumento en el valor <a href="#" onclick="NotaDebito.cerrarCaptura(); return false;" style="color:#888;"><i class="fas fa-times-circle"></i></a></div>' +
            '<table style="width:100%;border-collapse:collapse;margin:10px 0;">' +
            '<tr><td style="padding:5px 12px;width:38%;">Cantidad</td><td>:</td><td style="padding:5px 12px;"><input ' + ro + ' value="' + esc(it.cantidad) + '"></td></tr>' +
            '<tr><td style="padding:5px 12px;">Unidad de Medida</td><td>:</td><td style="padding:5px 12px;"><input ' + ro + ' value="' + esc(unidadTxt(it.unidad)) + '"></td></tr>' +
            '<tr><td style="padding:5px 12px;vertical-align:top;">Descripción</td><td>:</td><td style="padding:5px 12px;"><textarea readonly rows="3" style="width:100%;background:#EEE;color:#777;border:1px solid #999;font-family:monospace;font-size:12px;">' +
            esc(it.descripcion) + '</textarea></td></tr>' +
            '<tr><td style="padding:5px 12px;">Aumento en el valor unitario</td><td>:</td><td style="padding:5px 12px;"><input type="text" id="nd-aum" class="factura-input-text" inputmode="decimal" style="width:100%;" value="' +
            esc(S.aumentos[i] != null ? S.aumentos[i] : '0.00') + '" oninput="NotaDebito.calcCaptura(' + i + ')" onfocus="this.select()"></td></tr>' +
            '<tr><td style="padding:5px 12px;">ISC</td><td>:</td><td style="padding:5px 12px;"><input ' + ro + ' value="S/ 0.00"></td></tr>' +
            '<tr><td style="padding:5px 12px;">IGV (0.18 %)</td><td>:</td><td style="padding:5px 12px;"><input ' + ro + ' id="nd-aum-igv" value="S/ 0.00"></td></tr>' +
            '<tr><td style="padding:5px 12px;">Importe de Venta</td><td>:</td><td style="padding:5px 12px;"><input ' + ro + ' id="nd-aum-imp" value="S/ 0.00"></td></tr></table>' +
            '<div style="text-align:center;padding:4px 0 16px;display:flex;gap:16px;justify-content:center;">' +
            boton('nd-aum-ok', 'NotaDebito.aceptarCaptura(' + i + ')', 'fa-check', '#2e7d32', 'Aceptar') +
            boton('nd-aum-x', 'NotaDebito.cerrarCaptura()', 'fa-times', '#cc0000', 'Cancelar') + '</div></div>';
        document.body.appendChild(ov);
        calcCaptura(i);
        var inp = $('nd-aum'); inp.focus(); inp.select();
    }

    function calcCaptura(i) {
        var it = S.factura.items[i], u = num($('nd-aum').value), base = r2(num(it.cantidad) * u), igv = r2(base * TASA_IGV);
        $('nd-aum-igv').value = 'S/ ' + fmt(igv);
        $('nd-aum-imp').value = 'S/ ' + fmt(base + igv);
    }
    function aceptarCaptura(i) {
        var u = num($('nd-aum').value);
        if (u > 0) S.aumentos[i] = r2(u); else delete S.aumentos[i];
        cerrarCaptura();
        seleccion();
    }
    function cerrarCaptura() { var o = $('nd-captura'); if (o) o.remove(); }

    function continuar2() {
        var sel = Object.keys(S.aumentos).filter(function (k) { return num(S.aumentos[k]) > 0; });
        if (!sel.length) { mensaje('Seleccione al menos un ítem (lápiz) y consigne el aumento en el valor unitario.'); return; }
        preliminar(false);
    }

    // ------------------------------------------------------------------ preliminar / emitida
    function lineas() {
        if (S.tipo === 'aumento') {
            return Object.keys(S.aumentos).filter(function (k) { return num(S.aumentos[k]) > 0; }).map(function (k) {
                var it = S.factura.items[k];
                return { cant: num(it.cantidad), unidad: unidadTxt(it.unidad), desc: it.descripcion, vu: num(S.aumentos[k]) };
            });
        }
        return [{ cant: 0, unidad: '', desc: S.motivo.toUpperCase(), vu: r2(num(S.monto)) }];
    }

    function totales() {
        var ls = lineas(), base = 0;
        ls.forEach(function (l) { base += S.tipo === 'aumento' ? r2(l.cant * l.vu) : l.vu; });
        base = r2(base);
        var igv = TIPOS[S.tipo].igv ? r2(base * TASA_IGV) : 0;
        return { base: base, igv: igv, total: r2(base + igv), lineas: ls };
    }

    function receptor() {
        if (S.factura) return { nombre: S.factura.cliente, doc: S.factura.ruc, moneda: S.factura.moneda || 'SOLES' };
        return { nombre: S.docNombre.toUpperCase(), doc: S.docNum, moneda: 'SOLES' };
    }

    function htmlComprobante(final, numero) {
        var t = totales(), rc = receptor(), d = emisor(), aum = S.tipo === 'aumento';
        var filas = t.lineas.map(function (l) {
            return '<tr><td style="text-align:center;padding:4px;">' + l.cant.toFixed(2) + '</td>' +
                (aum ? '<td style="text-align:center;">' + esc(l.unidad) + '</td>' : '') +
                '<td style="padding:4px;">' + esc(l.desc) + '</td><td style="text-align:right;padding:4px;">' + fmt(l.vu) + '</td></tr>';
        }).join('');
        var tot = function (e, v) {
            return '<tr><td style="text-align:right;padding:3px 6px;">' + e + ' :</td><td style="width:230px;"><div style="background:#EEE;border:1px solid #ccc;' +
                'padding:2px 6px;color:#555;">S/ ' + fmt(v) + '</div></td></tr>';
        };
        return '<div id="nd-paper" style="border:1px solid #999;background:#fff;padding:6px;font-family:Arial,sans-serif;font-size:12px;color:#111;">' +
            '<div style="border:1px solid #999;text-align:center;font-weight:bold;font-size:15px;padding:3px;margin-bottom:4px;">' +
            (final ? 'NOTA DE DÉBITO ELECTRÓNICA' : 'PRELIMINAR DE NOTA DE DÉBITO') + '</div>' +
            '<div style="border:1px solid #999;padding:8px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
            '<div style="line-height:1.55;"><b class="emisor-nombre">' + esc(d.nombre_comercial || d.razon_social || '') + '</b><br>' +
            '<b class="emisor-razon">' + esc(d.razon_social || '') + '</b><br><span class="emisor-direccion">' + esc(d.direccion || '') + '</span><br>' +
            'Fecha de Emisión :<b>' + esc(S.fecha || hoy()) + '</b></div>' +
            '<div style="border:1.5px solid #4F81BD;padding:8px 26px;text-align:center;font-weight:bold;font-size:15px;align-self:center;line-height:1.3;">' +
            'NOTA DE DÉBITO<br>ELECTRÓNICA<br>RUC: ' + esc(d.ruc || '') + (numero ? '<br><span style="color:#c00;">' + esc(numero) + '</span>' : '') + '</div></div>' +
            '<div style="font-weight:bold;margin:6px 0 4px;">Documento que modifica:</div>' +
            '<div style="border:1px solid #999;padding:8px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;"><table style="font-size:12px;line-height:1.6;">' +
            '<tr><td style="padding-right:12px;">Factura Electrónica</td><td>: <b>' + (S.factura ? esc(S.serie + ' - ' + S.correlativo) : '-') + '</b></td></tr>' +
            '<tr><td>Señor(es)</td><td>: <b>' + esc(rc.nombre) + '</b></td></tr>' +
            '<tr><td>' + (S.factura || S.docTipo === '6' ? 'RUC' : 'Documento') + '</td><td>: <b>' + esc(rc.doc) + '</b></td></tr>' +
            '<tr><td>Tipo de Moneda</td><td>: <b>' + esc(rc.moneda) + '</b></td></tr>' +
            '<tr><td style="vertical-align:top;">Motivo o Sustento</td><td>: ' + esc(S.motivo.toUpperCase()) + '</td></tr></table>' +
            '<div style="font-weight:bold;">' + TIPOS[S.tipo].titulo + '</div></div>' +
            '<div style="border:1px solid #999;margin-top:6px;min-height:150px;"><table style="width:100%;border-collapse:collapse;font-size:12px;">' +
            '<tr style="background:#F2F2F2;"><th style="width:80px;padding:4px;">Cantidad</th>' + (aum ? '<th style="width:110px;">Unidad Medida</th>' : '') +
            '<th style="text-align:left;">Descripción</th><th style="text-align:right;width:120px;">Valor Unitario</th></tr>' + filas + '</table></div>' +
            '<div style="border:1px solid #999;margin-top:6px;padding:8px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">' +
            '<div id="nd-acciones">' + (final ? '' :
                boton('nd-ret2', 'NotaDebito.retroceder2()', 'fa-arrow-alt-circle-left', '#006699', 'Retroceder') + ' ' +
                boton('nd-emitir', 'NotaDebito.emitir()', 'fa-save', '#1E395B', 'Emitir') + ' ' +
                boton('nd-cerrar', 'NotaDebito.salir()', 'fa-times', '#cc0000', 'Cerrar')) + '</div>' +
            '<table style="font-size:12px;margin-left:auto;">' + tot('Valor Venta', t.base) + tot('ISC', 0) + tot('IGV', t.igv) + tot('Otros Cargos', 0) +
            tot('Otros Tributos', 0) + tot('Importe Total', t.total) + '</table></div>' +
            (final ? '<div style="text-align:center;color:#555;font-size:11px;margin-top:6px;">SON: ' + esc(typeof numeroALetrasSoles === 'function' ? numeroALetrasSoles(t.total) : fmt(t.total)) +
                ' · Representación impresa de la Nota de Débito Electrónica generada en el SIMULADOR SUNAT (TAXLAB 360).</div>' : '') +
            '</div>';
    }

    function preliminar() {
        S.fecha = hoy();
        pintar(htmlComprobante(false, ''));
        if (typeof pintarEmisor === 'function') pintarEmisor();
    }

    function emitir() {
        var d = emisor();
        var key = 'taxlab_correlativo_nd_' + (d.ruc || 'anon') + '_' + S.serie;
        var st = typeof almacenFacturas === 'function' ? almacenFacturas() : sessionStorage;
        var n = (parseInt(st.getItem(key) || '0', 10) || 0) + 1;
        try { st.setItem(key, String(n)); } catch (e) {}
        var numero = S.serie + '-' + String(n).padStart(8, '0');
        var t = totales(), rc = receptor();
        pintar('<div id="nd-final">' + htmlComprobante(true, numero) + '</div>' +
            '<div class="factura-buttons-row">' + boton('nd-imp', 'window.print()', 'fa-print', '#006699', 'Imprimir') +
            boton('nd-otra', 'NotaDebito.abrir()', 'fa-plus-circle', '#006699', 'Emitir otra Nota de Débito') +
            boton('nd-fin', 'NotaDebito.salir()', 'fa-home', '#006699', 'Ir al inicio') + '</div>');
        if (typeof pintarEmisor === 'function') pintarEmisor();
        if (window.TaxComp) {
            TaxComp.registrar({
                tipo: 'Nota de Débito', numero: numero, fecha: S.fecha,
                receptor: rc.nombre, receptor_doc: (S.factura || S.docTipo === '6' ? 'RUC ' : 'Doc. ') + rc.doc,
                total: 'S/ ' + fmt(t.total), referencia: S.factura ? S.serie + '-' + S.correlativo : ''
            }, $('nd-paper'), $('nd-main'));
        }
        if (typeof mostrarToastExito === 'function') {
            mostrarToastExito('¡Nota de débito emitida!', 'Comprobante ' + numero + (S.factura ? ' que modifica la factura ' + S.serie + '-' + S.correlativo : '') + '.');
        }
    }

    // ------------------------------------------------------------------ API
    async function abrir() {
        mostrarWrapper();
        if (typeof cargarEmisor === 'function') { try { await cargarEmisor(); } catch (e) {} }
        S = nuevo();
        paso1();
        if (typeof cargarFacturasParaNota === 'function') cargarFacturasParaNota();
    }

    window.NotaDebito = {
        abrir: abrir, salir: salir, ocultar: ocultar,
        cambioTipo: function () { leer1(); S.aumentos = {}; paso1(); },
        cambioFactura: aplicarExclusion,
        cambioDocTipo: function () { $('nd-doc-num').value = ''; $('nd-doc-nombre').value = ''; aplicarExclusion(); },
        buscarReceptor: buscarReceptor,
        verFactura: verFactura, continuar: continuar,
        captura: captura, calcCaptura: calcCaptura, aceptarCaptura: aceptarCaptura, cerrarCaptura: cerrarCaptura,
        continuar2: continuar2,
        retroceder1: function () { paso1(); },
        retroceder2: function () { if (S.tipo === 'aumento') seleccion(); else paso1(); },
        emitir: emitir,
        estado: function () { return S; }
    };
    window.showEmitirNotaDebito = function () { abrir(); };
})();
