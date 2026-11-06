// ============================================================================
// reporte_dia.js · "Acumulado del día": todo lo que el usuario hizo HOY
// ----------------------------------------------------------------------------
// Junta en un solo PDF, de TODAS las empresas con las que trabajó hoy:
//   1) Comprobantes emitidos en SEE - SOL (factura, boleta, NC, ND, GRE,
//      recibo por honorarios, constancia 1609). Los registra mis_comprobantes.js
//      en SimStore con la clave 'sire_comprobantes_dia'.
//   2) Declaraciones presentadas (FV 621 y FV 710). Las registra finalizar.js
//      (HistorialSim) en 'taxlab_hist_decl_<usuario>_<AAAAMMDD>'.
//   3) Bitácora: SIRE (generación de registros), ajustes posteriores y otras
//      acciones, en 'taxlab_bitacora_<usuario>_<AAAAMMDD>'.
//
// Se usa al pulsar "Finalizar simulación" / "Terminar simulación":
//   ReporteDia.anexar(doc)   agrega las páginas del acumulado a un PDF jsPDF
//   ReporteDia.descargar()   descarga el acumulado como PDF propio
//   ReporteDia.registrar(e)  anota una acción en la bitácora del día
//
// La bitácora va en localStorage (no en SimStore) porque reúne varias
// empresas: SimStore guarda por la pareja (usuario, RUC). Es un resumen del
// día que se borra solo a los 7 días; no reemplaza al avance.
// ============================================================================
(function () {
    'use strict';
    if (window.ReporteDia) return;

    var DIAS_GUARDADOS = 7;
    var CLAVE_COMP = 'sire_comprobantes_dia';

    function sesion() { try { return JSON.parse(sessionStorage.getItem('sunat_auth') || '{}') || {}; } catch (e) { return {}; } }
    function empresaActiva() { try { return JSON.parse(sessionStorage.getItem('sunat_empresa') || 'null') || {}; } catch (e) { return {}; } }
    function uid() { var s = sesion(); return s.usuario_id || s.id || null; }
    function estudiante() { try { return (sessionStorage.getItem('taxlab_estudiante') || '').trim(); } catch (e) { return ''; } }
    function dosD(n) { return String(n).padStart(2, '0'); }
    function hoyISO() { var d = new Date(); return d.getFullYear() + '-' + dosD(d.getMonth() + 1) + '-' + dosD(d.getDate()); }
    function hoyCompacto() { return hoyISO().replace(/-/g, ''); }
    function hhmm(d) { return dosD(d.getHours()) + ':' + dosD(d.getMinutes()); }

    // Misma identificación que HistorialSim (finalizar.js)
    function uidHistorial() {
        var u = sesion();
        if (u.usuario_id || u.id) return 'u' + (u.usuario_id || u.id);
        var est = estudiante();
        if (est && est.toUpperCase() !== 'USER') return 'e' + est.replace(/\s+/g, '_');
        return 'anon';
    }

    function leerJSON(st, k) { try { return JSON.parse(st.getItem(k) || '[]') || []; } catch (e) { return []; } }

    // ------------------------------------------------------------ bitácora
    function claveBitacora(dia) { return 'taxlab_bitacora_' + (uid() || 'anon') + '_' + (dia || hoyCompacto()); }

    function limpiarViejas() {
        try {
            var limite = new Date(Date.now() - DIAS_GUARDADOS * 864e5);
            var lim = limite.getFullYear() + dosD(limite.getMonth() + 1) + dosD(limite.getDate());
            for (var i = localStorage.length - 1; i >= 0; i--) {
                var k = localStorage.key(i);
                var m = k && k.match(/^taxlab_(?:bitacora|hist_decl)_.+_(\d{8})$/);
                if (m && m[1] < lim) localStorage.removeItem(k);
            }
        } catch (e) {}
    }

    /** Anota una acción del día. e = { modulo, accion, detalle, ruc, razon, monto, clave }
     *  'clave' evita duplicados: si ya existe una entrada con la misma clave, se reemplaza. */
    function registrar(e) {
        if (!e) return;
        var emp = empresaActiva();
        var ahora = new Date();
        var ent = {
            modulo: e.modulo || '', accion: e.accion || '', detalle: e.detalle || '',
            ruc: String(e.ruc || emp.ruc || ''), razon: e.razon || emp.razon_social || '',
            monto: (e.monto == null || e.monto === '') ? null : Number(e.monto),
            clave: e.clave || null,
            hora: hhmm(ahora),
            en: ahora.toISOString()
        };
        try {
            var k = claveBitacora();
            var lista = leerJSON(localStorage, k);
            var i = ent.clave ? lista.findIndex(function (x) { return x.clave === ent.clave; }) : -1;
            if (i >= 0) lista[i] = ent; else lista.push(ent);
            localStorage.setItem(k, JSON.stringify(lista.slice(-200)));
            limpiarViejas();
        } catch (err) { /* sin almacenamiento: el reporte saldrá sin esta acción */ }
    }

    // ------------------------------------------------------------ recopilar
    function comprobantesDelDia() {
        if (window.TaxComp && typeof window.TaxComp.delDia === 'function') {
            try { return window.TaxComp.delDia(); } catch (e) {}
        }
        var hoy = hoyISO(), vistos = {}, out = [];
        function sumar(lista) {
            (lista || []).forEach(function (c) {
                if (!c || c.dia !== hoy || vistos[c.id]) return;
                vistos[c.id] = 1; out.push(c);
            });
        }
        try {
            var pref = 'sim_' + (uid() || 'anon') + '_';
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && k.indexOf(pref) === 0 && k.slice(-CLAVE_COMP.length - 1) === '_' + CLAVE_COMP) sumar(leerJSON(localStorage, k));
            }
        } catch (e) {}
        try { sumar(leerJSON(sessionStorage, CLAVE_COMP)); } catch (e) {}
        return out.sort(function (a, b) { return a.emitido_en < b.emitido_en ? -1 : 1; });
    }

    function declaracionesDelDia() {
        if (window.HistorialSim && typeof window.HistorialSim.delDia === 'function') {
            try { return window.HistorialSim.delDia(); } catch (e) {}
        }
        return leerJSON(localStorage, 'taxlab_hist_decl_' + uidHistorial() + '_' + hoyCompacto());
    }

    function bitacoraDelDia() { try { return leerJSON(localStorage, claveBitacora()); } catch (e) { return []; } }

    function recopilar() {
        var comp = comprobantesDelDia(), decl = declaracionesDelDia(), bit = bitacoraDelDia();
        var empresas = {};
        function anotar(ruc, razon) {
            ruc = String(ruc || '').trim(); if (!ruc) return;
            if (!(ruc in empresas) || (!empresas[ruc] && razon)) empresas[ruc] = razon || '';
        }
        comp.forEach(function (c) { anotar(c.emisor_ruc, c.emisor); });
        decl.forEach(function (d) { anotar(d.ruc, d.razon); });
        bit.forEach(function (b) { anotar(b.ruc, b.razon); });
        var act = empresaActiva(); if (act.ruc) anotar(act.ruc, act.razon_social);
        return { comprobantes: comp, declaraciones: decl, bitacora: bit, empresas: empresas };
    }

    // ------------------------------------------------------------------ PDF
    var AZUL = [30, 57, 91];
    function soles(n) {
        var v = Number(String(n == null ? '' : n).replace(/[^0-9.\-]/g, ''));
        if (!isFinite(v) || String(n).trim() === '') return '-';
        return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function dibujar(doc) {
        var datos = recopilar();
        var u = sesion();
        var ahora = new Date();
        var y = 0;

        function pie() {
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(120, 120, 120);
            doc.text('Simulador de prueba | Elaborado por el Equipo Académico de Contabilidad CERTUS', 105, 290, { align: 'center' });
            doc.setTextColor(40, 40, 40);
        }
        function nuevaPagina() { pie(); doc.addPage(); y = 18; }
        function espacio(h) { if (y + h > 280) nuevaPagina(); }
        function trunc(txt, maxW) {
            txt = String(txt == null || txt === '' ? '-' : txt);
            if (doc.getTextWidth(txt) <= maxW) return txt;
            while (txt.length > 1 && doc.getTextWidth(txt + '...') > maxW) txt = txt.slice(0, -1);
            return txt + '...';
        }
        function titulo(t) {
            espacio(16);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(AZUL[0], AZUL[1], AZUL[2]);
            doc.text(t, 15, y);
            doc.setDrawColor(AZUL[0], AZUL[1], AZUL[2]); doc.setLineWidth(0.4); doc.line(15, y + 1.5, 195, y + 1.5);
            doc.setTextColor(40, 40, 40); y += 8;
        }
        // cols: [{t, x, w, r}]
        function tabla(cols, filas, vacio) {
            function cab() {
                doc.setFillColor(232, 238, 245); doc.rect(14, y - 4.2, 182, 6, 'F');
                doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
                cols.forEach(function (c) { doc.text(c.t, c.r ? c.x + c.w : c.x, y, c.r ? { align: 'right' } : undefined); });
                y += 6;
            }
            espacio(14); cab();
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
            if (!filas.length) { doc.setTextColor(110, 110, 110); doc.text(vacio, 15, y); doc.setTextColor(40, 40, 40); y += 7; return; }
            filas.forEach(function (f) {
                // Las columnas con wrap saltan de línea (hasta 3); las demás se recortan
                var celdas = cols.map(function (c, i) {
                    var txt = String(f[i] == null || f[i] === '' ? '-' : f[i]);
                    return c.wrap ? doc.splitTextToSize(txt, c.w).slice(0, 3) : [trunc(txt, c.w)];
                });
                var lineas = Math.max.apply(null, celdas.map(function (x) { return x.length; }));
                if (y + 4 * (lineas - 1) > 278) { nuevaPagina(); cab(); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); }
                cols.forEach(function (c, i) {
                    doc.text(celdas[i], c.r ? c.x + c.w : c.x, y, c.r ? { align: 'right' } : undefined);
                });
                y += 5.6 + 4 * (lineas - 1);
            });
            y += 3;
        }

        // Encabezado
        doc.setFillColor(AZUL[0], AZUL[1], AZUL[2]); doc.rect(0, 0, 210, 26, 'F');
        doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
        doc.text('LABORATORIO TRIBUTARIO CERTUS', 105, 11, { align: 'center' });
        doc.setFontSize(11);
        doc.text('Acumulado del día – ' + ahora.toLocaleDateString('es-PE'), 105, 19, { align: 'center' });
        doc.setTextColor(40, 40, 40); y = 36;

        // Datos del usuario
        titulo('Datos del usuario');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text('Realizado por: ' + (estudiante() || 'USER'), 15, y); y += 6;
        if (u.usuario) { doc.text('Usuario: ' + u.usuario + (u.rol ? '   ·   Perfil: ' + u.rol : ''), 15, y); y += 6; }
        doc.text('Fecha y hora del reporte: ' + ahora.toLocaleString('es-PE'), 15, y); y += 9;

        // Resumen
        titulo('Resumen del día');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        var porTipo = {};
        datos.comprobantes.forEach(function (c) { porTipo[c.tipo || 'Comprobante'] = (porTipo[c.tipo || 'Comprobante'] || 0) + 1; });
        var detalleTipos = Object.keys(porTipo).map(function (k) { return porTipo[k] + ' ' + k; }).join(', ');
        var lineasComp = doc.splitTextToSize('Comprobantes emitidos: ' + datos.comprobantes.length +
            (detalleTipos ? '  (' + detalleTipos + ')' : ''), 180);
        doc.text(lineasComp, 15, y);
        y += 5 * lineasComp.length + 1;
        doc.text('Declaraciones presentadas: ' + datos.declaraciones.length, 15, y); y += 6;
        doc.text('Otras acciones (SIRE, ajustes, etc.): ' + datos.bitacora.length, 15, y); y += 6;
        var rucs = Object.keys(datos.empresas);
        doc.text('Empresas con las que trabajó: ' + rucs.length, 15, y); y += 6;
        doc.setFontSize(9);
        rucs.forEach(function (r) {
            espacio(6);
            doc.text('•  ' + r + '  ' + trunc(datos.empresas[r] || '', 150), 19, y); y += 5;
        });
        y += 4;

        // 1) Comprobantes
        titulo('1. Comprobantes emitidos en SEE - SOL');
        tabla([
            { t: 'N°', x: 15, w: 6 }, { t: 'Hora', x: 22, w: 11 }, { t: 'Tipo', x: 34, w: 34 }, { t: 'Número', x: 69, w: 26 },
            { t: 'Emisor (RUC)', x: 96, w: 22 }, { t: 'Receptor', x: 119, w: 52, wrap: true }, { t: 'Total S/', x: 172, w: 23, r: true }
        ], datos.comprobantes.map(function (c, i) {
            var h = c.emitido_en ? hhmm(new Date(c.emitido_en)) : '';
            return [i + 1, h, c.tipo, c.numero, c.emisor_ruc, c.receptor || c.receptor_doc, soles(c.total)];
        }), 'No se emitieron comprobantes hoy.');

        // 2) Declaraciones
        titulo('2. Declaraciones presentadas');
        var totalDecl = 0;
        tabla([
            { t: 'N°', x: 15, w: 6 }, { t: 'Hora', x: 22, w: 11 }, { t: 'Formulario', x: 34, w: 22 }, { t: 'Período', x: 57, w: 18 },
            { t: 'N° Orden', x: 76, w: 28 }, { t: 'RUC', x: 105, w: 22 }, { t: 'Contribuyente', x: 128, w: 43, wrap: true }, { t: 'Monto S/', x: 172, w: 23, r: true }
        ], datos.declaraciones.map(function (d, i) {
            if (d.monto != null && isFinite(Number(d.monto))) totalDecl += Number(d.monto);
            var form = d.form ? 'FV ' + String(d.form).replace(/^0+/, '') : (d.modulo || '-');
            return [i + 1, d.hora, form, d.periodo, d.orden, d.ruc, d.razon, d.monto == null ? '-' : soles(d.monto)];
        }), 'No se presentaron declaraciones hoy.');
        if (datos.declaraciones.length) {
            espacio(7);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
            doc.text('Total declarado: S/ ' + soles(totalDecl), 195, y - 1, { align: 'right' }); y += 6;
        }

        // 3) Bitácora
        titulo('3. SIRE y otras acciones');
        tabla([
            { t: 'N°', x: 15, w: 6 }, { t: 'Hora', x: 22, w: 11 }, { t: 'Módulo', x: 34, w: 24 }, { t: 'Acción', x: 59, w: 54, wrap: true },
            { t: 'Detalle', x: 114, w: 58, wrap: true }, { t: 'RUC', x: 173, w: 22 }
        ], datos.bitacora.map(function (b, i) {
            return [i + 1, b.hora, b.modulo, b.accion, b.detalle, b.ruc];
        }), 'Sin otras acciones registradas hoy.');

        pie();
        return datos;
    }

    function asegurarJsPDF() {
        return new Promise(function (ok, mal) {
            if (window.jspdf) return ok();
            var s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            s.onload = function () { ok(); };
            s.onerror = function () { mal(new Error('No se pudo cargar el generador de PDF.')); };
            document.head.appendChild(s);
        });
    }

    window.ReporteDia = {
        registrar: registrar,
        recopilar: recopilar,
        /** Agrega las páginas del acumulado al final de un PDF jsPDF ya armado. */
        anexar: function (doc) {
            try { doc.addPage(); dibujar(doc); return true; }
            catch (e) { console.warn('Acumulado del día:', e); return false; }
        },
        /** Descarga el acumulado del día como PDF propio. */
        descargar: async function () {
            try { await asegurarJsPDF(); }
            catch (e) { alert('No se pudo cargar el generador de PDF. Revisa tu conexión a internet e inténtalo de nuevo.'); return false; }
            var doc = new window.jspdf.jsPDF();
            dibujar(doc);
            var slug = (estudiante() || 'USER').replace(/[^A-Za-z0-9]+/g, '_').slice(0, 30);
            doc.save('Acumulado_del_dia_' + slug + '_' + hoyISO() + '.pdf');
            return true;
        }
    };
})();
