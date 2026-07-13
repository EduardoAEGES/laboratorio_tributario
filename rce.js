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

    // Tab Switching Logic
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

    // Clock
    function updateClock() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timeString = `${day}/${month}/${year} ${hours}:${minutes}`;
        const clockEl = document.getElementById('clock');
        if (clockEl) clockEl.textContent = timeString;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Render detailed table rows
    function renderTable(dataRows) {
        const tbody = document.querySelector('.results-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        // Initialize totals for detailed table
        let totals = {
            biGravDG: 0, igvDG: 0, biGravDGNG: 0, igvDGNG: 0, biGravDNG: 0, igvDNG: 0, valNoGrav: 0,
            isc: 0, icbper: 0, otros: 0, total: 0, anticipos: 0, otrosCargos: 0, mtoRedondeo: 0
        };

        dataRows.forEach(row => {
            const fEmision = row.fecha_emision || '';
            const fVcto = row.fecha_vcto_pago || '';
            const tipoCp = row.tipo_cp || '';
            const comprobante = row.comprobante || '';
            const serie = row.serie || '';
            const anio = fEmision ? fEmision.split('/')[2] : '';
            const nroIni = row.numero || '';
            const nroFin = row.nro_final || '';
            
            const tipoDocId = row.tipo_doc_identidad || '';
            const nroDocId = row.nro_doc_identidad || '';
            const adqRazon = row.proveedor || '';
            const tipoProveedor = row.tipo_proveedor || 'Nacional - Bienes/Servicios';

            const biGrav = parseFloat(row.bi_gravada) || 0;
            const igv = parseFloat(row.igv_ipm) || 0;
            const biGravDGNG = parseFloat(row.bi_gravada_dgng) || 0;
            const igvDGNG = parseFloat(row.igv_ipm_dgng) || 0;
            const biGravDNG = parseFloat(row.bi_gravada_dng) || 0;
            const igvDNG = parseFloat(row.igv_ipm_dng) || 0;
            const valNoGrav = parseFloat(row.adquisiciones_no_gravadas) || 0;
            const isc = parseFloat(row.isc) || 0;
            const icbper = parseFloat(row.icbper) || 0;
            const otros = parseFloat(row.otros_tributos_cargos) || 0;
            const anticipos = parseFloat(row.anticipos) || 0;
            const otrosCargos = parseFloat(row.otros_cargos) || 0;
            const mtoRedondeo = parseFloat(row.monto_redondeo) || 0;
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
            const motivoNota = row.motivo_nota_credito || '';
            const sujetoDetrac = row.sujeto_detrac_retenc ? 'Sí' : 'No';
            const tipoCarga = row.tipo_carga || '';
            const pctAplicado = parseFloat(row.pct_aplicado) || 0;
            const mtoDetrac = parseFloat(row.monto_detrac_retenc) || 0;
            const constanciaDep = row.nro_constancia_deposito || '';

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
            totals.biGravDG += biGrav;
            totals.igvDG += igv;
            totals.biGravDGNG += biGravDGNG;
            totals.igvDGNG += igvDGNG;
            totals.biGravDNG += biGravDNG;
            totals.igvDNG += igvDNG;
            totals.valNoGrav += valNoGrav;
            totals.isc += isc;
            totals.icbper += icbper;
            totals.otros += otros;
            totals.anticipos += anticipos;
            totals.otrosCargos += otrosCargos;
            totals.mtoRedondeo += mtoRedondeo;
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
                <td>${anio}</td>
                <td>${nroIni}</td>
                <td>${nroFin || ''}</td>
                
                <!-- Proveedor -->
                <td>${tipoDocId}</td>
                <td>${nroDocId}</td>
                <td>${adqRazon}</td>
                <td>${tipoProveedor}</td>

                <!-- Montos -->
                <td>${biGrav.toFixed(2)}</td>
                <td>${igv.toFixed(2)}</td>
                <td>${biGravDGNG.toFixed(2)}</td>
                <td>${igvDGNG.toFixed(2)}</td>
                <td>${biGravDNG.toFixed(2)}</td>
                <td>${igvDNG.toFixed(2)}</td>
                <td>${valNoGrav.toFixed(2)}</td>
                <td>${isc.toFixed(2)}</td>
                <td>${icbper.toFixed(2)}</td>
                <td>${otros.toFixed(2)}</td>
                <td>${anticipos.toFixed(2)}</td>
                <td>${otrosCargos.toFixed(2)}</td>
                <td>${mtoRedondeo.toFixed(2)}</td>

                <!-- Totales/Moneda -->
                <td>${totalCp.toFixed(2)}</td>
                <td>${moneda}</td>
                <td>${Number(tc).toFixed(3)}</td>

                <!-- Referencias -->
                <td><i class="far fa-edit"></i></td>
                <td>${fRef || ''}</td>
                <td>${tipoRef || ''}</td>
                <td>${serieRef || ''}</td>
                <td>${nroRef || ''}</td>

                <!-- Detalle y Detracción/Retención -->
                <td>${detalleOp}</td>
                <td>${descripcion}</td>
                <td>${formaPago}</td>
                <td>${motivoNota}</td>
                <td>${sujetoDetrac}</td>
                <td>${tipoCarga}</td>
                <td>${pctAplicado}%</td>
                <td>${mtoDetrac.toFixed(2)}</td>
                <td>${constanciaDep}</td>

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

        // Update Totals Footer in detailed table
        const setHtml = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        setHtml('total-bi-grav-dg', totals.biGravDG);
        setHtml('total-igv-dg', totals.igvDG);
        setHtml('total-bi-grav-dgng', totals.biGravDGNG);
        setHtml('total-igv-dgng', totals.igvDGNG);
        setHtml('total-bi-grav-dng', totals.biGravDNG);
        setHtml('total-igv-dng', totals.igvDNG);
        setHtml('total-val-no-grav', totals.valNoGrav);
        setHtml('total-isc', totals.isc);
        setHtml('total-icbper', totals.icbper);
        setHtml('total-otros', totals.otros);
        setHtml('total-anticipos', totals.anticipos);
        setHtml('total-otros-cargos', totals.otrosCargos);
        setHtml('total-redondeo', totals.mtoRedondeo);
        setHtml('total-total-cp', totals.total);

        // Update pagination text
        const pagInfo = document.getElementById('detailed-pagination-info');
        if (pagInfo) {
            pagInfo.textContent = `Mostrando del 1 al ${dataRows.length} de un total ${dataRows.length} registros`;
        }
    }

    // Dropdown Logic
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

        mesOptionsBox.innerHTML = '';

        const months = monthData[yearKey] || [];
        months.forEach(month => {
            const div = document.createElement('div');
            div.className = 'option-item';
            div.textContent = month;
            mesOptionsBox.appendChild(div);
        });

        mesOptionsBox.querySelectorAll('.option-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                mesSpan.textContent = item.textContent;
                mesOptionsBox.classList.remove('show');
                updateAceptarButtonState();
            });
        });
    }

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

    if (mesSelectBox && mesOptionsBox && mesSpan && periodoSpan) {
        mesSelectBox.addEventListener('click', (e) => {
            e.stopPropagation();
            if (periodoOptionsBox) periodoOptionsBox.classList.remove('show');

            const periodoSeleccionado = periodoSpan.textContent;
            if (periodoSeleccionado !== 'Seleccionar') {
                mesOptionsBox.classList.toggle('show');
            }
        });
    }

    document.addEventListener('click', () => {
        if (periodoOptionsBox) periodoOptionsBox.classList.remove('show');
        if (mesOptionsBox) mesOptionsBox.classList.remove('show');
    });

    // Aceptar button logic
    if (btnAceptar) {
        btnAceptar.addEventListener('click', async () => {
            const periodoSeleccionado = periodoSpan.textContent;
            const mesSeleccionado = mesSpan.textContent;

            if (periodoSeleccionado !== 'Seleccionar' && mesSeleccionado !== 'Seleccionar') {
                const mainContent = document.getElementById('main-content-display');
                if (mainContent) {
                    mainContent.style.display = 'block';
                }

                const firstSubTab = document.querySelector('.sub-tab-btn[data-target="resumen-cp"]');
                if (firstSubTab) firstSubTab.click();

                // Format period to MM/YYYY to query from Supabase
                const year = periodoSeleccionado.split('-')[0];
                const mesMap = {
                    'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04',
                    'MAY': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
                    'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12'
                };
                const mesText = mesSeleccionado.split('-')[0];
                const searchPeriod = `${mesMap[mesText]}/${year}`;

                const tbody = document.getElementById('summary-table-body');
                if (tbody) tbody.innerHTML = `<tr><td colspan="11" class="text-center">Cargando datos de Supabase...</td></tr>`;

                if (typeof window.supabase !== 'undefined' && authSupabaseClient) {
                    try {
                        const parts = searchPeriod.split('/');
                        const searchPeriodBigInt = parseInt(parts[1] + parts[0]); // '01/2025' -> 202501

                        const { data, error } = await authSupabaseClient
                            .from('registro_compras')
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
                            // Calculate Totals for the Dashboard and group by tipo_cp
                            const groups = {};
                            let grandTotals = {
                                docs: 0, biGrav: 0, mtoIgv: 0, valNoGrav: 0, otros: 0, total: 0
                            };

                            data.forEach(row => {
                                const rawType = row['Tipo CP/Doc.'] || row['Tipo CP/Doc'] || '01';
                                const type = String(rawType).trim().padStart(2, '0');
                                if (!groups[type]) {
                                    groups[type] = {
                                        docs: 0, biGrav: 0, mtoIgv: 0, valNoGrav: 0, otros: 0, total: 0
                                    };
                                }

                                const biGravVal = parseFloat(row['BI Gravada (S/)'] || row['BI Gravada'] || row.bi_gravada || 0);
                                const mtoIgvVal = parseFloat(row['IGV/IPM (S/)'] || row['IGV / IPM'] || row.igv_ipm || 0);
                                const valNoGravVal = parseFloat(row['Mto Exonerado (S/)'] || row.mto_exonerado || 0) + parseFloat(row['Mto Inafecto (S/)'] || row.mto_inafecto || 0);
                                const otrosVal = parseFloat(row['Otros Tributos (S/)'] || row.otros_tributos || 0) + parseFloat(row['ICBPER (S/)'] || row.icbper || 0) + parseFloat(row['Otros Cargos (S/)'] || row.otros_cargos || 0);
                                const totalVal = parseFloat(row['Total CP (S/)'] || row['Total CP'] || row.total_cp || 0);

                                groups[type].docs += 1;
                                groups[type].biGrav += biGravVal;
                                groups[type].mtoIgv += mtoIgvVal;
                                groups[type].valNoGrav += valNoGravVal;
                                groups[type].otros += otrosVal;
                                groups[type].total += totalVal;

                                grandTotals.docs += 1;
                                grandTotals.biGrav += biGravVal;
                                grandTotals.mtoIgv += mtoIgvVal;
                                grandTotals.valNoGrav += valNoGravVal;
                                grandTotals.otros += otrosVal;
                                grandTotals.total += totalVal;
                            });

                            const cpTypesMap = {
                                '01': '01 - Factura',
                                '03': '03 - Boleta de Venta',
                                '07': '07 - Nota de Crédito',
                                '08': '08 - Nota de Débito'
                            };

                            // Update summary table
                            if (tbody) {
                                tbody.innerHTML = '';

                                Object.keys(groups).sort().forEach(type => {
                                    const g = groups[type];
                                    const label = cpTypesMap[type] || `${type} - Otro`;

                                    tbody.innerHTML += `
                                        <tr>
                                            <td class="text-left">${label}</td>
                                            <td>${g.docs}</td>
                                            <td>${g.biGrav.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td>${g.mtoIgv.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td>0.00</td>
                                            <td>0.00</td>
                                            <td>0.00</td>
                                            <td>0.00</td>
                                            <td>${g.valNoGrav.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td>${g.otros.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td>${g.total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    `;
                                });

                                // Update footer totals row
                                const tfoot = document.getElementById('summary-table-foot');
                                if (tfoot) {
                                    tfoot.innerHTML = `
                                        <tr class="totals-row totals-row-red">
                                            <td class="text-left">TOTAL:</td>
                                            <td>${grandTotals.docs}</td>
                                            <td>${grandTotals.biGrav.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td>${grandTotals.mtoIgv.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td>0.00</td>
                                            <td>0.00</td>
                                            <td>0.00</td>
                                            <td>0.00</td>
                                            <td>${grandTotals.valNoGrav.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td>${grandTotals.otros.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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

                            // Pass the data to the detailed table
                            renderTable(data.map(d => ({
                                ruc: d['RUC'] || d['Ruc'] || '20123456789',
                                razon_social: d['Razon Social'] || 'EMPRESA DEMO S.A.C.',
                                periodo: d['Periodo'],
                                src_key: d['CAR SUNAT'] || d['src_key'] || '',
                                fecha_emision: formatDate(d['Fecha de emisión'] || d['Fecha de Emision'] || d['Fecha de emision']),
                                fecha_vcto_pago: formatDate(d['Fecha Vcto/Pago'] || d['Fecha Vcto/pago']),
                                tipo_cp: d['Tipo CP/Doc.'] || d['Tipo CP/Doc'] ? String(d['Tipo CP/Doc.'] || d['Tipo CP/Doc']).trim().padStart(2, '0') : '01',
                                comprobante: d['Comprobante'] || (String(d['Tipo CP/Doc.'] || d['Tipo CP/Doc'] || '').trim().padStart(2, '0') === '01' ? 'Factura' : (String(d['Tipo CP/Doc.'] || d['Tipo CP/Doc'] || '').trim().padStart(2, '0') === '03' ? 'Boleta de Venta' : (String(d['Tipo CP/Doc.'] || d['Tipo CP/Doc'] || '').trim().padStart(2, '0') === '07' ? 'Nota de Crédito' : (String(d['Tipo CP/Doc.'] || d['Tipo CP/Doc'] || '').trim().padStart(2, '0') === '08' ? 'Nota de Débito' : 'Otro')))),
                                serie: d['Serie del CDP'] || d['Serie del cdp'] || d['serie'],
                                numero: d['Numero'] || d['numero'] || d['Nro CP o Doc. Nro Inicial (Rango)'],
                                nro_final: d['Nro Final (Rango)'] || '',
                                tipo_doc_identidad: d['Tipo Doc Identidad'] || d['Tipo Doc\nIdentidad'] || d['tipo_doc_identidad'],
                                nro_doc_identidad: d['Nro Doc Identidad'] || d['Nro Doc\nIdentidad'] || d['nro_doc_identidad'],
                                proveedor: d['Apellidos y Nombres o Razón social'] || d['Razon Social/ Nombre Proveedor'] || d['proveedor'] || '',
                                tipo_proveedor: d['Tipo de Proveedor'] || 'Nacional - Bienes/Servicios',
                                bi_gravada: d['BI Gravada (S/)'] || d['BI Gravada'] || 0.00,
                                igv_ipm: d['IGV/IPM (S/)'] || d['IGV / IPM'] || 0.00,
                                bi_gravada_dgng: d['BI Gravado DGNG'] || 0.00,
                                igv_ipm_dgng: d['IGV/IPM DGNG'] || 0.00,
                                bi_gravada_dng: d['BI Gravado DNG'] || 0.00,
                                igv_ipm_dng: d['IGV/IPM DNG'] || 0.00,
                                adquisiciones_no_gravadas: d['Valor de las Adquisiciones No Gravadas'] || (parseFloat(d['Mto Exonerado (S/)'] || d['mto_exonerado'] || 0) + parseFloat(d['Mto Inafecto (S/)'] || d['mto_inafecto'] || 0)).toFixed(2),
                                isc: d['ISC (S/)'] || d['isc'] || 0.00,
                                icbper: d['ICBPER (S/)'] || d['icbper'] || 0.00,
                                otros_tributos_cargos: (parseFloat(d['Otros Tributos (S/)'] || d['otros_tributos'] || 0) + parseFloat(d['Otros Cargos (S/)'] || d['otros_cargos'] || 0)).toFixed(2),
                                anticipos: d['Anticipos (S/)'] || d['anticipos'] || 0.00,
                                otros_cargos: d['Otros Cargos (S/)'] || d['otros_cargos'] || 0.00,
                                monto_redondeo: d['Monto de Redondeo (S/)'] || d['monto_redondeo'] || 0.00,
                                total_cp: d['Total CP (S/)'] || d['total_cp'] || 0.00,
                                moneda: d['Moneda'],
                                tipo_cambio: d['Tipo de Cambio'] || d['tipo_cambio'] || 1.000,
                                doc_mod_fecha_emision: formatDate(d['Fecha Emisión Doc. Modificado'] || d['Fecha Emision Doc. Modificado']),
                                doc_mod_tipo_cp: d['Tipo CP Modificado'] || d['doc_mod_tipo_cp'],
                                doc_mod_serie: d['Serie CP Modificado'] || d['doc_mod_serie'],
                                doc_mod_numero: d['Nro CP Modificado'] || d['doc_mod_numero'],
                                detalle_operacion: d['Detalle de la Operación'] || d['detalle_operacion'] || '',
                                descripcion: d['Descripción'] || d['descripcion'] || '',
                                forma_pago: d['Forma de Pago'] || d['forma_pago'] || '',
                                motivo_nota_credito: d['Motivo Nota de Crédito'] || d['motivo_nota_credito'] || '',
                                sujeto_detrac_retenc: d['Sujeto a Detracción / Retención'] || d['sujeto_detrac_retenc'] || false,
                                tipo_carga: d['Tipo (Detracción / Retención Renta 4ta)'] || d['tipo_carga'] || '',
                                pct_aplicado: d['% Aplicado'] || d['pct_aplicado'] || 0,
                                monto_detrac_retenc: d['Monto Detracción/Retención'] || d['monto_detrac_retenc'] || 0.00,
                                nro_constancia_deposito: d['N° Constancia Depósito'] || d['nro_constancia_deposito'] || '',
                                id_proyecto: d['ID Proyecto Operadores Atribución'] || '',
                                tipo_nota: d['Tipo de Nota'] || '',
                                est_comp: d['Est. Comp'] || '1',
                                desc_comp: 'ACTIVO',
                                valor_fob: '0.00',
                                valor_op_gratuitas: '0.00',
                                tipo_operacion: '0101',
                                dam: '',
                                clu: d['CLU'] || ''
                            })));
                        } else {
                            if (tbody) tbody.innerHTML = `<tr><td colspan="11" class="text-center">No se encontraron registros para el periodo ${searchPeriod}.</td></tr>`;
                        }
                    } catch (err) {
                        console.error("Error fetching data:", err);
                        if (tbody) tbody.innerHTML = `<tr><td colspan="11" class="text-center text-danger">Error de conexión con Supabase.</td></tr>`;
                    }
                } else {
                    if (tbody) tbody.innerHTML = `<tr><td colspan="11" class="text-center">Supabase no está configurado o conectado.</td></tr>`;
                }
            }
        });
    }
});
