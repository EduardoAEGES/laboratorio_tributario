// =============================================================================
// FV 710 · Información Complementaria: "Alquileres Pagados"
// -----------------------------------------------------------------------------
// Réplica de la pestaña de SUNAT:
//   · ¿Ha pagado usted alquiler por algún bien mueble o inmueble durante el
//     presente ejercicio?  Si / No  (por defecto No)
//   · Con "Si": botón Agregar y la tabla (Mostrar N registros, Buscar, editar,
//     eliminar y paginación).
//   · "Agregar" abre "Registro de Alquileres Pagados": documento de quien
//     alquila el bien, monto anual sin IGV y tipo de bien.
// La lista vive en un campo oculto del formulario (alquileres-710-lista), así
// viaja con el guardado automático del avance (fv710_movil.js).
// Se carga al final de dashboard.html.
// =============================================================================
(function () {
    'use strict';

    const TIPOS_DOC = [
        'CARNET DE EXTRANJERÍA', 'CARNET DE IDENTIDAD', 'CARNÉ PERMISO TEMP. PERMANENCIA', 'DOC. NACIONAL DE IDENTIDAD',
        'OTROS TIPOS DE DOCUMENTOS', 'PASAPORTE', 'REG. ÚNICO DE CONTRIBUYENTES'
    ];
    const TIPOS_BIEN = ['BIEN MUEBLE', 'BIEN INMUEBLE (PREDIOS)', 'BIEN INMUEBLE DISTINTO DE PREDIOS'];
    const DNI = 'DOC. NACIONAL DE IDENTIDAD', RUC = 'REG. ÚNICO DE CONTRIBUYENTES';

    const $ = id => document.getElementById(id);
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const miles = n => Math.round(n).toLocaleString('en-US');
    const numero = v => { const n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n; };

    let pagina = 1;
    let editando = -1;

    // ---------------------------------------------------------- datos
    function lista() {
        try { const v = JSON.parse(($('alquileres-710-lista') || {}).value || '[]'); return Array.isArray(v) ? v : []; }
        catch (e) { return []; }
    }
    function guardarLista(arr) {
        const inp = $('alquileres-710-lista');
        inp.value = JSON.stringify(arr);
        inp.dispatchEvent(new Event('change', { bubbles: true }));   // guardado automático
    }

    // ---------------------------------------------------------- marcado
    const radio = (nombre, valor, marcado) =>
        '<label style="cursor:pointer;"><input type="radio" name="' + nombre + '" value="' + valor + '"' +
        (marcado ? ' checked' : '') + ' style="margin-right:8px;">' + (valor === 'si' ? 'Si' : 'No') + '</label>';

    const TH = 'padding:8px;';
    const HTML_PESTANA =
        '<div class="informativa-content-area" id="inf-comp-alquileres-content" style="display:none;padding:26px 20px;font-size:15px;color:#333;">' +
            '<div style="display:flex;flex-wrap:wrap;gap:12px 40px;align-items:flex-start;margin-bottom:22px;">' +
                '<div style="flex:1 1 380px;max-width:700px;">¿Ha pagado usted alquiler por algún bien mueble o inmueble durante el presente ejercicio?</div>' +
                '<div style="display:flex;flex-direction:column;gap:10px;min-width:90px;">' + radio('alquileres-pago', 'si') + radio('alquileres-pago', 'no', true) + '</div>' +
            '</div>' +
            '<input type="hidden" id="alquileres-710-lista" value="">' +
            '<div id="alquileres-zona" style="display:none;">' +
                '<button type="button" id="alquileres-agregar" style="background:#0b5cad;color:#fff;border:none;border-radius:3px;padding:9px 14px;font-size:15px;cursor:pointer;margin-bottom:18px;">Agregar</button>' +
                '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;">' +
                    '<label>Mostrar <select id="alquileres-por-pagina" style="padding:5px 6px;border:1px solid #ccc;border-radius:4px;margin:0 4px;">' +
                        '<option>10</option><option>25</option><option>50</option><option>100</option></select> registros por página</label>' +
                    '<label>Buscar: <input type="text" id="alquileres-buscar" style="padding:7px 10px;border:1px solid #ccc;border-radius:4px;width:200px;max-width:60vw;"></label>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table style="width:100%;border-collapse:collapse;font-size:14px;min-width:900px;">' +
                        '<thead><tr style="border-bottom:2px solid #ddd;text-align:left;vertical-align:bottom;">' +
                            '<th style="width:70px;"></th><th style="' + TH + '">Tipo Documento</th><th style="' + TH + '">N° Documento</th>' +
                            '<th style="' + TH + '">Nombre o Razón Social</th><th style="' + TH + '">Monto anual del alquiler S/. (No incluye IGV)</th>' +
                            '<th style="' + TH + '">Tipo de Bien</th><th style="' + TH + '">Descripción del Bien</th><th style="' + TH + '">Matrícula placa Otros</th>' +
                        '</tr></thead><tbody id="alquileres-cuerpo"></tbody></table>' +
                '</div>' +
                '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-top:12px;border-top:1px solid #ddd;padding-top:12px;">' +
                    '<span id="alquileres-info" style="color:#555;"></span>' +
                    '<div id="alquileres-paginas" style="display:flex;gap:18px;color:#555;"></div>' +
                '</div>' +
            '</div>' +
            '<div style="display:flex;justify-content:center;gap:18px;margin-top:28px;">' +
                '<button type="button" data-alq-ir="socios" style="padding:8px 14px;border:1px solid #999;background:#fff;border-radius:4px;cursor:pointer;font-size:15px;"><i class="fas fa-chevron-left"></i> Anterior</button>' +
                '<button type="button" data-alq-ir="constructoras" style="padding:8px 14px;border:none;background:#0b5cad;color:#fff;border-radius:4px;cursor:pointer;font-size:15px;">Siguiente <i class="fas fa-chevron-right"></i></button>' +
            '</div>' +
        '</div>';

    const CTRL = 'width:100%;padding:9px 12px;border:1px solid #ccc;border-radius:4px;font-size:15px;box-sizing:border-box;';
    const fila = (etq, control, id) =>
        '<div' + (id ? ' id="' + id + '"' : '') + ' style="display:flex;flex-wrap:wrap;align-items:flex-start;gap:8px 20px;margin-bottom:18px;">' +
            '<label style="flex:1 1 260px;font-size:15px;color:#333;padding-top:8px;">' + etq + '</label>' +
            '<div style="flex:0 1 360px;width:360px;max-width:100%;">' + control + '</div></div>';

    const HTML_MODAL =
        '<div id="modal-alquileres" class="modal-overlay" style="display:none;z-index:2500;">' +
            '<div class="modal-content" style="width:860px;">' +
                '<div class="modal-header"><span>Registro de Alquileres Pagados</span>' +
                    '<i class="fas fa-times" data-alq-m="cerrar" style="cursor:pointer;"></i></div>' +
                '<div class="modal-body" style="padding:18px 22px;max-height:72vh;overflow-y:auto;">' +
                    '<div style="border:1px solid #e3e3e3;border-radius:4px;padding:14px 22px 6px;">' +
                        '<p style="margin:0 0 8px;font-size:15px;color:#333;">Documento de identidad de la persona que le alquila el bien</p>' +
                        fila('Tipo de Documento', '<select id="ma-tipo-doc" style="' + CTRL + '"><option value="">--Seleccionar--</option>' +
                            TIPOS_DOC.map(t => '<option>' + t + '</option>').join('') + '</select>') +
                        fila('Número de Documento', '<input type="text" id="ma-num-doc" placeholder="INGRESAR" maxlength="15" style="' + CTRL + '">') +
                        fila('Nombre o Razón Social', '<input type="text" id="ma-nombre" placeholder="INGRESAR" maxlength="100" style="' + CTRL + 'text-transform:uppercase;">') +
                        fila('Monto anual del alquiler S/. (No incluye IGV)', '<div style="position:relative;"><input type="text" id="ma-monto" inputmode="numeric" placeholder="0" style="' + CTRL + 'text-align:right;padding-right:42px;"><span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#777;">S/</span></div>') +
                        fila('¿Qué tipo de bien le han alquilado?', TIPOS_BIEN.map((t, i) =>
                            '<label style="display:block;margin:6px 0;cursor:pointer;font-size:15px;"><input type="radio" name="ma-tipo-bien" value="' + i + '" style="margin-right:8px;">' + t + '</label>').join('')) +
                        fila('Descripción del Bien', '<input type="text" id="ma-descripcion" placeholder="INGRESAR" maxlength="100" style="' + CTRL + 'text-transform:uppercase;">', 'ma-fila-descripcion') +
                        fila('Matrícula / Placa / Otros', '<input type="text" id="ma-matricula" placeholder="INGRESAR" maxlength="30" style="' + CTRL + 'text-transform:uppercase;">', 'ma-fila-matricula') +
                    '</div>' +
                    '<p id="ma-error" style="display:none;margin:12px 0 0;padding:9px 12px;background:#fdecea;border-left:4px solid #d32f2f;color:#8a1c1c;font-size:13px;"></p>' +
                '</div>' +
                '<div class="modal-footer" style="justify-content:flex-end;gap:10px;padding:14px 22px;">' +
                    '<button type="button" class="btn-modal-cancel" data-alq-m="cerrar">Cancelar</button>' +
                    '<button type="button" class="btn-modal-save" data-alq-m="guardar">Guardar</button>' +
                '</div>' +
            '</div>' +
        '</div>';

    // ---------------------------------------------------------- tabla
    function filtrados() {
        const q = (($('alquileres-buscar') || {}).value || '').trim().toUpperCase();
        return lista().map((a, i) => ({ a: a, i: i })).filter(x => !q ||
            [x.a.tipoDoc, x.a.numDoc, x.a.nombre, x.a.tipoBien, x.a.descripcion, x.a.matricula].join(' ').toUpperCase().indexOf(q) >= 0);
    }

    function pintar() {
        const cuerpo = $('alquileres-cuerpo');
        if (!cuerpo) return;
        const pago = document.querySelector('input[name="alquileres-pago"]:checked');
        $('alquileres-zona').style.display = (pago && pago.value === 'si') ? 'block' : 'none';

        const porPag = parseInt($('alquileres-por-pagina').value, 10) || 10;
        const datos = filtrados();
        const paginas = Math.max(1, Math.ceil(datos.length / porPag));
        pagina = Math.min(Math.max(1, pagina), paginas);
        const desde = (pagina - 1) * porPag;
        const visibles = datos.slice(desde, desde + porPag);
        const td = v => '<td style="padding:10px 8px;">' + v + '</td>';

        cuerpo.innerHTML = visibles.length ? visibles.map(x =>
            '<tr style="border-bottom:1px solid #e5e5e5;vertical-align:top;">' +
                '<td style="padding:10px 8px;white-space:nowrap;">' +
                    '<i class="fas fa-pencil-alt" data-alq-editar="' + x.i + '" title="Editar" style="cursor:pointer;color:#333;margin-right:16px;"></i>' +
                    '<i class="fas fa-trash" data-alq-borrar="' + x.i + '" title="Eliminar" style="cursor:pointer;color:#333;"></i></td>' +
                td(esc(x.a.tipoDoc)) + td(esc(x.a.numDoc)) + td(esc(x.a.nombre)) + td('S/ ' + miles(x.a.monto)) +
                td(esc(x.a.tipoBien)) + td(esc(x.a.descripcion)) + td(esc(x.a.matricula)) +
            '</tr>').join('')
            : '<tr><td colspan="8" style="padding:14px 8px;text-align:center;color:#555;">No hay registros disponibles</td></tr>';

        const total = lista().reduce((s, a) => s + (Number(a.monto) || 0), 0);
        $('alquileres-info').innerHTML = datos.length
            ? 'Mostrando ' + (desde + 1) + ' a ' + (desde + visibles.length) + ' de ' + datos.length + ' registros &nbsp;·&nbsp; Total alquileres: <strong>S/ ' + miles(total) + '</strong>'
            : 'No hay registros disponibles';
        const enlace = (txt, p, activo) => '<a href="javascript:void(0)" data-alq-pag="' + p + '" style="color:' + (activo ? '#0b5cad' : '#999') +
            ';text-decoration:none;' + (activo ? '' : 'pointer-events:none;') + '">' + txt + '</a>';
        $('alquileres-paginas').innerHTML =
            enlace('Primero', 1, pagina > 1) + enlace('Anterior', pagina - 1, pagina > 1) +
            '<span>' + pagina + ' / ' + paginas + '</span>' +
            enlace('Siguiente', pagina + 1, pagina < paginas) + enlace('Último', paginas, pagina < paginas);
    }

    // ---------------------------------------------------------- ventana
    function tipoBienElegido() {
        const r = document.querySelector('input[name="ma-tipo-bien"]:checked');
        return r ? TIPOS_BIEN[parseInt(r.value, 10)] : '';
    }

    // Número y nombre en gris hasta elegir el documento; la descripción y la
    // matrícula aparecen según el tipo de bien (los predios no llevan placa)
    function estadoCampos() {
        const conDoc = !!$('ma-tipo-doc').value;
        ['ma-num-doc', 'ma-nombre'].forEach(id => {
            const el = $(id);
            el.disabled = !conDoc;
            el.style.background = conDoc ? '#fff' : '#b5b5b5';
            el.style.cursor = conDoc ? '' : 'not-allowed';
            if (!conDoc) el.value = '';
        });
        const bien = tipoBienElegido();
        $('ma-fila-descripcion').style.display = bien ? 'flex' : 'none';
        $('ma-fila-matricula').style.display = (bien && bien !== TIPOS_BIEN[1]) ? 'flex' : 'none';
        $('ma-descripcion').placeholder = bien === TIPOS_BIEN[1] ? 'DIRECCIÓN DEL PREDIO' : (bien === TIPOS_BIEN[0] ? 'EJ. CAMIONETA - MAQUINARIA' : 'EJ. NAVE - AERONAVE');
    }

    function error(msg) {
        const p = $('ma-error');
        p.textContent = msg;
        p.style.display = msg ? 'block' : 'none';
    }

    function abrir(indice) {
        editando = typeof indice === 'number' ? indice : -1;
        const a = editando >= 0 ? lista()[editando] : {};
        $('ma-tipo-doc').value = a.tipoDoc || '';
        document.querySelectorAll('input[name="ma-tipo-bien"]').forEach(r => { r.checked = TIPOS_BIEN[parseInt(r.value, 10)] === a.tipoBien; });
        estadoCampos();
        $('ma-num-doc').value = a.numDoc || '';
        $('ma-nombre').value = a.nombre || '';
        $('ma-monto').value = a.monto ? miles(a.monto) : '';
        $('ma-descripcion').value = a.descripcion || '';
        $('ma-matricula').value = a.matricula || '';
        error('');
        $('modal-alquileres').style.display = 'flex';
    }

    function cerrar() { $('modal-alquileres').style.display = 'none'; }

    function guardar() {
        const limpio = v => v.trim().toUpperCase().replace(/,/g, ' ').replace(/\s+/g, ' ');
        const bien = tipoBienElegido();
        const a = {
            tipoDoc: $('ma-tipo-doc').value,
            numDoc: $('ma-num-doc').value.trim(),
            nombre: limpio($('ma-nombre').value),
            monto: Math.round(numero($('ma-monto').value)),
            tipoBien: bien,
            descripcion: limpio($('ma-descripcion').value),
            matricula: bien === TIPOS_BIEN[1] ? '' : limpio($('ma-matricula').value)
        };
        if (!a.tipoDoc) return error('Seleccione el Tipo de Documento de la persona que le alquila el bien.');
        if (!a.numDoc) return error('Ingrese el Número de Documento.');
        if (a.tipoDoc === DNI && !/^\d{8}$/.test(a.numDoc)) return error('El DNI debe tener 8 dígitos.');
        if (a.tipoDoc === RUC && !/^(10|15|17|20)\d{9}$/.test(a.numDoc)) return error('El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20.');
        if (!a.nombre) return error('Ingrese el Nombre o Razón Social.');
        if (!(a.monto > 0)) return error('Ingrese el Monto anual del alquiler (sin IGV), mayor que cero.');
        if (!a.tipoBien) return error('Indique qué tipo de bien le han alquilado.');
        if (!a.descripcion) return error('Ingrese la Descripción del Bien.');

        const arr = lista();
        if (editando >= 0) arr[editando] = a; else arr.push(a);
        guardarLista(arr);
        cerrar();
        pintar();
    }

    // ---------------------------------------------------------- montaje
    function montar() {
        const ref = $('inf-comp-others-content');
        if (!ref || $('inf-comp-alquileres-content')) return;
        ref.insertAdjacentHTML('afterend', HTML_PESTANA);
        document.body.insertAdjacentHTML('beforeend', HTML_MODAL);

        const zona = $('inf-comp-alquileres-content');
        zona.addEventListener('click', e => {
            const t = e.target;
            const ed = t.closest('[data-alq-editar]'), bo = t.closest('[data-alq-borrar]');
            const pg = t.closest('[data-alq-pag]'), ir = t.closest('[data-alq-ir]');
            if (ed) abrir(parseInt(ed.getAttribute('data-alq-editar'), 10));
            else if (bo) {
                const i = parseInt(bo.getAttribute('data-alq-borrar'), 10);
                const a = lista()[i];
                if (a && confirm('¿Eliminar el alquiler pagado a ' + a.nombre + '?')) {
                    const arr = lista(); arr.splice(i, 1); guardarLista(arr); pintar();
                }
            } else if (pg) { pagina = parseInt(pg.getAttribute('data-alq-pag'), 10) || 1; pintar(); }
            else if (ir) { if (typeof switchInfComp === 'function') switchInfComp(ir.getAttribute('data-alq-ir')); }
            else if (t.closest('#alquileres-agregar')) abrir();
        });
        $('alquileres-buscar').addEventListener('input', () => { pagina = 1; pintar(); });
        $('alquileres-por-pagina').addEventListener('change', () => { pagina = 1; pintar(); });
        document.querySelectorAll('input[name="alquileres-pago"]').forEach(r => r.addEventListener('change', pintar));

        const modal = $('modal-alquileres');
        modal.addEventListener('click', e => {
            const b = e.target.closest('[data-alq-m]');
            if (!b) return;
            if (b.getAttribute('data-alq-m') === 'guardar') guardar(); else cerrar();
        });
        $('ma-tipo-doc').addEventListener('change', estadoCampos);
        document.querySelectorAll('input[name="ma-tipo-bien"]').forEach(r => r.addEventListener('change', estadoCampos));
        $('ma-num-doc').addEventListener('input', function () {
            if ([DNI, RUC].indexOf($('ma-tipo-doc').value) >= 0) this.value = this.value.replace(/\D/g, '');
        });
        $('ma-monto').addEventListener('input', function () { this.value = this.value.replace(/[^0-9]/g, ''); });
        $('ma-monto').addEventListener('focusout', function () { if (this.value) this.value = miles(numero(this.value)); });
        $('ma-monto').addEventListener('focusin', function () { this.value = this.value.replace(/,/g, ''); });

        pintar();
    }

    window.FV710Alquileres = { pintar: pintar };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
    else montar();
})();
