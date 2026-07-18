document.addEventListener('DOMContentLoaded', function () {
    // Modal closure logic
    const infoModal = document.getElementById('info-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const acceptModalBtn = document.getElementById('accept-modal-btn');

    if (infoModal) {
        const closeModal = () => {
            infoModal.style.display = 'none';
        };
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        if (acceptModalBtn) acceptModalBtn.addEventListener('click', closeModal);
    }

    // =============================================
    // FLUJO: Aceptar Propuesta → Modales en cadena
    // =============================================
    const modalConfirmar = document.getElementById('modal-confirmar-propuesta');
    const modalTicket = document.getElementById('modal-ticket-generado');
    const modalAviso12h = document.getElementById('modal-aviso-12h');

    function showModal(el) {
        if (el) { el.style.display = 'flex'; }
    }
    function hideModal(el) {
        if (el) { el.style.display = 'none'; }
    }

    // Exponer función globalmente para el onclick inline del botón (respaldo)
    window.abrirConfirmarPropuesta = function() {
        showModal(modalConfirmar);
    };

    // Paso 1: Event delegation desde document - captura el click sin importar cuándo se registró
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('#btn-aceptar-propuesta');
        if (btn) {
            e.preventDefault();
            showModal(modalConfirmar);
        }
    });


    // Botón "No" del modal confirmación → cierra
    const btnNoPropuesta = document.getElementById('btn-no-propuesta');
    if (btnNoPropuesta) {
        btnNoPropuesta.addEventListener('click', () => hideModal(modalConfirmar));
    }
    const closeConfirmar = document.getElementById('close-confirmar-propuesta');
    if (closeConfirmar) {
        closeConfirmar.addEventListener('click', () => hideModal(modalConfirmar));
    }

    // Paso 2: Click "Sí" → cierra confirmación, abre modal ticket.
    // "Aceptar Propuesta" salta directo a Generación de Registros (no pasa por
    // el Preliminar). El Preliminar solo se usa en el flujo de reemplazo.
    const btnSiPropuesta = document.getElementById('btn-si-propuesta');
    if (btnSiPropuesta) {
        btnSiPropuesta.addEventListener('click', () => {
            hideModal(modalConfirmar);
            showModal(modalTicket);
        });
    }
    const closeTicket = document.getElementById('close-ticket-generado');
    if (closeTicket) {
        closeTicket.addEventListener('click', () => hideModal(modalTicket));
    }

    // Paso 3: Click "Aceptar" en modal ticket → abre aviso 12h Y muestra vista Generación de Registros
    const btnAceptarTicket = document.getElementById('btn-aceptar-ticket');
    if (btnAceptarTicket) {
        btnAceptarTicket.addEventListener('click', () => {
            hideModal(modalTicket);
            // Registrar la aceptación del RVIE (persiste hasta pulsar "Salir")
            guardarAceptacionRVIE(obtenerPeriodoSeleccionadoRVIE());
            mostrarVistaGeneracionRegistros();
            showModal(modalAviso12h);
        });
    }
    const closeAviso = document.getElementById('close-aviso-12h');
    if (closeAviso) {
        closeAviso.addEventListener('click', () => hideModal(modalAviso12h));
    }

    // Paso 4: Click "Aceptar" en aviso 12h → cierra modal, queda en vista Generación de Registros
    const btnAceptarAviso = document.getElementById('btn-aceptar-aviso');
    if (btnAceptarAviso) {
        btnAceptarAviso.addEventListener('click', () => {
            hideModal(modalAviso12h);
        });
    }

    // "Registrar Preliminar" → dispara la cadena ticket → aviso 12h → Generación.
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('#btn-registrar-preliminar-rvie');
        if (!btn) return;
        e.preventDefault();
        if (!preliminarActuales || !preliminarActuales.length) {
            alert('No hay comprobantes en el Preliminar. Acepte o reemplace la Propuesta primero.');
            return;
        }
        showModal(modalTicket);
    });

    // "Eliminar Preliminar" → limpia el Preliminar y regresa a la Propuesta.
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('#btn-eliminar-preliminar-rvie');
        if (!btn) return;
        e.preventDefault();
        if (!preliminarActuales || !preliminarActuales.length) {
            alert('No hay un Preliminar para eliminar.');
            return;
        }
        if (!confirm('¿Está seguro de eliminar el Preliminar? Esta acción no se puede deshacer.')) return;
        renderPreliminarRvie([]); // persiste el Preliminar vacío
        const propTab = document.querySelector('.sub-tab-btn[data-target="propuesta-rvie"]');
        if (propTab) propTab.click();
    });

    // "Eliminar" (filas seleccionadas) dentro del Preliminar.
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('#btn-prelim-eliminar-rvie');
        if (!btn) return;
        e.preventDefault();
        const tbody = document.querySelector('#preliminar-rvie .results-table tbody');
        if (!tbody) return;
        const conservar = [];
        tbody.querySelectorAll('tr').forEach((tr, idx) => {
            const chk = tr.querySelector('input[type="checkbox"]');
            if (!(chk && chk.checked)) conservar.push(preliminarActuales[idx]);
        });
        if (conservar.length === preliminarActuales.length) {
            alert('Seleccione al menos un comprobante para eliminar.');
            return;
        }
        renderPreliminarRvie(conservar);
    });

    // =============================================
    // Estado de aceptación compartido (RCE / RVIE)
    // Se guarda en sessionStorage con la clave 'sire_aceptado'
    // y se conserva hasta que el usuario pulse "Salir".
    // Formato: { rce: '2026-07', rvie: '2026-05' }
    // =============================================
    function obtenerEstadoAceptacion() {
        try {
            return JSON.parse(SimStore.getItem('sire_aceptado') || '{}');
        } catch (e) {
            return {};
        }
    }

    function guardarAceptacionRVIE(periodo) {
        const estado = obtenerEstadoAceptacion();
        estado.rvie = periodo;
        SimStore.setItem('sire_aceptado', JSON.stringify(estado));
    }

    // Lee el período elegido en los selects personalizados de rvie.html (ej. '2026-05')
    function obtenerPeriodoSeleccionadoRVIE() {
        const mesMap = {
            'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04',
            'MAY': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
            'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12'
        };
        const pSel = document.querySelector('#periodo-select span');
        const mSel = document.querySelector('#mes-select span');
        if (pSel && mSel &&
            pSel.textContent !== 'Seleccionar' &&
            mSel.textContent !== 'Seleccionar') {
            const year = pSel.textContent.split('-')[0].trim();
            const mes = mesMap[mSel.textContent.split('-')[0].trim()];
            if (year && mes) return year + '-' + mes;
        }
        return '2026-05';
    }

    // Función que transforma el contenido principal a la vista "Generación de Registros".
    // Muestra una fila por cada registro aceptado previamente (RCE y/o RVIE),
    // según el estado guardado en sessionStorage.
    function mostrarVistaGeneracionRegistros() {
        const contentArea = document.querySelector('.content-area');
        if (!contentArea) return;

        const estado = obtenerEstadoAceptacion();
        // Fallback defensivo: si no hay nada aceptado, mostrar solo el RVIE
        if (!estado.rce && !estado.rvie) estado.rvie = '2026-05';

        function filaRegistro(nombre, periodo, indicador) {
            return `
                                <tr>
                                    <td>${nombre}</td>
                                    <td>${periodo}</td>
                                    <td>${indicador}</td>
                                    <td><a href="#" class="link-registrado"><i class="fas fa-search"></i> Registrado</a></td>
                                    <td style="text-align:center;"><span class="btn-eliminar-prelim"><i class="fas fa-times-circle"></i></span></td>
                                    <td>Actualizado</td>
                                    <td>No Generado</td>
                                    <td style="text-align:center;"><input type="checkbox" class="gen-check-registro"></td>
                                </tr>`;
        }

        let filas = '';
        if (estado.rce)  filas += filaRegistro('Registro de compras', estado.rce, 'Con Información');
        if (estado.rvie) filas += filaRegistro('Registro de Ventas e Ingresos', estado.rvie, 'Con Información');

        const periodo = estado.rvie || estado.rce;

        contentArea.innerHTML = `
            <div class="page-header">
                <h1>Generación de Registros</h1>
            </div>
            <div class="gen-registros-container">
                <div class="gen-table-section">
                    <div class="gen-table-wrapper">
                        <table class="gen-table">
                            <thead>
                                <tr>
                                    <th>REGISTRO</th>
                                    <th>PERIODO</th>
                                    <th>INDICADOR DE CONTENIDO</th>
                                    <th>DETALLE DEL PRELIMINAR</th>
                                    <th>ELIMINACIÓN DEL PRELIMINAR</th>
                                    <th>ESTADO DE ACTUALIZACIÓN</th>
                                    <th>ESTADO DE GENERACIÓN</th>
                                    <th style="text-align:center;">SELECCIÓN</th>
                                </tr>
                            </thead>
                            <tbody>${filas}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="gen-table-section mt-3">
                    <table class="gen-table">
                        <thead>
                            <tr>
                                <th>PROPUESTA DE CASILLAS</th>
                                <th>PERIODO</th>
                                <th>INDICADOR DE CONTENIDO</th>
                                <th>DETALLE DE CASILLAS DE REC.</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Casilla FV621</td>
                                <td>${periodo}</td>
                                <td>Sin Información</td>
                                <td><a href="#" class="link-registrado">Ver Casillas</a></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="gen-action-buttons">
                    <button class="btn-gen btn-gen-dark-blue" onclick="window.location.href='rvie.html'">Ir al RVIE</button>
                    <button class="btn-gen btn-gen-dark-blue" onclick="window.location.href='rce.html'">Ir al RCE</button>
                    <button class="btn-gen btn-gen-green" id="btn-generar-registro-vista"><i class="fas fa-check"></i> Generar registro</button>
                </div>
            </div>
        `;
    }

    // Vista final tras generar los registros: tablas vacías + botón Terminar simulación
    function mostrarVistaGeneracionVacia() {
        const contentArea = document.querySelector('.content-area');
        if (!contentArea) return;

        contentArea.innerHTML = `
            <div class="page-header">
                <h1>Generación de Registros</h1>
            </div>
            <div class="gen-registros-container">
                <div class="gen-table-section">
                    <div class="gen-table-wrapper">
                        <table class="gen-table">
                            <thead>
                                <tr>
                                    <th>REGISTRO</th>
                                    <th>PERIODO</th>
                                    <th>INDICADOR DE CONTENIDO</th>
                                    <th>DETALLE DEL PRELIMINAR</th>
                                    <th>ELIMINACIÓN DEL PRELIMINAR</th>
                                    <th>ESTADO DE ACTUALIZACIÓN</th>
                                    <th>ESTADO DE GENERACIÓN</th>
                                    <th style="text-align:center;">SELECCIÓN</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colspan="8" style="text-align:center; padding:14px;">Ningún registro encontrado</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="gen-table-section mt-3">
                    <table class="gen-table">
                        <thead>
                            <tr>
                                <th>PROPUESTA DE CASILLAS</th>
                                <th>PERIODO</th>
                                <th>INDICADOR DE CONTENIDO</th>
                                <th>DETALLE DE CASILLAS DE REC.</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>

                <div class="gen-action-buttons">
                    <button class="btn-gen btn-gen-dark-blue" onclick="window.location.href='rvie.html'">Ir al RVIE</button>
                    <button class="btn-gen btn-gen-dark-blue" onclick="window.location.href='rce.html'">Ir al RCE</button>
                    <button class="btn-gen btn-gen-green"><i class="fas fa-check"></i> Generar registro</button>
                </div>

                <div style="display:flex; justify-content:center; margin-top:35px;">
                    <button class="btn-gen" id="btn-terminar-simulacion" style="background:#C00000; color:#fff;">
                        <i class="fas fa-flag-checkered"></i> Terminar simulación
                    </button>
                </div>
            </div>
        `;
    }

    // =============================================
    // FLUJO: Generar registro → Alerta → Proceso → Vista vacía
    // =============================================
    const modalGenAlerta = document.getElementById('modal-gen-alerta');
    const modalGenProceso = document.getElementById('modal-gen-proceso');

    // Click en "Generar registro" de la vista Generación de Registros
    // (botón dinámico: se usa delegación). Requiere marcar todos los checks.
    document.addEventListener('click', function (e) {
        if (!e.target.closest('#btn-generar-registro-vista')) return;
        e.preventDefault();

        const checks = document.querySelectorAll('.gen-check-registro');
        if (checks.length === 0) return;
        const todosMarcados = Array.from(checks).every(c => c.checked);
        if (!todosMarcados) return; // deben marcarse todos los registros listados

        // Texto dinámico según los registros aceptados
        const estado = obtenerEstadoAceptacion();
        const regSpan = document.getElementById('gen-alerta-registros');
        if (regSpan) {
            if (estado.rce && estado.rvie) regSpan.textContent = 'los RCE Y RVIE';
            else if (estado.rce)           regSpan.textContent = 'el RCE';
            else                           regSpan.textContent = 'el RVIE';
        }
        const perSpan = document.getElementById('gen-alerta-periodo');
        if (perSpan) perSpan.textContent = estado.rvie || estado.rce || '2026-05';

        showModal(modalGenAlerta);
    });

    // Modal 1 (Alerta): Cancelar / cerrar
    const closeGenAlerta = document.getElementById('close-gen-alerta');
    if (closeGenAlerta) closeGenAlerta.addEventListener('click', () => hideModal(modalGenAlerta));
    const btnGenAlertaCancelar = document.getElementById('btn-gen-alerta-cancelar');
    if (btnGenAlertaCancelar) btnGenAlertaCancelar.addEventListener('click', () => hideModal(modalGenAlerta));

    // Modal 1 (Alerta): Aceptar → abre modal de proceso de generación
    const btnGenAlertaAceptar = document.getElementById('btn-gen-alerta-aceptar');
    if (btnGenAlertaAceptar) {
        btnGenAlertaAceptar.addEventListener('click', () => {
            hideModal(modalGenAlerta);
            showModal(modalGenProceso);
        });
    }

    // Modal 2 (Proceso): cerrar
    const closeGenProceso = document.getElementById('close-gen-proceso');
    if (closeGenProceso) closeGenProceso.addEventListener('click', () => hideModal(modalGenProceso));

    // Modal 2 (Proceso): Continuar → marca los periodos como Presentados,
    // limpia la aceptación y muestra la vista vacía
    const btnGenContinuar = document.getElementById('btn-gen-continuar');
    if (btnGenContinuar) {
        btnGenContinuar.addEventListener('click', () => {
            hideModal(modalGenProceso);

            // Registrar los periodos generados como "Presentado"
            // (los dropdowns de mes de RVIE y RCE lo reflejan)
            const estado = obtenerEstadoAceptacion();
            let presentados = {};
            try {
                presentados = JSON.parse(SimStore.getItem('sire_presentado') || '{}');
            } catch (e) { /* estado corrupto: se reinicia */ }
            if (estado.rce)  presentados[estado.rce]  = true;
            if (estado.rvie) presentados[estado.rvie] = true;
            SimStore.setItem('sire_presentado', JSON.stringify(presentados));

            // Guardar el resumen de la generación para el reporte PDF final
            const correoInput = document.getElementById('gen-correos');
            const resumen = {
                ticket: '2026020000005',
                generadoEn: new Date().toLocaleString('es-PE'),
                rce: estado.rce || null,
                rvie: estado.rvie || null,
                correo: (correoInput && correoInput.value.trim()) || null
            };
            SimStore.setItem('sire_resumen', JSON.stringify(resumen));

            SimStore.removeItem('sire_aceptado');
            mostrarVistaGeneracionVacia();
            window.scrollTo(0, 0);
        });
    }

    // Genera el reporte PDF de la simulación con jsPDF
    function generarReporteSimulacionPDF() {
        if (typeof window.jspdf === 'undefined') return false;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Datos del usuario (sesión) y resumen de la generación
        let usuario = {};
        try { usuario = JSON.parse(sessionStorage.getItem('sunat_auth') || '{}'); } catch (e) {}
        let resumen = {};
        try { resumen = JSON.parse(SimStore.getItem('sire_resumen') || '{}'); } catch (e) {}

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
        doc.text('Reporte de Simulación – SIRE (RVIE / RCE)', 105, 19, { align: 'center' });

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
        doc.text('Fecha y hora del reporte: ' + fechaHora, 15, y); y += 12;

        // Resumen de la simulación
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Resumen de la simulación', 15, y);
        doc.line(15, y + 1.5, 195, y + 1.5);
        y += 9;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.text('Número de ticket de generación: ' + (resumen.ticket || '—'), 15, y); y += 6.5;
        doc.text('Fecha y hora de la generación: ' + (resumen.generadoEn || '—'), 15, y); y += 6.5;
        doc.text('Registro de Compras (RCE): ' + (resumen.rce ? 'Generado – periodo ' + resumen.rce : 'No generado'), 15, y); y += 6.5;
        doc.text('Registro de Ventas e Ingresos (RVIE): ' + (resumen.rvie ? 'Generado – periodo ' + resumen.rvie : 'No generado'), 15, y); y += 6.5;
        if (resumen.correo) {
            doc.text('Correo adicional para envío: ' + resumen.correo, 15, y); y += 6.5;
        }
        y += 5.5;

        // Documentos generados por el proceso
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Documentos generados por el proceso', 15, y);
        doc.line(15, y + 1.5, 195, y + 1.5);
        y += 9;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        const docs = [];
        if (resumen.rvie) {
            docs.push('Constancia de Recepción RVIE PDF', 'Archivo del RVIE',
                      'Reporte de Inconsistencias (RVIE)', 'Reporte de Exportadores',
                      'Archivo XML de la Constancia de Recepción (RVIE)');
        }
        if (resumen.rce) {
            docs.push('Constancia de Recepción RCE PDF', 'Archivo del RCE',
                      'Archivo del RC Operaciones con Sujetos No Domiciliados',
                      'Reporte de Inconsistencias (RCE)',
                      'Archivo XML de la Constancia de Recepción (RCE)',
                      'Propuesta de Casillas del Formulario Virtual 621');
        }
        docs.forEach(function (d) {
            doc.text('•  ' + d, 18, y);
            y += 6;
        });

        // Pie de página
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text('Simulador de prueba | Elaborado por el Equipo Académico de Contabilidad CERTUS', 105, 285, { align: 'center' });

        const stamp = ahora.toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
        doc.save('Reporte_Simulacion_SIRE_' + stamp + '.pdf');
        return true;
    }

    // Botón "Terminar simulación": descarga el reporte PDF y va a sol.html.
    // El estado temporal (periodos presentados, resumen) se CONSERVA;
    // solo se borra al llegar a index o con "Reiniciar simulación" en SOL.
    document.addEventListener('click', function (e) {
        if (!e.target.closest('#btn-terminar-simulacion')) return;
        e.preventDefault();

        generarReporteSimulacionPDF();

        // Pequeña espera para que inicie la descarga antes de navegar
        setTimeout(function () {
            window.location.href = 'sol.html';
        }, 800);
    });

    // =============================================
    // Modal: Agregar comprobante de pago
    // =============================================
    const modalAgregarCp = document.getElementById('modal-agregar-cp');

    function prellenarDatosGenerales() {
        // RUC y Razón social desde la sesión (si existe)
        let ruc = '20123456789';
        let razon = 'EMPRESA DEMO S.A.C.';
        try {
            const auth = JSON.parse(sessionStorage.getItem('sunat_auth') || '{}');
            if (auth.ruc) ruc = auth.ruc;
            if (auth.denominacion) razon = auth.denominacion;
        } catch (e) { /* usar valores por defecto */ }

        const rucInput = document.getElementById('cp-ruc');
        const razonInput = document.getElementById('cp-razon-social');
        const periodoInput = document.getElementById('cp-periodo');
        if (rucInput) rucInput.value = ruc;
        if (razonInput) razonInput.value = razon;

        // Periodo desde los selectores (AAAA/MM) si están elegidos
        if (periodoInput) {
            const periodoSel = document.querySelector('#periodo-select span');
            const mesSel = document.querySelector('#mes-select span');
            const mesMap = {
                'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04',
                'MAY': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
                'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12'
            };
            let periodoTxt = '';
            if (periodoSel && mesSel &&
                periodoSel.textContent !== 'Seleccionar' &&
                mesSel.textContent !== 'Seleccionar') {
                const year = periodoSel.textContent.split('-')[0];
                const mes = mesMap[mesSel.textContent.split('-')[0]] || '';
                periodoTxt = mes ? `${year}/${mes}` : year;
            }
            periodoInput.value = periodoTxt;
        }
    }

    function abrirModalAgregarCp() {
        prellenarDatosGenerales();
        showModal(modalAgregarCp);
    }

    // El botón "Agregar" se renderiza dentro de la vista de Propuesta.
    // Usamos delegación para capturar el click de forma robusta.
    document.addEventListener('click', function (e) {
        if (e.target.closest('#btn-agregar-cp')) {
            e.preventDefault();
            abrirModalAgregarCp();
        }
    });

    const closeAgregarCp = document.getElementById('close-agregar-cp');
    const btnCancelarCp = document.getElementById('btn-cancelar-cp');
    const btnGuardarCp = document.getElementById('btn-guardar-cp');

    if (closeAgregarCp) closeAgregarCp.addEventListener('click', () => hideModal(modalAgregarCp));
    if (btnCancelarCp) btnCancelarCp.addEventListener('click', () => hideModal(modalAgregarCp));

    // Cerrar al hacer clic fuera del formulario
    if (modalAgregarCp) {
        modalAgregarCp.addEventListener('click', (e) => {
            if (e.target === modalAgregarCp) hideModal(modalAgregarCp);
        });
    }

    if (btnGuardarCp) {
        btnGuardarCp.addEventListener('click', () => {
            const tipoDoc = document.getElementById('cp-tipo-doc');
            const serie = document.getElementById('cp-serie');
            // Validación mínima de simulación
            if (tipoDoc && !tipoDoc.value) {
                alert('Seleccione el Tipo CP / DOC.');
                return;
            }
            if (serie && !serie.value.trim()) {
                alert('Ingrese la Serie del CDP.');
                return;
            }

            // MASTER: agrega el comprobante a la propuesta y lo persiste
            if (esMasterRvie()) {
                const nuevo = construirComprobanteDesdeModal();
                comprobantesActuales = comprobantesActuales.concat([nuevo]);
                const mainContent = document.getElementById('main-content-display');
                if (mainContent) mainContent.style.display = 'block';
                renderRvieContenido(comprobantesActuales);
                guardarContenidoRvie();
                hideModal(modalAgregarCp);
                alert('Comprobante agregado y guardado.');
                return;
            }

            hideModal(modalAgregarCp);
            alert('Comprobante agregado correctamente (simulación).');
        });
    }

    // La lógica de cambio de pestaña se puede agregar aquí
    console.log('SUNAT Interface Loaded');

    // Nota: la lógica de las main-tabs (Generación de Registro / Información de Gestión)
    // se maneja abajo con los manejadores específicos de mainTabGeneracion / mainTabInfoGestion.

    const subTabs = document.querySelectorAll('.sub-tab-btn');
    subTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            subTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Hide all sub-views
            document.querySelectorAll('.sub-content-view').forEach(view => {
                view.style.display = 'none';
            });

            // Show selected view
            const targetId = tab.getAttribute('data-target');
            if (targetId) {
                const targetView = document.getElementById(targetId);
                if (targetView) targetView.style.display = 'block';
            }
        });
    });

    const tertiaryTabs = document.querySelectorAll('.tertiary-tab-btn');
    tertiaryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tertiaryTabs.forEach(t => t.classList.remove('active-tertiary'));
            tab.classList.add('active-tertiary');
        });
    });

    // Sidebar Submenu Toggle Logic
    const sidebarToggles = document.querySelectorAll('.sidebar .submenu-toggle, .sidebar .submenu-toggle-level2, .sidebar .submenu-toggle-level3');
    sidebarToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const parentLi = toggle.parentElement;
            parentLi.classList.toggle('open');

            // Rotate the icon
            const icon = toggle.querySelector('i');
            if (parentLi.classList.contains('open')) {
                icon.classList.remove('fa-caret-right');
                icon.classList.add('fa-caret-down');
            } else {
                icon.classList.remove('fa-caret-down');
                icon.classList.add('fa-caret-right');
            }
        });
    });

    // Reloj en tiempo real
    function updateClock() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        // La imagen muestra HH:mm, pero los usuarios a menudo prefieren segundos o al menos una actualización precisa de HH:mm
        // La imagen muestra: 15/02/2026 18:38
        const timeString = `${day}/${month}/${year} ${hours}:${minutes}`;
        document.getElementById('clock').textContent = timeString;
    }

    setInterval(updateClock, 1000);
    updateClock(); // Ejecutar inmediatamente

    // Data Integration (CSVs)
    const csvData = `Ruc,Razon Social,Periodo,CAR SUNAT,Fecha de emisión,Fecha Vcto/Pago,Tipo CP/Doc.,Serie del CDP,Nro CP o Doc. Nro Inicial (Rango),Nro Final (Rango),Tipo Doc Identidad,Nro Doc Identidad,Apellidos Nombres/ Razón Social,Valor Facturado Exportación,BI Gravada,Dscto BI,IGV / IPM,Dscto IGV / IPM,Mto Exonerado,Mto Inafecto,ISC,BI Grav IVAP,IVAP,ICBPER,Otros Tributos,Total CP,Moneda,Tipo Cambio,Fecha Emisión Doc Modificado,Tipo CP Modificado,Serie CP Modificado,Nro CP Modificado,ID Proyecto Operadores Atribución,Tipo de Nota,Est. Comp,Valor FOB Embarcado,Valor OP Gratuitas,Tipo Operación,DAM / CP,CLU
20123456789,EMPRESA EJEMPLO S.R.L.,202512,2012345678901F0030000023501,01/12/2025,01/12/2025,01,F003,23501,,6,20601765544,EMPRESA DE SERVICIOS ZAM S.A.C.,0,370.17,0,66.63,0,0,0,0,0,0,0,0,436.8,PEN,1.000,,,,,,,1,0,0,0101,,
20123456789,EMPRESA EJEMPLO S.R.L.,202512,2012345678901F0030000023502,01/12/2025,01/12/2025,01,F003,23502,,6,20455651655,SCE INDUSTRIAL E.I.R.L.,0,56.36,0,10.14,0,0,0,0,0,0,0,0,66.5,PEN,1.000,,,,,,,1,0,0,0101,,
20123456789,EMPRESA EJEMPLO S.R.L.,202512,2012345678901F0030000023503,01/12/2025,01/12/2025,01,F003,23503,,6,20601765544,EMPRESA DE SERVICIOS ZAM S.A.C.,0,110.17,0,19.83,0,0,0,0,0,0,0,0,130,PEN,1.000,,,,,,,1,0,0,0101,,
20123456789,EMPRESA EJEMPLO S.R.L.,202512,2012345678901F0040000028355,01/12/2025,01/12/2025,01,F004,28355,,6,20612465330,M & C PROYECTOS OBRAS Y SERVICIOS GENERALES S.R.L.,0,30.93,0,5.57,0,0,0,0,0,0,0,0,36.5,PEN,1.000,,,,,,,1,0,0,0101,,
20123456789,EMPRESA EJEMPLO S.R.L.,202512,2012345678901F0040000028356,01/12/2025,01/12/2025,01,F004,28356,,6,20478111712,LR CONSTRUCCIONES GENERALES S.A.C. - LR CONGER S.A.C.,0,116.1,0,20.9,0,0,0,0,0,0,0,0,137,PEN,1.000,,,,,,,1,0,0,0101,,`;

    function parseCSV(csv) {
        const lines = csv.trim().split('\n');
        const headers = lines[0].split(',');
        const rows = lines.slice(1).map(line => line.split(','));
        return { headers, rows };
    }

    const parsedCsv = parseCSV(csvData);
    const mockObjects = parsedCsv.rows.map(row => ({
        ruc: row[0],
        razon_social: row[1],
        periodo: row[2],
        src_key: row[3],
        fecha_emision: row[4],
        fecha_vcto_pago: row[5],
        tipo_cp: row[6],
        comprobante: row[6] === '01' ? 'Factura' : (row[6] === '03' ? 'Boleta de Venta' : 'Otro'),
        serie: row[7],
        numero: row[8],
        nro_final: row[9] || '',
        tipo_doc_identidad: row[10],
        nro_doc_identidad: row[11],
        cliente: row[12],
        tipo_cliente: 'Empresa Nacional',
        valor_facturado_export: parseFloat(row[13]) || 0,
        bi_gravada: parseFloat(row[14]) || 0,
        dscto_bi: parseFloat(row[15]) || 0,
        igv_ipm: parseFloat(row[16]) || 0,
        dscto_igv_ipm: parseFloat(row[17]) || 0,
        mto_exonerado: parseFloat(row[18]) || 0,
        mto_inafecto: parseFloat(row[19]) || 0,
        isc: parseFloat(row[20]) || 0,
        bi_grav_ivap: parseFloat(row[21]) || 0,
        ivap: parseFloat(row[22]) || 0,
        icbper: parseFloat(row[23]) || 0,
        otros_tributos: parseFloat(row[24]) || 0,
        anticipos: 0.00,
        otros_cargos: 0.00,
        monto_redondeo: 0.00,
        total_cp: parseFloat(row[25]) || 0,
        moneda: row[26],
        tipo_cambio: parseFloat(row[27]) || 1.000,
        doc_mod_fecha_emision: row[28] || '',
        doc_mod_tipo_cp: row[29] || '',
        doc_mod_serie: row[30] || '',
        doc_mod_numero: row[31] || '',
        detalle_operacion: '',
        descripcion: '',
        forma_pago: '',
        nro_cuotas: '',
        motivo_nota_credito: '',
        sujeto_detraccion: false,
        pct_detraccion: 0,
        monto_detraccion: 0.00,
        nro_constancia_detrac: '',
        id_proyecto: row[32] || '',
        tipo_nota: row[33] || '',
        est_comp: row[34] || '1',
        desc_comp: 'ACTIVO',
        valor_fob: parseFloat(row[35]) || 0,
        valor_op_gratuitas: parseFloat(row[36]) || 0,
        tipo_operacion: row[37] || '0101',
        dam: row[38] || '',
        clu: row[39] || ''
    }));

    // Últimos comprobantes mostrados en la tabla de propuesta (fuente del archivo exportado)
    let comprobantesActuales = [];

    function renderTable(dataRows, opts) {
        opts = opts || {};
        const tbodySel = opts.tbodySel || '#propuesta-rvie .results-table tbody';
        const P = opts.totalPrefix || 'total-';
        const pagId = opts.pagInfoId || 'detailed-pagination-info';
        if (opts.setState !== false) comprobantesActuales = dataRows;
        const tbody = document.querySelector(tbodySel);
        if (!tbody) return;
        tbody.innerHTML = '';

        // Montos con separador de miles como en el SIRE real (7,920.12)
        const fmtMonto = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Initialize totals
        let totals = {
            valExp: 0, biGrav: 0, dsctoBi: 0, igv: 0, dsctoIgv: 0,
            mtoExo: 0, mtoIna: 0, isc: 0, biIvap: 0, ivap: 0,
            icbper: 0, otros: 0, total: 0, anticipos: 0, otrosCargos: 0, mtoRedondeo: 0,
            fob: 0, opGrat: 0
        };

        dataRows.forEach((row, idx) => {
            const fEmision = row.fecha_emision || '';
            const fVcto = row.fecha_vcto_pago || '';
            const tipoCp = row.tipo_cp || '';
            const comprobante = row.comprobante || '';
            const serie = row.serie || '';
            const nroIni = row.numero || '';
            const nroFin = row.nro_final || '';
            const tipoDocId = row.tipo_doc_identidad || '';
            const nroDocId = row.nro_doc_identidad || '';
            const adqRazon = row.cliente || '';
            const tipoCliente = row.tipo_cliente || '';

            const valExp = parseFloat(row.valor_facturado_export) || 0;
            const biGrav = parseFloat(row.bi_gravada) || 0;
            const dsctoBi = parseFloat(row.dscto_bi) || 0;
            const igv = parseFloat(row.igv_ipm) || 0;
            const dsctoIgv = parseFloat(row.dscto_igv_ipm) || 0;
            const mtoExo = parseFloat(row.mto_exonerado) || 0;
            const mtoIna = parseFloat(row.mto_inafecto) || 0;
            const isc = parseFloat(row.isc) || 0;
            const biIvap = parseFloat(row.bi_grav_ivap) || 0;
            const anticipos = parseFloat(row.anticipos) || 0;
            const otrosCargos = parseFloat(row.otros_cargos) || 0;
            const mtoRedondeo = parseFloat(row.monto_redondeo) || 0;

            const ivap = parseFloat(row.ivap) || 0;
            const icbper = parseFloat(row.icbper) || 0;
            const otros = parseFloat(row.otros_tributos) || 0;
            const totalCp = parseFloat(row.total_cp) || 0;
            const moneda = row.moneda || 'PEN';
            const tc = parseFloat(row.tipo_cambio) || 1.000;

            const fRef = row.doc_mod_fecha_emision || '';
            const tipoRef = row.doc_mod_tipo_cp || '';
            const serieRef = row.doc_mod_serie || '';
            const nroRef = row.doc_mod_numero || '';

            const detalleOp = row.detalle_operacion || '';
            const descripcion = row.descripcion || '';
            const formaPago = row.forma_pago || '';
            const nroCuotas = row.nro_cuotas || '';
            const motivoNota = row.motivo_nota_credito || '';
            const sujetoDetrac = row.sujeto_detraccion ? 'Sí' : 'No';
            const pctDetrac = parseFloat(row.pct_detraccion) || 0;
            const mtoDetrac = parseFloat(row.monto_detraccion) || 0;
            const constanciaDetrac = row.nro_constancia_detrac || '';

            const idProy = row.id_proyecto || '';
            const tipoNota = row.tipo_nota || '';
            const estComp = row.est_comp || '1';
            const descComp = row.desc_comp || 'ACTIVO';
            const fob = parseFloat(row.valor_fob) || 0;
            const opGrat = parseFloat(row.valor_op_gratuitas) || 0;
            const tipoOp = String(row.tipo_operacion || '0101').padStart(4, '0');
            const dam = row.dam || '';
            const clu = row.clu || '';
            const car = row.src_key || '';

            // Accumulate totals
            totals.valExp += valExp;
            totals.biGrav += biGrav;
            totals.dsctoBi += dsctoBi;
            totals.igv += igv;
            totals.dsctoIgv += dsctoIgv;
            totals.mtoExo += mtoExo;
            totals.mtoIna += mtoIna;
            totals.isc += isc;
            totals.biIvap += biIvap;
            totals.anticipos += anticipos;
            totals.otrosCargos += otrosCargos;
            totals.mtoRedondeo += mtoRedondeo;
            totals.ivap += ivap;
            totals.icbper += icbper;
            totals.otros += otros;
            totals.total += totalCp;
            totals.fob += fob;
            totals.opGrat += opGrat;

            // Lápiz de complemento: solo editable cuando la moneda es distinta de PEN
            const compIcon = moneda !== 'PEN'
                ? `<i class="fas fa-edit tc-edit-btn" data-idx="${idx}" title="Editar tipo de cambio"></i>`
                : '<i class="far fa-edit tc-edit-off"></i>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox"></td>
                <td></td>
                <td><i class="fas fa-sync-alt"></i></td>
                <td>${fEmision}</td>
                <td>${fVcto}</td>
                <td>${tipoCp}</td>
                <td>${serie}</td>
                <td>${nroIni}</td>
                <td>${nroFin || ''}</td>

                <!-- Adquiriente -->
                <td>${tipoDocId}</td>
                <td>${nroDocId}</td>
                <td>${adqRazon}</td>

                <!-- Montos -->
                <td>${fmtMonto(valExp)}</td>
                <td>${fmtMonto(biGrav)}</td>
                <td>${fmtMonto(dsctoBi)}</td>
                <td>${fmtMonto(igv)}</td>
                <td>${fmtMonto(dsctoIgv)}</td>
                <td>${fmtMonto(mtoExo)}</td>
                <td>${fmtMonto(mtoIna)}</td>
                <td>${fmtMonto(isc)}</td>
                <td>${fmtMonto(biIvap)}</td>

                <!-- Totales/Moneda -->
                <td>${fmtMonto(ivap)}</td>
                <td>${fmtMonto(icbper)}</td>
                <td>${fmtMonto(otros)}</td>
                <td>${fmtMonto(totalCp)}</td>
                <td>${moneda}</td>
                <td>${Number(tc).toFixed(3)}</td>

                <!-- Referencias (Empty in sample, mostly) -->
                <td>${compIcon}</td>
                <td>${fRef || ''}</td>
                <td>${tipoRef || ''}</td>
                <td>${serieRef || ''}</td>
                <td>${nroRef || ''}</td>

                <!-- Otros -->
                <td>${idProy || ''}</td>
                <td>${tipoNota || ''}</td>
                <td>${estComp || '1'}</td>
                <td>${descComp}</td>
                <td>${fmtMonto(fob)}</td>
                <td>${fmtMonto(opGrat)}</td>
                <td>${tipoOp || '0101'}</td>
                <td>${dam || ''}</td>
                <td>${clu || ''}</td>
                <td>${car || ''}</td>
            `;
            tbody.appendChild(tr);
        });

        // Update Totals Footer
        const setT = (suffix, val) => {
            const el = document.getElementById(P + suffix);
            if (el) el.textContent = fmtMonto(val);
        };
        setT('val-exp', totals.valExp);
        setT('bi-grav', totals.biGrav);
        setT('dscto-bi', totals.dsctoBi);
        setT('igv', totals.igv);
        setT('dscto-igv', totals.dsctoIgv);
        setT('mto-exo', totals.mtoExo);
        setT('mto-ina', totals.mtoIna);
        setT('isc', totals.isc);
        setT('bi-ivap', totals.biIvap);
        setT('ivap', totals.ivap);
        setT('icbper', totals.icbper);
        setT('otros', totals.otros);
        setT('total-cp', totals.total);
        setT('fob', totals.fob);
        setT('op-gratuitas', totals.opGrat);

        // Update pagination text
        const pagInfo = document.getElementById(pagId);
        if (pagInfo) {
            pagInfo.textContent = `Mostrando del 1 al ${dataRows.length} de un total ${dataRows.length} registros`;
        }
    }

    renderTable(mockObjects);

    // ==========================================================
    // Modal: Carga Individual de complemento (editar tipo de cambio)
    // Solo se abre desde el lápiz de filas con moneda distinta de PEN
    // ==========================================================
    const modalEditarTc = document.getElementById('modal-editar-tc');
    let tcEditIdx = null;

    const resultsTbody = document.querySelector('.results-table tbody');
    if (resultsTbody && modalEditarTc) {
        resultsTbody.addEventListener('click', (e) => {
            const btn = e.target.closest('.tc-edit-btn');
            if (!btn) return;
            tcEditIdx = parseInt(btn.dataset.idx, 10);
            const row = comprobantesActuales[tcEditIdx];
            if (!row) return;
            document.getElementById('tc-edit-fecha').textContent = row.fecha_emision || '';
            document.getElementById('tc-edit-moneda').textContent = row.moneda || '';
            document.getElementById('tc-edit-input').value = Number(row.tipo_cambio || 1).toFixed(3);
            showModal(modalEditarTc);
        });
    }

    const btnGrabarTc = document.getElementById('btn-grabar-tc');
    if (btnGrabarTc) {
        btnGrabarTc.addEventListener('click', () => {
            const nuevoTc = parseFloat(document.getElementById('tc-edit-input').value);
            if (isNaN(nuevoTc) || nuevoTc <= 0) {
                alert('Ingrese un tipo de cambio válido.');
                return;
            }
            if (tcEditIdx !== null && comprobantesActuales[tcEditIdx]) {
                const row = comprobantesActuales[tcEditIdx];
                // Los montos almacenados están en soles convertidos con el TC anterior:
                // monto_nuevo = (monto / tc_anterior) * tc_nuevo
                const tcAnterior = parseFloat(row.tipo_cambio) || 1;
                const factor = nuevoTc / tcAnterior;
                const camposMonto = [
                    'valor_facturado_export', 'bi_gravada', 'dscto_bi', 'igv_ipm', 'dscto_igv_ipm',
                    'mto_exonerado', 'mto_inafecto', 'isc', 'bi_grav_ivap', 'ivap', 'icbper',
                    'otros_tributos', 'anticipos', 'otros_cargos', 'monto_redondeo', 'total_cp',
                    'valor_fob', 'valor_op_gratuitas', 'monto_detraccion'
                ];
                camposMonto.forEach(campo => {
                    const valor = parseFloat(row[campo]) || 0;
                    row[campo] = Math.round(valor * factor * 100) / 100;
                });
                row.tipo_cambio = nuevoTc;
                renderTable(comprobantesActuales);
            }
            hideModal(modalEditarTc);
        });
    }

    const btnCancelarTc = document.getElementById('btn-cancelar-tc');
    if (btnCancelarTc) btnCancelarTc.addEventListener('click', () => hideModal(modalEditarTc));
    const closeEditarTc = document.getElementById('close-editar-tc');
    if (closeEditarTc) closeEditarTc.addEventListener('click', () => hideModal(modalEditarTc));

    // Colapsar/expandir la sección "Buscar por" de la Propuesta del RVIE
    const buscarPorToggle = document.getElementById('buscar-por-toggle');
    const buscarPorBody = document.getElementById('buscar-por-body');
    const buscarPorCaret = document.getElementById('buscar-por-caret');
    if (buscarPorToggle && buscarPorBody && buscarPorCaret) {
        buscarPorToggle.addEventListener('click', () => {
            const colapsado = buscarPorBody.style.display === 'none';
            buscarPorBody.style.display = colapsado ? '' : 'none';
            buscarPorCaret.className = colapsado ? 'fas fa-caret-up' : 'fas fa-caret-down';
        });
    }

    const monthData = {
        '2026': [
            'ENE-Presentado',
            'FEB-Presentado',
            'MAR-Presentado',
            'ABR-Presentado',
            'MAY-No Presentado',
            'JUN-No Presentado',
            'JUL-No Presentado'
        ],
        '2025': [
            'ENE-Presentado',
            'FEB-Presentado',
            'MAR-Presentado',
            'ABR-Presentado',
            'MAY-Presentado',
            'JUN-Presentado',
            'JUL-Presentado',
            'AGO-Presentado',
            'SEP-Presentado',
            'OCT-Presentado',
            'NOV-Presentado',
            'DIC-Presentado'
        ]
    };

    const periodoSelectBox = document.getElementById('periodo-select');
    const periodoOptionsBox = document.getElementById('periodo-options');
    const periodoSpan = periodoSelectBox ? periodoSelectBox.querySelector('span') : null;

    const mesSelectBox = document.getElementById('mes-select');
    const mesOptionsBox = document.getElementById('mes-options');
    const mesSpan = mesSelectBox ? mesSelectBox.querySelector('span') : null;

    const btnAceptar = document.getElementById('btn-aceptar-periodo');

    function updateAceptarButtonState() {
        if (!periodoSpan || !mesSpan || !btnAceptar) return;
        const periodoSeleccionado = periodoSpan.textContent;
        const mesSeleccionado = mesSpan.textContent;

        if (periodoSeleccionado !== 'Seleccionar' && mesSeleccionado !== 'Seleccionar') {
            btnAceptar.style.opacity = '1';
            btnAceptar.style.pointerEvents = 'auto';
        } else {
            btnAceptar.style.opacity = '0.5';
            btnAceptar.style.pointerEvents = 'none';
        }
    }

    // Si el periodo fue generado en la simulación (guardado en 'sire_presentado'),
    // la etiqueta del mes pasa de "No Presentado" a "Presentado"
    function etiquetaMesPresentado(yearKey, month) {
        try {
            const presentados = JSON.parse(SimStore.getItem('sire_presentado') || '{}');
            const mesMap = {
                'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04',
                'MAY': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
                'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12'
            };
            const abrev = month.split('-')[0];
            const periodo = yearKey + '-' + mesMap[abrev];
            if (presentados[periodo]) return abrev + '-Presentado';
        } catch (e) { /* estado corrupto: se ignora */ }
        return month;
    }

    function updateMonthOptions(yearKey) {
        if (!mesOptionsBox || !mesSpan) return;

        // Clear existing options
        mesOptionsBox.innerHTML = '';

        const months = monthData[yearKey] || [];
        months.forEach(month => {
            const div = document.createElement('div');
            div.className = 'option-item';
            div.textContent = etiquetaMesPresentado(yearKey, month);
            mesOptionsBox.appendChild(div);
        });

        // Re-bind click events for month options
        mesOptionsBox.querySelectorAll('.option-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                mesSpan.textContent = item.textContent;
                mesOptionsBox.classList.remove('show');
                updateAceptarButtonState();
            });
        });
    }

    // Bind period selection toggle
    if (periodoSelectBox && periodoOptionsBox && periodoSpan) {
        periodoSelectBox.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mesOptionsBox) mesOptionsBox.classList.remove('show');
            periodoOptionsBox.classList.toggle('show');
        });

        periodoOptionsBox.querySelectorAll('.option-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const selectedText = item.textContent;
                const yearKey = selectedText.split('-')[0];

                if (periodoSpan.textContent !== selectedText) {
                    periodoSpan.textContent = selectedText;
                    if (mesSpan) mesSpan.textContent = 'Seleccionar';
                    updateMonthOptions(yearKey);
                }

                periodoOptionsBox.classList.remove('show');
                updateAceptarButtonState();
            });
        });
    }

    // Bind month selection toggle
    if (mesSelectBox && mesOptionsBox && mesSpan && periodoSpan) {
        mesSelectBox.addEventListener('click', (e) => {
            e.stopPropagation();
            if (periodoOptionsBox) periodoOptionsBox.classList.remove('show');

            // Only show months if year is selected
            const periodoSeleccionado = periodoSpan.textContent;
            if (periodoSeleccionado !== 'Seleccionar') {
                // Reconstruir opciones al abrir para reflejar periodos ya Presentados
                if (!mesOptionsBox.classList.contains('show')) {
                    const seleccionActual = mesSpan.textContent;
                    updateMonthOptions(periodoSeleccionado.split('-')[0]);
                    mesSpan.textContent = seleccionActual;
                }
                mesOptionsBox.classList.toggle('show');
            }
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        if (periodoOptionsBox) periodoOptionsBox.classList.remove('show');
        if (mesOptionsBox) mesOptionsBox.classList.remove('show');
    });

    // Aceptar button logic
    if (btnAceptar) {
        btnAceptar.addEventListener('click', async () => {
            const periodoSeleccionado = document.querySelector('#periodo-select span').textContent;
            const mesSeleccionado = document.querySelector('#mes-select span').textContent;

            if (periodoSeleccionado !== 'Seleccionar' && mesSeleccionado !== 'Seleccionar') {
                const mainContent = document.getElementById('main-content-display');
                if (mainContent) {
                    mainContent.style.display = 'block';
                }

                // Asegurar que la primera tab activa sea "Resumen de CP"
                const firstSubTab = document.querySelector('.sub-tab-btn[data-target="resumen-cp"]');
                if (firstSubTab) firstSubTab.click();

                // Construir el string del periodo MM/YYYY para coincidir con la base de datos
                // Ejemplo: periodo=2025, mes=ENE -> 01/2025
                const year = periodoSeleccionado.split('-')[0];
                const mesMap = {
                    'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04',
                    'MAY': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
                    'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12'
                };
                const mesText = mesSeleccionado.split('-')[0];
                const searchPeriod = `${mesMap[mesText]}/${year}`;
                const userRuc = '20123456789'; // Usuario demostrativo

                // Periodo 'YYYYMM' usado para persistir/recuperar el contenido editado
                currentPeriodoRvie = year + (mesMap[mesText] || '');
                actualizarBotonPresentadoRvie();

                // MASTER: si hay contenido guardado (editado/agregado) para este
                // periodo, se usa ese en lugar de la propuesta base de Supabase.
                const contenidoGuardado = cargarContenidoRvie(currentPeriodoRvie);
                if (contenidoGuardado) {
                    renderRvieContenido(contenidoGuardado);
                    return;
                }

                // Limpiar la tabla de resumen
                const tbody = document.getElementById('summary-table-body');
                if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center">Cargando datos de Supabase...</td></tr>`;

                if (typeof window.supabase !== 'undefined' && authSupabaseClient) {
                    try {
                        const parts = searchPeriod.split('/');
                        const searchPeriodBigInt = parseInt(parts[1] + parts[0]); // '01/2025' -> 202501

                        const { data, error } = await authSupabaseClient
                            .from('registro_ventas')
                            .select('*')
                            .eq('Periodo', searchPeriodBigInt);

                        if (error) throw error;

                        if (data && data.length > 0) {
                            procesarDatosRvie(data);
                        } else {
                            if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center">No se encontraron registros para el periodo ${searchPeriod}.</td></tr>`;
                        }
                    } catch (err) {
                        console.error("Error fetching data:", err);
                        if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error de conexión con Supabase.</td></tr>`;
                    }
                } else {
                    if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center">Supabase no está configurado o conectado.</td></tr>`;
                }
            }
        });
    }

    // =============================================
    // Datepicker Personalizado para campos de fecha
    // =============================================
    class CustomDatePicker {
        constructor(inputElement) {
            this.input = inputElement;
            this.wrapper = inputElement.parentElement;
            this.icon = this.wrapper.querySelector('i');
            
            this.currentDate = new Date();
            this.parseInputValue();

            this.popup = null;
            this.init();
        }

        parseInputValue() {
            const val = this.input.value.trim();
            const parts = val.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                    this.currentDate = new Date(year, month, day);
                }
            }
        }

        init() {
            this.input.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });

            if (this.icon) {
                this.icon.style.cursor = 'pointer';
                this.icon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggle();
                });
            }
        }

        toggle() {
            document.querySelectorAll('.custom-calendar-popup').forEach(p => {
                if (p !== this.popup) p.style.display = 'none';
            });

            if (!this.popup) {
                this.createPopup();
            }

            if (this.popup.style.display === 'none') {
                this.parseInputValue();
                this.render();
                this.popup.style.display = 'block';
            } else {
                this.popup.style.display = 'none';
            }
        }

        createPopup() {
            this.popup = document.createElement('div');
            this.popup.className = 'custom-calendar-popup';
            this.popup.style.display = 'none';
            
            this.popup.addEventListener('click', (e) => e.stopPropagation());
            this.wrapper.appendChild(this.popup);
        }

        render() {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();

            let headerHtml = `
                <div class="calendar-header">
                    <button class="calendar-nav-btn prev-month" type="button"><i class="fas fa-chevron-left"></i></button>
                    <select class="calendar-select-month">
            `;
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            months.forEach((m, idx) => {
                headerHtml += `<option value="${idx}" ${idx === month ? 'selected' : ''}>${m}</option>`;
            });
            headerHtml += `
                    </select>
                    <select class="calendar-select-year">
            `;
            for (let y = year - 10; y <= year + 10; y++) {
                headerHtml += `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`;
            }
            headerHtml += `
                    </select>
                    <button class="calendar-nav-btn next-month" type="button"><i class="fas fa-chevron-right"></i></button>
                </div>
                <div class="calendar-weekdays">
                    <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sa</span><span>Do</span>
                </div>
                <div class="calendar-days"></div>
            `;

            this.popup.innerHTML = headerHtml;

            this.popup.querySelector('.prev-month').addEventListener('click', (e) => {
                e.stopPropagation();
                this.changeMonth(-1);
            });
            this.popup.querySelector('.next-month').addEventListener('click', (e) => {
                e.stopPropagation();
                this.changeMonth(1);
            });
            this.popup.querySelector('.calendar-select-month').addEventListener('change', (e) => {
                this.currentDate.setMonth(parseInt(e.target.value, 10));
                this.render();
            });
            this.popup.querySelector('.calendar-select-year').addEventListener('change', (e) => {
                this.currentDate.setFullYear(parseInt(e.target.value, 10));
                this.render();
            });

            const daysContainer = this.popup.querySelector('.calendar-days');
            const firstDay = new Date(year, month, 1);
            let startDay = firstDay.getDay(); 
            let startDayIndex = startDay === 0 ? 6 : startDay - 1; 

            const currentMonthDays = new Date(year, month + 1, 0).getDate();
            const prevMonthDays = new Date(year, month, 0).getDate();

            for (let i = startDayIndex; i > 0; i--) {
                const dayNum = prevMonthDays - i + 1;
                const span = document.createElement('span');
                span.className = 'prev-month';
                span.textContent = dayNum;
                span.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectDate(dayNum, -1);
                });
                daysContainer.appendChild(span);
            }

            let selDay = -1;
            const valParts = this.input.value.trim().split('/');
            if (valParts.length === 3) {
                const d = parseInt(valParts[0], 10);
                const m = parseInt(valParts[1], 10) - 1;
                const y = parseInt(valParts[2], 10);
                if (d && m === month && y === year) {
                    selDay = d;
                }
            }

            for (let i = 1; i <= currentMonthDays; i++) {
                const span = document.createElement('span');
                span.className = 'current-month';
                if (i === selDay) {
                    span.classList.add('selected');
                }
                span.textContent = i;
                span.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectDate(i, 0);
                });
                daysContainer.appendChild(span);
            }

            const totalRendered = startDayIndex + currentMonthDays;
            const remaining = 42 - totalRendered;
            for (let i = 1; i <= remaining; i++) {
                const span = document.createElement('span');
                span.className = 'next-month';
                span.textContent = i;
                span.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectDate(i, 1);
                });
                daysContainer.appendChild(span);
            }
        }

        changeMonth(delta) {
            this.currentDate.setMonth(this.currentDate.getMonth() + delta);
            this.render();
        }

        selectDate(day, monthOffset) {
            let year = this.currentDate.getFullYear();
            let month = this.currentDate.getMonth() + monthOffset;
            
            const finalDate = new Date(year, month, day);
            const dayStr = String(finalDate.getDate()).padStart(2, '0');
            const monthStr = String(finalDate.getMonth() + 1).padStart(2, '0');
            const yearStr = finalDate.getFullYear();

            this.input.value = `${dayStr}/${monthStr}/${yearStr}`;
            this.popup.style.display = 'none';

            this.input.dispatchEvent(new Event('input', { bubbles: true }));
            this.input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    // Inicializar Datepickers
    const emisionInput = document.getElementById('cp-fecha-emision');
    const vctoInput = document.getElementById('cp-fecha-vcto');
    if (emisionInput) new CustomDatePicker(emisionInput);
    if (vctoInput) new CustomDatePicker(vctoInput);

    // Cerrar calendarios al hacer clic fuera
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-calendar-popup').forEach(p => {
            p.style.display = 'none';
        });
    });

    // =============================================
    // Custom Dropdown para Tipo CP / DOC (Lista grande)
    // =============================================
    const docTypes = [
        { code: '00', text: '00 - Otros' },
        { code: '01', text: '01 - Factura' },
        { code: '03', text: '03 - Boleta de Venta' },
        { code: '04', text: '04 - Liquidación de Compra' },
        { code: '05', text: '05 - Boletos de Transporte Aéreo...' },
        { code: '06', text: '06 - Carta de porte aéreo' },
        { code: '07', text: '07 - Nota de Crédito' },
        { code: '08', text: '08 - Nota de Débito' },
        { code: '11', text: '11 - Póliza emitida por la Bolsa...' },
        { code: '12', text: '12 - Ticket de máquina registradora...' },
        { code: '13', text: '13 - Documento Bajo Control...' },
        { code: '14', text: '14 - Recibo de Servicios Públicos...' },
        { code: '15', text: '15 - Boletos emitidos por servicios...' },
        { code: '16', text: '16 - Boleto de viaje de transporte...' },
        { code: '17', text: '17 - Documentos emitidos por las empresas del sistema financiero...' },
        { code: '18', text: '18 - Documentos emitidos por las empresas de seguros...' },
        { code: '21', text: '21 - Conocimiento de embarque...' },
        { code: '24', text: '24 - Certificado de pago PERT...' },
        { code: '27', text: '27 - Seguro Complementario...' },
        { code: '28', text: '28 - Etiquetas por el pago de...' },
        { code: '30', text: '30 - Documentos emitidos por...' },
        { code: '32', text: '32 - Documentos emitidos g...' },
        { code: '34', text: '34 - Documento Electrónico ...' },
        { code: '35', text: '35 - Documento Electrónico ...' },
        { code: '36', text: '36 - Recibo de Distribución d...' },
        { code: '37', text: '37 - Documentos emitidos por...' },
        { code: '42', text: '42 - Documentos emitidos p...' },
        { code: '43', text: '43 - Boleto de aviación trans...' },
        { code: '44', text: '44 - Billetes de lotería, rifas y...' },
        { code: '45', text: '45 - Documentos emitidos p...' },
        { code: '48', text: '48 - Comprobantes de Operación...' },
        { code: '49', text: '49 - Constancia de Depósito...' },
        { code: '55', text: '55 - BVME para transporte fe...' },
        { code: '56', text: '56 - Comprobante de pago ...' },
        { code: '87', text: '87 - Nota de Crédito Especial' },
        { code: '88', text: '88 - Nota de Débito Especial' },
        { code: '89', text: '89 - Nota de Ajuste de Oper...' }
    ];

    const cpTipoDocSelect = document.getElementById('tipo-cp-select');
    const cpTipoDocOptions = document.getElementById('cp-tipo-doc-options');
    const cpTipoDocHidden = document.getElementById('cp-tipo-doc');

    if (cpTipoDocSelect && cpTipoDocOptions) {
        cpTipoDocOptions.innerHTML = '';

        docTypes.forEach(doc => {
            const div = document.createElement('div');
            div.className = 'option-item';
            div.textContent = doc.text;
            div.setAttribute('data-value', doc.code);
            cpTipoDocOptions.appendChild(div);
        });

        cpTipoDocSelect.addEventListener('click', (e) => {
            e.stopPropagation();
            cpTipoDocOptions.classList.toggle('show');
        });

        cpTipoDocOptions.querySelectorAll('.option-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const selectedVal = item.getAttribute('data-value');
                const selectedText = item.textContent;

                const span = cpTipoDocSelect.querySelector('span');
                if (span) span.textContent = selectedText;

                if (cpTipoDocHidden) {
                    cpTipoDocHidden.value = selectedVal;
                    cpTipoDocHidden.dispatchEvent(new Event('input', { bubbles: true }));
                    cpTipoDocHidden.dispatchEvent(new Event('change', { bubbles: true }));
                }

                cpTipoDocOptions.classList.remove('show');
            });
        });

        document.addEventListener('click', () => {
            cpTipoDocOptions.classList.remove('show');
        });
    }

    // =============================================
    // NAVEGACIÓN DESDE RCE – Mostrar Generación de Registros
    // =============================================
    if (sessionStorage.getItem('rce_nav_generacion') === '1') {
        sessionStorage.removeItem('rce_nav_generacion');
        sessionStorage.removeItem('rce_gen_periodo'); // clave legada, ya no se usa

        // No mostrar los modales informativos al venir del RCE:
        // ni el "Mensaje Informativo" (SIRE) ni el aviso de 12 horas
        if (infoModal) infoModal.style.display = 'none';
        const modal12h = document.getElementById('rvie-modal-12h');
        if (modal12h) modal12h.style.display = 'none';

        // Mostrar directamente la vista "Generación de Registros";
        // las filas salen del estado de aceptación (RCE y/o RVIE)
        mostrarVistaGeneracionRegistros();
        window.scrollTo(0, 0);
    }

    // =============================================
    // PROCESAR DATOS DE LA PROPUESTA DEL RVIE (resumen + tabla detallada)
    // Reutilizado tanto por la consulta a Supabase como por "Reemplazar Propuesta"
    // =============================================
    function procesarDatosRvie(data) {
        const tbody = document.getElementById('summary-table-body');

        function formatDate(dateStr) {
            if (!dateStr) return '';
            if (String(dateStr).includes('/')) return dateStr;
            const parts = String(dateStr).split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return dateStr;
        }

        // Calculate Totals for the Dashboard
        const groups = {};
        let grandTotals = {
            docs: 0, valExp: 0, biGrav: 0, dsctoBi: 0, mtoIgv: 0, icbper: 0, total: 0
        };

        data.forEach(row => {
            const rawType = row['Tipo CP/Doc.'] || row['Tipo CP/Doc'] || '01';
            const type = String(rawType).trim().padStart(2, '0');
            if (!groups[type]) {
                groups[type] = {
                    docs: 0, valExp: 0, biGrav: 0, dsctoBi: 0, mtoIgv: 0, icbper: 0, total: 0
                };
            }

            const valExpVal = parseFloat(row['Valor Facturado Exportación'] || row.valor_facturado_export || 0);
            const biGravVal = parseFloat(row['BI Gravada'] || row.bi_gravada || 0);
            const dsctoBiVal = parseFloat(row['Dscto BI'] || row.dscto_bi || 0);
            const mtoIgvVal = parseFloat(row['IGV / IPM'] || row.igv_ipm || 0);
            const icbperVal = parseFloat(row['ICBPER'] || row.icbper || 0);
            const totalVal = parseFloat(row['Total CP'] || row.total_cp || 0);

            groups[type].docs += 1;
            groups[type].valExp += valExpVal;
            groups[type].biGrav += biGravVal;
            groups[type].dsctoBi += dsctoBiVal;
            groups[type].mtoIgv += mtoIgvVal;
            groups[type].icbper += icbperVal;
            groups[type].total += totalVal;

            grandTotals.docs += 1;
            grandTotals.valExp += valExpVal;
            grandTotals.biGrav += biGravVal;
            grandTotals.dsctoBi += dsctoBiVal;
            grandTotals.mtoIgv += mtoIgvVal;
            grandTotals.icbper += icbperVal;
            grandTotals.total += totalVal;
        });

        const cpTypesMap = {
            '01': '01 - Factura',
            '03': '03 - Boleta de Venta',
            '07': '07 - Nota de Crédito',
            '08': '08 - Nota de Débito'
        };

        // Update Table
        if (tbody) {
            tbody.innerHTML = '';

            Object.keys(groups).sort().forEach(type => {
                const g = groups[type];
                const label = cpTypesMap[type] || `${type} - Otro`;

                tbody.innerHTML += `
                    <tr>
                        <td class="text-left">${label}</td>
                        <td>${g.docs}</td>
                        <td>${g.valExp.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>${g.biGrav.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>${g.dsctoBi.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>${g.mtoIgv.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>${g.icbper.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>${g.total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                `;
            });

            // Update Footer
            const tfoot = document.getElementById('summary-table-foot');
            if (tfoot) {
                tfoot.innerHTML = `
                    <tr class="totals-row totals-row-red">
                        <td class="text-left">TOTAL:</td>
                        <td>${grandTotals.docs}</td>
                        <td>${grandTotals.valExp.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>${grandTotals.biGrav.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>${grandTotals.dsctoBi.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>${grandTotals.mtoIgv.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>${grandTotals.icbper.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>${grandTotals.total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                `;
            }

            // Update summary pagination text
            const sumPagInfo = document.getElementById('summary-pagination-info');
            if (sumPagInfo) {
                const sumCount = Object.keys(groups).length;
                sumPagInfo.textContent = `Mostrando del 1 al ${sumCount} de un total ${sumCount} registros`;
            }

            // Update Ring Charts
            const chartQty = document.getElementById('chart-qty');
            const chartAmount = document.getElementById('chart-amount');
            if (chartQty) chartQty.textContent = grandTotals.docs;
            if (chartAmount) chartAmount.textContent = grandTotals.total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        // Pass the data to the old 'Propuesta' detailed table
        renderTable(mapearFilasRvie(data));
    }

    // Convierte filas crudas (importadas o de Supabase) al formato snake_case
    // que usa renderTable. Extraído para reutilizarlo al alimentar el Preliminar.
    function mapearFilasRvie(data) {
        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            if (String(dateStr).includes('/')) return dateStr;
            const parts = String(dateStr).split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
            return dateStr;
        };
        return data.map(d => ({
            ruc: d['Ruc'] || '20123456789',
            razon_social: d['Razon Social'] || 'EMPRESA DEMO S.A.C.',
            periodo: d['Periodo'],
            src_key: d['CAR SUNAT'] || '',
            fecha_emision: formatDate(d['Fecha de emisión']),
            fecha_vcto_pago: formatDate(d['Fecha Vcto/Pago']),
            tipo_cp: d['Tipo CP/Doc.'] ? String(d['Tipo CP/Doc.']).trim().padStart(2, '0') : '01',
            comprobante: d['Comprobante'] || (String(d['Tipo CP/Doc.']).trim().padStart(2, '0') === '01' ? 'Factura' : (String(d['Tipo CP/Doc.']).trim().padStart(2, '0') === '03' ? 'Boleta de Venta' : (String(d['Tipo CP/Doc.']).trim().padStart(2, '0') === '07' ? 'Nota de Crédito' : (String(d['Tipo CP/Doc.']).trim().padStart(2, '0') === '08' ? 'Nota de Débito' : 'Otro')))),
            serie: d['Serie del CDP'],
            numero: d['Nro CP o Doc. Nro Inicial (Rango)'],
            nro_final: d['Nro Final (Rango)'] || '',
            tipo_doc_identidad: d['Tipo Doc Identidad'],
            nro_doc_identidad: d['Nro Doc Identidad'],
            cliente: d['Apellidos Nombres/ Razón Social'],
            tipo_cliente: d['Tipo de Cliente'] || 'Empresa Nacional',
            valor_facturado_export: d['Valor Facturado Exportación'],
            bi_gravada: d['BI Gravada'],
            dscto_bi: d['Dscto BI'],
            igv_ipm: d['IGV / IPM'],
            dscto_igv_ipm: d['Dscto IGV / IPM'],
            mto_exonerado: d['Mto Exonerado'],
            mto_inafecto: d['Mto Inafecto'],
            isc: d['ISC'],
            bi_grav_ivap: d['BI Grav IVAP'],
            ivap: d['IVAP'],
            icbper: d['ICBPER'],
            otros_tributos: d['Otros Tributos'],
            anticipos: d['Anticipos'] || d['Anticipos (S/)'] || 0.00,
            otros_cargos: d['Otros Cargos'] || d['Otros Cargos (S/)'] || 0.00,
            monto_redondeo: d['Monto de Redondeo'] || d['Monto de Redondeo (S/)'] || 0.00,
            total_cp: d['Total CP'],
            moneda: d['Moneda'],
            tipo_cambio: d['Tipo Cambio'],
            doc_mod_fecha_emision: formatDate(d['Fecha Emisión Doc Modificado']),
            doc_mod_tipo_cp: d['Tipo CP Modificado'],
            doc_mod_serie: d['Serie CP Modificado'],
            doc_mod_numero: d['Nro CP Modificado'],
            detalle_operacion: d['Detalle de la Operación'] || d['Detalle de la operacion'] || '',
            descripcion: d['Descripción'] || d['Descripcion'] || '',
            forma_pago: d['Forma de Pago'] || d['Forma de pago'] || '',
            nro_cuotas: d['N° de Cuotas'] || d['Nro de cuotas'] || '',
            motivo_nota_credito: d['Motivo Nota de Crédito'] || d['Motivo nota de credito'] || '',
            sujeto_detraccion: d['Sujeto a Detracción'] || d['Sujeto a detraccion'] || false,
            pct_detraccion: d['% de Detracción'] || d['% de detraccion'] || 0,
            monto_detraccion: d['Monto Detracción'] || d['Monto detraccion'] || 0.00,
            nro_constancia_detrac: d['N° Constancia Depósito Detracción'] || d['Nro constancia deposito detraccion'] || '',
            id_proyecto: d['ID Proyecto Operadores Atribución'] || '',
            tipo_nota: d['Tipo de Nota'] || '',
            est_comp: d['Est. Comp'] || '1',
            desc_comp: 'ACTIVO',
            valor_fob: d['Valor FOB Embarcado'] || '0.00',
            valor_op_gratuitas: d['Valor OP Gratuitas'] || '0.00',
            tipo_operacion: String(d['Tipo Operación'] || '0101').padStart(4, '0'),
            dam: d['DAM / CP'] || '',
            clu: d['CLU'] || ''
        }));
    }

    // =============================================
    // PRELIMINAR DEL RVIE
    // Los datos aceptados/reemplazados se copian aquí; la Propuesta no se toca.
    // =============================================
    let preliminarActuales = [];
    function prelimKeyRvie(p) { return 'sire_rvie_prelim_' + p; }

    function renderPreliminarRvie(rows) {
        preliminarActuales = Array.isArray(rows) ? rows.slice() : [];
        renderTable(preliminarActuales, {
            tbodySel: '#preliminar-rvie .results-table tbody',
            totalPrefix: 'prelim-total-',
            pagInfoId: 'prelim-pagination-info',
            setState: false
        });
        guardarPreliminarRvie();
    }

    function guardarPreliminarRvie() {
        if (!esMasterRvie() || !currentPeriodoRvie) return;
        try { SimStore.setItem(prelimKeyRvie(currentPeriodoRvie), JSON.stringify(preliminarActuales)); } catch (e) {}
    }

    function irAPreliminarRvie() {
        const btn = document.querySelector('.sub-tab-btn[data-target="preliminar-rvie"]');
        if (btn) btn.click();
    }

    // =============================================
    // EDICIÓN Y PERSISTENCIA DE CONTENIDO DEL RVIE (solo rol MASTER)
    // =============================================
    let currentPeriodoRvie = '';   // 'YYYYMM' del periodo cargado en la propuesta
    let modoEdicionRvie = false;

    function esMasterRvie() {
        try { return !!(window.SimStore && SimStore.esMaster()); } catch (e) { return false; }
    }

    function contentKeyRvie(periodo) { return 'sire_rvie_content_' + periodo; }

    function comprobantePorTipo(tp) {
        const t = String(tp || '').trim().padStart(2, '0');
        return t === '01' ? 'Factura' : t === '03' ? 'Boleta de Venta' :
            t === '07' ? 'Nota de Crédito' : t === '08' ? 'Nota de Débito' : 'Otro';
    }

    // Mapa: índice de celda en el detalle -> campo del comprobante (n = numérico)
    const MAP_EDIT_RVIE = [
        { i: 3, f: 'fecha_emision' }, { i: 4, f: 'fecha_vcto_pago' },
        { i: 5, f: 'tipo_cp' }, { i: 6, f: 'serie' }, { i: 7, f: 'numero' }, { i: 8, f: 'nro_final' },
        { i: 9, f: 'tipo_doc_identidad' }, { i: 10, f: 'nro_doc_identidad' }, { i: 11, f: 'cliente' },
        { i: 12, f: 'valor_facturado_export', n: true }, { i: 13, f: 'bi_gravada', n: true },
        { i: 14, f: 'dscto_bi', n: true }, { i: 15, f: 'igv_ipm', n: true }, { i: 16, f: 'dscto_igv_ipm', n: true },
        { i: 17, f: 'mto_exonerado', n: true }, { i: 18, f: 'mto_inafecto', n: true }, { i: 19, f: 'isc', n: true },
        { i: 20, f: 'bi_grav_ivap', n: true }, { i: 21, f: 'ivap', n: true }, { i: 22, f: 'icbper', n: true },
        { i: 23, f: 'otros_tributos', n: true }, { i: 24, f: 'total_cp', n: true },
        { i: 25, f: 'moneda' }, { i: 26, f: 'tipo_cambio', n: true },
        { i: 28, f: 'doc_mod_fecha_emision' }, { i: 29, f: 'doc_mod_tipo_cp' }, { i: 30, f: 'doc_mod_serie' }, { i: 31, f: 'doc_mod_numero' },
        { i: 32, f: 'id_proyecto' }, { i: 33, f: 'tipo_nota' }, { i: 34, f: 'est_comp' }, { i: 35, f: 'desc_comp' },
        { i: 36, f: 'valor_fob', n: true }, { i: 37, f: 'valor_op_gratuitas', n: true },
        { i: 38, f: 'tipo_operacion' }, { i: 39, f: 'dam' }, { i: 40, f: 'clu' }, { i: 41, f: 'src_key' }
    ];

    // Renderiza detalle + resumen desde los comprobantes (snake_case)
    function renderRvieContenido(rows) {
        renderTable(rows);
        actualizarResumenRvie(rows);
        if (modoEdicionRvie) aplicarModoEdicionRvie(true);
    }

    // Recalcula el resumen (parte superior) desde los comprobantes en snake_case
    function actualizarResumenRvie(rows) {
        const tbody = document.getElementById('summary-table-body');
        if (!tbody) return;
        const fmt = n => Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const groups = {}; const gt = { docs: 0, valExp: 0, biGrav: 0, dsctoBi: 0, mtoIgv: 0, icbper: 0, total: 0 };
        rows.forEach(r => {
            const t = String(r.tipo_cp || '01').trim().padStart(2, '0');
            if (!groups[t]) groups[t] = { docs: 0, valExp: 0, biGrav: 0, dsctoBi: 0, mtoIgv: 0, icbper: 0, total: 0 };
            const add = (o) => {
                o.docs += 1; o.valExp += +r.valor_facturado_export || 0; o.biGrav += +r.bi_gravada || 0;
                o.dsctoBi += +r.dscto_bi || 0; o.mtoIgv += +r.igv_ipm || 0; o.icbper += +r.icbper || 0; o.total += +r.total_cp || 0;
            };
            add(groups[t]); add(gt);
        });
        const labels = { '01': '01 - Factura', '03': '03 - Boleta de Venta', '07': '07 - Nota de Crédito', '08': '08 - Nota de Débito' };
        tbody.innerHTML = '';
        Object.keys(groups).sort().forEach(t => {
            const g = groups[t];
            tbody.innerHTML += `<tr><td class="text-left">${labels[t] || t + ' - Otro'}</td><td>${g.docs}</td>` +
                `<td>${fmt(g.valExp)}</td><td>${fmt(g.biGrav)}</td><td>${fmt(g.dsctoBi)}</td>` +
                `<td>${fmt(g.mtoIgv)}</td><td>${fmt(g.icbper)}</td><td>${fmt(g.total)}</td></tr>`;
        });
        const tfoot = document.getElementById('summary-table-foot');
        if (tfoot) tfoot.innerHTML = `<tr class="totals-row totals-row-red"><td class="text-left">TOTAL:</td><td>${gt.docs}</td>` +
            `<td>${fmt(gt.valExp)}</td><td>${fmt(gt.biGrav)}</td><td>${fmt(gt.dsctoBi)}</td><td>${fmt(gt.mtoIgv)}</td>` +
            `<td>${fmt(gt.icbper)}</td><td>${fmt(gt.total)}</td></tr>`;
        const sumPag = document.getElementById('summary-pagination-info');
        if (sumPag) { const c = Object.keys(groups).length; sumPag.textContent = `Mostrando del 1 al ${c} de un total ${c} registros`; }
        const cq = document.getElementById('chart-qty'); if (cq) cq.textContent = gt.docs;
        const ca = document.getElementById('chart-amount'); if (ca) ca.textContent = fmt(gt.total);
    }

    function guardarContenidoRvie() {
        if (!esMasterRvie() || !currentPeriodoRvie) return;
        try { SimStore.setItem(contentKeyRvie(currentPeriodoRvie), JSON.stringify(comprobantesActuales)); } catch (e) {}
    }

    function cargarContenidoRvie(periodo) {
        if (!esMasterRvie()) return null;
        try {
            const raw = SimStore.getItem(contentKeyRvie(periodo));
            if (!raw) return null;
            const arr = JSON.parse(raw);
            return Array.isArray(arr) && arr.length ? arr : null;
        } catch (e) { return null; }
    }

    // Activa/desactiva la edición inline en el detalle (solo MASTER)
    function aplicarModoEdicionRvie(activar) {
        const tbody = document.querySelector('.results-table tbody');
        if (!tbody) return;
        Array.from(tbody.rows).forEach(tr => {
            MAP_EDIT_RVIE.forEach(m => {
                const td = tr.cells[m.i];
                if (!td) return;
                td.contentEditable = activar ? 'true' : 'false';
                td.classList.toggle('celda-editable-rvie', activar);
            });
        });
    }

    // Lee los valores editados del DOM hacia comprobantesActuales
    function leerEdicionRvie() {
        const tbody = document.querySelector('.results-table tbody');
        if (!tbody) return;
        Array.from(tbody.rows).forEach((tr, idx) => {
            const row = comprobantesActuales[idx];
            if (!row) return;
            MAP_EDIT_RVIE.forEach(m => {
                const td = tr.cells[m.i];
                if (!td) return;
                let val = td.textContent.trim();
                if (m.n) val = parseFloat(val.replace(/,/g, '')) || 0;
                row[m.f] = val;
            });
            row.comprobante = comprobantePorTipo(row.tipo_cp);
        });
    }

    function toggleEditarRvie() {
        if (!esMasterRvie()) { alert('La edición directa solo está disponible para el perfil MASTER.'); return; }
        if (!comprobantesActuales.length) { alert('No hay comprobantes para editar. Cargue una propuesta primero.'); return; }
        const btn = document.getElementById('btn-editar-cp');
        if (!modoEdicionRvie) {
            modoEdicionRvie = true;
            aplicarModoEdicionRvie(true);
            if (btn) btn.innerHTML = '<i class="fas fa-save"></i> Guardar edición';
        } else {
            leerEdicionRvie();
            modoEdicionRvie = false;
            renderRvieContenido(comprobantesActuales);
            guardarContenidoRvie();
            if (btn) btn.innerHTML = '<i class="fas fa-pen"></i> Editar';
            alert('Cambios guardados.');
        }
    }

    function eliminarSeleccionadosRvie() {
        if (!esMasterRvie()) { alert('Eliminar comprobantes solo está disponible para el perfil MASTER.'); return; }
        const tbody = document.querySelector('.results-table tbody');
        if (!tbody) return;
        const conservar = [];
        Array.from(tbody.rows).forEach((tr, idx) => {
            const chk = tr.cells[0] && tr.cells[0].querySelector('input[type="checkbox"]');
            if (!(chk && chk.checked)) conservar.push(comprobantesActuales[idx]);
        });
        if (conservar.length === comprobantesActuales.length) { alert('Seleccione al menos un comprobante para eliminar.'); return; }
        comprobantesActuales = conservar;
        renderRvieContenido(comprobantesActuales);
        guardarContenidoRvie();
    }

    // Construye un comprobante (snake_case) a partir del modal "Agregar CP"
    function construirComprobanteDesdeModal() {
        const gv = id => { const el = document.getElementById(id); return el ? String(el.value).trim() : ''; };
        const nv = id => parseFloat(gv(id).replace(/,/g, '')) || 0;
        const tipo = gv('cp-tipo-doc') || '01';
        return {
            ruc: gv('cp-ruc'), razon_social: gv('cp-razon-social'),
            periodo: gv('cp-periodo'), src_key: gv('cp-car-sunat'),
            fecha_emision: gv('cp-fecha-emision'), fecha_vcto_pago: gv('cp-fecha-vcto'),
            tipo_cp: String(tipo).padStart(2, '0'), comprobante: comprobantePorTipo(tipo),
            serie: gv('cp-serie'), numero: gv('cp-nro-inicial'), nro_final: gv('cp-nro-final'),
            tipo_doc_identidad: gv('cp-tipo-doc-id'), nro_doc_identidad: gv('cp-nro-doc-id'),
            cliente: gv('cp-adquiriente'), tipo_cliente: 'Empresa Nacional',
            valor_facturado_export: nv('cp-valor-export'), bi_gravada: nv('cp-bi-gravada'),
            dscto_bi: nv('cp-dscto-bi'), igv_ipm: nv('cp-igv'), dscto_igv_ipm: nv('cp-dscto-igv'),
            mto_exonerado: nv('cp-mto-exonerado'), mto_inafecto: nv('cp-mto-inafecto'), isc: nv('cp-isc'),
            bi_grav_ivap: nv('cp-bi-ivap'), ivap: nv('cp-ivap'), icbper: nv('cp-icbper'),
            otros_tributos: nv('cp-otros-tributos'), anticipos: 0, otros_cargos: 0, monto_redondeo: 0,
            total_cp: nv('cp-total'), moneda: gv('cp-moneda') || 'PEN', tipo_cambio: nv('cp-tipo-cambio') || 1,
            doc_mod_fecha_emision: gv('cp-fecha-doc-mod'), doc_mod_tipo_cp: gv('cp-tipo-cp-mod'),
            doc_mod_serie: gv('cp-serie-mod'), doc_mod_numero: gv('cp-nro-mod'),
            id_proyecto: gv('cp-id-proyecto'), tipo_nota: gv('cp-tipo-nota'),
            est_comp: gv('cp-est-comp') || '1', desc_comp: 'ACTIVO',
            valor_fob: nv('cp-valor-fob'), valor_op_gratuitas: nv('cp-valor-gratuitas'),
            tipo_operacion: gv('cp-tipo-operacion') || '0101', dam: gv('cp-dam'), clu: gv('cp-clu')
        };
    }

    // Alterna el estado Presentado / No Presentado del periodo cargado (solo MASTER)
    function togglePresentadoRvie() {
        if (!esMasterRvie()) { alert('Cambiar el estado Presentado solo está disponible para el perfil MASTER.'); return; }
        if (!currentPeriodoRvie || currentPeriodoRvie.length < 6) { alert('Primero cargue un periodo (Aceptar propuesta).'); return; }
        const periodo = currentPeriodoRvie.slice(0, 4) + '-' + currentPeriodoRvie.slice(4, 6);
        let presentados = {};
        try { presentados = JSON.parse(SimStore.getItem('sire_presentado') || '{}'); } catch (e) {}
        if (presentados[periodo]) delete presentados[periodo]; else presentados[periodo] = true;
        SimStore.setItem('sire_presentado', JSON.stringify(presentados));
        const nuevoEstado = presentados[periodo] ? 'PRESENTADO' : 'NO PRESENTADO';
        // Refrescar etiquetas del selector de meses
        const periodoSel = document.querySelector('#periodo-select span');
        if (periodoSel && periodoSel.textContent !== 'Seleccionar') updateMonthOptions(periodoSel.textContent.split('-')[0]);
        const btn = document.getElementById('btn-toggle-presentado-rvie');
        if (btn) btn.innerHTML = '<i class="fas fa-flag"></i> Estado: ' + nuevoEstado;
        alert('El periodo ' + periodo + ' quedó como ' + nuevoEstado + '.');
    }

    // Muestra/oculta el botón de estado y refleja el estado actual del periodo
    function actualizarBotonPresentadoRvie() {
        const btn = document.getElementById('btn-toggle-presentado-rvie');
        if (!btn) return;
        if (!esMasterRvie()) { btn.style.display = 'none'; return; }
        btn.style.display = '';
        let estado = 'NO PRESENTADO';
        if (currentPeriodoRvie && currentPeriodoRvie.length >= 6) {
            const periodo = currentPeriodoRvie.slice(0, 4) + '-' + currentPeriodoRvie.slice(4, 6);
            try {
                const p = JSON.parse(SimStore.getItem('sire_presentado') || '{}');
                if (p[periodo]) estado = 'PRESENTADO';
            } catch (e) {}
        }
        btn.innerHTML = '<i class="fas fa-flag"></i> Estado: ' + estado;
    }

    // Delegación de clicks para Editar / Eliminar / Presentado
    document.addEventListener('click', function (e) {
        if (e.target.closest('#btn-editar-cp')) { e.preventDefault(); toggleEditarRvie(); }
        else if (e.target.closest('#btn-eliminar-cp')) { e.preventDefault(); eliminarSeleccionadosRvie(); }
        else if (e.target.closest('#btn-toggle-presentado-rvie')) { e.preventDefault(); togglePresentadoRvie(); }
    });

    // =============================================
    // REEMPLAZAR PROPUESTA RVIE (importación de zip con txt plano)
    // =============================================
    // Campos obligatorios del RVIE (offset relativo al inicio de los datos del
    // comprobante, es decir después de RUC/Razón cuando el archivo los incluye).
    const OBLIGATORIOS_RVIE = [
        { off: 0, nombre: 'Periodo' },
        { off: 2, nombre: 'Fecha de emisión' },
        { off: 4, nombre: 'Tipo CP/Doc.' },
        { off: 6, nombre: 'Nro CP o Doc. Nro Inicial (Rango)' },
        { off: 8, nombre: 'Tipo Doc Identidad' },
        { off: 9, nombre: 'Nro Doc Identidad' },
        { off: 10, nombre: 'Apellidos Nombres/ Razón Social' },
        { off: 23, nombre: 'Total CP' },
        { off: 24, nombre: 'Moneda' }
    ];

    // ==== Catálogos de códigos válidos (Anexo N.° 1) para validar el contenido ====
    // Tabla 3: Tipo de Comprobante de Pago o Documento (RVIE)
    const CODIGOS_CP_RVIE = new Set([
        '00', '01', '03', '04', '05', '06', '07', '08', '11', '12', '13', '14', '15', '16',
        '17', '18', '19', '21', '23', '24', '27', '28', '29', '30', '32', '34', '35', '36',
        '37', '42', '43', '44', '45', '48', '49', '55', '56', '64', '87', '88', '89'
    ]);
    // Tabla 1: Tipo de Documento de Identidad
    const CODIGOS_DOC_ID = new Set(['0', '1', '4', '6', '7', 'A', 'B', 'C', 'D', 'E', 'F', 'G']);
    // Tabla 2: Código de Moneda (ISO 4217)
    const CODIGOS_MONEDA = new Set([
        'PEN', 'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK', 'CNY',
        'KRW', 'BOB', 'BRL', 'CLP', 'COP', 'MXN', 'ARS', 'UYU'
    ]);

    const REGEX_FECHA_RVIE = /^\d{2}\/\d{2}\/\d{4}$/;

    // Valida el contenido de los campos según los catálogos del Anexo N.° 1.
    // Devuelve la primera inconsistencia encontrada o null si todos son válidos.
    function validarContenidoRvie(f, base, conRuc) {
        const g = i => String(f[base + i] !== undefined ? f[base + i] : '').trim();

        if (conRuc && !/^\d{11}$/.test(String(f[0]).trim())) {
            return { pos: '1', codigo: '461', descripcion: 'El RUC debe tener 11 dígitos numéricos' };
        }
        const periodo = g(0).length === 8 && g(0).endsWith('00') ? g(0).slice(0, 6) : g(0);
        if (!/^\d{6}$/.test(periodo) || Number(periodo.slice(4, 6)) < 1 || Number(periodo.slice(4, 6)) > 12) {
            return { pos: String(base + 1), codigo: '462', descripcion: 'El periodo debe tener el formato AAAAMM (mes entre 01 y 12)' };
        }
        if (!REGEX_FECHA_RVIE.test(g(2))) {
            return { pos: String(base + 3), codigo: '463', descripcion: 'La fecha de emisión debe tener el formato DD/MM/AAAA' };
        }
        if (!CODIGOS_CP_RVIE.has(g(4))) {
            return { pos: String(base + 5), codigo: '470', descripcion: 'Tipo de comprobante de pago no válido (Tabla 3 del Anexo N.° 1)' };
        }
        if (!CODIGOS_DOC_ID.has(g(8))) {
            return { pos: String(base + 9), codigo: '471', descripcion: 'Tipo de documento de identidad no válido (Tabla 1 del Anexo N.° 1)' };
        }
        if (g(24) && !CODIGOS_MONEDA.has(g(24))) {
            return { pos: String(base + 25), codigo: '472', descripcion: 'Código de moneda no válido (Tabla 2 del Anexo N.° 1)' };
        }
        // Tipo CP Modificado (solo notas de crédito/débito 07/08/87/88): validar si viene informado
        if (g(27) && !CODIGOS_CP_RVIE.has(g(27))) {
            return { pos: String(base + 28), codigo: '470', descripcion: 'Tipo de comprobante modificado no válido (Tabla 3 del Anexo N.° 1)' };
        }
        return null;
    }

    // Identificador del comprobante para el reporte: RUC_TipoCP_Serie_Nro
    function idComprobanteRvie(f, base, ruc) {
        const tipoCp = String(f[base + 4] || '').trim();
        const serie = String(f[base + 5] || '').trim();
        const nro = String(f[base + 6] || '').trim();
        return [ruc, tipoCp, serie, nro].filter(x => x !== '').join('_');
    }

    /**
     * Valida y convierte el contenido del archivo plano (txt SIRE separado por "|"
     * o csv exportado) en objetos con las columnas del esquema del RVIE.
     * Devuelve { filas, inconsistencias, filasValidadas }:
     *  - filas: solo las filas que superaron la validación (para procesarDatosRvie)
     *  - inconsistencias: detalle de cada fila que no cumple (estructura o campo obligatorio)
     */
    function validarArchivoPlanoRvie(texto) {
        let authData = {};
        try { authData = JSON.parse(sessionStorage.getItem('sunat_auth') || '{}'); } catch (e) {}
        const rucSesion = authData.ruc || '20606966823';
        const razonSesion = authData.denominacion || 'EMPRESA DEMO S.A.C.';

        const lineas = texto.replace(/^﻿/, '').split(/\r?\n/);
        const filas = [];
        const inconsistencias = [];
        let nroOperacion = 0;
        let filasValidadas = 0;

        lineas.forEach(lineaRaw => {
            const linea = lineaRaw.replace(/\r$/, '');
            if (linea.trim() === '') return; // línea en blanco: se ignora

            nroOperacion++;

            const esPipe = linea.includes('|');
            const f = linea.split(esPipe ? '|' : ',').map(v => String(v).trim());

            // El archivo del editor de reemplazo lleva RUC y Razón Social como
            // primeras columnas (40 campos); el txt de la propuesta SIRE empieza
            // en el Periodo (38 campos).
            const conRuc = /^\d{11}$/.test(f[0]);
            const base = conRuc ? 2 : 0;
            const esperado = conRuc ? 40 : 38;
            const ruc = conRuc ? f[0] : rucSesion;
            const razon = conRuc ? (f[1] || razonSesion) : razonSesion;
            const idComp = idComprobanteRvie(f, base, ruc);

            // 1) VALIDACIÓN DE ESTRUCTURA: número de campos incorrecto (campo omitido)
            if (f.length !== esperado) {
                inconsistencias.push({
                    nro: nroOperacion,
                    campo: '0',
                    datos: idComp,
                    codigo: '453',
                    descripcion: 'Fila no cumple con estructura(numero de campos incorrecto)'
                });
                return; // no se procesa la fila
            }

            // 2) VALIDACIÓN DE CAMPOS OBLIGATORIOS: no pueden estar vacíos
            if (conRuc && String(f[0]).trim() === '') {
                inconsistencias.push({ nro: nroOperacion, campo: '1', datos: idComp, codigo: '454', descripcion: 'Campo obligatorio no informado (RUC)' });
                return;
            }
            let faltante = null;
            for (const ob of OBLIGATORIOS_RVIE) {
                if (String(f[base + ob.off] || '').trim() === '') {
                    faltante = { pos: String(base + ob.off + 1), nombre: ob.nombre };
                    break;
                }
            }
            if (faltante) {
                inconsistencias.push({
                    nro: nroOperacion,
                    campo: faltante.pos,
                    datos: idComp,
                    codigo: '454',
                    descripcion: 'Campo obligatorio no informado (' + faltante.nombre + ')'
                });
                return; // no se procesa la fila
            }

            // 3) VALIDACIÓN DE CONTENIDO: valores según catálogos del Anexo N.° 1
            const contenido = validarContenidoRvie(f, base, conRuc);
            if (contenido) {
                inconsistencias.push({
                    nro: nroOperacion,
                    campo: contenido.pos,
                    datos: idComp,
                    codigo: contenido.codigo,
                    descripcion: contenido.descripcion
                });
                return; // no se procesa la fila
            }

            // Fila válida: se construye el objeto para procesarDatosRvie
            const g = i => (f[base + i] !== undefined ? f[base + i] : '');
            const periodoRaw = g(0);
            const periodo = (periodoRaw.length === 8 && periodoRaw.endsWith('00')) ? periodoRaw.slice(0, 6) : periodoRaw;

            // En el archivo de reemplazo el CAR viene vacío (SUNAT lo genera):
            // RUC(11) + Tipo CP(2) + Serie(4) + Nro CP(10)
            let car = g(1);
            if (!car) {
                const tipoCar = String(g(4) || '').trim().padStart(2, '0');
                const serieCar = String(g(5) || '').trim();
                const nroCar = String(g(6) || '').trim().padStart(10, '0');
                car = ruc + tipoCar + serieCar + nroCar;
            }

            filasValidadas++;
            filas.push({
                'Ruc': ruc,
                'Razon Social': razon,
                'Periodo': periodo,
                'CAR SUNAT': car,
                'Fecha de emisión': g(2),
                'Fecha Vcto/Pago': g(3),
                'Tipo CP/Doc.': g(4),
                'Serie del CDP': g(5),
                'Nro CP o Doc. Nro Inicial (Rango)': g(6),
                'Nro Final (Rango)': g(7),
                'Tipo Doc Identidad': g(8),
                'Nro Doc Identidad': g(9),
                'Apellidos Nombres/ Razón Social': g(10),
                'Valor Facturado Exportación': g(11),
                'BI Gravada': g(12),
                'Dscto BI': g(13),
                'IGV / IPM': g(14),
                'Dscto IGV / IPM': g(15),
                'Mto Exonerado': g(16),
                'Mto Inafecto': g(17),
                'ISC': g(18),
                'BI Grav IVAP': g(19),
                'IVAP': g(20),
                'ICBPER': g(21),
                'Otros Tributos': g(22),
                'Total CP': g(23),
                'Moneda': g(24) || 'PEN',
                'Tipo Cambio': g(25) || '1.000',
                'Fecha Emisión Doc Modificado': g(26),
                'Tipo CP Modificado': g(27),
                'Serie CP Modificado': g(28),
                'Nro CP Modificado': g(29),
                'ID Proyecto Operadores Atribución': g(30),
                'Tipo de Nota': g(31),
                'Est. Comp': g(32) || '1',
                'Valor FOB Embarcado': g(33),
                'Valor OP Gratuitas': g(34),
                'Tipo Operación': String(g(35) || '0101').padStart(4, '0'),
                'DAM / CP': g(36),
                'CLU': g(37)
            });
        });

        return { filas, inconsistencias, filasValidadas };
    }

    // Abrir el modal "Reemplazo de la Propuesta del RVIE"
    const btnReemplazarRvie = document.getElementById('btn-reemplazar-propuesta-rvie');
    if (btnReemplazarRvie) {
        btnReemplazarRvie.addEventListener('click', function () {
            const inp = document.getElementById('rvie-reemplazo-file');
            if (inp) inp.value = '';
            const nameBox = document.getElementById('rvie-reemplazo-filename');
            if (nameBox) nameBox.value = '';
            const m = document.getElementById('rvie-modal-reemplazo');
            if (m) m.style.display = 'flex';
        });
    }

    // Mostrar el nombre del zip elegido con "Examinar"
    const fileInputReemplazoRvie = document.getElementById('rvie-reemplazo-file');
    if (fileInputReemplazoRvie) {
        fileInputReemplazoRvie.addEventListener('change', function () {
            const nameBox = document.getElementById('rvie-reemplazo-filename');
            if (nameBox) nameBox.value = this.files.length ? this.files[0].name : '';
        });
    }

    // Botón "Cargar archivo": lee el zip, reemplaza la propuesta y genera el ticket
    const btnCargarArchivoRvie = document.getElementById('btn-cargar-archivo-rvie');
    if (btnCargarArchivoRvie) {
        btnCargarArchivoRvie.addEventListener('click', async function () {
            const inp = document.getElementById('rvie-reemplazo-file');
            if (!inp || !inp.files.length) {
                alert('Seleccione el archivo zip a importar con la opción Examinar.');
                return;
            }
            if (typeof JSZip === 'undefined') {
                alert('La librería de compresión JSZip no se ha cargado.');
                return;
            }

            const file = inp.files[0];
            try {
                const zip = await JSZip.loadAsync(file);
                let entry = null;
                zip.forEach(function (path, zipFile) {
                    if (!entry && /\.(txt|csv)$/i.test(path)) entry = zipFile;
                });
                if (!entry) {
                    alert('El zip no contiene un archivo de texto (.txt).');
                    return;
                }

                const texto = await entry.async('string');
                const { filas, inconsistencias, filasValidadas } = validarArchivoPlanoRvie(texto);

                if (!filas.length && !inconsistencias.length) {
                    alert('El archivo no contiene comprobantes con la estructura del RVIE.');
                    return;
                }

                const now = new Date();
                const pad = n => String(n).padStart(2, '0');
                const randStr = String(Math.floor(Math.random() * 84) + 10);
                const ticketNum = now.getFullYear() + '01000000' + randStr;
                const fechaTicket = pad(now.getDate()) + '/' + pad(now.getMonth() + 1) + '/' + now.getFullYear() + ' ' +
                    pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());

                let ruc = rucFromSession();
                let razon = 'EMPRESA DEMO S.A.C.';
                try {
                    const auth = JSON.parse(sessionStorage.getItem('sunat_auth') || '{}');
                    if (auth.denominacion) razon = auth.denominacion;
                } catch (e) {}

                let tickets = [];
                try { tickets = JSON.parse(SimStore.getItem('sire_export_tickets') || '[]'); } catch (err) {}

                // ===== CASO 1: EL ARCHIVO TIENE INCONSISTENCIAS =====
                // No se actualiza la propuesta. Se registra el ticket con el reporte
                // de inconsistencias descargable y se avisa de revisar el estado del ticket.
                if (inconsistencias.length) {
                    const perInc = detectarPeriodoInconsistencias(texto);
                    tickets.unshift({
                        numero: ticketNum,
                        fecha: fechaTicket,
                        archivo: file.name,
                        tipo: 'Reemplazar propuesta',
                        estado: 'Terminado',
                        conInconsistencias: true,
                        inconsistencias: inconsistencias,
                        filasValidadas: filasValidadas,
                        periodo: perInc,
                        ruc: ruc,
                        razon: razon
                    });
                    SimStore.setItem('sire_export_tickets', JSON.stringify(tickets));

                    cerrarModalReemplazoRvie();
                    const numErr = document.getElementById('rvie-inc-ticket-numero');
                    if (numErr) numErr.textContent = ticketNum;
                    const cantErr = document.getElementById('rvie-inc-cantidad');
                    if (cantErr) cantErr.textContent = inconsistencias.length;
                    const mErr = document.getElementById('rvie-modal-reemplazo-error');
                    if (mErr) mErr.style.display = 'flex';
                    return;
                }

                // ===== CASO 2: ARCHIVO CORRECTO =====
                // Los datos reemplazados van al PRELIMINAR; la Propuesta no se toca.
                const perImport = (filas[0] && filas[0]['Periodo']) ? String(filas[0]['Periodo']).replace(/\D/g, '').slice(0, 6) : '';
                if (esMasterRvie() && perImport.length === 6) {
                    currentPeriodoRvie = perImport;
                    actualizarBotonPresentadoRvie();
                }

                // Asegurar que la vista de registros esté visible y pintar el Preliminar
                const mainContent = document.getElementById('main-content-display');
                if (mainContent) mainContent.style.display = 'block';
                renderPreliminarRvie(mapearFilasRvie(filas));
                irAPreliminarRvie();

                tickets.unshift({
                    numero: ticketNum,
                    fecha: fechaTicket,
                    archivo: file.name,
                    tipo: 'Reemplazar propuesta',
                    estado: 'Terminado'
                });
                SimStore.setItem('sire_export_tickets', JSON.stringify(tickets));

                // Cerrar el modal de reemplazo y mostrar "Mensaje" con el ticket
                cerrarModalReemplazoRvie();
                const numEl = document.getElementById('rvie-ticket-reemplazo-numero');
                if (numEl) numEl.textContent = ticketNum;
                const mTicket = document.getElementById('rvie-modal-ticket-reemplazo');
                if (mTicket) mTicket.style.display = 'flex';
            } catch (err) {
                console.error('Error al leer el zip de reemplazo:', err);
                alert('No se pudo leer el archivo zip. Verifique que sea un zip válido con el txt del RVIE.');
            }
        });
    }

    function rucFromSession() {
        let ruc = '20606966823';
        try {
            const auth = JSON.parse(sessionStorage.getItem('sunat_auth') || '{}');
            if (auth.ruc) ruc = auth.ruc;
        } catch (e) {}
        return ruc;
    }

    // Intenta deducir el periodo (YYYYMM) de la primera línea con datos del archivo,
    // para encabezar el reporte de inconsistencias.
    function detectarPeriodoInconsistencias(texto) {
        const lineas = texto.replace(/^﻿/, '').split(/\r?\n/);
        for (const lineaRaw of lineas) {
            const linea = lineaRaw.replace(/\r$/, '');
            if (linea.trim() === '') continue;
            const esPipe = linea.includes('|');
            const f = linea.split(esPipe ? '|' : ',').map(v => String(v).trim());
            const base = /^\d{11}$/.test(f[0]) ? 2 : 0;
            let per = String(f[base] || '').trim();
            if (per.length === 8 && per.endsWith('00')) per = per.slice(0, 6);
            if (/^\d{6}$/.test(per)) return per;
        }
        return '';
    }

    // Genera y descarga el REPORTE_PARAMETRICOS.txt con las inconsistencias del ticket,
    // con el mismo formato que emite SUNAT (resumen + detalle).
    function descargarReporteInconsistenciasRvie(ticketNum) {
        let tickets = [];
        try { tickets = JSON.parse(SimStore.getItem('sire_export_tickets') || '[]'); } catch (err) {}
        const t = tickets.find(x => x.numero === ticketNum);
        if (!t || !t.inconsistencias || !t.inconsistencias.length) {
            alert('No se encontró el reporte de inconsistencias para este ticket.');
            return;
        }

        const per = t.periodo || '';
        const periodoTxt = (per.length === 6) ? per.slice(0, 4) + '/' + per.slice(4, 6) : (per || '—');

        // Agrupar por descripción para el resumen
        const resumen = {};
        t.inconsistencias.forEach(i => { resumen[i.descripcion] = (resumen[i.descripcion] || 0) + 1; });

        const L = [];
        L.push('REPORTE DE INCONSISTENCIAS PARAMÉTRICAS');
        L.push('Datos del contribuyente');
        L.push('Número de RUC: ' + (t.ruc || ''));
        L.push('Nombre o razón social: ' + (t.razon || ''));
        L.push('');
        L.push('Datos del archivo con inconsistencias');
        L.push('Periodo: ' + periodoTxt);
        L.push('Registro: 140400 - RVIE');
        L.push('Nro. De ticket: ' + t.numero);
        L.push('Fecha y hora de generación: ' + (t.fecha || ''));
        L.push('Cantidad de filas validadas: ' + (t.filasValidadas || 0));
        L.push('Cantidad de inconsistencias: ' + t.inconsistencias.length);
        L.push('');
        L.push('Estimado contribuyente, se muestran algunas inconsistencias que presenta su archivo.');
        L.push('');
        L.push('1.- INCONSISTENCIAS A NIVEL RESUMEN');
        L.push('CANTIDAD | DESCRIPCIÓN');
        Object.keys(resumen).forEach(desc => { L.push(resumen[desc] + ' | ' + desc); });
        L.push('');
        L.push('2.- INCONSISTENCIAS A NIVEL DETALLE');
        L.push('NÚMERO DE OPERACIÓN|CAMPO DEL REGISTRO|DATOS COMPROBANTE|CÓDIGO DE INCONSISTENCIA|DESCRIPCIÓN');
        t.inconsistencias.forEach(i => {
            L.push(i.nro + '|' + i.campo + '|' + i.datos + '|' + i.codigo + '|' + i.descripcion);
        });

        const contenido = L.join('\n');
        const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'REPORTE_PARAMETRICOS_' + t.numero + '.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // =============================================
    // EXPORTAR DROPDOWN (TXT / CSV)
    // =============================================
    function setupExportarDropdown(btnId, dropdownId) {
        const btn = document.getElementById(btnId);
        const dropdown = document.getElementById(dropdownId);
        if (!btn || !dropdown) return;

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            // Cerrar otros dropdowns
            document.querySelectorAll('.exportar-dropdown').forEach(d => {
                if (d !== dropdown) d.style.display = 'none';
            });
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
    }

    setupExportarDropdown('btn-exportar-resumen', 'dropdown-exportar-resumen');
    setupExportarDropdown('btn-exportar-propuesta', 'dropdown-exportar-propuesta');

    // Cerrar dropdowns de exportar al hacer clic fuera
    document.addEventListener('click', function () {
        document.querySelectorAll('.exportar-dropdown').forEach(d => d.style.display = 'none');
    });

    // Lógica al elegir una opción (TXT o CSV)
    document.addEventListener('click', function (e) {
        const opt = e.target.closest('.exportar-option');
        if (!opt) return;
        e.stopPropagation();

        const format = opt.getAttribute('data-format');
        // Cerrar dropdown
        document.querySelectorAll('.exportar-dropdown').forEach(d => d.style.display = 'none');

        if (format === 'CSV') {
            const periodoSel = obtenerPeriodoSeleccionadoRVIE() || '2026-05';
            const parts = periodoSel.split('-');
            const year = parts[0];
            const mes = parts[1];

            let ruc = '20606966823';
            try {
                const auth = JSON.parse(sessionStorage.getItem('sunat_auth') || '{}');
                if (auth.ruc) ruc = auth.ruc;
            } catch (e) {}

            const randVal = Math.floor(Math.random() * 34) + 1;
            const randStr = String(randVal).padStart(2, '0');
            const ticketNum = year + '03000000' + randStr;

            const filename = 'LE' + ruc + year + mes + '014040001EXP2.zip';

            const ticketEl = document.getElementById('export-ticket-number');
            if (ticketEl) ticketEl.textContent = ticketNum;

            const now = new Date();
            // Guardar ticket para la tabla de Estado de envío
            const ticketData = {
                numero: ticketNum,
                fecha: now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
                       now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                archivo: filename,
                tipo: 'Generar archivo exportar propuesta',
                estado: 'Terminado'
            };
            // Guardar en sessionStorage para persistir
            let tickets = [];
            try { tickets = JSON.parse(SimStore.getItem('sire_export_tickets') || '[]'); } catch (err) {}
            tickets.unshift(ticketData);
            SimStore.setItem('sire_export_tickets', JSON.stringify(tickets));

            // Mostrar modal de ticket
            const modalCsv = document.getElementById('modal-exportar-csv');
            if (modalCsv) modalCsv.style.display = 'flex';
        }
        // TXT: no hace nada especial en este simulador
    });

    // Cerrar modal exportar CSV con la X
    const closeCsvModal = document.getElementById('close-exportar-csv');
    if (closeCsvModal) {
        closeCsvModal.addEventListener('click', function () {
            const m = document.getElementById('modal-exportar-csv');
            if (m) m.style.display = 'none';
        });
    }

    // ACEPTAR en modal exportar CSV → solo se cierra la ventana flotante
    const btnAceptarCsv = document.getElementById('btn-aceptar-exportar-csv');
    if (btnAceptarCsv) {
        btnAceptarCsv.addEventListener('click', function () {
            const m = document.getElementById('modal-exportar-csv');
            if (m) m.style.display = 'none';
        });
    }

    // =============================================
    // TABS PRINCIPALES: Generación de Registro / Información de Gestión
    // =============================================
    const mainTabGeneracion = document.getElementById('main-tab-generacion');
    const mainTabInfoGestion = document.getElementById('main-tab-info-gestion');
    const subTabsContainer = document.querySelector('.sub-tabs-container');
    const infoGestionView = document.getElementById('info-gestion-view');

    function activarGeneracionTab() {
        if (mainTabGeneracion) mainTabGeneracion.classList.add('active');
        if (mainTabInfoGestion) mainTabInfoGestion.classList.remove('active');
        if (subTabsContainer) subTabsContainer.style.display = '';
        if (infoGestionView) infoGestionView.style.display = 'none';
        // Mostrar la sub-vista activa de Generación de Registro
        const mainContent = document.getElementById('main-content-display');
        if (mainContent) mainContent.style.display = 'block';
    }

    function activarInfoGestion() {
        if (mainTabGeneracion) mainTabGeneracion.classList.remove('active');
        if (mainTabInfoGestion) mainTabInfoGestion.classList.add('active');
        if (subTabsContainer) subTabsContainer.style.display = 'none';
        // Ocultar todas las sub-vistas de Generación
        document.querySelectorAll('.sub-content-view').forEach(v => {
            if (v.id !== 'info-gestion-view') v.style.display = 'none';
        });
        if (infoGestionView) infoGestionView.style.display = 'block';
        const mainContent = document.getElementById('main-content-display');
        if (mainContent) mainContent.style.display = 'block';
    }

    if (mainTabGeneracion) {
        mainTabGeneracion.addEventListener('click', function () {
            activarGeneracionTab();
        });
    }

    if (mainTabInfoGestion) {
        mainTabInfoGestion.addEventListener('click', function () {
            activarInfoGestion();
            // Mostrar solo el menú, sin panel expandido
            const panel = document.getElementById('ig-estado-ticket-panel');
            const otrosPanel = document.getElementById('ig-otros-panel');
            if (panel) panel.style.display = 'none';
            if (otrosPanel) otrosPanel.style.display = 'none';
            // Resetear items activos
            document.querySelectorAll('.ig-menu-item').forEach(i => i.classList.remove('ig-item-active'));
        });
    }

    // =============================================
    // INFO GESTIÓN: Sub-tabs (Consultas y Descargas, etc.)
    // =============================================
    document.querySelectorAll('.info-gestion-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.info-gestion-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-ig-target');
            document.querySelectorAll('.ig-subview').forEach(v => v.style.display = 'none');
            const targetView = document.getElementById(target);
            if (targetView) targetView.style.display = 'block';
        });
    });

    // =============================================
    // INFO GESTIÓN: Items del menú "Consultas y Descargas"
    // =============================================
    function mostrarEstadoTicketPanel() {
        // Marcar item activo
        document.querySelectorAll('.ig-menu-item').forEach(i => i.classList.remove('ig-item-active'));
        const itemTicket = document.getElementById('ig-item-estado-ticket');
        if (itemTicket) itemTicket.classList.add('ig-item-active');

        // Ocultar otros paneles
        const otrosPanel = document.getElementById('ig-otros-panel');
        if (otrosPanel) otrosPanel.style.display = 'none';

        // Mostrar panel de estado de ticket
        const panel = document.getElementById('ig-estado-ticket-panel');
        if (panel) panel.style.display = 'block';

        // Poblar la tabla con los tickets guardados
        poblarTablaTickets();
    }

    function generarCSVComprobantes() {
        // Cabeceras exactas del archivo EXP2 que genera el SIRE de SUNAT (con tildes)
        const headers = ["Ruc","Razon Social","Periodo","CAR SUNAT","Fecha de emisión","Fecha Vcto/Pago","Tipo CP/Doc.","Serie del CDP","Nro CP o Doc. Nro Inicial (Rango)","Nro Final (Rango)","Tipo Doc Identidad","Nro Doc Identidad","Apellidos Nombres/ Razón Social","Valor Facturado Exportación","BI Gravada","Dscto BI","IGV / IPM","Dscto IGV / IPM","Mto Exonerado","Mto Inafecto","ISC","BI Grav IVAP","IVAP","ICBPER","Otros Tributos","Total CP","Moneda","Tipo Cambio","Fecha Emisión Doc Modificado","Tipo CP Modificado","Serie CP Modificado","Nro CP Modificado","ID Proyecto Operadores Atribución","Tipo de Nota","Est. Comp","Valor FOB Embarcado","Valor OP Gratuitas","Tipo Operación","DAM / CP","CLU"];
        let csvContent = headers.join(",") + "\r\n";

        // Exportar lo que muestra la tabla (datos de Supabase si se consultó un período); si no, los de ejemplo
        const dataRows = (comprobantesActuales && comprobantesActuales.length > 0)
            ? comprobantesActuales
            : ((typeof mockObjects !== "undefined" && mockObjects) ? mockObjects : []);
        dataRows.forEach(row => {
            const line = [
                row.ruc || "",
                row.razon_social || "",
                row.periodo || "",
                row.src_key || "",
                row.fecha_emision || "",
                row.fecha_vcto_pago || "",
                row.tipo_cp || "",
                row.serie || "",
                row.numero || "",
                row.nro_final || "",
                row.tipo_doc_identidad || "",
                row.nro_doc_identidad || "",
                row.cliente || "",
                row.valor_facturado_export || 0,
                row.bi_gravada || 0,
                row.dscto_bi || 0,
                row.igv_ipm || 0,
                row.dscto_igv_ipm || 0,
                row.mto_exonerado || 0,
                row.mto_inafecto || 0,
                row.isc || 0,
                row.bi_grav_ivap || 0,
                row.ivap || 0,
                row.icbper || 0,
                row.otros_tributos || 0,
                row.total_cp || 0,
                row.moneda || "PEN",
                Number(row.tipo_cambio || 1).toFixed(3),
                row.doc_mod_fecha_emision || "",
                row.doc_mod_tipo_cp || "",
                row.doc_mod_serie || "",
                row.doc_mod_numero || "",
                row.id_proyecto || "",
                row.tipo_nota || "",
                row.est_comp || "1",
                row.valor_fob || 0,
                row.valor_op_gratuitas || 0,
                String(row.tipo_operacion || "0101").padStart(4, '0'),
                row.dam || "",
                row.clu || ""
            ];
            csvContent += line.join(",") + "\r\n";
        });
        return csvContent;
    }

    async function descargarZipComprobantes(filename) {
        if (typeof JSZip === "undefined") {
            alert("La librería de compresión JSZip no se ha cargado.");
            return;
        }
        
        try {
            const zip = new JSZip();
            const csvContent = generarCSVComprobantes();
            const csvFilename = filename.replace(".zip", ".csv");

            // BOM UTF-8 para que Excel muestre correctamente las tildes
            zip.file(csvFilename, "\uFEFF" + csvContent);
            
            const content = await zip.generateAsync({ type: "blob" });
            
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error al generar el archivo ZIP:", error);
            alert("Ocurrió un error al generar la descarga.");
        }
    }

    // Delegación de eventos para la descarga del ticket zip o PDF
    document.addEventListener('click', function(e) {
        const link = e.target.closest('.ig-download-link');
        if (link) {
            e.preventDefault();
            const filename = link.getAttribute('data-filename');
            descargarZipComprobantes(filename);
            return;
        }

        const pdfBtn = e.target.closest('.ig-pdf-download-btn');
        if (pdfBtn) {
            e.preventDefault();
            const ticketNum = pdfBtn.getAttribute('data-ticket');
            descargarConstanciaRecepcionPDF(ticketNum);
            return;
        }

        const incBtn = e.target.closest('.ig-inc-download-link');
        if (incBtn) {
            e.preventDefault();
            const ticketNum = incBtn.getAttribute('data-ticket');
            descargarReporteInconsistenciasRvie(ticketNum);
            return;
        }
    });

    function poblarTablaTickets() {
        const tbody = document.getElementById('ig-ticket-tbody');
        if (!tbody) return;

        let tickets = [];
        try { tickets = JSON.parse(SimStore.getItem('sire_export_tickets') || '[]'); } catch (err) {}

        // Auto-populate based on simulation state
        let estadoAceptado = {};
        try { estadoAceptado = JSON.parse(SimStore.getItem('sire_aceptado') || '{}'); } catch (e) {}
        let estadoResumen = {};
        try { estadoResumen = JSON.parse(SimStore.getItem('sire_resumen') || '{}'); } catch (e) {}

        let ruc = '20606966823';
        try {
            const auth = JSON.parse(sessionStorage.getItem('sunat_auth') || '{}');
            if (auth.ruc) ruc = auth.ruc;
        } catch (e) {}

        const period = estadoAceptado.rvie || (estadoResumen ? estadoResumen.rvie : null) || '2026-05';
        const parts = period.split('-');
        const year = parts[0];
        const mes = parts[1];
        const filename = 'LE' + ruc + year + mes + '0014040003EXP2.zip';

        let modified = false;

        // If RVIE proposal has been accepted or registers generated, ensure "Aceptar propuesta" ticket exists
        if (estadoAceptado.rvie || (estadoResumen && estadoResumen.rvie)) {
            if (!tickets.some(t => t.numero === '2026030000008')) {
                tickets.push({
                    numero: '2026030000008',
                    fecha: '16/06/2026 21:57:42',
                    archivo: '',
                    tipo: 'Aceptar propuesta',
                    estado: 'Terminado'
                });
                modified = true;
            }
        }

        // If registers are generated, ensure "Generación de Registros" ticket exists
        if (estadoResumen && estadoResumen.rvie) {
            if (!tickets.some(t => t.numero === '2026020000005')) {
                // Generación de Registros should be at the top
                tickets.unshift({
                    numero: '2026020000005',
                    fecha: '16/06/2026 21:58:34',
                    archivo: filename,
                    tipo: 'Generación de Registros',
                    estado: 'Terminado'
                });
                modified = true;
            }
        }

        if (modified) {
            SimStore.setItem('sire_export_tickets', JSON.stringify(tickets));
        }

        tbody.innerHTML = '';
        if (tickets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:14px; color:#666;">No se encontraron registros.</td></tr>';
            return;
        }

        tickets.forEach(function (t) {
            const tr = document.createElement('tr');
            
            let downloadCell = '';
            let detalleCell = '';
            if (t.conInconsistencias) {
                detalleCell = `<span style="color:#c0392b; font-weight:600;">Con inconsistencias (${(t.inconsistencias || []).length})</span>`;
                downloadCell = `<a href="#" class="ig-inc-download-link" data-ticket="${t.numero}" style="color:#c0392b; text-decoration:underline; font-weight:600;" title="Descargar reporte de inconsistencias"><i class="far fa-file-alt"></i> REPORTE_PARAMETRICOS.txt</a>`;
            } else if (t.tipo === 'Generación de Registros') {
                downloadCell = `<a href="#" class="ig-pdf-download-btn" data-ticket="${t.numero}" style="color:#005691; text-decoration:none; font-size:18px; cursor:pointer;" title="Descargar Constancia PDF"><i class="far fa-file-alt"></i></a>`;
            } else if (t.tipo === 'Aceptar propuesta') {
                downloadCell = '';
            } else {
                downloadCell = `<a href="#" class="ig-download-link" data-filename="${t.archivo}" style="color:#005691; text-decoration:underline; font-weight:600;">${t.archivo}</a>`;
            }

            tr.innerHTML = `
                <td style="font-weight:700; color:#1E395B;">${t.numero}</td>
                <td>${t.fecha}</td>
                <td>${t.archivo || ''}</td>
                <td>${t.tipo}</td>
                <td><span style="color:#217a21; font-weight:600;">${t.estado}</span></td>
                <td style="text-align:center;">${detalleCell}</td>
                <td style="text-align:center;">${downloadCell}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function descargarConstanciaRecepcionPDF(ticketNum) {
        if (typeof window.jspdf === 'undefined') {
            alert("No se pudo cargar la librería jsPDF.");
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        // Header logo
        let logoLoaded = false;
        const logoImg = document.querySelector('img[src="LOGO_SUNAT.png"]') || document.querySelector('.logo');
        if (logoImg && logoImg.complete && logoImg.naturalWidth !== 0) {
            try {
                doc.addImage(logoImg, 'PNG', 15, 12, 35, 10);
                logoLoaded = true;
            } catch (e) {
                console.error("Error drawing logo:", e);
            }
        }
        if (!logoLoaded) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(12, 86, 145);
            doc.text('SUNAT', 15, 20);
        }

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text('Constancia de Recepción del Registro de Ventas e Ingresos', 15, 30);
        
        let y = 38;

        // Section 1: Transacción
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('Transacción', 15, y);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(15, y + 1.5, 195, y + 1.5);
        y += 7;

        let tickets = [];
        try { tickets = JSON.parse(SimStore.getItem('sire_export_tickets') || '[]'); } catch (err) {}
        const currentTicket = tickets.find(t => t.numero === ticketNum) || {
            numero: '2026020000005',
            fecha: '16/06/2026 21:58:34',
            archivo: 'LE206069668232026050014040003EXP2.zip'
        };

        function drawField(label, value, yPos) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(60, 60, 60);
            doc.text(label, 15, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(value, 65, yPos);
        }

        drawField('Nombre:', 'Generación del RVIE', y); y += 5;
        drawField('Nro. de Operación:', currentTicket.numero, y); y += 5;
        drawField('Fecha y hora:', currentTicket.fecha, y); y += 8;

        // Section 2: Datos del Contribuyente
        let ruc = '20606966823';
        let denominacion = 'FABRINSUR GROUP S.R.L.';
        try {
            const auth = JSON.parse(sessionStorage.getItem('sunat_auth') || '{}');
            if (auth.ruc) ruc = auth.ruc;
            if (auth.denominacion) denominacion = auth.denominacion;
        } catch (e) {}

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('Datos del Contribuyente', 15, y);
        doc.line(15, y + 1.5, 195, y + 1.5);
        y += 7;

        drawField('Número de RUC:', ruc, y); y += 5;
        drawField('Nombre o Razón Social:', denominacion, y); y += 8;

        // Section 3: Datos del Registro
        let periodText = '2026/05';
        let year = '2026';
        let mes = '05';

        if (currentTicket && currentTicket.archivo) {
            const match = currentTicket.archivo.match(/LE\d{11}(\d{4})(\d{2})/);
            if (match && match[1] && match[2]) {
                year = match[1];
                mes = match[2];
                periodText = year + '/' + mes;
            }
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('Datos del Registro', 15, y);
        doc.line(15, y + 1.5, 195, y + 1.5);
        y += 7;

        drawField('Registro:', 'RVIE', y); y += 5;
        drawField('Período:', periodText, y); y += 5;
        drawField('Anotación:', 'Propuesta Aceptada', y); y += 5;

        let cantRegistros = '5';
        const tbodyRows = document.querySelectorAll('#detailed-table-body tr');
        if (tbodyRows && tbodyRows.length > 0) {
            const firstRowText = tbodyRows[0].textContent;
            if (!firstRowText.includes('No se encontraron') && !firstRowText.includes('Ningún registro')) {
                cantRegistros = String(tbodyRows.length);
            }
        }
        drawField('Cantidad de registros:', cantRegistros, y); y += 8;

        // Section 4: Datos Totales
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('Datos Totales', 15, y);
        doc.line(15, y + 1.5, 195, y + 1.5);
        y += 7;

        // Draw Table Header
        doc.setFillColor(235, 235, 235);
        doc.rect(15, y, 180, 6, 'F');
        doc.setDrawColor(180, 180, 180);
        doc.rect(15, y, 180, 6, 'D');
        doc.line(145, y, 145, y + 6);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text('Descripción', 18, y + 4.2);
        doc.text('Monto', 192, y + 4.2, { align: 'right' });
        y += 6;

        function getVal(id, def) {
            const el = document.getElementById(id);
            if (el && el.textContent.trim()) {
                return el.textContent.trim();
            }
            return def;
        }

        const valExp = getVal('total-val-exp', '0.00');
        const biGrav = getVal('total-bi-grav', '6,711.97');
        const dsctoBi = getVal('total-dscto-bi', '0.00');
        const igv = getVal('total-igv', '1,208.15');
        const dsctoIgv = getVal('total-dscto-igv', '0.00');
        const mtoExo = getVal('total-mto-exo', '0.00');
        const mtoIna = getVal('total-mto-ina', '0.00');
        const isc = getVal('total-isc', '0.00');
        const biIvap = getVal('total-bi-ivap', '0.00');
        const ivap = getVal('total-ivap', '0.00');
        const icbper = getVal('total-icbper', '0.00');
        const otros = getVal('total-otros', '0.00');
        const totalCp = getVal('total-total-cp', '7,920.12');

        const rows = [
            { desc: 'Monto Total facturado de la exportación', val: valExp },
            { desc: 'Monto Total de la base imponible de la operación gravada', val: biGrav },
            { desc: 'Sumatoria de descuentos de base Imponible', val: dsctoBi },
            { desc: 'Monto Total del IGV y/o IPM', val: igv },
            { desc: 'Sumatoria de descuentos de IGV', val: dsctoIgv },
            { desc: 'Monto Total de la operación exonerada', val: mtoExo },
            { desc: 'Monto Total de la operación inafecta', val: mtoIna },
            { desc: 'Monto Total del ISC', val: isc },
            { desc: 'Monto Total de la base imponible del IVAP', val: biIvap },
            { desc: 'Monto Total del IVAP', val: ivap },
            { desc: 'Sumatoria de Impuesto al Consumo Bolsas de Plástico', val: icbper },
            { desc: 'Monto Total de otros tributos y cargos que no forman parte de la base imponible', val: otros },
            { desc: 'Monto Total del comprobante de pago', val: totalCp }
        ];

        rows.forEach((row, index) => {
            if (index === rows.length - 1) {
                doc.setFont('helvetica', 'bold');
            } else {
                doc.setFont('helvetica', 'normal');
            }
            doc.setFontSize(7.5);
            doc.rect(15, y, 180, 5.2, 'D');
            doc.line(145, y, 145, y + 5.2);
            doc.text(row.desc, 18, y + 3.7);
            
            let displayVal = row.val;
            if (typeof displayVal === 'number') {
                displayVal = displayVal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
            doc.text(displayVal, 192, y + 3.7, { align: 'right' });
            y += 5.2;
        });

        // Footer message
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 100);
        doc.text('Gracias por cumplir con sus obligaciones tributarias.', 105, y, { align: 'center' });

        // Save PDF
        const filenamePdf = 'LE' + ruc + year + mes + '001404000111120.pdf';
        doc.save(filenamePdf);
    }

    // Click en "Estado de envío de Ticket" desde el menú
    const igItemEstadoTicket = document.getElementById('ig-item-estado-ticket');
    if (igItemEstadoTicket) {
        igItemEstadoTicket.addEventListener('click', function () {
            mostrarEstadoTicketPanel();
        });
    }

    // Click en otros items del menú → mostrar panel genérico
    ['ig-item-constancias', 'ig-item-descarga', 'ig-item-inconsistencias', 'ig-item-car', 'ig-item-exportadores'].forEach(function (id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('click', function () {
            document.querySelectorAll('.ig-menu-item').forEach(i => i.classList.remove('ig-item-active'));
            el.classList.add('ig-item-active');

            const panel = document.getElementById('ig-estado-ticket-panel');
            if (panel) panel.style.display = 'none';

            const otrosPanel = document.getElementById('ig-otros-panel');
            const otrosTitulo = document.getElementById('ig-otros-titulo');
            if (otrosPanel) otrosPanel.style.display = 'block';
            if (otrosTitulo) {
                const label = el.querySelector('strong');
                if (label) otrosTitulo.textContent = label.textContent;
            }
        });
    });

    // Botón Buscar en Estado de envío de Ticket
    const igBtnBuscar = document.getElementById('ig-btn-buscar');
    if (igBtnBuscar) {
        igBtnBuscar.addEventListener('click', function () {
            poblarTablaTickets();
        });
    }

    // Botón Limpiar
    const igBtnLimpiar = document.getElementById('ig-btn-limpiar');
    if (igBtnLimpiar) {
        igBtnLimpiar.addEventListener('click', function () {
            const piInput = document.getElementById('ig-periodo-inicio');
            const pfInput = document.getElementById('ig-periodo-fin');
            const nrInput = document.getElementById('ig-nro-ticket');
            if (piInput) piInput.value = '';
            if (pfInput) pfInput.value = '';
            if (nrInput) nrInput.value = '';
        });
    }

});

/* ================================================
   MODAL AVISO 12 HORAS (en rvie.html)
   ================================================ */
function cerrarModal12hRVIE() {
    const m = document.getElementById('rvie-modal-12h');
    if (m) m.style.display = 'none';
}

/* ================================================
   MODALES REEMPLAZO DE PROPUESTA RVIE
   ================================================ */
function cerrarModalReemplazoRvie() {
    const m = document.getElementById('rvie-modal-reemplazo');
    if (m) m.style.display = 'none';
}

function cerrarModalTicketReemplazoRvie() {
    const m = document.getElementById('rvie-modal-ticket-reemplazo');
    if (m) m.style.display = 'none';
}

function cerrarModalReemplazoErrorRvie() {
    const m = document.getElementById('rvie-modal-reemplazo-error');
    if (m) m.style.display = 'none';
}

