// ============================================================================
// mis_comprobantes.js · "Mis comprobantes del día" + descarga en PDF
// ----------------------------------------------------------------------------
// 1) TaxComp.registrar(meta, nodo): cada vez que se emite un comprobante
//    (factura, boleta, nota de crédito, GRE, recibo por honorarios, constancia
//    1609) se guarda una copia de su representación impresa y se agrega,
//    arriba del comprobante, un botón "Descargar comprobante (PDF)".
// 2) Gatito ayudante (abajo a la izquierda): lista los comprobantes que el
//    usuario generó HOY, para verlos o descargarlos uno por uno o todos juntos
//    en un solo PDF.
//
// Persistencia: SimStore con la clave 'sire_comprobantes_dia', es decir por la
// pareja (usuario, RUC) como el resto del avance. El gatito además lee (solo
// lectura) los de las otras empresas que el mismo usuario usó en esta
// computadora, para mostrar todo lo del día.
// PDF: html2canvas + jsPDF (cdnjs, se cargan solo al descargar).
// Se carga en tramites.html después de rxh.js.
// ============================================================================
(function () {
    'use strict';

    var CLAVE = 'sire_comprobantes_dia';
    var MAX_GUARDADOS = 60;          // por empresa
    var DIAS_GUARDADOS = 7;
    var URL_JSPDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    var URL_H2C = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

    function $(id) { return document.getElementById(id); }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function hoy() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    function sesion() { try { return JSON.parse(sessionStorage.getItem('sunat_auth') || '{}'); } catch (e) { return {}; } }
    function uid() { var s = sesion(); return s.usuario_id || s.id || 'anon'; }
    function empresa() {
        try {
            var e = JSON.parse(sessionStorage.getItem('sunat_empresa') || 'null');
            if (e && e.ruc) return { ruc: String(e.ruc), razon_social: e.razon_social || '' };
        } catch (x) {}
        var d = window.currentEmisorData || {};
        return { ruc: String(d.ruc || ''), razon_social: d.razon_social || '' };
    }
    function store() { return window.SimStore || sessionStorage; }
    function leer() { try { return JSON.parse(store().getItem(CLAVE) || '[]') || []; } catch (e) { return []; } }
    function guardar(lista) {
        try { store().setItem(CLAVE, JSON.stringify(lista)); }
        catch (e) {
            // Sin espacio: se conservan solo los de hoy
            try { store().setItem(CLAVE, JSON.stringify(lista.filter(function (x) { return x.dia === hoy(); }).slice(-20))); } catch (e2) {}
        }
    }

    // Todos los del día del usuario: los de la empresa activa + los de otras
    // empresas guardados en esta computadora (namespace sim_<uid>_<ruc>_...).
    function delDia() {
        var vistos = {}, out = [];
        function sumar(lista) {
            (lista || []).forEach(function (c) {
                if (!c || c.dia !== hoy() || vistos[c.id]) return;
                vistos[c.id] = 1; out.push(c);
            });
        }
        sumar(leer());
        try {
            var pref = 'sim_' + uid() + '_';
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && k.indexOf(pref) === 0 && k.slice(-CLAVE.length - 1) === '_' + CLAVE) {
                    try { sumar(JSON.parse(localStorage.getItem(k) || '[]')); } catch (e) {}
                }
            }
        } catch (e) {}
        try { sumar(JSON.parse(sessionStorage.getItem(CLAVE) || '[]')); } catch (e) {}
        return out.sort(function (a, b) { return a.emitido_en < b.emitido_en ? -1 : 1; });
    }

    // Copia limpia de la representación impresa (sin botones ni barras)
    function copiaLimpia(nodo) {
        var c = nodo.cloneNode(true);
        c.querySelectorAll('button, .tc-barra, .no-pdf, script, input[type="button"]').forEach(function (el) { el.remove(); });
        c.querySelectorAll('[onclick]').forEach(function (el) { el.removeAttribute('onclick'); });
        c.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
        c.removeAttribute('id');
        c.style.display = 'block';
        c.style.margin = '0';
        return c.outerHTML;
    }

    // ------------------------------------------------------------------ PDF
    function cargarScript(url) {
        return new Promise(function (ok, mal) {
            var s = document.createElement('script');
            s.src = url; s.onload = ok;
            s.onerror = function () { mal(new Error('No se pudo cargar ' + url)); };
            document.head.appendChild(s);
        });
    }
    async function libs() {
        if (!window.jspdf) await cargarScript(URL_JSPDF);
        if (!window.html2canvas) await cargarScript(URL_H2C);
    }

    async function lienzo(html) {
        var caja = document.createElement('div');
        caja.style.cssText = 'position:fixed;left:-12000px;top:0;width:860px;background:#fff;padding:24px;box-sizing:border-box;' +
            'font-family:Roboto,Arial,sans-serif;color:#222;';
        caja.innerHTML = html;
        document.body.appendChild(caja);
        try {
            await new Promise(function (r) { setTimeout(r, 60); });
            return await window.html2canvas(caja, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
        } finally { caja.remove(); }
    }

    function pegarEnPdf(doc, canvas, primera) {
        var anchoMm = 190, altoPag = 277;                     // A4 con márgenes de 10 mm
        var mmPorPx = anchoMm / canvas.width;
        var altoTotalMm = canvas.height * mmPorPx;
        var pxPorPag = Math.floor(altoPag / mmPorPx);
        var y = 0, pag = 0;
        while (y < canvas.height) {
            var alto = Math.min(pxPorPag, canvas.height - y);
            var trozo = document.createElement('canvas');
            trozo.width = canvas.width; trozo.height = alto;
            trozo.getContext('2d').drawImage(canvas, 0, y, canvas.width, alto, 0, 0, canvas.width, alto);
            if (!(primera && pag === 0)) doc.addPage();
            doc.addImage(trozo.toDataURL('image/jpeg', 0.92), 'JPEG', 10, 10, anchoMm, alto * mmPorPx);
            y += alto; pag++;
        }
        return altoTotalMm;
    }

    function nombreArchivo(t) { return String(t || 'Comprobante').replace(/[^A-Za-z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, '_').replace(/_+/g, '_'); }

    async function pdfDe(htmls, nombre, boton) {
        var txt = boton ? boton.innerHTML : '';
        if (boton) { boton.disabled = true; boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando PDF...'; }
        try {
            await libs();
            var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
            for (var i = 0; i < htmls.length; i++) {
                var cv = await lienzo(htmls[i]);
                pegarEnPdf(doc, cv, i === 0);
            }
            doc.save(nombreArchivo(nombre) + '.pdf');
        } catch (e) {
            console.error(e);
            alert('No se pudo generar el PDF (¿sin conexión a internet?). Puede usar el botón Imprimir y elegir "Guardar como PDF".');
        } finally {
            if (boton) { boton.disabled = false; boton.innerHTML = txt; }
        }
    }

    function encabezado(c) {
        return '<div style="font-size:11px;color:#666;border-bottom:1px solid #ddd;padding-bottom:6px;margin-bottom:12px;">' +
            'LABORATORIO TRIBUTARIO CERTUS · ' + esc(c.tipo) + ' ' + esc(c.numero) + ' · Emisor: ' + esc(c.emisor) +
            ' (RUC ' + esc(c.emisor_ruc) + ') · Generado: ' + new Date(c.emitido_en).toLocaleString('es-PE') + '</div>';
    }

    // ------------------------------------------------------------------ registro
    function registrar(meta, nodo, barraEn) {
        if (!nodo) return null;
        var emp = empresa();
        var c = {
            id: Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            dia: hoy(), emitido_en: new Date().toISOString(),
            tipo: meta.tipo || 'Comprobante', numero: meta.numero || '', fecha: meta.fecha || '',
            emisor_ruc: meta.emisor_ruc || emp.ruc, emisor: meta.emisor || emp.razon_social,
            receptor: meta.receptor || '', receptor_doc: meta.receptor_doc || '', total: meta.total || '',
            referencia: meta.referencia || '',
            html: copiaLimpia(nodo)
        };
        var limite = new Date(Date.now() - DIAS_GUARDADOS * 864e5).toISOString().slice(0, 10);
        var lista = leer().filter(function (x) { return x.dia >= limite; });
        lista.push(c);
        guardar(lista.slice(-MAX_GUARDADOS));
        barraDescarga(barraEn || nodo, c);
        pintarContador();
        return c;
    }

    function barraDescarga(nodo, c) {
        var vieja = nodo.querySelector(':scope > .tc-barra');
        if (vieja) vieja.remove();
        var b = document.createElement('div');
        b.className = 'tc-barra no-pdf';
        b.innerHTML = '<span><i class="fas fa-check-circle" style="color:#2e7d32;"></i> Comprobante generado: <b>' + esc(c.tipo) + ' ' + esc(c.numero) + '</b></span>' +
            '<button type="button" class="tc-btn tc-btn-pri"><i class="fas fa-file-pdf"></i> Descargar comprobante (PDF)</button>' +
            '<button type="button" class="tc-btn tc-btn-sec"><span class="tc-mini-gato">🐱</span> Mis comprobantes del día</button>';
        b.querySelector('.tc-btn-pri').onclick = function () { descargar(c, this); };
        b.querySelector('.tc-btn-sec').onclick = abrirPanel;
        nodo.insertBefore(b, nodo.firstChild);
    }

    function descargar(c, boton) {
        return pdfDe([encabezado(c) + c.html], c.tipo + '_' + c.numero, boton);
    }

    function descargarNodo(nodo, nombre, boton) {
        if (!nodo) return;
        return pdfDe([copiaLimpia(nodo)], nombre, boton);
    }

    // ------------------------------------------------------------------ gatito
    var CSS = [
        '.tc-barra{display:flex;flex-wrap:wrap;align-items:center;gap:10px;background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;',
        'padding:10px 14px;margin:0 0 14px;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#1b5e20;}',
        '.tc-barra span:first-child{flex:1 1 220px;}',
        '.tc-btn{border:none;border-radius:6px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;',
        'width:auto!important;height:auto!important;min-width:0!important;flex:0 0 auto;white-space:nowrap;line-height:1.2;margin:0;}',
        '.tc-btn-pri{background:#c62828;color:#fff;}.tc-btn-pri:hover{background:#a51d1d;}',
        '.tc-btn-sec{background:#004B91;color:#fff;}.tc-btn-sec:hover{background:#003a72;}',
        '.tc-btn[disabled]{opacity:.6;cursor:wait;}',
        '#tc-fab{position:fixed;left:20px;bottom:20px;z-index:99990;display:flex;align-items:center;gap:10px;background:#ff8f00;color:#fff;',
        'padding:6px 16px 6px 6px;border-radius:40px;cursor:pointer;font-family:Roboto,Arial,sans-serif;font-weight:700;font-size:14px;',
        'border:2px solid #fff;box-shadow:0 8px 22px rgba(0,0,0,.28);transition:transform .15s;}',
        '#tc-fab:hover{transform:translateY(-2px) scale(1.03);}',
        '#tc-fab .tc-cara{width:48px;height:48px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:30px;',
        'position:relative;animation:tc-mov 3.2s ease-in-out infinite;}',
        '#tc-fab .tc-num{position:absolute;top:-4px;right:-6px;background:#c62828;color:#fff;border-radius:10px;min-width:20px;height:20px;',
        'font-size:11px;display:flex;align-items:center;justify-content:center;padding:0 5px;border:2px solid #fff;}',
        '#tc-fab small{display:block;font-weight:400;font-size:10.5px;opacity:.92;margin-top:2px;}',
        '@keyframes tc-mov{0%,100%{transform:rotate(0)}10%{transform:rotate(-10deg)}20%{transform:rotate(8deg)}30%{transform:rotate(0)}}',
        '#tc-ov{position:fixed;inset:0;z-index:100002;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;}',
        '#tc-modal{background:#fff;width:100%;max-width:920px;max-height:92vh;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;',
        'font-family:Roboto,Arial,sans-serif;box-shadow:0 25px 60px rgba(0,0,0,.45);}',
        '#tc-modal .tc-head{background:#ff8f00;color:#fff;padding:12px 18px;display:flex;align-items:center;gap:12px;}',
        '#tc-modal .tc-head .tc-cara{width:40px;height:40px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;}',
        '#tc-modal .tc-head b{font-size:16px;}#tc-modal .tc-head span{display:block;font-size:12px;opacity:.95;}',
        '#tc-modal .tc-x{margin-left:auto;background:none;border:none;color:#fff;font-size:26px;cursor:pointer;line-height:1;}',
        '#tc-modal .tc-body{overflow:auto;padding:14px 18px;}',
        '#tc-modal table{width:100%;border-collapse:collapse;font-size:12.5px;}',
        '#tc-modal th{background:#FFF3E0;color:#7C4A03;text-align:left;padding:7px;font-weight:600;}',
        '#tc-modal td{border-bottom:1px solid #eee;padding:7px;vertical-align:top;}',
        '#tc-modal .tc-acc button{margin:0 4px 4px 0;padding:5px 10px;font-size:12px;}',
        '#tc-modal .tc-pie{padding:10px 18px;border-top:1px solid #eee;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;}',
        '#tc-modal .tc-vacio{text-align:center;padding:30px 10px;color:#666;font-size:13.5px;line-height:1.6;}',
        '#tc-modal .tc-ver{border:1px solid #ddd;border-radius:8px;padding:14px;background:#fafafa;}',
        '@media (max-width:640px){#tc-fab .tc-txt{display:none;}#tc-fab{padding:6px;}#tc-modal th:nth-child(4),#tc-modal td:nth-child(4){display:none;}}',
        '@media print{#tc-fab,#tc-ov,.tc-barra{display:none!important;}}'
    ].join('');

    function pintarContador() {
        var n = delDia().length, el = $('tc-num');
        if (!el) return;
        el.textContent = n;
        el.style.display = n ? 'flex' : 'none';
    }

    function montarGatito() {
        if ($('tc-fab')) return;
        var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
        var f = document.createElement('div');
        f.id = 'tc-fab';
        f.title = 'Ver y descargar los comprobantes que generaste hoy';
        f.innerHTML = '<div class="tc-cara">🐱<span class="tc-num" id="tc-num" style="display:none;">0</span></div>' +
            '<div class="tc-txt">Mis comprobantes<small>Ver y descargar los de hoy</small></div>';
        f.onclick = abrirPanel;
        document.body.appendChild(f);
        pintarContador();
    }

    function cerrarPanel() { var o = $('tc-ov'); if (o) o.remove(); }

    function abrirPanel() {
        cerrarPanel();
        var lista = delDia();
        var ov = document.createElement('div');
        ov.id = 'tc-ov';
        ov.onclick = function (e) { if (e.target === ov) cerrarPanel(); };
        var cuerpo = lista.length
            ? '<table><tr><th>Hora</th><th>Comprobante</th><th>Emisor</th><th>Cliente / usuario</th><th style="text-align:right;">Total</th><th></th></tr>' +
              lista.slice().reverse().map(function (c) {
                  return '<tr><td>' + new Date(c.emitido_en).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) + '</td>' +
                      '<td><b>' + esc(c.tipo) + '</b><br>' + esc(c.numero) + (c.referencia ? '<br><span style="color:#888;">Modifica ' + esc(c.referencia) + '</span>' : '') + '</td>' +
                      '<td>' + esc(c.emisor) + '<br><span style="color:#888;">RUC ' + esc(c.emisor_ruc) + '</span></td>' +
                      '<td>' + esc(c.receptor || '-') + (c.receptor_doc ? '<br><span style="color:#888;">' + esc(c.receptor_doc) + '</span>' : '') + '</td>' +
                      '<td style="text-align:right;white-space:nowrap;">' + esc(c.total || '-') + '</td>' +
                      '<td class="tc-acc" style="white-space:nowrap;"><button type="button" class="tc-btn tc-btn-sec" data-ver="' + esc(c.id) + '"><i class="fas fa-eye"></i> Ver</button>' +
                      '<button type="button" class="tc-btn tc-btn-pri" data-pdf="' + esc(c.id) + '"><i class="fas fa-download"></i> PDF</button></td></tr>';
              }).join('') + '</table>'
            : '<div class="tc-vacio">🐱 Todavía no has generado comprobantes hoy.<br>Cuando emitas una factura, boleta, nota de crédito, guía de remisión o ' +
              'recibo por honorarios, aparecerá aquí para que lo descargues.</div>';
        ov.innerHTML = '<div id="tc-modal"><div class="tc-head"><div class="tc-cara">🐱</div><div><b>Mis comprobantes de hoy</b>' +
            '<span>' + new Date().toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) +
            ' · ' + lista.length + ' comprobante' + (lista.length === 1 ? '' : 's') + '</span></div>' +
            '<button type="button" class="tc-x" title="Cerrar">&times;</button></div>' +
            '<div class="tc-body" id="tc-body">' + cuerpo + '</div>' +
            '<div class="tc-pie">' + (lista.length ? '<button type="button" class="tc-btn tc-btn-pri" id="tc-todos"><i class="fas fa-file-pdf"></i> Descargar todos en un PDF</button>' : '') +
            '<button type="button" class="tc-btn" style="background:#eee;color:#333;" id="tc-cerrar">Cerrar</button></div></div>';
        document.body.appendChild(ov);
        ov.querySelector('.tc-x').onclick = cerrarPanel;
        $('tc-cerrar').onclick = cerrarPanel;
        if ($('tc-todos')) $('tc-todos').onclick = function () {
            pdfDe(lista.map(function (c) { return encabezado(c) + c.html; }), 'Comprobantes_del_dia_' + hoy(), this);
        };
        ov.querySelectorAll('[data-pdf]').forEach(function (b) {
            b.onclick = function () { var c = lista.find(function (x) { return x.id === b.getAttribute('data-pdf'); }); if (c) descargar(c, b); };
        });
        ov.querySelectorAll('[data-ver]').forEach(function (b) {
            b.onclick = function () {
                var c = lista.find(function (x) { return x.id === b.getAttribute('data-ver'); });
                if (!c) return;
                $('tc-body').innerHTML = '<div style="margin-bottom:10px;"><button type="button" class="tc-btn" style="background:#eee;color:#333;" id="tc-volver">' +
                    '<i class="fas fa-arrow-left"></i> Volver a la lista</button> <button type="button" class="tc-btn tc-btn-pri" id="tc-pdf1">' +
                    '<i class="fas fa-download"></i> Descargar PDF</button></div><div class="tc-ver">' + c.html + '</div>';
                $('tc-volver').onclick = abrirPanel;
                $('tc-pdf1').onclick = function () { descargar(c, this); };
            };
        });
    }

    // ------------------------------------------------------------------ GRE
    // La GRE (gre_emision.js) ya tiene su PDF propio; aquí solo se registra para
    // el gatito, con la vista previa como representación impresa.
    function engancharGRE() {
        if (!window.GRE || !GRE.emitir || GRE.__tc) return;
        var orig = GRE.emitir;
        GRE.emitir = function () {
            var r = orig.apply(this, arguments);
            try {
                var S = GRE.estado ? GRE.estado() : {}, prev = $('gre-preview');
                if (S && S.emitida && prev) {
                    var tmp = document.createElement('div');
                    tmp.innerHTML = '<div style="font-size:16px;font-weight:700;color:#1E395B;margin-bottom:8px;">GUÍA DE REMISIÓN ELECTRÓNICA REMITENTE ' +
                        esc(S.emitida.numero) + '</div>' + prev.innerHTML;
                    registrar({
                        tipo: 'Guía de Remisión Remitente', numero: S.emitida.numero, fecha: S.emitida.fecha,
                        receptor: (S.destinatario || {}).razonSocial || '', receptor_doc: (S.destinatario || {}).numDoc || ''
                    }, tmp);
                }
            } catch (e) { console.warn('No se pudo registrar la GRE en Mis comprobantes:', e); }
            return r;
        };
        GRE.__tc = true;
    }

    window.TaxComp = {
        registrar: registrar,
        descargar: descargar,
        descargarNodo: descargarNodo,
        abrirPanel: abrirPanel,
        delDia: delDia
    };

    function iniciar() { montarGatito(); engancharGRE(); setTimeout(engancharGRE, 1500); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();
