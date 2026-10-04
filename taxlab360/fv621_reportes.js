// =============================================================================
// FV 621 · Reportes de la declaración presentada
// -----------------------------------------------------------------------------
// En "Resumen de Transacciones" (constancia del 621):
//   · Ver detalle      -> Detalle de casillas (PDT IGV - Renta Mensual, 2 páginas)
//   · Ver constancia   -> Constancia Formulario - 0621
//   · Ver todas las constancias -> la misma constancia (es el único formulario)
// Se muestran en una ventana como la de SUNAT, con Guardar (descarga el PDF),
// Imprimir y Enviar. Los datos se toman en el momento de presentar, así que
// no cambian aunque el alumno vuelva a editar el formulario.
// Se carga al final de declaraciones.html.
// =============================================================================
(function () {
    'use strict';

    // Casillas que se copian al presentar
    const CASILLAS = [100, 101, 102, 103, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117,
        119, 120, 122, 127, 131, 140, 145, 154, 155, 156, 157, 164, 165, 168, 171, 173, 176, 178, 179, 184,
        185, 187, 188, 189, 301, 302, 303, 304, 305, 307, 312, 315, 317, 319, 324, 326, 327, 328, 336, 380,
        681, 682, 894];
    const CON_4_DECIMALES = { 173: true, 380: true, 894: true };

    // ------------------------------------------------------------ captura
    function texto(id) {
        const el = document.getElementById(id);
        return el ? String(el.textContent || '').trim() : '';
    }

    function numero(raw) {
        let s = String(raw == null ? '' : raw).replace(/,/g, '').replace(/S\/\.?/i, '').trim();
        let neg = false;
        if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
        const n = parseFloat(s);
        if (isNaN(n)) return null;
        return neg ? -n : n;
    }

    function capturar(total, pagado) {
        const cas = {};
        CASILLAS.forEach(n => {
            const el = document.getElementById('c' + n);
            if (el && String(el.value).trim() !== '') cas[n] = el.value;
        });
        const selTipo = document.getElementById('tipo-declaracion');
        let tributo = ['3121', 'RENTA - REGIMEN MYPE TRIBUTARIO'];
        try { if (typeof tributoRenta === 'function') tributo = tributoRenta(); } catch (e) {}
        // Empresa elegida en la Clave SOL; si no hay, lo que muestra la constancia
        let emp = {};
        try { emp = JSON.parse(sessionStorage.getItem('sunat_empresa') || 'null') || {}; } catch (e) {}
        let ruc = '';
        try { if (typeof rucDeclarante === 'function') ruc = rucDeclarante() || ''; } catch (e) {}
        const ahora = new Date();
        return {
            ruc: ruc || emp.ruc || texto('const-ruc'),
            razon: emp.razon_social || texto('const-nombre'),
            periodo: texto('const-periodo'),
            orden: texto('const-orden'),
            fecha: texto('const-fecha-pres'),
            hora: ahora.toLocaleTimeString('es-PE', { hour12: false }),
            tipo: selTipo && selTipo.value ? selTipo.options[selTipo.selectedIndex].text : 'Original',
            tributoRenta: tributo,
            total: Number(total) || 0,
            pagado: Number(pagado) || 0,
            cas: cas
        };
    }

    // Se engancha a la función que llena el Resumen de Transacciones
    function enganchar() {
        if (typeof window.llenarResumenTransacciones !== 'function') return;
        const original = window.llenarResumenTransacciones;
        window.llenarResumenTransacciones = function (total, pagado) {
            const r = original.apply(this, arguments);
            try { window.__decl621 = capturar(total, pagado); } catch (e) { console.warn(e); }
            return r;
        };
    }

    function datos() {
        return window.__decl621 || capturar(numero(texto('const-monto')) || 0, numero(texto('const-monto-pagado')) || 0);
    }

    // ------------------------------------------------------------ formato
    function fmt(n, dec) {
        return Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    }
    function valor(d, n) {
        if (!(n in d.cas)) return '';
        const v = numero(d.cas[n]);
        if (v === null) return esc(d.cas[n]);
        return fmt(v, CON_4_DECIMALES[n] ? 4 : 2);
    }
    function num(d, n) { const v = numero(d.cas[n]); return v === null ? 0 : v; }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    // Celdas casilla + importe. n vacío = celda sin casilla (gris)
    function par(d, n) {
        if (!n) return '<td class="r6-sin" colspan="2"></td>';
        return '<td class="r6-cod">' + n + '</td><td class="r6-val">' + valor(d, n) + '</td>';
    }

    // ------------------------------------------------------- detalle (2 pág)
    function cabecera(d, pagina) {
        return '' +
            '<table class="r6-cab">' +
            '<tr><td class="r6-logo" rowspan="5"><div class="r6-sunat">SUNAT</div><div>DECLARACIÓN PAGO</div><div class="r6-form">0621</div></td>' +
            '<td colspan="4" class="r6-tit">PDT IGV - RENTA MENSUAL</td>' +
            '<td class="r6-copia" rowspan="5">Copia para el contribuyente<br>(Pag. ' + pagina + ')</td></tr>' +
            '<tr><td class="r6-k">RUC</td><td colspan="3">' + esc(d.ruc) + '</td></tr>' +
            '<tr><td class="r6-k">Razón Social</td><td>' + esc(d.razon) + '</td><td class="r6-k">Período</td><td class="r6-c">' + esc(d.periodo) + '</td></tr>' +
            '<tr><td class="r6-k">Número de Orden</td><td>' + esc(d.orden) + '</td><td class="r6-k">Fecha de Presentación</td><td class="r6-c">' + esc(d.fecha) + '</td></tr>' +
            '<tr><td class="r6-k">Tipo de Declaración</td><td>' + esc(d.tipo) + '</td><td class="r6-k">Tipo de Moneda</td><td class="r6-c">Soles</td></tr>' +
            '</table>';
    }

    function encabezadoBloque(titulo, columna) {
        return '<tr><td class="r6-bloque" colspan="2" rowspan="2">' + titulo + '</td>' +
            '<td colspan="4" class="r6-hcol">' + columna + '</td></tr>' +
            '<tr><td colspan="2" class="r6-hsub">BASE</td><td colspan="2" class="r6-hsub">TRIBUTO</td></tr>';
    }

    function fila(d, etiqueta, nBase, nTrib, extra) {
        return '<tr' + (extra || '') + '><td colspan="2" class="r6-desc">' + etiqueta + '</td>' +
            (nBase ? par(d, nBase) : '<td class="r6-sin" colspan="2"></td>') +
            (nTrib ? par(d, nTrib) : '<td class="r6-sin" colspan="2"></td>') + '</tr>';
    }

    function paginaDetalle1(d) {
        const ventas =
            encabezadoBloque('IGV VENTAS', 'IGV CUENTA PROPIA') +
            '<tr><td class="r6-grupo" rowspan="7"><span>Gravadas</span></td><td class="r6-desc">Ventas Netas</td>' + par(d, 100) + par(d, 101) + '</tr>' +
            '<tr><td class="r6-desc">Ventas Netas Gravadas Ley N° 31556 y modificatorias</td>' + par(d, 154) + par(d, 155) + '</tr>' +
            '<tr><td class="r6-desc">Descuentos Concedidos y/o devoluciones de Ventas</td>' + par(d, 102) + par(d, 103) + '</tr>' +
            '<tr><td class="r6-desc">Ventas de bienes (ley 27037 inc. 11.1, 12.1, 12.3 y 12.4)</td><td class="r6-cod">160</td><td class="r6-val"></td><td class="r6-cod">161</td><td class="r6-val"></td></tr>' +
            '<tr><td class="r6-desc">Descuentos y devoluciones (ley 27037)</td><td class="r6-cod">162</td><td class="r6-val"></td><td class="r6-cod">163</td><td class="r6-val"></td></tr>' +
            '<tr><td class="r6-desc">Exportaciones · Facturadas en el período</td>' + par(d, 106) + '<td class="r6-sin" colspan="2"></td></tr>' +
            '<tr><td class="r6-desc">Exportaciones · Embarcadas en el período</td>' + par(d, 127) + '<td class="r6-sin" colspan="2"></td></tr>' +
            fila(d, 'Ventas no Gravadas (Sin Considerar exportaciones)', 105, null) +
            fila(d, 'Ventas no Gravadas (Sin efecto en ratio)', 109, null) +
            fila(d, 'Otras ventas (inciso ii), numeral 6.2 - art. 6 del Reglamento', 112, null) +
            '<tr class="r6-tot"><td colspan="2" class="r6-desc">Total</td><td class="r6-sin" colspan="2"></td>' + par(d, 131) + '</tr>';

        const compras =
            encabezadoBloque('IGV COMPRAS', 'IGV CUENTA PROPIA') +
            '<tr><td class="r6-grupo" rowspan="4"><span>Nacionales</span></td><td class="r6-desc">Compras netas destinada a ventas gravadas exclusivamente</td>' + par(d, 107) + par(d, 108) + '</tr>' +
            '<tr><td class="r6-desc">Compras Netas destinadas a Vtas Gravadas Ley N° 31556 y modificatorias</td>' + par(d, 156) + par(d, 157) + '</tr>' +
            '<tr><td class="r6-desc">Compras netas destinada a ventas gravadas y no gravadas</td>' + par(d, 110) + par(d, 111) + '</tr>' +
            '<tr><td class="r6-desc">Compras netas destinada a ventas no gravadas exclusivamente</td>' + par(d, 113) + '<td class="r6-sin" colspan="2"></td></tr>' +
            '<tr><td class="r6-grupo" rowspan="3"><span>Importadas</span></td><td class="r6-desc">Compras netas destinada a ventas gravadas exclusivamente</td>' + par(d, 114) + par(d, 115) + '</tr>' +
            '<tr><td class="r6-desc">Compras netas destinada a ventas gravadas y no gravadas</td>' + par(d, 116) + par(d, 117) + '</tr>' +
            '<tr><td class="r6-desc">Compras netas destinada a ventas no gravadas exclusivamente</td>' + par(d, 119) + '<td class="r6-sin" colspan="2"></td></tr>' +
            fila(d, 'Compras internas no gravadas', 120, null) +
            fila(d, 'Compras importadas no gravadas', 122, null) +
            '<tr class="r6-tot"><td colspan="2" class="r6-desc">TOTAL</td><td class="r6-sin" colspan="2"></td>' + par(d, 178) + '</tr>' +
            '<tr><td colspan="2" class="r6-desc">CRÉDITO FISCAL ESPECIAL</td><td class="r6-sin" colspan="2"></td><td class="r6-cod">172</td><td class="r6-val"></td></tr>' +
            fila(d, 'COEFICIENTE', 173, null);

        const ivap =
            encabezadoBloque('IVAP', 'IVAP') +
            '<tr><td colspan="2" class="r6-desc">Ventas Gravadas</td><td class="r6-cod">340</td><td class="r6-val"></td><td class="r6-cod">341</td><td class="r6-val"></td></tr>' +
            '<tr><td colspan="2" class="r6-desc">Otros Créditos IVAP</td><td class="r6-sin" colspan="2"></td><td class="r6-cod">182</td><td class="r6-val"></td></tr>';

        const renta =
            encabezadoBloque('RENTA', 'RENTA') +
            fila(d, 'Ingresos Netos', 301, 312) +
            fila(d, 'Coeficiente', 380, null) +
            fila(d, 'Porcentaje', 315, null) +
            fila(d, 'Coeficiente Calculado (aplicado para el Cálculo de la Cas312)', 894, null) +
            fila(d, 'Pagos a Cuenta en Exceso del Presente Ejercicio', null, 336);

        return '<div class="r6-pag">' + cabecera(d, 1) +
            '<table class="r6-t">' + ventas + '</table>' +
            '<table class="r6-t">' + compras + '</table>' +
            '<table class="r6-t">' + ivap + '</table>' +
            '<table class="r6-t">' + renta + '</table></div>';
    }

    function paginaDetalle2(d) {
        const F = (etq, a, b, c) => '<tr><td class="r6-desc">' + etq + '</td>' +
            (a ? par(d, a) : '<td class="r6-sin" colspan="2"></td>') +
            (b ? '<td class="r6-cod">' + b + '</td><td class="r6-val"></td>' : '<td class="r6-sin" colspan="2"></td>') +
            (c ? par(d, c) : '<td class="r6-sin" colspan="2"></td>') + '</tr>';
        const filas =
            '<tr><td class="r6-bloque" rowspan="2">DETERMINACIÓN DE LA DEUDA</td><td colspan="6" class="r6-hcol">DETERMINACIÓN DE LA DEUDA</td></tr>' +
            '<tr><td colspan="2" class="r6-hsub">IGV</td><td colspan="2" class="r6-hsub">IVAP</td><td colspan="2" class="r6-hsub">RENTA</td></tr>' +
            F('Impuesto Resultante o Saldo a Favor', 140, 353, 302) +
            F('Saldo a Favor del Período anterior', 145, 351, 303) +
            F('Tributo a Pagar o Saldo a Favor', 184, 352, 304) +
            F('Percepciones declaradas en el período', 171) +
            F('Saldo de percepciones de periodos anteriores', 168) +
            F('Saldo de percepciones no aplicadas', 164) +
            F('Retenciones declaradas en el período', 179) +
            F('Saldo de retenciones de periodos anteriores', 176) +
            F('Saldo de Retenciones no aplicadas', 165) +
            F('Retenciones de tercera declaradas en período', null, null, 326) +
            F('Retenciones de tercera declaradas en periodos anteriores', null, null, 327) +
            F('Compensación Saldo a Favor del Exportador', null, 347, 305) +
            F('Impuesto Temporal a los Activos Netos', null, null, 328) +
            F('Sub Total', 681, 683, 682) +
            F('Pagos previos', 185, 342, 317) +
            F('Interés moratorio', 187, 343, 319) +
            '<tr class="r6-tot">' + F('Total deuda tributaria', 188, 344, 324).slice(4);
        return '<div class="r6-pag">' + cabecera(d, 2) + '<table class="r6-t r6-deuda">' + filas + '</table></div>';
    }

    // ------------------------------------------------------------ constancia
    function paginaConstancia(d) {
        const igvDeuda = num(d, 188), rentaDeuda = num(d, 324);
        const pagoIgv = d.pagado > 0 ? num(d, 189) : 0;
        const pagoRenta = d.pagado > 0 ? num(d, 307) : 0;
        const s = n => 'S/. ' + fmt(n, 0);
        const tribRenta = d.tributoRenta || ['3121', 'RENTA - REGIMEN MYPE TRIBUTARIO'];

        const pendientes = [];
        if (igvDeuda - pagoIgv > 0 || !d.pagado) pendientes.push([d.periodo, '1011 IGV - OPER. INT. - CTA.', igvDeuda - pagoIgv]);
        if (rentaDeuda - pagoRenta > 0 || !d.pagado) pendientes.push([d.periodo, tribRenta[0] + ' ' + tribRenta[1], rentaDeuda - pagoRenta]);
        const debe = pendientes.some(p => p[2] > 0);

        const cajaPago = debe
            ? '<div class="r6c-caja"><p>Usted no ha realizado el pago de la deuda, recuerde que deberá cancelar el saldo deudor de la declaración presentada consignando los siguientes datos:</p>' +
              '<table class="r6c-t"><tr><th>Periodo</th><th>Tributos</th><th>Deuda</th></tr>' +
              pendientes.map(p => '<tr><td>' + esc(p[0]) + '</td><td>' + esc(p[1]) + '</td><td class="r6-der">' + s(Math.max(0, p[2])) + '</td></tr>').join('') +
              '</table></div>'
            : '<div class="r6c-caja"><p>Usted ha realizado el pago total de la deuda de la declaración presentada por <strong>' + s(d.pagado) + '</strong>.</p></div>';

        return '<div class="r6-pag r6c">' +
            '<div class="r6c-top"><span class="r6c-tit">Constancia Formulario - 0621</span><span class="r6c-fecha">Fecha: &nbsp; ' + esc(d.fecha) + ' ' + esc(d.hora) + '</span></div>' +
            '<fieldset class="r6c-fs"><legend>Identificación de la Transacción:</legend>' +
                '<p>Número de Formulario : &nbsp;0621</p><p>Número de Orden : &nbsp;' + esc(d.orden) + '</p><p>Fecha de presentación : ' + esc(d.fecha) + '</p></fieldset>' +
            '<fieldset class="r6c-fs r6c-alto"><legend>Datos de la Declaración:</legend>' +
                '<p>RUC : &nbsp;' + esc(d.ruc) + '</p><p>Nombre o Razón Social : ' + esc(d.razon) + '</p><p>Período : ' + esc(d.periodo) + '</p>' +
                '<p>Semana : &nbsp;&nbsp;0</p><p>Tipo de Declaración : &nbsp;' + esc(d.tipo) + '</p></fieldset>' +
            '<fieldset class="r6c-fs"><legend>Detalle de Tributos:</legend>' +
                '<table class="r6c-t r6c-trib"><tr><th>Tributos</th><th>Total Deuda</th><th>Monto Pago</th></tr>' +
                '<tr><td>1011 &nbsp;&nbsp;&nbsp; IGV - OPER. INT. - CTA. PROPIA</td><td class="r6-der">' + s(igvDeuda) + '</td><td class="r6-der">' + s(pagoIgv) + '</td></tr>' +
                '<tr><td>' + esc(tribRenta[0]) + ' &nbsp;&nbsp;&nbsp; ' + esc(tribRenta[1]) + '</td><td class="r6-der">' + s(rentaDeuda) + '</td><td class="r6-der">' + s(pagoRenta) + '</td></tr>' +
                '<tr><td>Total a Pagar</td><td class="r6-der">' + s(igvDeuda + rentaDeuda) + '</td><td class="r6-der">' + s(pagoIgv + pagoRenta) + '</td></tr></table>' +
            '</fieldset>' + cajaPago + '</div>';
    }

    // ---------------------------------------------------------------- estilos
    const CSS_REPORTE = `
        .r6-pag { background:#fff; width:780px; margin:0 auto 18px; padding:22px 24px 30px; box-sizing:border-box;
                  font:10.5px/1.25 Arial, Helvetica, sans-serif; color:#000; box-shadow:0 1px 4px rgba(0,0,0,.15); }
        .r6-pag table { border-collapse:collapse; width:100%; }
        .r6-pag td, .r6-pag th { border:1px solid #000; padding:2px 5px; }
        .r6-cab { margin-bottom:22px; }
        .r6-logo { width:130px; text-align:center; font-size:11px; }
        .r6-sunat { font-size:19px; font-weight:bold; margin-bottom:4px; }
        .r6-form { font-size:12px; font-weight:bold; margin-top:6px; }
        .r6-tit { text-align:center; font-weight:bold; font-size:10px; height:24px; }
        .r6-copia { width:95px; text-align:center; font-size:8.5px; }
        .r6-k { width:95px; }
        .r6-c { text-align:center; }
        .r6-t { margin-bottom:16px; }
        .r6-bloque { border:none !important; font-weight:bold; vertical-align:bottom; padding:0 0 3px 0 !important; }
        .r6-hcol, .r6-hsub { text-align:center; }
        .r6-grupo { width:16px; padding:0 !important; text-align:center; font-weight:bold; font-size:8.5px; }
        .r6-grupo span { writing-mode:vertical-rl; transform:rotate(180deg); }
        .r6-desc { }
        .r6-cod { width:30px; text-align:left; }
        .r6-val { width:90px; text-align:center; }
        .r6-sin { border:none !important; }
        .r6-deuda .r6-val { width:78px; }
        .r6-tot td { font-weight:normal; }
        .r6-der { text-align:right; }
        .r6c { font-size:11.5px; }
        .r6c-top { display:flex; justify-content:center; position:relative; margin-bottom:10px; }
        .r6c-tit { font-size:12.5px; }
        .r6c-fecha { position:absolute; right:0; top:0; font-size:10px; }
        .r6c-fs { border:1px solid #000; margin:0 0 22px; padding:8px 20px 12px; }
        .r6c-fs legend { padding:0 4px; font-size:11.5px; }
        .r6c-fs p { margin:7px 0; }
        .r6c-alto { min-height:150px; }
        .r6c-t { width:92% !important; margin:6px auto; }
        .r6c-t th { background:#4BACC6; color:#000; text-align:left; font-weight:normal; }
        .r6c-trib th:nth-child(1) { width:55%; }
        .r6c-caja { border:1px solid #000; padding:12px 20px 26px; }
        .r6c-caja p { margin:0 0 12px; }
        .r6c-caja .r6c-t { width:100% !important; }
    `;

    const CSS_VENTANA = `
        .r6v-fondo { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:1000002; display:flex; align-items:flex-start;
                     justify-content:center; padding:30px 12px; overflow:auto; }
        .r6v-caja { background:#fff; border-radius:6px; width:min(880px, 100%); box-shadow:0 10px 40px rgba(0,0,0,.35); }
        .r6v-barra { display:flex; align-items:center; gap:6px; padding:12px 16px; border-bottom:1px solid #e5e5e5; position:sticky; top:0; background:#fff; border-radius:6px 6px 0 0; z-index:1; flex-wrap:wrap; }
        .r6v-barra button.r6v-btn { background:#337ab7; color:#fff; border:none; border-radius:3px; padding:7px 13px; font:14px 'Roboto', Arial, sans-serif; cursor:pointer; }
        .r6v-barra button.r6v-btn:hover { background:#286090; }
        .r6v-barra button.r6v-btn:disabled { opacity:.6; cursor:wait; }
        .r6v-titulo { margin-left:10px; font:500 14px 'Roboto', Arial, sans-serif; color:#555; }
        .r6v-cerrar { margin-left:auto; background:none; border:none; font-size:24px; color:#999; cursor:pointer; line-height:1; }
        .r6v-cerrar:hover { color:#333; }
        .r6v-cuerpo { padding:18px; background:#f3f3f3; overflow-x:auto; border-radius:0 0 6px 6px; }
    `;

    function asegurarEstilos() {
        if (document.getElementById('r6-estilos')) return;
        const st = document.createElement('style');
        st.id = 'r6-estilos';
        st.textContent = CSS_REPORTE + CSS_VENTANA;
        document.head.appendChild(st);
    }

    // ---------------------------------------------------------------- ventana
    function cargarScript(src) {
        return new Promise((ok, mal) => {
            if (document.querySelector('script[src="' + src + '"]')) return ok();
            const s = document.createElement('script');
            s.src = src;
            s.onload = () => ok();
            s.onerror = () => mal(new Error('No se pudo cargar ' + src));
            document.head.appendChild(s);
        });
    }

    async function guardarPDF(cuerpo, nombre, boton) {
        boton.disabled = true;
        const textoOriginal = boton.innerHTML;
        boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
        try {
            await cargarScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            await cargarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            const pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
            const paginas = cuerpo.querySelectorAll('.r6-pag');
            for (let i = 0; i < paginas.length; i++) {
                const lienzo = await window.html2canvas(paginas[i], { scale: 2, backgroundColor: '#ffffff' });
                const ancho = 210, alto = Math.min(297, lienzo.height * ancho / lienzo.width);
                if (i > 0) pdf.addPage();
                pdf.addImage(lienzo.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, ancho, alto);
            }
            pdf.save(nombre);
        } catch (e) {
            alert('No se pudo generar el PDF (revisa tu conexión a internet). Puedes usar Imprimir y elegir "Guardar como PDF".');
        } finally {
            boton.disabled = false;
            boton.innerHTML = textoOriginal;
        }
    }

    function imprimir(html) {
        const marco = document.createElement('iframe');
        marco.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
        document.body.appendChild(marco);
        const doc = marco.contentWindow.document;
        doc.open();
        doc.write('<!doctype html><html><head><meta charset="utf-8"><title>Reporte 0621</title><style>' + CSS_REPORTE +
            ' body{margin:0} .r6-pag{box-shadow:none;margin:0 auto;page-break-after:always} @page{size:A4;margin:8mm}</style></head><body>' +
            html + '</body></html>');
        doc.close();
        setTimeout(() => {
            marco.contentWindow.focus();
            marco.contentWindow.print();
            setTimeout(() => marco.remove(), 1500);
        }, 300);
    }

    function abrirVentana(titulo, html, archivo) {
        asegurarEstilos();
        cerrarVentana();
        const fondo = document.createElement('div');
        fondo.className = 'r6v-fondo';
        fondo.id = 'r6v-fondo';
        fondo.innerHTML =
            '<div class="r6v-caja" role="dialog" aria-label="' + esc(titulo) + '">' +
                '<div class="r6v-barra">' +
                    '<button type="button" class="r6v-btn" data-acc="guardar"><i class="fas fa-file-download"></i> Guardar</button>' +
                    '<button type="button" class="r6v-btn" data-acc="imprimir"><i class="fas fa-print"></i> Imprimir</button>' +
                    '<button type="button" class="r6v-btn" data-acc="enviar"><i class="fas fa-envelope"></i> Enviar</button>' +
                    '<span class="r6v-titulo">' + esc(titulo) + '</span>' +
                    '<button type="button" class="r6v-cerrar" data-acc="cerrar" title="Cerrar">&times;</button>' +
                '</div>' +
                '<div class="r6v-cuerpo">' + html + '</div>' +
            '</div>';
        document.body.appendChild(fondo);
        const cuerpo = fondo.querySelector('.r6v-cuerpo');
        fondo.addEventListener('click', e => {
            if (e.target === fondo) return cerrarVentana();
            const b = e.target.closest('button[data-acc]');
            if (!b) return;
            const acc = b.getAttribute('data-acc');
            if (acc === 'cerrar') cerrarVentana();
            else if (acc === 'imprimir') imprimir(html);
            else if (acc === 'guardar') guardarPDF(cuerpo, archivo, b);
            else if (acc === 'enviar') alert('En el simulador no se envían correos. Usa "Guardar" para descargar el PDF y adjúntalo donde lo necesites.');
        });
        document.addEventListener('keydown', escCerrar);
    }

    function escCerrar(e) { if (e.key === 'Escape') cerrarVentana(); }

    function cerrarVentana() {
        const f = document.getElementById('r6v-fondo');
        if (f) f.remove();
        document.removeEventListener('keydown', escCerrar);
    }

    // ------------------------------------------------------------ API pública
    function nombreArchivo(d, tipo) {
        return tipo + '_0621_' + (d.ruc || 'RUC') + '_' + (d.periodo || '') + '.pdf';
    }

    window.verDetalle621 = function () {
        const d = datos();
        abrirVentana('Detalle de la declaración - 0621', paginaDetalle1(d) + paginaDetalle2(d), nombreArchivo(d, 'Detalle'));
    };

    window.verConstancia621 = function () {
        const d = datos();
        abrirVentana('Constancia Formulario - 0621', paginaConstancia(d), nombreArchivo(d, 'Constancia'));
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
    else enganchar();
})();
