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

    // Paso 2: Click "Sí" → cierra confirmación, abre modal ticket
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

    // =============================================
    // Estado de aceptación compartido (RCE / RVIE)
    // Se guarda en sessionStorage con la clave 'sire_aceptado'
    // y se conserva hasta que el usuario pulse "Salir".
    // Formato: { rce: '2026-07', rvie: '2026-05' }
    // =============================================
    function obtenerEstadoAceptacion() {
        try {
            return JSON.parse(sessionStorage.getItem('sire_aceptado') || '{}');
        } catch (e) {
            return {};
        }
    }

    function guardarAceptacionRVIE(periodo) {
        const estado = obtenerEstadoAceptacion();
        estado.rvie = periodo;
        sessionStorage.setItem('sire_aceptado', JSON.stringify(estado));
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

    // Modal 2 (Proceso): Continuar → limpia la aceptación y muestra la vista vacía
    const btnGenContinuar = document.getElementById('btn-gen-continuar');
    if (btnGenContinuar) {
        btnGenContinuar.addEventListener('click', () => {
            hideModal(modalGenProceso);
            sessionStorage.removeItem('sire_aceptado');
            mostrarVistaGeneracionVacia();
            window.scrollTo(0, 0);
        });
    }

    // Botón "Terminar simulación": limpia el estado y vuelve al inicio
    document.addEventListener('click', function (e) {
        if (!e.target.closest('#btn-terminar-simulacion')) return;
        e.preventDefault();
        sessionStorage.removeItem('sire_aceptado');
        sessionStorage.removeItem('rce_nav_generacion');
        sessionStorage.removeItem('rce_gen_periodo');
        window.location.href = 'tramites.html';
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
            hideModal(modalAgregarCp);
            alert('Comprobante agregado correctamente (simulación).');
        });
    }

    // La lógica de cambio de pestaña se puede agregar aquí
    console.log('SUNAT Interface Loaded');

    // Implementación simple de pestañas para demostración
    const mainTabs = document.querySelectorAll('.tab-btn');
    mainTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            mainTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

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

    function renderTable(dataRows) {
        const tbody = document.querySelector('.results-table tbody');
        tbody.innerHTML = '';

        // Initialize totals
        let totals = {
            valExp: 0, biGrav: 0, dsctoBi: 0, igv: 0, dsctoIgv: 0,
            mtoExo: 0, mtoIna: 0, isc: 0, biIvap: 0, ivap: 0,
            icbper: 0, otros: 0, total: 0, anticipos: 0, otrosCargos: 0, mtoRedondeo: 0
        };

        dataRows.forEach(row => {
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
            const tipoOp = row.tipo_operacion || '0101';
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

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox"></td>
                <td></td>
                <td><i class="fas fa-sync-alt"></i></td>
                <td>${fEmision}</td>
                <td>${fVcto}</td>
                <td>${tipoCp}</td>
                <td>${comprobante}</td>
                <td>${serie}</td>
                <td>${nroIni}</td>
                <td>${nroFin || ''}</td>
                
                <!-- Adquiriente -->
                <td>${tipoDocId}</td>
                <td>${nroDocId}</td>
                <td>${adqRazon}</td>
                <td>${tipoCliente}</td>

                <!-- Montos -->
                <td>${valExp.toFixed(2)}</td>
                <td>${biGrav.toFixed(2)}</td>
                <td>${dsctoBi.toFixed(2)}</td>
                <td>${igv.toFixed(2)}</td>
                <td>${dsctoIgv.toFixed(2)}</td>
                <td>${mtoExo.toFixed(2)}</td>
                <td>${mtoIna.toFixed(2)}</td>
                <td>${isc.toFixed(2)}</td>
                <td>${biIvap.toFixed(2)}</td>
                <td>${anticipos.toFixed(2)}</td>
                <td>${otrosCargos.toFixed(2)}</td>
                <td>${mtoRedondeo.toFixed(2)}</td>

                <!-- Totales/Moneda -->
                <td>${ivap.toFixed(2)}</td>
                <td>${icbper.toFixed(2)}</td>
                <td>${otros.toFixed(2)}</td>
                <td>${totalCp.toFixed(2)}</td>
                <td>${moneda}</td>
                <td>${Number(tc).toFixed(3)}</td>

                <!-- Referencias (Empty in sample, mostly) -->
                <td><i class="far fa-edit"></i></td>
                <td>${fRef || ''}</td>
                <td>${tipoRef || ''}</td>
                <td>${serieRef || ''}</td>
                <td>${nroRef || ''}</td>

                <!-- Detalle y Detracción -->
                <td>${detalleOp}</td>
                <td>${descripcion}</td>
                <td>${formaPago}</td>
                <td>${nroCuotas}</td>
                <td>${motivoNota}</td>
                <td>${sujetoDetrac}</td>
                <td>${pctDetrac}%</td>
                <td>${mtoDetrac.toFixed(2)}</td>
                <td>${constanciaDetrac}</td>

                <!-- Otros -->
                <td>${idProy || ''}</td>
                <td>${tipoNota || ''}</td>
                <td>${estComp || '1'}</td>
                <td>${descComp}</td>
                <td>${fob.toFixed(2)}</td>
                <td>${opGrat.toFixed(2)}</td>
                <td>${tipoOp || '0101'}</td>
                <td>${dam || ''}</td>
                <td>${clu || ''}</td>
                <td>${car || ''}</td>
            `;
            tbody.appendChild(tr);
        });

        // Update Totals Footer
        document.getElementById('total-val-exp').textContent = totals.valExp.toFixed(2);
        document.getElementById('total-bi-grav').textContent = totals.biGrav.toFixed(2);
        document.getElementById('total-dscto-bi').textContent = totals.dsctoBi.toFixed(2);
        document.getElementById('total-igv').textContent = totals.igv.toFixed(2);
        document.getElementById('total-dscto-igv').textContent = totals.dsctoIgv.toFixed(2);
        document.getElementById('total-mto-exo').textContent = totals.mtoExo.toFixed(2);
        document.getElementById('total-mto-ina').textContent = totals.mtoIna.toFixed(2);
        document.getElementById('total-isc').textContent = totals.isc.toFixed(2);
        document.getElementById('total-bi-ivap').textContent = totals.biIvap.toFixed(2);
        document.getElementById('total-anticipos').textContent = totals.anticipos.toFixed(2);
        document.getElementById('total-otros-cargos').textContent = totals.otrosCargos.toFixed(2);
        document.getElementById('total-redondeo').textContent = totals.mtoRedondeo.toFixed(2);
        document.getElementById('total-ivap').textContent = totals.ivap.toFixed(2);
        document.getElementById('total-icbper').textContent = totals.icbper.toFixed(2);
        document.getElementById('total-otros').textContent = totals.otros.toFixed(2);
        document.getElementById('total-total-cp').textContent = totals.total.toFixed(2);

        // Update pagination text
        const pagInfo = document.getElementById('detailed-pagination-info');
        if (pagInfo) {
            pagInfo.textContent = `Mostrando del 1 al ${dataRows.length} de un total ${dataRows.length} registros`;
        }
    }

    renderTable(mockObjects);

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

    function updateMonthOptions(yearKey) {
        if (!mesOptionsBox || !mesSpan) return;

        // Clear existing options
        mesOptionsBox.innerHTML = '';

        const months = monthData[yearKey] || [];
        months.forEach(month => {
            const div = document.createElement('div');
            div.className = 'option-item';
            div.textContent = month;
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

                        function formatDate(dateStr) {
                            if (!dateStr) return '';
                            if (dateStr.includes('/')) return dateStr;
                            const parts = String(dateStr).split('-');
                            if (parts.length === 3) {
                                return `${parts[2]}/${parts[1]}/${parts[0]}`;
                            }
                            return dateStr;
                        }

                        if (data && data.length > 0) {
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
                            renderTable(data.map(d => ({
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
                                tipo_operacion: d['Tipo Operación'] || '0101',
                                dam: d['DAM / CP'] || '',
                                clu: d['CLU'] || ''
                            })));
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

    // ===================================================
    // NAVEGACIÓN DESDE RCE – Mostrar Generación de Registros
    // ===================================================
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
});

/* ================================================
   MODAL AVISO 12 HORAS (en rvie.html)
   ================================================ */
function cerrarModal12hRVIE() {
    const m = document.getElementById('rvie-modal-12h');
    if (m) m.style.display = 'none';
}

