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

    // Módulo según el nombre del archivo (coincide con detectarModuloActual de survey.js)
    function detectarModulo() {
        const p = window.location.pathname.toLowerCase();
        if (p.includes('declaraciones')) return 'FV 621';
        if (p.includes('renta')) return 'FV 710';
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
            return {
                titulo: 'Reporte de Simulación – Renta Anual FV 710',
                filas: [['Formulario', 'Formulario Virtual 710 – Renta Anual']],
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
        doc.text('Datos del usuario', 15, y);
        doc.setLineWidth(0.4);
        doc.line(15, y + 1.5, 195, y + 1.5);
        y += 9;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.text('RUC: ' + (usuario.ruc || '—'), 15, y); y += 6.5;
        doc.text('Razón social: ' + (usuario.denominacion || 'EMPRESA DEMO S.A.C.'), 15, y); y += 6.5;
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

    // Manejador del botón (delegado): descarga el reporte y vuelve al portal SOL.
    // survey.js corre antes en fase de captura; cuando re-dispara el clic tras la
    // encuesta, este manejador de burbuja sí se ejecuta.
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('#btn-finalizar-simulacion, .btn-finalizar-simulacion');
        if (!btn) return;
        e.preventDefault();

        generarReportePDF(detectarModulo());

        // Algunas pantallas (p. ej. el T-Registro) piden quedarse donde están
        // tras descargar el reporte, en vez de volver al portal.
        if (btn.hasAttribute('data-sin-redireccion')) return;

        // Destino: si hay sesión SOL activa, volver a sol.html; si no, al inicio.
        const destino = sessionStorage.getItem('sunat_auth') ? 'sol.html' : 'index.html';
        setTimeout(function () { window.location.href = destino; }, 800);
    });
})();
