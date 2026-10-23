/* finalizar.js - Botón "Finalizar simulación" para los módulos que no son SIRE.
 *
 * Genera un reporte PDF de la simulación (al estilo del que ya produce el SIRE
 * en rvie.js) y luego regresa al portal SOL. survey.js intercepta el clic por el
 * texto del botón, muestra la encuesta y, al cerrarla, deja continuar este
 * manejador (que descarga el PDF y navega).
 *
 * El SIRE (rvie/rce/reemplazo) NO usa este archivo: tiene su propio flujo.
 */
(function () {
    // Cargar jsPDF si la página no lo incluye
    if (typeof window.jspdf === 'undefined' && !document.querySelector('script[src*="jspdf"]')) {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(s);
    }

    // ------------------------------------------------------------------------
    // Historial de declaraciones del DIA (persistente entre páginas).
    // Se guarda en localStorage por usuario + fecha, para que al "Finalizar
    // simulación" se pueda armar UN solo reporte con todo lo declarado hoy.
    // ------------------------------------------------------------------------
    window.HistorialSim = window.HistorialSim || (function () {
        function uid() {
            try {
                var u = JSON.parse(sessionStorage.getItem('sunat_auth') || '{}');
                if (u && (u.usuario_id || u.id)) return 'u' + (u.usuario_id || u.id);
            } catch (e) {}
            try {
                var est = (sessionStorage.getItem('taxlab_estudiante') || '').trim();
                if (est && est.toUpperCase() !== 'USER') return 'e' + est.replace(/\s+/g, '_');
            } catch (e) {}
            return 'anon';
        }
        function hoy() {
            var d = new Date();
            return '' + d.getFullYear() +
                   String(d.getMonth() + 1).padStart(2, '0') +
                   String(d.getDate()).padStart(2, '0');
        }
        function key() { return 'taxlab_hist_decl_' + uid() + '_' + hoy(); }
        function leer() { try { return JSON.parse(localStorage.getItem(key()) || '[]') || []; } catch (e) { return []; } }
        function guardar(a) { try { localStorage.setItem(key(), JSON.stringify(a)); } catch (e) {} }
        function firma(e) { return [e.modulo, e.form, e.periodo, e.orden].join('|'); }
        return {
            // Agrega (o reemplaza si es la misma declaración) una entrada del día
            registrar: function (e) {
                if (!e) return;
                var a = leer();
                var f = firma(e);
                var i = -1;
                for (var k = 0; k < a.length; k++) { if (firma(a[k]) === f) { i = k; break; } }
                if (i >= 0) a[i] = e; else a.push(e);
                guardar(a);
                return a;
            },
            delDia: function () { return leer(); },
            limpiarDia: function () { guardar([]); }
        };
    })();

    // Módulo según el nombre del archivo (coincide con detectarModuloActual de survey.js)
    function detectarModulo() {
        const p = window.location.pathname.toLowerCase();
        if (p.includes('declaraciones')) return 'FV 621';
        if (p.includes('renta') || p.includes('dashboard')) return 'FV 710';
        if (p.includes('comprobantes') || p.includes('tramites')) return 'CDP - SEE SOL';
        if (p.includes('ajustes')) return 'Ajustes Posteriores';
        return 'Laboratorio Tributario';
    }

    const val = id => { const el = document.getElementById(id); return el ? (el.value || el.textContent || '').trim() : ''; };

    // Reúne las filas del reporte propias de cada módulo
    function datosDelModulo(modulo) {
        if (modulo === 'FV 621') {
            return {
                titulo: 'Reporte de Simulación – Declaración Mensual FV 621',
                filas: [
                    ['Período declarado', val('periodo-input') || '—'],
                    ['Tipo de declaración', val('tipo-declaracion') || '—'],
                    ['Tipo de moneda', val('tipo-moneda') || '—'],
                    ['Casilla 100 (ventas gravadas)', val('c100') || '0.00'],
                    ['Casilla 140 (IGV a pagar / saldo)', val('c140') || '0.00'],
                    ['Importe total a pagar', val('importe-total') || 's/. 0.00']
                ],
                documentos: ['Constancia de Presentación del Formulario Virtual 621']
            };
        }
        if (modulo === 'FV 710') {
            const u = window.ultimoPago710;
            const f = n => 'S/ ' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
            const filas = [['Formulario', 'Formulario Virtual 710 – Renta Anual Empresas']];
            if (u) {
                filas.push(['Ejercicio declarado', String(u.record.ejercicio)]);
                filas.push(['Régimen', u.regimen === 'MYPE' ? 'Régimen MYPE Tributario' : 'Régimen General']);
                filas.push(['UIT del ejercicio', f(u.uit)]);
                filas.push(['Renta neta imponible (casilla 110)', f(u.rentaNeta)]);
                filas.push(['Impuesto resultante (casilla 113)', f(u.impuesto)]);
                filas.push(['Importe pagado (casilla 180)', f(u.record.monto)]);
                filas.push(['Medio de pago', u.record.medio]);
                filas.push(['Número de orden', u.record.orden]);
            } else {
                filas.push(['Estado', 'Sin declaración presentada en esta simulación']);
            }
            return {
                titulo: 'Reporte de Simulación – Renta Anual FV 710',
                filas: filas,
                documentos: ['Constancia de Presentación de la Declaración Anual (FV 710)']
            };
        }
        if (modulo === 'CDP - SEE SOL') {
            return {
                titulo: 'Reporte de Simulación – Comprobantes de Pago (SEE - SOL)',
                filas: [
                    ['RUC consultado', val('ruc-input') || '—'],
                    ['Razón social', val('razon-social-display') || '—']
                ],
                documentos: ['Comprobante de Pago Electrónico emitido (SEE - SOL)']
            };
        }
        if (modulo === 'Ajustes Posteriores') {
            const tbody = document.querySelector('#tabla tbody');
            const nFilas = tbody ? tbody.rows.length : 0;
            return {
                titulo: 'Reporte de Simulación – Editor de Ajustes Posteriores',
                filas: [
                    ['RUC', val('txtRuc') || '—'],
                    ['Razón social', val('txtDenom') || '—'],
                    ['Comprobantes en el editor', String(nFilas)]
                ],
                documentos: ['Archivo plano de Ajustes Posteriores']
            };
        }
        return { titulo: 'Reporte de Simulación', filas: [], documentos: [] };
    }

    function generarReportePDF(modulo) {
        if (typeof window.jspdf === 'undefined') return false;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let usuario = {};
        try { usuario = JSON.parse(sessionStorage.getItem('sunat_auth') || '{}'); } catch (e) {}
        // Empresa elegida en la Clave SOL (el login de la persona no trae RUC)
        let empresa = {};
        try { empresa = JSON.parse(sessionStorage.getItem('sunat_empresa') || '{}') || {}; } catch (e) {}

        const cfg = datosDelModulo(modulo);
        const ahora = new Date();
        const fechaHora = ahora.toLocaleString('es-PE');
        const azul = [30, 57, 91];

        // Encabezado
        doc.setFillColor(azul[0], azul[1], azul[2]);
        doc.rect(0, 0, 210, 26, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text('LABORATORIO TRIBUTARIO CERTUS', 105, 11, { align: 'center' });
        doc.setFontSize(11);
        doc.text(cfg.titulo, 105, 19, { align: 'center' });

        doc.setTextColor(40, 40, 40);
        let y = 38;

        // Datos del usuario
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Datos de la empresa y del usuario', 15, y);
        doc.setLineWidth(0.4);
        doc.line(15, y + 1.5, 195, y + 1.5);
        y += 9;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.text('RUC: ' + (empresa.ruc || usuario.ruc || '—'), 15, y); y += 6.5;
        doc.text('Razón social: ' + (empresa.razon_social || '—'), 15, y); y += 6.5;
        let estudiante = '';
        try { estudiante = (sessionStorage.getItem('taxlab_estudiante') || '').trim(); } catch (e) {}
        doc.text('Realizado por: ' + (estudiante || 'USER'), 15, y); y += 6.5;
        doc.text('Usuario: ' + (usuario.usuario || '—'), 15, y); y += 6.5;
        doc.text('Perfil: ' + (usuario.rol || '—'), 15, y); y += 6.5;
        doc.text('Módulo: ' + modulo, 15, y); y += 6.5;
        doc.text('Fecha y hora del reporte: ' + fechaHora, 15, y); y += 12;

        // Resumen de la simulación
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Resumen de la simulación', 15, y);
        doc.line(15, y + 1.5, 195, y + 1.5);
        y += 9;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        (cfg.filas || []).forEach(function (par) {
            doc.text(par[0] + ': ' + par[1], 15, y);
            y += 6.5;
        });
        y += 5.5;

        // Documentos generados
        if (cfg.documentos && cfg.documentos.length) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Documentos generados por el proceso', 15, y);
            doc.line(15, y + 1.5, 195, y + 1.5);
            y += 9;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10.5);
            cfg.documentos.forEach(function (d) {
                doc.text('•  ' + d, 18, y);
                y += 6;
            });
        }

        // Pie de página
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text('Simulador de prueba | Elaborado por el Equipo Académico de Contabilidad CERTUS', 105, 285, { align: 'center' });

        const modSlug = modulo.replace(/[^A-Za-z0-9]+/g, '_');
        const stamp = ahora.toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
        doc.save('Reporte_Simulacion_' + modSlug + '_' + stamp + '.pdf');
        return true;
    }

    // Arma la entrada de historial de la declaración del módulo actual.
    function entradaActual(modulo) {
        var ahora = new Date();
        var emp = {};
        try { emp = JSON.parse(sessionStorage.getItem('sunat_empresa') || '{}') || {}; } catch (e) {}
        var e = {
            modulo: modulo, form: '', periodo: '', orden: '', monto: null,
            ruc: emp.ruc || '', razon: emp.razon_social || '',
            fechaISO: ahora.toISOString(),
            fecha: ahora.toLocaleDateString('es-PE'),
            hora: ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
        };
        if (modulo === 'FV 621') {
            var d = window.__decl621 || {};
            e.form = '0621';
            e.periodo = d.periodo || val('periodo-input') || '';
            e.orden = d.orden || '';
            e.monto = (d.total != null && d.total !== '') ? Number(d.total) : null;
            if (d.ruc) e.ruc = d.ruc;
            if (d.razon) e.razon = d.razon;
        } else if (modulo === 'FV 710') {
            var u = window.ultimoPago710;
            e.form = '0710';
            if (u && u.record) {
                e.periodo = String(u.record.ejercicio || '');
                e.orden = u.record.orden || '';
                e.monto = (u.record.monto != null) ? Number(u.record.monto) : null;
            }
        }
        return e;
    }

    // ¿La entrada corresponde a una declaración real (no una pantalla vacía)?
    function hayDeclaracion(e) {
        return !!(e && (e.orden || e.periodo || (e.monto != null)));
    }

    // Genera UN solo PDF con todas las declaraciones registradas hoy.
    function generarReporteConsolidado() {
        if (typeof window.jspdf === 'undefined') return false;
        var entradas = window.HistorialSim.delDia();
        if (!entradas.length) return false;

        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF();
        var azul = [30, 57, 91];

        var usuario = {};
        try { usuario = JSON.parse(sessionStorage.getItem('sunat_auth') || '{}'); } catch (e) {}
        var estudiante = '';
        try { estudiante = (sessionStorage.getItem('taxlab_estudiante') || '').trim(); } catch (e) {}
        var ahora = new Date();

        // Encabezado
        doc.setFillColor(azul[0], azul[1], azul[2]);
        doc.rect(0, 0, 210, 26, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text('LABORATORIO TRIBUTARIO CERTUS', 105, 11, { align: 'center' });
        doc.setFontSize(11);
        doc.text('Reporte de Declaraciones de la Simulación', 105, 19, { align: 'center' });

        doc.setTextColor(40, 40, 40);
        var y = 38;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Datos del usuario', 15, y);
        doc.setLineWidth(0.4);
        doc.line(15, y + 1.5, 195, y + 1.5);
        y += 9;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.text('Realizado por: ' + (estudiante || 'USER'), 15, y); y += 6.5;
        if (usuario.usuario) {
            doc.text('Usuario: ' + usuario.usuario + (usuario.rol ? ('   ·   Perfil: ' + usuario.rol) : ''), 15, y);
            y += 6.5;
        }
        doc.text('Fecha del reporte: ' + ahora.toLocaleString('es-PE'), 15, y); y += 6.5;
        doc.text('Declaraciones registradas hoy: ' + entradas.length, 15, y); y += 12;

        // Tabla de declaraciones
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Declaraciones realizadas', 15, y);
        doc.line(15, y + 1.5, 195, y + 1.5);
        y += 9;

        var cols = [
            { t: 'N°',       x: 15 },
            { t: 'Formulario', x: 24 },
            { t: 'Período',  x: 52 },
            { t: 'N° Orden', x: 74 },
            { t: 'RUC',      x: 112 },
            { t: 'Monto S/', x: 195, r: true }
        ];
        function fila(vals, bold) {
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            doc.setFontSize(9);
            cols.forEach(function (c, i) {
                var v = (vals[i] == null) ? '' : String(vals[i]);
                doc.text(v, c.x, y, c.r ? { align: 'right' } : undefined);
            });
            y += 6.2;
        }
        function cabecera() {
            doc.setFillColor(232, 238, 245);
            doc.rect(14, y - 4.3, 182, 6, 'F');
            fila(cols.map(function (c) { return c.t; }), true);
            doc.setDrawColor(210, 218, 228);
            doc.line(14, y - 3.9, 196, y - 3.9);
        }
        cabecera();

        var total = 0;
        entradas.forEach(function (e, idx) {
            if (y > 275) { doc.addPage(); y = 20; cabecera(); }
            var monto = (e.monto != null) ? Number(e.monto) : null;
            if (monto != null) total += monto;
            var form = e.form ? ('FV ' + e.form.replace(/^0+/, '')) : (e.modulo || '—');
            fila([
                idx + 1,
                form,
                e.periodo || '—',
                e.orden || '—',
                e.ruc || '—',
                monto != null ? monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
            ]);
        });

        // Total
        y += 1.5;
        doc.setDrawColor(150, 160, 172);
        doc.line(120, y - 3, 196, y - 3);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Total declarado:', 120, y);
        doc.text('S/ ' + total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 195, y, { align: 'right' });

        // Pie
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text('Simulador de prueba | Elaborado por el Equipo Académico de Contabilidad CERTUS', 105, 290, { align: 'center' });

        var slug = (estudiante || 'USER').replace(/[^A-Za-z0-9]+/g, '_').slice(0, 30);
        doc.save('Declaraciones_' + slug + '_' + ahora.toISOString().slice(0, 10) + '.pdf');
        return true;
    }

    // Manejador del botón (delegado): descarga el reporte y vuelve al portal SOL.
    // survey.js corre antes en fase de captura; cuando re-dispara el clic tras la
    // encuesta, este manejador de burbuja sí se ejecuta.
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('#btn-finalizar-simulacion, .btn-finalizar-simulacion');
        if (!btn) return;
        e.preventDefault();

        var modulo = detectarModulo();
        // Para las declaraciones (FV 621 / FV 710): registrar la del módulo
        // actual y generar UN solo reporte con todo lo declarado hoy. Los demás
        // módulos (comprobantes, ajustes, T-Registro) mantienen su reporte.
        if (modulo === 'FV 621' || modulo === 'FV 710') {
            try {
                var ent = entradaActual(modulo);
                if (hayDeclaracion(ent)) window.HistorialSim.registrar(ent);
            } catch (err) { console.warn('Historial de declaraciones:', err); }
            if (!generarReporteConsolidado()) generarReportePDF(modulo);
        } else {
            generarReportePDF(modulo);
        }

        // Algunas pantallas (p. ej. el T-Registro) piden quedarse donde están
        // tras descargar el reporte, en vez de volver al portal.
        if (btn.hasAttribute('data-sin-redireccion')) return;

        // Destino: si hay sesión SOL activa, volver a sol.html; si no, al inicio.
        const destino = sessionStorage.getItem('sunat_auth') ? 'sol.html' : 'index.html';
        setTimeout(function () { window.location.href = destino; }, 800);
    });
})();
