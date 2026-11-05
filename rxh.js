// ============================================================================
// rxh.js · Emisión del Recibo por Honorarios Electrónico (SEE - SOL)
// ----------------------------------------------------------------------------
// Réplica del flujo de SUNAT Operaciones en Línea:
//   Comprobantes de pago > SEE - SOL > Recibo por Honorarios Electrónicos >
//   Emitir Recibo por Honorario Electrónico
// Pasos: 1) forma de pago y usuario · 2) datos del servicio, inciso, retención,
// pago y monto · 3) borrador ("¿Está seguro...?") · 4) recibo emitido.
//
// Solo emite una persona natural con RUC 10 (empresas_simulador con ruc 10...).
// Si la Clave SOL es de una empresa (RUC 20) se explica por qué no puede.
// Los recibos emitidos se guardan con SimStore (clave 'sire_rxh_emitidos'), es
// decir por la pareja (usuario, RUC) como el resto del avance.
// Se carga en tramites.html después de auth.js y sesion.js.
// ============================================================================
(function () {
    'use strict';

    var CLAVE_EMITIDOS = 'sire_rxh_emitidos';
    var CLAVE_CORRELATIVO = 'sire_rxh_correlativo';
    var TASA_RETENCION = 0.08;
    var TOPE_RETENCION = 1500;   // se retiene cuando el recibo supera S/ 1,500

    // Primer número de recibo de los prestadores de los casos (EFSRT Módulo 1):
    // así el primero que emite el alumno coincide con el del enunciado.
    var CORRELATIVO_INICIAL = { '10457821634': 125, '10428765391': 87 };

    // Personas con DNI que aparecen en los casos (RENIEC simulado)
    var DNI_CONOCIDOS = {
        '45872103': 'ROJAS CHAVEZ MARIA FERNANDA',
        '42318765': 'PEREZ LUNA JUAN CARLOS',
        '74859262': 'PARI HOYOS ALEJANDRA SUNDARI'
    };

    // RUC que ya reconoce la emisión de facturas (lookupRuc de tramites.html)
    var RUC_CONOCIDOS = {
        '10460693395': 'MAMANI ROQUE EDUARDO LUIS',
        '20100100100': 'SUNAT - SUPERINTENDENCIA NACIONAL DE ADUANAS Y DE ADMINISTRACION TRIBUTARIA',
        '20607502316': 'CONSTRUCTORA AREQUIPA SUR S.R.L.',
        '20606927283': 'DISTRIBUIDORA FERRETERA EL CONSTRUCTOR E.I.R.L.',
        '20613448706': 'GRUPO EMPRESARIAL LOS ANDES S.A.C.',
        '20517941507': 'SERVICIOS Y GESTIONES EMPRESARIALES DEL PERU EIRL',
        '20448190740': 'ALTIPLANO CIA MINERA SOCIEDAD ANÓNIMA CERRADA',
        '20562707108': 'CONSORCIO TRANSPORTE AREQUIPA S.A.',
        '20611979828': 'SERVICIOS EMPRESARIALES E & P E.I.R.L.'
    };

    var TIPOS_DOC = [
        { v: '6', t: 'RUC', largo: 11 },
        { v: '1', t: 'DOC. NACIONAL DE IDENTIDAD', largo: 8 },
        { v: '4', t: 'CARNET DE EXTRANJERIA', largo: 0 },
        { v: '7', t: 'PASAPORTE', largo: 0 },
        { v: '0', t: 'SIN DOCUMENTO', largo: 0 }
    ];

    var MEDIOS_PAGO = ['Depósito en Cuenta', 'Efectivo', 'Transferencia de Fondos', 'Giro',
        'Orden de Pago', 'Tarjeta de Débito', 'Tarjeta de Crédito', 'Cheque', 'Otros'];

    var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
        'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    var estado = null;   // datos del recibo en edición
    var emisor = null;   // prestador (Clave SOL activa)

    // ------------------------------------------------------------------ utilidades
    function $(id) { return document.getElementById(id); }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function cliente() {
        if (window.authSupabaseClient) return window.authSupabaseClient;
        try { if (typeof authSupabaseClient !== 'undefined' && authSupabaseClient) return authSupabaseClient; } catch (e) {}
        try { if (typeof supabaseClient !== 'undefined' && supabaseClient) return supabaseClient; } catch (e) {}
        return null;
    }

    function empresaActiva() {
        try {
            var e = JSON.parse(sessionStorage.getItem('sunat_empresa') || 'null');
            if (e && e.ruc) return { ruc: String(e.ruc), razon_social: e.razon_social || '' };
        } catch (err) {}
        try {
            var a = JSON.parse(sessionStorage.getItem('sunat_auth') || '{}');
            if (a.ruc) return { ruc: String(a.ruc), razon_social: a.denominacion || '' };
        } catch (err) {}
        return { ruc: '', razon_social: '' };
    }

    function leer(clave, defecto) {
        try {
            var st = window.SimStore || sessionStorage;
            var v = st.getItem(clave);
            return v == null ? defecto : JSON.parse(v);
        } catch (e) { return defecto; }
    }

    function guardar(clave, valor) {
        try {
            var st = window.SimStore || sessionStorage;
            st.setItem(clave, JSON.stringify(valor));
        } catch (e) { console.warn('No se pudo guardar el recibo:', e); }
    }

    function hoyISO() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function fechaDMY(iso) {
        if (!iso) return '';
        var p = iso.split('-');
        return p[2] + '/' + p[1] + '/' + p[0];
    }

    function fechaLarga(iso) {
        var p = iso.split('-');
        return p[2] + ' de ' + MESES[parseInt(p[1], 10) - 1] + ' de ' + p[0];
    }

    function r2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }

    function fmt(n) {
        return r2(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Número a letras: 100 -> "CIEN Y 00/100 SOLES"
    function enLetras(monto, moneda) {
        var U = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ',
            'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE',
            'VEINTIUNO', 'VEINTIDOS', 'VEINTITRES', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISEIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
        var D = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
        var C = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS',
            'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
        function menor1000(n) {
            if (n === 0) return '';
            if (n === 100) return 'CIEN';
            var c = Math.floor(n / 100), r = n % 100, s = C[c];
            if (r) {
                var t = r < 30 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? ' Y ' + U[r % 10] : '');
                s = (s ? s + ' ' : '') + t;
            }
            return s;
        }
        function entero(n) {
            if (n === 0) return 'CERO';
            var mill = Math.floor(n / 1000000), miles = Math.floor((n % 1000000) / 1000), resto = n % 1000, out = [];
            if (mill) out.push(mill === 1 ? 'UN MILLON' : menor1000(mill).replace(/UNO$/, 'UN') + ' MILLONES');
            if (miles) out.push(miles === 1 ? 'MIL' : menor1000(miles).replace(/UNO$/, 'UN') + ' MIL');
            if (resto) out.push(menor1000(resto));
            return out.join(' ');
        }
        var v = r2(monto), ent = Math.floor(v), cent = Math.round((v - ent) * 100);
        return entero(ent) + ' Y ' + String(cent).padStart(2, '0') + '/100 ' + (moneda === 'USD' ? 'DOLARES AMERICANOS' : 'SOLES');
    }

    // ------------------------------------------------------------------ vista
    var CSS = [
        '#rxh-wrapper .rxh-title{background:#4F81BD;color:#fff;font-size:20px;padding:8px 12px;margin:0 0 6px;font-weight:400;font-family:Roboto,Arial,sans-serif;}',
        '#rxh-wrapper .rxh-intro{font-size:12.5px;color:#333;margin:0 0 10px;line-height:1.5;}',
        '#rxh-wrapper .rxh-sec{background:#B8CCE4;color:#1E395B;font-size:12.5px;padding:5px 8px;font-weight:500;}',
        '#rxh-wrapper .rxh-box{border:1px solid #9DB3CC;margin-bottom:12px;background:#fff;}',
        '#rxh-wrapper .rxh-box .factura-form-table td.question-cell{width:32%;}',
        '#rxh-wrapper .rxh-box .factura-form-table td.control-cell{width:66%;}',
        '#rxh-wrapper .rxh-radio-list label{display:block;margin:6px 0;line-height:1.4;}',
        '#rxh-wrapper .rxh-msg{font-size:12px;padding:8px 10px;border-radius:3px;margin:8px 0;line-height:1.45;}',
        '#rxh-wrapper .rxh-msg.err{background:#FDECEA;color:#8A1C1C;border:1px solid #F5C2C0;}',
        '#rxh-wrapper .rxh-msg.info{background:#EAF3FB;color:#1E395B;border:1px solid #BFD7EE;}',
        '#rxh-wrapper .rxh-msg.warn{background:#FFF6E0;color:#7C4A03;border:1px solid #F3D08A;}',
        '#rxh-wrapper .rxh-ro{background:#EEF1F4;color:#333;}',
        '#rxh-wrapper .rxh-num{text-align:right;width:150px;}',
        '#rxh-wrapper .btn-factura-action[disabled]{opacity:.5;cursor:not-allowed;}',
        '#rxh-recibo{max-width:620px;margin:0 auto 14px;border:1px solid #4F81BD;padding:28px 30px;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#222;background:#fff;}',
        '#rxh-recibo .cab{display:flex;justify-content:space-between;gap:16px;margin-bottom:22px;}',
        '#rxh-recibo .cab .izq{flex:1;line-height:1.45;}',
        '#rxh-recibo .cab .izq .nom{font-size:14.5px;margin-bottom:10px;}',
        '#rxh-recibo .cab .izq p{margin:0 0 10px;}',
        '#rxh-recibo .cab .der{border:1.5px solid #4F81BD;padding:14px 18px;text-align:center;min-width:190px;align-self:flex-start;line-height:1.6;}',
        '#rxh-recibo .cuerpo p,#rxh-recibo > p{margin:0 0 11px;line-height:1.45;}',
        '#rxh-recibo table.tot{margin:18px 0 6px auto;border-collapse:collapse;}',
        '#rxh-recibo table.tot td{padding:6px 10px;vertical-align:top;}',
        '#rxh-recibo table.tot td.v{text-align:right;min-width:110px;}',
        '#rxh-recibo .borrador{color:#cc0000;text-align:center;margin-top:14px;font-size:12.5px;}',
        '#rxh-recibo .valido{color:#2e7d32;text-align:center;margin-top:14px;font-size:12.5px;}',
        '#rxh-wrapper .rxh-pregunta{color:#2e7d32;text-align:center;font-size:17px;margin:14px 0;}',
        '#rxh-wrapper table.rxh-lista{width:100%;border-collapse:collapse;font-size:12px;}',
        '#rxh-wrapper table.rxh-lista th{background:#4F81BD;color:#fff;padding:6px;font-weight:500;}',
        '#rxh-wrapper table.rxh-lista td{border-bottom:1px solid #D6E2EE;padding:6px;}',
        '@media (max-width:760px){#rxh-wrapper .factura-layout{flex-direction:column;}#rxh-wrapper .factura-sidebar{width:100%;}',
        '#rxh-wrapper .factura-content{padding:14px 12px;}#rxh-recibo{padding:18px 14px;}#rxh-recibo .cab{flex-direction:column;}',
        '#rxh-wrapper .rxh-box .factura-form-table td{display:block;width:auto!important;}#rxh-wrapper .rxh-box .factura-form-table td.separator-cell{display:none;}}',
        '@media print{body *{visibility:hidden!important;}#rxh-recibo,#rxh-recibo *{visibility:visible!important;}',
        '#rxh-recibo{position:absolute;left:0;top:0;border:none;}}'
    ].join('');

    function menuLateral(activo) {
        function item(key, txt) {
            var on = key === activo;
            return '<li><a href="#" class="menu-item-link" onclick="RxH.ir(\'' + key + '\'); return false;"' +
                (on ? ' style="font-weight:600;"' : '') + '><i class="fas fa-caret-right"></i> ' + txt +
                (on ? ' <i class="fas fa-chevron-right" style="color:#006699;font-size:11px;"></i>' : '') + '</a></li>';
        }
        function noImpl(txt) {
            return '<li><a href="#" class="menu-item-link" onclick="alert(\'EN PROCESO DE IMPLEMENTACION\'); return false;">' +
                '<i class="fas fa-caret-right"></i> ' + txt + '</a></li>';
        }
        return '<div class="factura-sidebar-header"><a href="#" onclick="RxH.salir(); return false;">' +
            '<i class="fas fa-home"></i> Ir al inicio <i class="fas fa-chevron-left" style="float:right;margin-top:3px;"></i></a></div>' +
            '<div class="factura-sidebar-menu"><h3>Recibo por Honorarios Electrónicos</h3><ul>' +
            item('emitir', 'Emitir Recibo por Honorario Electrónico') +
            noImpl('Emitir Nota de Crédito Electrónica') +
            noImpl('Registrar Recibo por Honorario Físico') +
            noImpl('Registrar Nota de Crédito Física') +
            noImpl('Registrar Pagos') +
            noImpl('Registrar Otros Ingresos de Cuarta Categoría') +
            noImpl('Revertir Recibo por Honorario Electrónico') +
            item('consultar', 'Consultas de Recibos emitidos') +
            '</ul><h3>Otras declaraciones y solicitudes</h3><ul>' +
            item('f1609', 'Form. 1609 Solicitud de Suspensión Retenciones 4ta Cat.') +
            item('f1609-consulta', 'Consulta de Suspensión de Retenciones') +
            '</ul></div>';
    }

    function asegurarVista() {
        if ($('rxh-wrapper')) return;
        var st = document.createElement('style');
        st.id = 'rxh-css';
        st.textContent = CSS;
        document.head.appendChild(st);
        var w = document.createElement('div');
        w.className = 'emitir-factura-wrapper';
        w.id = 'rxh-wrapper';
        w.style.display = 'none';
        w.innerHTML = '<div class="factura-layout"><aside class="factura-sidebar" id="rxh-sidebar"></aside>' +
            '<main class="factura-content"><div class="factura-form-container" id="rxh-main"></div></main></div>';
        var ref = $('emitir-boleta-wrapper') || $('tramites-content-container');
        if (ref && ref.parentNode) ref.parentNode.insertBefore(w, ref.nextSibling);
        else document.body.appendChild(w);
    }

    function pintar(activo, html) {
        $('rxh-sidebar').innerHTML = menuLateral(activo);
        $('rxh-main').innerHTML = html;
        window.scrollTo(0, 0);
    }

    function botones(lista) {
        return '<div class="factura-buttons-row">' + lista.map(function (b) {
            return '<button type="button" class="btn-factura-action" id="' + b.id + '" onclick="' + b.fn + '"' +
                (b.off ? ' disabled' : '') + '><i class="fas ' + b.ic + '" style="color:' + b.col + ';"></i> ' + b.t + '</button>';
        }).join('') + '</div>';
    }

    // ------------------------------------------------------------------ emisor
    async function cargarEmisor() {
        var act = empresaActiva();
        var e = { ruc: act.ruc, nombre: act.razon_social, profesion: '', direccion: '', telefono: '' };
        var sb = cliente();
        if (sb && act.ruc) {
            try {
                var r = await sb.from('empresas_simulador')
                    .select('razon_social, rubro, direccion_fiscal, distrito, provincia, departamento, telefono')
                    .eq('ruc', act.ruc).maybeSingle();
                if (r && r.data) {
                    var d = r.data;
                    e.nombre = d.razon_social || e.nombre;
                    e.profesion = d.rubro || '';
                    e.direccion = [d.direccion_fiscal, d.departamento, d.provincia, d.distrito]
                        .filter(Boolean).join(' - ').toUpperCase();
                    e.telefono = d.telefono || '';
                }
            } catch (err) { console.warn('No se pudo leer el emisor:', err); }
        }
        return e;
    }

    async function buscarUsuario(tipo, num) {
        if (tipo === '6') {
            var sb = cliente();
            if (sb) {
                try {
                    var r = await sb.from('empresas_simulador')
                        .select('razon_social, direccion_fiscal, distrito, provincia, departamento')
                        .eq('ruc', num).maybeSingle();
                    if (r && r.data) {
                        var d = r.data;
                        return { nombre: d.razon_social, domicilio: [d.direccion_fiscal, d.distrito, d.provincia, d.departamento].filter(Boolean).join(' - ').toUpperCase() };
                    }
                } catch (e) {}
                try {
                    // Terceros que ya figuran como clientes o proveedores en los registros
                    var v = await sb.from('registro_ventas').select('"Apellidos Nombres/ Razón Social"')
                        .eq('Nro Doc Identidad', Number(num)).limit(1);
                    if (v && v.data && v.data.length) return { nombre: v.data[0]['Apellidos Nombres/ Razón Social'], domicilio: '' };
                    var c = await sb.from('registro_compras').select('"Apellidos Nombres/ Razón  Social"')
                        .eq('Nro Doc Identidad', Number(num)).limit(1);
                    if (c && c.data && c.data.length) return { nombre: c.data[0]['Apellidos Nombres/ Razón  Social'], domicilio: '' };
                } catch (e) {}
            }
            if (RUC_CONOCIDOS[num]) return { nombre: RUC_CONOCIDOS[num], domicilio: '' };
            // La misma búsqueda de la factura (empresas registradas y consulta a SUNAT)
            if (typeof window.resolverRuc === 'function' || typeof resolverRuc === 'function') {
                try {
                    var info = await resolverRuc(num);
                    if (info && info.ok) return { nombre: info.razon_social, domicilio: (info.direccion_legal && info.direccion_legal !== '-') ? info.direccion_legal : '' };
                } catch (e) {}
            }
            return null;
        }
        if (tipo === '1' && DNI_CONOCIDOS[num]) return { nombre: DNI_CONOCIDOS[num], domicilio: '' };
        if (tipo === '1') {
            var sbp = cliente();
            if (sbp) {
                try {
                    var p = await sbp.from('personas').select('nombres, direccion').eq('dni', num).maybeSingle();
                    if (p && p.data && p.data.nombres) return { nombre: p.data.nombres, domicilio: p.data.direccion || '' };
                } catch (e) {}
            }
        }
        return null;
    }

    // ------------------------------------------------------------------ pasos
    function nuevoEstado() {
        return {
            forma: 'contado', tipoDoc: '6', numDoc: '', nombre: '', domicilio: '', validado: false,
            gratuito: 'no', descripcion: '', observacion: '', fecha: hoyISO(), inciso: 'A',
            retencion: 'no', pagoTotal: 'si', medioPago: MEDIOS_PAGO[0], vencimiento: '',
            moneda: 'PEN', monto: ''
        };
    }

    function pantallaNoPersona(vista) {
        var act = empresaActiva();
        var es1609 = vista === 'f1609' || vista === 'f1609-consulta';
        pintar(es1609 ? 'f1609' : 'emitir',
            '<h2 class="rxh-title">' + (es1609 ? 'Suspensiones de 4ta Categoría - Formulario 1609' : 'Emisión del Recibo por Honorarios Electrónico') + '</h2>' +
            '<div class="rxh-msg err"><b>Esta opción es solo para personas naturales con RUC (rentas de cuarta categoría).</b><br>' +
            'Ingresaste con la Clave SOL de <b>' + esc(act.razon_social || 'una empresa') + '</b>' + (act.ruc ? ' (RUC ' + esc(act.ruc) + ')' : '') +
            (es1609
                ? '. La suspensión de retenciones la solicita el prestador del servicio, no la empresa que paga los honorarios.</div>'
                : '. Una empresa no emite recibos por honorarios: los <b>recibe</b> de sus prestadores de servicios y, cuando le corresponde ' +
                  'retener el 8 %, declara esa retención en el PDT PLAME (Formulario 0601).</div>') +
            '<div class="rxh-msg info">Para practicar, sal de la Clave SOL y vuelve a ingresar con el RUC de un prestador ' +
            '(usuario <b>SIST</b>, clave <b>NORTON</b>):<br>' +
            '• <b>10457821634</b> · QUISPE FLORES ANA MARIA (asesoría contable)<br>' +
            '• <b>10428765391</b> · TORRES MAMANI LUIS ALBERTO (diseño del catálogo digital)</div>' +
            botones([{ id: 'rxh-volver', fn: 'RxH.salir()', ic: 'fa-arrow-alt-circle-left', col: '#006699', t: 'Regresar' }]));
    }

    function paso1() {
        var s = estado;
        var opts = TIPOS_DOC.map(function (t) {
            return '<option value="' + t.v + '"' + (t.v === s.tipoDoc ? ' selected' : '') + '>' + t.t + '</option>';
        }).join('');
        pintar('emitir',
            '<h2 class="rxh-title">Emisión del Recibo por Honorarios Electrónico</h2>' +
            '<p class="rxh-intro">Señor contribuyente, complete la información solicitada para el recibo por honorarios electrónico y luego ' +
            'seleccione el botón "Continuar" para seguir ingresando los datos del Recibo.</p>' +
            '<div class="rxh-box"><div class="rxh-sec">Forma de pago</div><table class="factura-form-table"><tr>' +
            '<td class="question-cell">Indicar la forma de pago</td><td class="separator-cell">:</td><td class="control-cell">' +
            '<label><input type="radio" name="rxh-forma" value="contado"' + (s.forma === 'contado' ? ' checked' : '') + '> Al contado</label>' +
            '<label><input type="radio" name="rxh-forma" value="credito"' + (s.forma === 'credito' ? ' checked' : '') + '> Al Crédito</label>' +
            '</td></tr></table></div>' +
            '<div class="rxh-box"><div class="rxh-sec">Indique los datos del usuario al que le prestó el servicio:</div>' +
            '<table class="factura-form-table">' +
            '<tr><td class="question-cell">Tipo de Documento de Identidad del Usuario</td><td class="separator-cell">:</td>' +
            '<td class="control-cell"><select class="factura-select" id="rxh-tipo-doc" style="width:260px;max-width:100%;" onchange="RxH.cambioTipoDoc()">' + opts + '</select></td></tr>' +
            '<tr><td class="question-cell">Número Documento de Identidad del Usuario</td><td class="separator-cell">:</td>' +
            '<td class="control-cell"><input type="text" id="rxh-num-doc" class="factura-input-text" maxlength="15" value="' + esc(s.numDoc) + '" ' +
            'oninput="RxH.cambioNumDoc()" style="width:150px;"> ' +
            '<button type="button" class="btn-factura-action" style="padding:4px 10px;" onclick="RxH.validar()">Validar RUC o DNI</button></td></tr>' +
            '<tr><td class="question-cell">Nombre o Razón Social del Usuario</td><td class="separator-cell">:</td>' +
            '<td class="control-cell"><input type="text" id="rxh-nombre" class="factura-input-text rxh-ro" style="width:100%;" readonly value="' + esc(s.nombre) + '" oninput="RxH.cambioNombre()"></td></tr>' +
            '</table><div id="rxh-msg1" style="padding:0 8px;"></div></div>' +
            botones([
                { id: 'rxh-cont1', fn: 'RxH.continuar1()', ic: 'fa-arrow-alt-circle-right', col: '#006699', t: 'Continuar', off: !s.validado },
                { id: 'rxh-canc1', fn: 'RxH.salir()', ic: 'fa-times-circle', col: '#cc0000', t: 'Cancelar' }
            ]));
        aplicarTipoDoc(false);
    }

    function aplicarTipoDoc(limpiar) {
        var tipo = $('rxh-tipo-doc').value;
        var num = $('rxh-num-doc'), nom = $('rxh-nombre');
        if (limpiar) { num.value = ''; nom.value = ''; estado.validado = false; estado.manual = false; }
        num.disabled = tipo === '0';
        if (tipo === '0') {
            nom.readOnly = false; nom.classList.remove('rxh-ro');
            estado.validado = !!nom.value.trim();
        } else if (tipo === '4' || tipo === '7' || ((tipo === '1' || tipo === '6') && estado.manual)) {
            nom.readOnly = false; nom.classList.remove('rxh-ro');
        } else {
            nom.readOnly = true; nom.classList.add('rxh-ro');
        }
        $('rxh-cont1').disabled = !estado.validado;
    }

    function mensaje(id, tipo, html) {
        var el = $(id);
        if (el) el.innerHTML = html ? '<div class="rxh-msg ' + tipo + '">' + html + '</div>' : '';
    }

    async function validar() {
        var tipo = $('rxh-tipo-doc').value;
        var num = $('rxh-num-doc').value.trim();
        var nom = $('rxh-nombre');
        estado.validado = false;
        estado.manual = false;
        var def = TIPOS_DOC.filter(function (t) { return t.v === tipo; })[0];
        if (tipo !== '0' && !num) { mensaje('rxh-msg1', 'err', 'Ingrese el número de documento del usuario y luego presione "Validar RUC o DNI".'); return aplicarTipoDoc(false); }
        if (def && def.largo && (!/^\d+$/.test(num) || num.length !== def.largo)) {
            mensaje('rxh-msg1', 'err', 'El ' + (tipo === '6' ? 'RUC' : 'DNI') + ' debe tener ' + def.largo + ' dígitos numéricos. Revise el número e inténtelo nuevamente.');
            return aplicarTipoDoc(false);
        }
        if (tipo === '6' && num === String(emisor.ruc)) {
            mensaje('rxh-msg1', 'err', 'No puede emitirse un recibo por honorarios a sí mismo. Ingrese el RUC de la empresa o persona que recibió el servicio.');
            return aplicarTipoDoc(false);
        }
        if (tipo === '6' || tipo === '1') {
            mensaje('rxh-msg1', 'info', 'Validando...');
            var u = await buscarUsuario(tipo, num);
            if (u) {
                nom.value = u.nombre; estado.domicilio = u.domicilio || '';
                nom.readOnly = true; nom.classList.add('rxh-ro');
                estado.validado = true;
                mensaje('rxh-msg1', '', '');
            } else {
                // No figura en el padrón del laboratorio: se escribe el nombre a mano
                estado.manual = true;
                estado.domicilio = '';
                nom.value = '';
                setTimeout(function () { nom.focus(); }, 0);
                estado.validado = false;
                mensaje('rxh-msg1', 'warn', tipo === '1'
                    ? 'El DNI no figura en la base del laboratorio. Escriba los apellidos y nombres del usuario tal como figuran en su DNI.'
                    : 'El RUC ' + esc(num) + ' no figura en el padrón del laboratorio. Escriba el nombre o la razón social del usuario tal como figura en su ficha RUC.');
            }
        } else {
            estado.validado = !!nom.value.trim();
            if (!estado.validado) mensaje('rxh-msg1', 'warn', 'Escriba el nombre del usuario.');
        }
        aplicarTipoDoc(false);
    }

    function continuar1() {
        var s = estado;
        s.forma = (document.querySelector('input[name="rxh-forma"]:checked') || {}).value || 'contado';
        s.tipoDoc = $('rxh-tipo-doc').value;
        s.numDoc = $('rxh-num-doc').value.trim();
        s.nombre = $('rxh-nombre').value.trim().toUpperCase();
        if (!s.validado || !s.nombre) { mensaje('rxh-msg1', 'err', 'Primero valide el documento del usuario.'); return; }
        paso2();
    }

    function radio(name, val, actual, txt, extra) {
        return '<label><input type="radio" name="' + name + '" value="' + val + '"' + (val === actual ? ' checked' : '') +
            (extra || '') + ' onchange="RxH.refrescar2()"> ' + txt + '</label>';
    }

    function paso2() {
        var s = estado;
        var conRuc = s.tipoDoc === '6';
        var medios = MEDIOS_PAGO.map(function (m) { return '<option' + (m === s.medioPago ? ' selected' : '') + '>' + m + '</option>'; }).join('');
        pintar('emitir',
            '<h2 class="rxh-title">Emisión del Recibo por Honorarios Electrónico</h2>' +
            '<div class="rxh-msg info" style="margin-top:0;">Usuario: <b>' + esc(s.nombre) + '</b>' +
            (s.tipoDoc !== '0' ? ' · ' + (conRuc ? 'RUC' : 'Doc.') + ' ' + esc(s.numDoc) : '') + ' · Forma de pago: <b>' + (s.forma === 'credito' ? 'AL CRÉDITO' : 'AL CONTADO') + '</b></div>' +
            '<div class="rxh-box"><div class="rxh-sec">Indique los datos del servicio prestado:</div><table class="factura-form-table">' +
            '<tr><td class="question-cell">¿El Servicio se Prestó a Título Gratuito?</td><td class="separator-cell">:</td><td class="control-cell">' +
            radio('rxh-gratuito', 'si', s.gratuito, 'Sí') + radio('rxh-gratuito', 'no', s.gratuito, 'No') + '</td></tr>' +
            '<tr><td class="question-cell">Descripción o Tipo de Servicio Prestado</td><td class="separator-cell">:</td><td class="control-cell">' +
            '<input type="text" id="rxh-desc" class="factura-input-text" maxlength="250" style="width:100%;" value="' + esc(s.descripcion) + '"></td></tr>' +
            '<tr><td class="question-cell">Observación (opcional)</td><td class="separator-cell">:</td><td class="control-cell">' +
            '<input type="text" id="rxh-obs" class="factura-input-text" maxlength="250" style="width:100%;" value="' + esc(s.observacion) + '"></td></tr>' +
            '<tr><td class="question-cell">Fecha de Emisión</td><td class="separator-cell">:</td><td class="control-cell">' +
            '<input type="date" id="rxh-fecha" class="factura-input-text" max="' + hoyISO() + '" value="' + esc(s.fecha) + '"></td></tr>' +
            '</table></div>' +
            '<div class="rxh-box"><div class="rxh-sec">Indique el tipo de Renta de Cuarta Categoría, de acuerdo al inciso aplicable del artículo 33 LIR:</div>' +
            '<div class="rxh-radio-list" style="padding:4px 10px;font-size:12px;">' +
            radio('rxh-inciso', 'A', s.inciso, 'Inciso A: El ejercicio individual, de cualquier profesión, arte, ciencia, oficio o actividades no incluidas expresamente en la tercera categoría.') +
            radio('rxh-inciso', 'B', s.inciso, 'Inciso B: El desempeño de funciones de director de empresas, síndico, mandatario, gestor de negocios, albacea y actividades similares, incluyendo el desempeño de las funciones del regidor municipal o consejero regional.') +
            '</div></div>' +
            '<div class="rxh-box" id="rxh-box-ret"><div class="rxh-sec">Retención del Impuesto a la Renta:</div>' +
            '<div class="rxh-radio-list" style="padding:4px 10px;font-size:12px;">' +
            radio('rxh-ret', 'si', s.retencion, 'Sí') + radio('rxh-ret', 'no', s.retencion, 'No') +
            '<div id="rxh-msg-ret"></div></div></div>' +
            (s.forma === 'contado'
                ? '<div class="rxh-box" id="rxh-box-pago"><div class="rxh-sec">El pago total del servicio está siendo efectuado al momento de la emisión de este comprobante:</div>' +
                  '<div class="rxh-radio-list" style="padding:4px 10px;font-size:12px;">' +
                  radio('rxh-pago', 'si', s.pagoTotal, 'Sí') + radio('rxh-pago', 'no', s.pagoTotal, 'No') +
                  '<select class="factura-select" id="rxh-medio" style="width:260px;max-width:100%;margin:4px 0 6px;">' + medios + '</select></div></div>'
                : '<div class="rxh-box"><div class="rxh-sec">Indique la fecha de vencimiento del pago:</div><table class="factura-form-table"><tr>' +
                  '<td class="question-cell">Fecha de vencimiento</td><td class="separator-cell">:</td><td class="control-cell">' +
                  '<input type="date" id="rxh-venc" class="factura-input-text" value="' + esc(s.vencimiento) + '"></td></tr></table></div>') +
            '<div class="rxh-box" id="rxh-box-monto"><div class="rxh-sec">Indique el monto de los honorarios:</div><table class="factura-form-table">' +
            '<tr><td class="question-cell">Tipo de Moneda</td><td class="separator-cell">:</td><td class="control-cell">' +
            '<select class="factura-select" id="rxh-moneda" onchange="RxH.refrescar2()"><option value="PEN"' + (s.moneda === 'PEN' ? ' selected' : '') + '>SOL</option>' +
            '<option value="USD"' + (s.moneda === 'USD' ? ' selected' : '') + '>DOLAR AMERICANO</option></select></td></tr>' +
            '<tr><td class="question-cell">Monto Total de los Honorarios</td><td class="separator-cell">:</td><td class="control-cell">' +
            '<input type="text" id="rxh-monto" class="factura-input-text rxh-num" inputmode="decimal" value="' + esc(s.monto) + '" oninput="RxH.refrescar2()" onblur="RxH.formatearMonto()"></td></tr>' +
            '<tr><td class="question-cell">Retención (8%) Impuesto a la Renta</td><td class="separator-cell">:</td><td class="control-cell">' +
            '<input type="text" id="rxh-retencion" class="factura-input-text rxh-num rxh-ro" readonly></td></tr>' +
            '<tr><td class="question-cell">Total Neto Recibido</td><td class="separator-cell">:</td><td class="control-cell">' +
            '<input type="text" id="rxh-neto" class="factura-input-text rxh-num rxh-ro" readonly></td></tr>' +
            '</table></div><div id="rxh-msg2"></div>' +
            botones([
                { id: 'rxh-cont2', fn: 'RxH.continuar2()', ic: 'fa-arrow-alt-circle-right', col: '#006699', t: 'Continuar' },
                { id: 'rxh-ant2', fn: 'RxH.anterior2()', ic: 'fa-arrow-alt-circle-left', col: '#006699', t: 'Anterior' },
                { id: 'rxh-canc2', fn: 'RxH.salir()', ic: 'fa-times-circle', col: '#cc0000', t: 'Cancelar' }
            ]));
        refrescar2();
    }

    function valorRadio(name) {
        var el = document.querySelector('input[name="' + name + '"]:checked');
        return el ? el.value : '';
    }

    function montoIngresado() {
        var t = ($('rxh-monto').value || '').replace(/,/g, '').trim();
        var n = parseFloat(t);
        return isNaN(n) ? 0 : n;
    }

    function leerPaso2() {
        var s = estado;
        s.gratuito = valorRadio('rxh-gratuito') || 'no';
        s.descripcion = $('rxh-desc').value.trim();
        s.observacion = $('rxh-obs').value.trim();
        s.fecha = $('rxh-fecha').value;
        s.inciso = valorRadio('rxh-inciso') || 'A';
        s.retencion = valorRadio('rxh-ret') || 'no';
        if ($('rxh-medio')) { s.pagoTotal = valorRadio('rxh-pago') || 'si'; s.medioPago = $('rxh-medio').value; }
        if ($('rxh-venc')) s.vencimiento = $('rxh-venc').value;
        s.moneda = $('rxh-moneda').value;
        s.monto = $('rxh-monto').value;
    }

    function refrescar2() {
        leerPaso2();
        var s = estado;
        var gratis = s.gratuito === 'si';
        $('rxh-box-monto').style.display = gratis ? 'none' : '';
        $('rxh-box-ret').style.display = gratis ? 'none' : '';
        if ($('rxh-box-pago')) $('rxh-box-pago').style.display = gratis ? 'none' : '';
        if ($('rxh-medio')) $('rxh-medio').style.display = s.pagoTotal === 'si' ? '' : 'none';
        var m = montoIngresado();
        var ret = s.retencion === 'si' ? r2(m * TASA_RETENCION) : 0;
        $('rxh-retencion').value = fmt(ret);
        $('rxh-neto').value = fmt(m - ret);
        // Sugerencia según la regla de retención de cuarta categoría. Es solo
        // una ayuda: el alumno elige Sí o No libremente y puede emitir igual.
        var sug = '';
        var cons = s.fecha ? constancia1609(emisor.ruc, Number(s.fecha.slice(0, 4))) : null;
        var link1609 = '<a href="#" onclick="RxH.ir(\'f1609\'); return false;">Formulario Virtual 1609</a>';
        if (!gratis && m > 0 && s.moneda === 'PEN') {
            if (s.tipoDoc !== '6') {
                sug = s.retencion === 'si'
                    ? 'El usuario no tiene RUC (persona sin negocio): normalmente no es agente de retención, por lo que lo usual es <b>No</b> retener.'
                    : 'El usuario no tiene RUC: normalmente no es agente de retención, así que <b>No</b> retener es lo usual.';
            } else if (cons) {
                sug = 'Usted tiene constancia de suspensión de retenciones del ' + cons.anio + ' (Formulario 1609, N° ' + esc(cons.numero) +
                    '): si se la entregó al usuario, lo que corresponde es <b>No</b> retener.';
            } else if (m > TOPE_RETENCION) {
                sug = 'El recibo supera S/ 1,500.00 y el usuario tiene RUC: si es agente de retención, lo que corresponde es <b>Sí</b> retener el 8 %. ' +
                    'Para evitar la retención puede presentar antes el ' + link1609 + ' y entregar la constancia al usuario.';
            } else {
                sug = 'El recibo no supera S/ 1,500.00: lo que corresponde es <b>No</b> retener.';
            }
        }
        mensaje('rxh-msg-ret', 'info', sug ? '<i class="fas fa-lightbulb" style="color:#B45309;"></i> <b>Sugerencia:</b> ' + sug +
            ' <span style="opacity:.8;">Usted decide: puede marcar Sí o No.</span>' : '');
    }

    function formatearMonto() {
        var m = montoIngresado();
        if (m > 0) $('rxh-monto').value = fmt(m);
        refrescar2();
    }

    function anterior2() { leerPaso2(); paso1(); }

    function continuar2() {
        leerPaso2();
        var s = estado, err = [];
        if (!s.descripcion) err.push('Escriba la descripción o tipo de servicio prestado (por ejemplo: ASESORIA CONTABLE DEL MES).');
        if (!s.fecha) err.push('Indique la fecha de emisión.');
        else if (s.fecha > hoyISO()) err.push('La fecha de emisión no puede ser posterior a la fecha de hoy.');
        if (s.gratuito !== 'si') {
            var m = montoIngresado();
            if (!(m > 0)) err.push('Ingrese el monto total de los honorarios (mayor que cero).');
            if (s.forma === 'credito' && !s.vencimiento) err.push('Indique la fecha de vencimiento del pago al crédito.');
            if (s.forma === 'credito' && s.vencimiento && s.fecha && s.vencimiento < s.fecha) err.push('La fecha de vencimiento no puede ser anterior a la fecha de emisión.');
        }
        if (err.length) { mensaje('rxh-msg2', 'err', err.join('<br>')); return; }
        s.descripcion = s.descripcion.toUpperCase();
        paso3();
    }

    function importes(s) {
        if (s.gratuito === 'si') return { bruto: 0, ret: 0, neto: 0 };
        var b = r2(parseFloat(String(s.monto).replace(/,/g, '')) || 0);
        var ret = s.retencion === 'si' ? r2(b * TASA_RETENCION) : 0;
        return { bruto: b, ret: ret, neto: r2(b - ret) };
    }

    function htmlRecibo(s, numero, final) {
        var imp = importes(s);
        var mon = s.moneda === 'USD' ? 'DOLARES AMERICANOS' : 'SOLES';
        var docTxt = s.tipoDoc === '6' ? 'RUC' : s.tipoDoc === '1' ? 'DNI' : s.tipoDoc === '4' ? 'Carnet de Extranjería' : s.tipoDoc === '7' ? 'Pasaporte' : '';
        var forma = s.forma === 'credito' ? 'AL CRÉDITO' + (s.vencimiento ? ' (vence el ' + fechaDMY(s.vencimiento) + ')' : '') : 'AL CONTADO';
        return '<div id="rxh-recibo"><div class="cab"><div class="izq">' +
            '<div class="nom">' + esc(emisor.nombre) + '</div>' +
            (emisor.profesion ? '<p>' + esc(emisor.profesion) + '</p>' : '') +
            '<p>' + esc(emisor.direccion || '-') + '</p>' +
            '<p>TELÉFONO: ' + esc(emisor.telefono || '-') + '</p></div>' +
            '<div class="der">R.U.C. ' + esc(emisor.ruc) + '<br><br>RECIBO POR HONORARIOS ELECTRÓNICO' +
            (numero ? '<br><b>Nro: ' + esc(numero) + '</b>' : '') + '</div></div>' +
            '<div class="cuerpo">' +
            '<p>Recibí de ' + esc(s.nombre) + '</p>' +
            (docTxt ? '<p>Identificado con ' + docTxt + ' Número ' + esc(s.numDoc) + '</p>' : '') +
            '<p>Domicilio del Usuario: ' + esc(s.domicilio || '-') + '</p>' +
            '<p>Forma de Pago: ' + forma + '</p>' +
            (s.gratuito === 'si' ? '<p>SERVICIO PRESTADO A TÍTULO GRATUITO</p>' : '<p>La suma de ' + enLetras(imp.bruto, s.moneda) + '</p>') +
            '<p>Por concepto de ' + esc(s.descripcion) + '</p>' +
            '<p>Observación ' + esc(s.observacion || '-') + '</p>' +
            '<p>Inciso "' + s.inciso + '" DEL ARTÍCULO 33 DE LA LEY DEL IMPUESTO A LA RENTA</p>' +
            '<p>Fecha de emisión ' + fechaLarga(s.fecha) + '</p>' +
            (s.forma === 'contado' && s.gratuito !== 'si' && s.pagoTotal === 'si' ? '<p>Medio de pago: ' + esc(s.medioPago) + '</p>' : '') +
            '</div><table class="tot">' +
            '<tr><td>Total por Honorarios</td><td>:</td><td class="v">' + fmt(imp.bruto) + '</td></tr>' +
            '<tr><td>Retención (8 %) IR</td><td>:</td><td class="v">(' + fmt(imp.ret) + ')</td></tr>' +
            '<tr><td>Total Neto Recibido</td><td>:</td><td class="v">' + fmt(imp.neto) + ' ' + mon + '</td></tr></table>' +
            (final ? '<div class="valido">Recibo por Honorarios Electrónico emitido en el SIMULADOR SUNAT (TAXLAB 360). Sin valor tributario real.</div>'
                   : '<div class="borrador">ESTO ES UN BORRADOR, NO TIENE NINGUNA VALIDEZ LEGAL</div>') +
            '</div>';
    }

    function paso3() {
        pintar('emitir',
            '<h2 class="rxh-title">Emisión del Recibo por Honorarios Electrónico</h2>' +
            htmlRecibo(estado, '', false) +
            '<div class="rxh-pregunta">¿Está seguro que desea emitir este Recibo por Honorarios Electrónico?</div>' +
            botones([
                { id: 'rxh-emitir', fn: 'RxH.emitir()', ic: 'fa-check-circle', col: '#2e7d32', t: 'Emitir Recibo' },
                { id: 'rxh-ant3', fn: 'RxH.anterior3()', ic: 'fa-arrow-alt-circle-left', col: '#006699', t: 'Anterior' }
            ]));
    }

    function siguienteNumero() {
        var mapa = leer(CLAVE_CORRELATIVO, {}) || {};
        var ultimo = mapa[emisor.ruc];
        var n = ultimo ? ultimo + 1 : (CORRELATIVO_INICIAL[emisor.ruc] || 1);
        mapa[emisor.ruc] = n;
        guardar(CLAVE_CORRELATIVO, mapa);
        return 'E001-' + String(n).padStart(3, '0');
    }

    function emitir() {
        var btn = $('rxh-emitir');
        if (btn) btn.disabled = true;
        var numero = siguienteNumero();
        var imp = importes(estado);
        var registro = JSON.parse(JSON.stringify(estado));
        registro.numero = numero;
        registro.emisor_ruc = emisor.ruc;
        registro.emisor_nombre = emisor.nombre;
        registro.bruto = imp.bruto; registro.retencion_monto = imp.ret; registro.neto = imp.neto;
        registro.estado = 'EMITIDO';
        registro.emitido_en = new Date().toISOString();
        var lista = leer(CLAVE_EMITIDOS, []) || [];
        lista.push(registro);
        guardar(CLAVE_EMITIDOS, lista);
        estado.ultimo = registro;
        pintar('emitir',
            '<h2 class="rxh-title">Emisión del Recibo por Honorarios Electrónico</h2>' +
            '<div class="rxh-msg info" style="text-align:center;font-size:13px;"><b>El Recibo por Honorarios Electrónico ' + esc(numero) +
            ' ha sido emitido.</b><br>' + (imp.ret > 0
                ? 'El usuario le pagará el neto: la retención de S/ ' + fmt(imp.ret) + ' la declara y paga él como agente de retención en el PDT PLAME (Formulario 0601).'
                : 'El usuario le pagará el total de los honorarios: este recibo no tiene retención.') + '</div>' +
            htmlRecibo(registro, numero, true) +
            botones([
                { id: 'rxh-imp', fn: 'window.print()', ic: 'fa-print', col: '#006699', t: 'Imprimir' },
                { id: 'rxh-otro', fn: 'RxH.ir(\'emitir\')', ic: 'fa-plus-circle', col: '#006699', t: 'Emitir otro recibo' },
                { id: 'rxh-fin', fn: 'RxH.salir()', ic: 'fa-home', col: '#006699', t: 'Ir al inicio' }
            ]));
        if (typeof window.mostrarToastExito === 'function') {
            try { window.mostrarToastExito('¡Recibo por honorarios emitido!', 'Comprobante ' + numero + ' generado en la simulación.'); } catch (e) {}
        }
        if (window.TaxComp) {
            TaxComp.registrar({
                tipo: 'Recibo por Honorarios', numero: numero, fecha: fechaDMY(registro.fecha),
                emisor_ruc: emisor.ruc, emisor: emisor.nombre,
                receptor: registro.nombre, receptor_doc: (registro.tipoDoc === '6' ? 'RUC ' : 'Doc. ') + (registro.numDoc || ''),
                total: 'Neto S/ ' + fmt(imp.neto)
            }, $('rxh-recibo'), $('rxh-main'));
        }
    }

    function consultar() {
        var lista = (leer(CLAVE_EMITIDOS, []) || []).filter(function (r) { return String(r.emisor_ruc) === String(emisor.ruc); });
        var filas = lista.length ? lista.slice().reverse().map(function (r, i) {
            var idx = lista.length - 1 - i;
            return '<tr><td>' + esc(r.numero) + '</td><td>' + fechaDMY(r.fecha) + '</td><td>' + esc(r.nombre) +
                '</td><td style="text-align:right;">' + fmt(r.bruto) + '</td><td style="text-align:right;">' + fmt(r.retencion_monto) +
                '</td><td style="text-align:right;">' + fmt(r.neto) + '</td><td>' + esc(r.estado) +
                '</td><td><a href="#" onclick="RxH.ver(' + idx + '); return false;">Ver</a></td></tr>';
        }).join('') : '<tr><td colspan="8" style="text-align:center;padding:14px;">Aún no ha emitido recibos por honorarios con este RUC.</td></tr>';
        pintar('consultar',
            '<h2 class="rxh-title">Consulta de Recibos por Honorarios Electrónicos emitidos</h2>' +
            '<div style="overflow-x:auto;"><table class="rxh-lista"><tr><th>Número</th><th>Fecha</th><th>Usuario</th><th>Honorario</th>' +
            '<th>Retención</th><th>Neto</th><th>Estado</th><th></th></tr>' + filas + '</table></div>' +
            botones([{ id: 'rxh-nuevo', fn: 'RxH.ir(\'emitir\')', ic: 'fa-plus-circle', col: '#006699', t: 'Emitir Recibo' }]));
    }

    function ver(idx) {
        var lista = (leer(CLAVE_EMITIDOS, []) || []).filter(function (r) { return String(r.emisor_ruc) === String(emisor.ruc); });
        var r = lista[idx];
        if (!r) return consultar();
        pintar('consultar',
            '<h2 class="rxh-title">Recibo por Honorarios Electrónico ' + esc(r.numero) + '</h2>' +
            htmlRecibo(r, r.numero, true) +
            botones([
                { id: 'rxh-imp2', fn: 'window.print()', ic: 'fa-print', col: '#006699', t: 'Imprimir' },
                { id: 'rxh-lista', fn: 'RxH.ir(\'consultar\')', ic: 'fa-arrow-alt-circle-left', col: '#006699', t: 'Regresar' }
            ]));
    }

    // ------------------------------------------------------------------ Formulario 1609
    // Solicitud de suspensión de retenciones y/o pagos a cuenta de 4ta categoría.
    // Procede si los ingresos que proyecta percibir en el año no superan:
    //   · solo rentas de 4ta ............ 8.75 UIT  (2026: S/ 48,125)
    //   · rentas de 4ta + 5ta ........... 7 UIT     (2026: S/ 38,500)
    // (mismo criterio que publica SUNAT cada año: 2025 = S/ 46,813 y S/ 37,450).
    // En el simulador la constancia vale para todo el ejercicio, para que los
    // recibos de enero del caso puedan emitirse sin retención aunque la
    // solicitud se haga en clase meses después.
    var CLAVE_1609 = 'sire_f1609_constancias';
    var UIT = { 2025: 5350, 2026: 5500 };
    var f1609 = null;

    function uitDe(anio) { return UIT[anio] || UIT[Math.max.apply(null, Object.keys(UIT).map(Number))]; }

    function limites1609(anio) {
        var u = uitDe(anio);
        return { uit: u, solo4ta: r2(u * 8.75), con5ta: r2(u * 7) };
    }

    function constancia1609(ruc, anio) {
        var lista = leer(CLAVE_1609, []) || [];
        return lista.filter(function (c) { return String(c.ruc) === String(ruc) && Number(c.anio) === Number(anio) && c.procede; }).pop() || null;
    }

    function montoDe(id) {
        var n = parseFloat(String(($(id) || {}).value || '').replace(/,/g, ''));
        return isNaN(n) ? NaN : n;
    }

    function f1609Cabecera() {
        return '<h2 class="rxh-title" style="text-align:center;">Suspensiones de 4ta Categoría-Formulario 1609</h2>' +
            '<div class="rxh-box"><div class="rxh-sec" style="text-align:center;">Sugerimos leer las instrucciones antes de elaborar su ' +
            '<a href="#" onclick="RxH.instrucciones1609(); return false;">solicitud</a></div>' +
            '<div id="rxh-1609-instr" style="display:none;font-size:12px;padding:8px 12px;line-height:1.5;">' +
            'Puede solicitar la suspensión de las retenciones (8 %) y pagos a cuenta del Impuesto a la Renta de cuarta categoría si ' +
            'los ingresos que proyecta percibir en el año no superan <b>S/ ' + fmt(limites1609(new Date().getFullYear()).solo4ta) +
            '</b> (solo cuarta categoría) o <b>S/ ' + fmt(limites1609(new Date().getFullYear()).con5ta) + '</b> (si además percibe rentas de quinta ' +
            'categoría). Si procede, entregue la constancia a quien le paga los honorarios: ya no le retendrá el 8 %.</div>';
    }

    function f1609Paso1() {
        var anio = new Date().getFullYear();
        var previa = constancia1609(emisor.ruc, anio);
        f1609 = f1609 && f1609.ruc === emisor.ruc ? f1609 : { ruc: emisor.ruc, ing4ta: '', ing5ta: '', inicio: hoyISO() };
        pintar('f1609', f1609Cabecera() +
            (previa ? '<div class="rxh-msg info" style="margin:8px;">Ya tiene una constancia de suspensión del ejercicio ' + anio +
                ' (N° ' + esc(previa.numero) + '). Si presenta una nueva solicitud, la reemplaza.</div>' : '') +
            '<table class="factura-form-table">' +
            '<tr><td class="question-cell">Monto total de ingresos que proyecta percibir por rentas de 4ta durante el presente año:</td>' +
            '<td class="separator-cell"></td><td class="control-cell"><input type="text" id="rxh-1609-4ta" class="factura-input-text rxh-num" inputmode="decimal" value="' + esc(f1609.ing4ta) + '"></td></tr>' +
            '<tr><td class="question-cell">Monto total de ingresos que proyecta percibir por rentas de 5ta durante el presente año:</td>' +
            '<td class="separator-cell"></td><td class="control-cell"><input type="text" id="rxh-1609-5ta" class="factura-input-text rxh-num" inputmode="decimal" value="' + esc(f1609.ing5ta) + '"></td></tr>' +
            '</table><div id="rxh-1609-msg" style="padding:0 8px;"></div></div>' +
            botones([
                { id: 'rxh-1609-ok', fn: 'RxH.aceptar1609a()', ic: 'fa-check-circle', col: '#006699', t: 'Aceptar' },
                { id: 'rxh-1609-limp', fn: 'RxH.limpiar1609a()', ic: 'fa-eraser', col: '#006699', t: 'Limpiar' },
                { id: 'rxh-1609-reg', fn: 'RxH.salir()', ic: 'fa-arrow-alt-circle-left', col: '#006699', t: 'Regresar' }
            ]));
        var i4 = $('rxh-1609-4ta'); if (i4) i4.focus();
    }

    function aceptar1609a() {
        var m4 = montoDe('rxh-1609-4ta'), m5 = montoDe('rxh-1609-5ta');
        if (($('rxh-1609-5ta').value || '').trim() === '') m5 = 0;
        var err = [];
        if (isNaN(m4) || m4 <= 0) err.push('Ingrese el monto de ingresos por rentas de 4ta que proyecta percibir en el año (mayor que cero).');
        if (isNaN(m5) || m5 < 0) err.push('El monto de rentas de 5ta debe ser un número; si no percibe rentas de 5ta, déjelo vacío o en 0.');
        if (err.length) { mensaje('rxh-1609-msg', 'err', err.join('<br>')); return; }
        f1609.ing4ta = fmt(m4); f1609.ing5ta = fmt(m5);
        f1609.m4 = r2(m4); f1609.m5 = r2(m5);
        f1609Paso2();
    }

    function f1609Paso2() {
        var anio = new Date().getFullYear();
        pintar('f1609', f1609Cabecera() +
            '<table class="factura-form-table">' +
            '<tr><td class="question-cell">Fecha en que comienza a percibir ingresos por rentas de 4ta (dd/mm/aaaa):</td>' +
            '<td class="separator-cell"></td><td class="control-cell"><input type="date" id="rxh-1609-inicio" class="factura-input-text" ' +
            'min="' + anio + '-01-01" max="' + anio + '-12-31" value="' + esc(f1609.inicio) + '"></td></tr>' +
            '<tr><td class="question-cell">Fecha actual:</td><td class="separator-cell"></td><td class="control-cell">' + fechaDMY(hoyISO()) + '</td></tr>' +
            '</table><div id="rxh-1609-msg" style="padding:0 8px;"></div></div>' +
            botones([
                { id: 'rxh-1609-ok2', fn: 'RxH.aceptar1609b()', ic: 'fa-check-circle', col: '#006699', t: 'Aceptar' },
                { id: 'rxh-1609-limp2', fn: 'RxH.limpiar1609b()', ic: 'fa-eraser', col: '#006699', t: 'Limpiar' },
                { id: 'rxh-1609-reg2', fn: 'RxH.f1609Paso1()', ic: 'fa-arrow-alt-circle-left', col: '#006699', t: 'Regresar' }
            ]));
    }

    function aceptar1609b() {
        var anio = new Date().getFullYear();
        var ini = $('rxh-1609-inicio').value;
        if (!ini) { mensaje('rxh-1609-msg', 'err', 'Indique la fecha en que comienza a percibir ingresos de 4ta categoría.'); return; }
        if (ini.slice(0, 4) !== String(anio)) { mensaje('rxh-1609-msg', 'err', 'La fecha debe estar dentro del presente año (' + anio + ').'); return; }
        f1609.inicio = ini;
        var lim = limites1609(anio);
        var total = r2(f1609.m4 + f1609.m5);
        var tope = f1609.m5 > 0 ? lim.con5ta : lim.solo4ta;
        var procede = total <= tope;
        var reg = {
            ruc: emisor.ruc, nombre: emisor.nombre, anio: anio, ingreso4ta: f1609.m4, ingreso5ta: f1609.m5,
            total: total, tope: tope, uit: lim.uit, inicio: ini, presentado: hoyISO(), procede: procede,
            numero: String(Date.now()).slice(-9)
        };
        // Una solicitud aceptada reemplaza a las anteriores del año; una que no
        // procede queda registrada pero no anula una constancia ya aceptada.
        var lista = leer(CLAVE_1609, []) || [];
        if (procede) lista = lista.filter(function (c) { return !(String(c.ruc) === String(emisor.ruc) && Number(c.anio) === anio); });
        lista.push(reg);
        guardar(CLAVE_1609, lista);
        f1609 = null;
        f1609Resultado(reg);
        if (window.TaxComp) {
            TaxComp.registrar({
                tipo: 'Constancia Formulario 1609', numero: reg.numero, fecha: fechaDMY(reg.presentado),
                emisor_ruc: emisor.ruc, emisor: emisor.nombre,
                receptor: reg.procede ? 'Suspensión aceptada' : 'Solicitud no procedente', total: 'Proyectado S/ ' + fmt(reg.total)
            }, $('rxh-recibo'), $('rxh-main'));
        }
    }

    function htmlConstancia(c) {
        var base = c.ingreso5ta > 0 ? 'rentas de 4ta y 5ta categoría (7 UIT)' : 'solo rentas de 4ta categoría (8.75 UIT)';
        return '<div id="rxh-recibo"><div style="text-align:center;font-size:15px;margin-bottom:14px;"><b>CONSTANCIA DE ' +
            (c.procede ? 'AUTORIZACIÓN DE SUSPENSIÓN DE RETENCIONES Y/O PAGOS A CUENTA' : 'SOLICITUD DE SUSPENSIÓN NO PROCEDENTE') +
            '</b><br>Impuesto a la Renta - Cuarta Categoría · Formulario Virtual 1609</div>' +
            '<p>Número de orden: <b>' + esc(c.numero) + '</b></p>' +
            '<p>RUC: <b>' + esc(c.ruc) + '</b> · Apellidos y nombres: <b>' + esc(c.nombre) + '</b></p>' +
            '<p>Ejercicio: <b>' + c.anio + '</b> · Fecha de presentación: ' + fechaDMY(c.presentado) + '</p>' +
            '<p>Fecha en que comienza a percibir rentas de 4ta: ' + fechaDMY(c.inicio) + '</p>' +
            '<table class="tot" style="margin-left:0;">' +
            '<tr><td>Ingresos proyectados de 4ta categoría</td><td>:</td><td class="v">S/ ' + fmt(c.ingreso4ta) + '</td></tr>' +
            '<tr><td>Ingresos proyectados de 5ta categoría</td><td>:</td><td class="v">S/ ' + fmt(c.ingreso5ta) + '</td></tr>' +
            '<tr><td><b>Total proyectado</b></td><td>:</td><td class="v"><b>S/ ' + fmt(c.total) + '</b></td></tr>' +
            '<tr><td>Límite para ' + base + ', UIT S/ ' + fmt(c.uit) + '</td><td>:</td><td class="v">S/ ' + fmt(c.tope) + '</td></tr></table>' +
            (c.procede
                ? '<p style="margin-top:12px;">Se autoriza la suspensión de las retenciones y/o pagos a cuenta del Impuesto a la Renta de cuarta ' +
                  'categoría durante el ejercicio ' + c.anio + '. Entregue esta constancia a quien le paga los honorarios: <b>no deberá retenerle el 8 %</b>.</p>'
                : '<p style="margin-top:12px;">No procede la suspensión: sus ingresos proyectados superan el límite. Quien le pague honorarios ' +
                  'por más de S/ 1,500.00 deberá retenerle el 8 %.</p>') +
            '<div class="valido">Constancia generada en el SIMULADOR SUNAT (TAXLAB 360). Sin valor tributario real.</div></div>';
    }

    function f1609Resultado(c) {
        pintar('f1609',
            '<h2 class="rxh-title" style="text-align:center;">Suspensiones de 4ta Categoría-Formulario 1609</h2>' +
            '<div class="rxh-msg ' + (c.procede ? 'info' : 'err') + '" style="text-align:center;font-size:13px;"><b>' +
            (c.procede ? 'Su solicitud fue aceptada.' : 'Su solicitud no procede.') + '</b> ' +
            (c.procede ? 'Ya puede emitir sus recibos por honorarios del ' + c.anio + ' sin retención.'
                       : 'El total proyectado (S/ ' + fmt(c.total) + ') supera el límite de S/ ' + fmt(c.tope) + '.' +
                         (constancia1609(c.ruc, c.anio) ? ' Su constancia anterior del ' + c.anio + ' sigue vigente.' : '')) + '</div>' +
            htmlConstancia(c) +
            botones([
                { id: 'rxh-1609-imp', fn: 'window.print()', ic: 'fa-print', col: '#006699', t: 'Imprimir' },
                { id: 'rxh-1609-rhe', fn: 'RxH.ir(\'emitir\')', ic: 'fa-file-invoice', col: '#006699', t: 'Emitir Recibo por Honorarios' },
                { id: 'rxh-1609-fin', fn: 'RxH.salir()', ic: 'fa-home', col: '#006699', t: 'Ir al inicio' }
            ]));
    }

    function f1609Consulta() {
        var lista = (leer(CLAVE_1609, []) || []).filter(function (c) { return String(c.ruc) === String(emisor.ruc); });
        if (!lista.length) {
            return pintar('f1609-consulta',
                '<h2 class="rxh-title">Consulta de Suspensión de Retenciones de 4ta Categoría</h2>' +
                '<div class="rxh-msg info">No ha presentado el Formulario Virtual 1609 con este RUC.</div>' +
                botones([{ id: 'rxh-1609-nueva', fn: 'RxH.ir(\'f1609\')', ic: 'fa-plus-circle', col: '#006699', t: 'Presentar Formulario 1609' }]));
        }
        // Se muestra la constancia vigente del año; si no hay, la última solicitud
        f1609Resultado(constancia1609(emisor.ruc, new Date().getFullYear()) || lista[lista.length - 1]);
        $('rxh-sidebar').innerHTML = menuLateral('f1609-consulta');
    }

    // ------------------------------------------------------------------ API
    async function abrir(vista) {
        asegurarVista();
        var cont = $('tramites-content-container');
        if (cont) cont.style.display = 'none';
        ['emitir-boleta-wrapper', 'emitir-factura-wrapper', 'emitir-nota-credito-wrapper'].forEach(function (id) {
            if ($(id)) $(id).style.display = 'none';
        });
        $('rxh-wrapper').style.display = 'block';
        $('rxh-main').innerHTML = '<p style="padding:20px;">Cargando...</p>';
        emisor = await cargarEmisor();
        if (!/^1[057]\d{9}$/.test(String(emisor.ruc || ''))) return pantallaNoPersona(vista);
        if (vista === 'consultar') return consultar();
        if (vista === 'f1609') return f1609Paso1();
        if (vista === 'f1609-consulta') return f1609Consulta();
        estado = nuevoEstado();
        paso1();
    }

    function salir() {
        if ($('rxh-wrapper')) $('rxh-wrapper').style.display = 'none';
        var cont = $('tramites-content-container');
        if (cont) cont.style.display = 'flex';
        // Vuelve a la pestaña que corresponde a la Clave SOL
        if (window.RxH && RxH.pestana) RxH.pestana(/^1[057]\d{9}$/.test(empresaActiva().ruc) ? 'personas' : 'empresas');
        window.scrollTo(0, 0);
    }

    window.RxH = {
        abrir: abrir,
        ir: function (v) { abrir(v); },
        salir: salir,
        cambioTipoDoc: function () { estado.tipoDoc = $('rxh-tipo-doc').value; aplicarTipoDoc(true); mensaje('rxh-msg1', '', ''); },
        cambioNumDoc: function () {
            var t = $('rxh-tipo-doc').value;
            if ((t === '6' || t === '1') && (estado.validado || estado.manual)) {
                estado.validado = false; estado.manual = false; $('rxh-nombre').value = '';
            }
            aplicarTipoDoc(false);
        },
        cambioNombre: function () {
            var t = $('rxh-tipo-doc').value;
            var n = $('rxh-num-doc').value.trim();
            if (!$('rxh-nombre').readOnly) {
                estado.validado = !!$('rxh-nombre').value.trim() &&
                    (t === '1' ? /^\d{8}$/.test(n) : t === '6' ? /^\d{11}$/.test(n) : true);
            }
            aplicarTipoDoc(false);
        },
        validar: validar,
        continuar1: continuar1,
        refrescar2: refrescar2,
        formatearMonto: formatearMonto,
        anterior2: anterior2,
        continuar2: continuar2,
        anterior3: function () { paso2(); },
        emitir: emitir,
        ver: ver,
        f1609Paso1: f1609Paso1,
        aceptar1609a: aceptar1609a,
        aceptar1609b: aceptar1609b,
        limpiar1609a: function () { $('rxh-1609-4ta').value = ''; $('rxh-1609-5ta').value = ''; mensaje('rxh-1609-msg', '', ''); },
        limpiar1609b: function () { $('rxh-1609-inicio').value = ''; mensaje('rxh-1609-msg', '', ''); },
        instrucciones1609: function () { var d = $('rxh-1609-instr'); if (d) d.style.display = d.style.display === 'none' ? 'block' : 'none'; },
        _limites1609: limites1609,
        // expuesto para pruebas
        _enLetras: enLetras
    };
    window.showEmitirRxH = function () { abrir('emitir'); };

    // ======================================================================
    // Pestaña "Personas" del menú SOL (como en SUNAT Operaciones en Línea).
    // Ahí vive el Recibo por Honorarios Electrónicos. Si la Clave SOL es de
    // una persona natural (RUC 10) se abre esta pestaña por defecto.
    // ======================================================================
    var NO_IMPL = "alert('EN PROCESO DE IMPLEMENTACION'); return false;";

    function hoja(txt, onclick) {
        return '<li><a href="#" onclick="' + (onclick || NO_IMPL) + '"><i class="fas fa-caret-right"></i> ' + txt + '</a></li>';
    }
    function rama(txt, hijos, implementado, abierto) {
        return '<li class="has-submenu' + (abierto ? ' open' : '') + '"><a href="#" class="rxh-toggle' + (implementado ? ' menu-item-implemented' : '') + '">' +
            '<i class="fas ' + (abierto ? 'fa-caret-down' : 'fa-caret-right') + '"></i> ' + txt + '</a><ul class="submenu-list">' + hijos.join('') + '</ul></li>';
    }
    function hojaFinal(txt, onclick) {
        return '<li><a href="#" onclick="' + (onclick || NO_IMPL) + '">' + txt + '</a></li>';
    }

    function menuPersonasHTML() {
        var rhe = '<li class="has-submenu"><a href="#" class="rxh-toggle menu-item-implemented"><i class="fas fa-caret-right"></i> Recibo por Honorarios Electrónicos</a>' +
            '<ul class="submenu-list last-level">' +
            hojaFinal('Emitir Recibo por Honorario Electrónico', "RxH.ir('emitir'); return false;") +
            hojaFinal('Emitir Nota de Crédito Electrónica') +
            hojaFinal('Registrar Recibo por Honorario Físico') +
            hojaFinal('Registrar Nota de Crédito Física') +
            hojaFinal('Registrar Pagos') +
            hojaFinal('Registrar Otros Ingresos de Cuarta Categoria') +
            hojaFinal('Revertir Recibo por Honorario Electrónico') +
            hojaFinal('Dar de Baja al Registro de Recibo por Honorario Físico') +
            hojaFinal('Dar de Baja al Registro de Nota de Crédito Física') +
            hojaFinal('Consultas', "RxH.ir('consultar'); return false;") +
            '</ul></li>';
        var col1 = [
            rama('Mi RUC y Otros Registros', [hoja('Mis Datos del RUC'), hoja('Actualizo información de mi RUC'), hoja('Reporte Tributario y Aduanero')]),
            rama('Perfil de Cumplimiento', [hoja('Consulta de Perfil de Cumplimiento')]),
            rama('Propuesta información para declaración jurada', [hoja('Renta Anual Personas')]),
            rama('Comprobantes de pago', [
                hoja('Comprobantes de Pago'),
                hoja('Comprobantes de Pago Físico'),
                rama('SEE - SOL', [rhe, hoja('Consulta de Validez de Comprobante de Pago')], true, true),
                hoja('Liquidación de Compra')
            ], true, true)
        ];
        var col2 = [
            rama('Sistema Integrado de Registros Electronicos', [hoja('Registros Electronicos')]),
            rama('Mis declaraciones informativas', [hoja('Declaraciones informativas')]),
            rama('Otras declaraciones y solicitudes', [
                hoja('Form. 1609 Solicitud de Suspensión Retenciones 4ta Cat.', "RxH.ir('f1609'); return false;"),
                hoja('Consulta de Suspensión de Retenciones 4ta Cat.', "RxH.ir('f1609-consulta'); return false;")
            ], true),
            rama('Ventanilla de Atención al Operador', [hoja('Ventanilla')]),
            rama('Observaciones realizadas por SUNAT', [hoja('Consulta de observaciones')])
        ];
        return '<div class="menu-col"><ul class="menu-list">' + col1.join('') + '</ul></div>' +
            '<div class="menu-col"><ul class="menu-list">' + col2.join('') + '</ul></div>';
    }

    function pestana(cual) {
        var emp = $('menu-columns-container'), per = $('menu-personas-container');
        if (!emp || !per) return;
        // Si estaba abierto un formulario de emisión, se vuelve al menú
        if ($('rxh-wrapper')) $('rxh-wrapper').style.display = 'none';
        var cont = $('tramites-content-container');
        if (cont && cont.style.display === 'none') cont.style.display = 'flex';
        emp.style.display = cual === 'empresas' ? 'flex' : 'none';
        per.style.display = cual === 'personas' ? 'flex' : 'none';
        var lis = document.querySelectorAll('.tramites-sidebar .sidebar-menu > li');
        lis.forEach(function (li, i) {
            var on = (i === 0 && cual === 'personas') || (i === 1 && cual === 'empresas');
            li.classList.toggle('active', on);
            var a = li.querySelector('a'), flecha = a && a.querySelector('.arrow-right');
            if (on && a && !flecha) a.insertAdjacentHTML('beforeend', ' <i class="fas fa-chevron-right arrow-right"></i>');
            if (!on && flecha) flecha.remove();
        });
    }

    function initPersonas() {
        var emp = $('menu-columns-container');
        if (!emp || $('menu-personas-container')) return;
        var per = document.createElement('div');
        per.className = 'menu-columns';
        per.id = 'menu-personas-container';
        per.style.display = 'none';
        per.innerHTML = menuPersonasHTML();
        emp.parentNode.insertBefore(per, emp.nextSibling);
        per.addEventListener('click', function (e) {
            var t = e.target.closest('.rxh-toggle');
            if (!t) return;
            e.preventDefault();
            var li = t.parentElement, ic = t.querySelector('i');
            li.classList.toggle('open');
            if (ic) { ic.classList.toggle('fa-caret-down', li.classList.contains('open')); ic.classList.toggle('fa-caret-right', !li.classList.contains('open')); }
        });
        var lis = document.querySelectorAll('.tramites-sidebar .sidebar-menu > li > a');
        if (lis[0]) lis[0].setAttribute('onclick', "RxH.pestana('personas'); return false;");
        if (lis[1]) lis[1].setAttribute('onclick', "RxH.pestana('empresas'); return false;");
        if (/^1[057]\d{9}$/.test(empresaActiva().ruc)) pestana('personas');
    }

    window.RxH.pestana = pestana;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPersonas);
    else initPersonas();
})();
