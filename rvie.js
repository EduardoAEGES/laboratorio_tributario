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
});
