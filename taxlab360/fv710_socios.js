// =============================================================================
// FV 710 · Información Complementaria: "100 Principales socios, asociados y otros"
// -----------------------------------------------------------------------------
// Réplica de la pestaña de SUNAT:
//   · ¿Usted cuenta con socios, asociados y otros...?  Si / No
//   · ¿Está comprendido en el Art. 4° de la Ley 26887...?  Si / No
//   · Importar · Agregar, y la tabla con Mostrar N registros, Buscar,
//     editar (lápiz), eliminar (tacho) y paginación.
//   · "Agregar" abre la ventana "Registro de Principales Socios".
// Cada empresa trae socios de ejemplo (ficticios, armados a partir del RUC)
// para que el alumno los revise, edite o complete.
// La lista vive en un campo oculto del formulario (socios-710-lista), así
// viaja con el guardado automático del avance (fv710_movil.js).
// Se carga al final de dashboard.html.
// =============================================================================
(function () {
    'use strict';

    const TIPOS_SOCIO = [
        'PERSONA NATURAL DOMICILIADA', 'PERSONA JURÍDICA DOMICILIADA', 'PERSONA NATURAL NO DOMICILIADA',
        'PERSONA JURÍDICA NO DOMICILIADA', 'ENTE JURÍDICO DOMICILIADO', 'ENTE JURÍDICO NO DOMICILIADO', 'CONSOLIDADO'
    ];
    const TIPOS_DOC = [
        'CARNET DE EXTRANJERÍA', 'CARNET DE IDENTIDAD', 'CARNÉ PERMISO TEMP. PERMANENCIA', 'DOC. NACIONAL DE IDENTIDAD',
        'NIT', 'OTROS TIPOS DE DOCUMENTOS', 'PASAPORTE', 'REG. ÚNICO DE CONTRIBUYENTES'
    ];
    const PAISES = ['ALEMANIA', 'ARGENTINA', 'BOLIVIA', 'BRASIL', 'CANADÁ', 'CHILE', 'CHINA', 'COLOMBIA', 'ECUADOR',
        'ESPAÑA', 'ESTADOS UNIDOS', 'FRANCIA', 'ITALIA', 'JAPÓN', 'MÉXICO', 'PANAMÁ', 'URUGUAY', 'VENEZUELA', 'OTROS'];

    // Socios ficticios (sin comas: el importador del simulador separa por coma)
    const NOMBRES = [
        'QUISPE MAMANI JORGE LUIS', 'FLORES HUAMAN ROSA ELENA', 'GARCIA TORRES CARLOS ALBERTO',
        'RAMIREZ CHAVEZ ANA LUCIA', 'VARGAS SALAZAR MIGUEL ANGEL', 'MENDOZA RIOS PATRICIA ISABEL',
        'CASTILLO PAREDES LUIS ENRIQUE', 'ROJAS HUERTA MARIA FERNANDA', 'CONDORI APAZA WILBER RAUL',
        'SANCHEZ VILCA KAREN MILAGROS', 'TICONA CHOQUE JUAN CARLOS', 'DELGADO NUÑEZ SILVIA ROXANA'
    ];
    const REPARTOS = [[60, 40], [50, 30, 20], [70, 20, 10], [90, 10], [40, 35, 25], [55, 45]];

    const $ = id => document.getElementById(id);
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    let pagina = 1;
    let editando = -1;

    // ---------------------------------------------------------- datos
    function lista() {
        try { const v = JSON.parse(($('socios-710-lista') || {}).value || '[]'); return Array.isArray(v) ? v : []; }
        catch (e) { return []; }
    }
    function guardarLista(arr) {
        const inp = $('socios-710-lista');
        inp.value = JSON.stringify(arr);
        inp.dispatchEvent(new Event('change', { bubbles: true }));   // guardado automático
    }

    function rucEmpresa() {
        try { if (currentContribuyente && currentContribuyente.ruc) return String(currentContribuyente.ruc); } catch (e) {}
        try { return String((JSON.parse(sessionStorage.getItem('sunat_empresa') || 'null') || {}).ruc || '20123456789'); } catch (e) { return '20123456789'; }
    }

    // Socios de ejemplo: siempre los mismos para un mismo RUC
    function sociosDeEjemplo() {
        const ruc = rucEmpresa();
        let h = 0;
        for (let i = 0; i < ruc.length; i++) h = (h * 31 + ruc.charCodeAt(i)) >>> 0;
        const reparto = REPARTOS[h % REPARTOS.length];
        const anioSocio = 2010 + (h % 12);
        return reparto.map((pct, i) => {
            const k = (h + i * 5) % NOMBRES.length;
            const dni = String(40000000 + ((h >>> (i + 1)) % 9999999)).slice(0, 8);
            const nac = new Date(1962 + ((h >> i) % 30), (h + i) % 12, 1 + ((h >> (i + 2)) % 27));
            return {
                tipoSocio: TIPOS_SOCIO[0],
                tipoDoc: 'DOC. NACIONAL DE IDENTIDAD',
                numDoc: dni,
                nombre: NOMBRES[k],
                nacimiento: iso(nac),
                pais: '',
                porcentaje: pct,
                fechaSocio: iso(new Date(anioSocio + (i ? 1 + (i % 3) : 0), (h + 3 * i) % 12, 1 + ((h >> 3) % 27)))
            };
        });
    }

    function iso(d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    function ddmmaaaa(s) {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
        return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
    }

    // ---------------------------------------------------------- marcado
    function radio(nombre, valor, marcado) {
        return '<label style="cursor:pointer;"><input type="radio" name="' + nombre + '" value="' + valor + '"' +
            (marcado ? ' checked' : '') + ' style="margin-right:8px;">' + (valor === 'si' ? 'Si' : 'No') + '</label>';
    }

    const HTML_PESTANA =
        '<div class="informativa-content-area" id="inf-comp-socios-content" style="display:none;padding:26px 20px;font-size:15px;color:#333;">' +
            '<div style="display:flex;flex-wrap:wrap;gap:12px 40px;align-items:flex-start;margin-bottom:22px;">' +
                '<div style="flex:1 1 380px;max-width:700px;">¿Usted cuenta con socios, asociados y otros para la declaración de renta?</div>' +
                '<div style="display:flex;flex-direction:column;gap:10px;min-width:90px;">' + radio('socios-tiene', 'si', true) + radio('socios-tiene', 'no') + '</div>' +
            '</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:12px 40px;align-items:flex-start;margin-bottom:22px;">' +
                '<div style="flex:1 1 380px;max-width:700px;">¿Está comprendido en el Art. 4° de la ley 26887 - Ley General de sociedades o norma similar?</div>' +
                '<div style="display:flex;flex-direction:column;gap:10px;min-width:90px;">' + radio('socios-art4', 'si') + radio('socios-art4', 'no', true) + '</div>' +
            '</div>' +
            '<input type="hidden" id="socios-710-lista" value="">' +
            '<div id="socios-zona">' +
                '<div style="display:flex;gap:8px;margin-bottom:18px;">' +
                    '<button type="button" id="socios-importar" style="background:#0b5cad;color:#fff;border:none;border-radius:3px;padding:9px 14px;font-size:15px;cursor:pointer;">Importar</button>' +
                    '<button type="button" id="socios-agregar" style="background:#0b5cad;color:#fff;border:none;border-radius:3px;padding:9px 14px;font-size:15px;cursor:pointer;">Agregar</button>' +
                '</div>' +
                '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;">' +
                    '<label>Mostrar <select id="socios-por-pagina" style="padding:5px 6px;border:1px solid #ccc;border-radius:4px;margin:0 4px;">' +
                        '<option>10</option><option>25</option><option>50</option><option>100</option></select> registros por página</label>' +
                    '<label>Buscar: <input type="text" id="socios-buscar" style="padding:7px 10px;border:1px solid #ccc;border-radius:4px;width:200px;max-width:60vw;"></label>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table id="socios-tabla" style="width:100%;border-collapse:collapse;font-size:14px;min-width:900px;">' +
                        '<thead><tr style="border-bottom:2px solid #ddd;text-align:left;vertical-align:bottom;">' +
                            '<th style="width:70px;"></th><th style="padding:8px;">Tipo de Socio</th><th style="padding:8px;">Tipo Documento</th>' +
                            '<th style="padding:8px;">N° Documento</th><th style="padding:8px;">Nombre o Razón Social</th>' +
                            '<th style="padding:8px;">Fecha de Nacimiento</th><th style="padding:8px;">País de Residencia</th>' +
                            '<th style="padding:8px;">% Participación</th><th style="padding:8px;">Fecha en que se constituye como socio</th>' +
                        '</tr></thead><tbody id="socios-cuerpo"></tbody></table>' +
                '</div>' +
                '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-top:12px;border-top:1px solid #ddd;padding-top:12px;">' +
                    '<span id="socios-info" style="color:#555;"></span>' +
                    '<div id="socios-paginas" style="display:flex;gap:18px;color:#555;"></div>' +
                '</div>' +
            '</div>' +
            '<div style="display:flex;justify-content:center;gap:18px;margin-top:28px;">' +
                '<button type="button" data-socios-ir="general" style="padding:8px 14px;border:1px solid #999;background:#fff;border-radius:4px;cursor:pointer;font-size:15px;"><i class="fas fa-chevron-left"></i> Anterior</button>' +
                '<button type="button" data-socios-ir="alquileres" style="padding:8px 14px;border:none;background:#0b5cad;color:#fff;border-radius:4px;cursor:pointer;font-size:15px;">Siguiente <i class="fas fa-chevron-right"></i></button>' +
            '</div>' +
        '</div>';

    const opciones = arr => '<option value="">--Seleccionar--</option>' + arr.map(o => '<option>' + o + '</option>').join('');
    const fila = (etq, control) =>
        '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px 20px;margin-bottom:18px;">' +
            '<label style="flex:1 1 220px;font-size:15px;color:#333;">' + etq + '</label>' +
            '<div style="flex:0 1 250px;width:250px;max-width:100%;">' + control + '</div></div>';
    const CTRL = 'width:100%;padding:9px 12px;border:1px solid #ccc;border-radius:4px;font-size:15px;box-sizing:border-box;';

    const HTML_MODAL =
        '<div id="modal-socios" class="modal-overlay" style="display:none;z-index:2500;">' +
            '<div class="modal-content" style="width:620px;">' +
                '<div class="modal-header"><span>Registro de Principales Socios</span>' +
                    '<i class="fas fa-times" data-socios-m="cerrar" style="cursor:pointer;"></i></div>' +
                '<div class="modal-body" style="padding:20px 26px;max-height:70vh;overflow-y:auto;">' +
                    '<div style="border:1px solid #e3e3e3;border-radius:4px;padding:16px 22px 6px;">' +
                        fila('Tipo de Socio', '<select id="ms-tipo-socio" style="' + CTRL + '">' + opciones(TIPOS_SOCIO) + '</select>') +
                        fila('Tipo de Documento', '<select id="ms-tipo-doc" style="' + CTRL + '">' + opciones(TIPOS_DOC) + '</select>') +
                        fila('Número de Documento', '<input type="text" id="ms-num-doc" placeholder="INGRESAR" maxlength="15" style="' + CTRL + '">') +
                        fila('Nombre o Razón Social', '<input type="text" id="ms-nombre" placeholder="INGRESAR" maxlength="100" style="' + CTRL + 'text-transform:uppercase;">') +
                        fila('Fecha de Nacimiento', '<input type="date" id="ms-nacimiento" style="' + CTRL + '">') +
                        fila('País de Residencia', '<select id="ms-pais" style="' + CTRL + '">' + opciones(PAISES) + '</select>') +
                        fila('Porcentaje de Participación', '<div style="position:relative;"><input type="text" id="ms-porcentaje" inputmode="decimal" placeholder="0" style="' + CTRL + 'text-align:right;padding-right:30px;"><span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#777;">%</span></div>') +
                        fila('Fecha en que se constituye como socio', '<input type="date" id="ms-fecha-socio" style="' + CTRL + '">') +
                    '</div>' +
                    '<p id="ms-error" style="display:none;margin:12px 0 0;padding:9px 12px;background:#fdecea;border-left:4px solid #d32f2f;color:#8a1c1c;font-size:13px;"></p>' +
                '</div>' +
                '<div class="modal-footer" style="justify-content:flex-end;gap:10px;padding:14px 26px;">' +
                    '<button type="button" class="btn-modal-cancel" data-socios-m="cerrar">Cancelar</button>' +
                    '<button type="button" class="btn-modal-save" data-socios-m="guardar">Guardar</button>' +
                '</div>' +
            '</div>' +
        '</div>';

    // ---------------------------------------------------------- tabla
    function filtrados() {
        const q = (($('socios-buscar') || {}).value || '').trim().toUpperCase();
        return lista().map((s, i) => ({ s: s, i: i })).filter(x => !q ||
            [x.s.tipoSocio, x.s.tipoDoc, x.s.numDoc, x.s.nombre, x.s.pais].join(' ').toUpperCase().indexOf(q) >= 0);
    }

    function pintar() {
        const cuerpo = $('socios-cuerpo');
        if (!cuerpo) return;
        if (aplicarSociosDeLaBase && sociosBase && sociosBase.length &&
            $('socios-710-lista').value === JSON.stringify(sociosDeEjemplo())) {
            return aplicarSociosDeLaBase();
        }
        const tiene = document.querySelector('input[name="socios-tiene"]:checked');
        $('socios-zona').style.display = (tiene && tiene.value === 'no') ? 'none' : 'block';

        const porPag = parseInt($('socios-por-pagina').value, 10) || 10;
        const datos = filtrados();
        const paginas = Math.max(1, Math.ceil(datos.length / porPag));
        pagina = Math.min(Math.max(1, pagina), paginas);
        const desde = (pagina - 1) * porPag;
        const visibles = datos.slice(desde, desde + porPag);

        cuerpo.innerHTML = visibles.length ? visibles.map(x =>
            '<tr style="border-bottom:1px solid #e5e5e5;vertical-align:top;">' +
                '<td style="padding:10px 8px;white-space:nowrap;">' +
                    '<i class="fas fa-pencil-alt" data-socio-editar="' + x.i + '" title="Editar" style="cursor:pointer;color:#333;margin-right:16px;"></i>' +
                    '<i class="fas fa-trash" data-socio-borrar="' + x.i + '" title="Eliminar" style="cursor:pointer;color:#333;"></i></td>' +
                '<td style="padding:10px 8px;">' + esc(x.s.tipoSocio) + '</td>' +
                '<td style="padding:10px 8px;">' + esc(x.s.tipoDoc) + '</td>' +
                '<td style="padding:10px 8px;">' + esc(x.s.numDoc) + '</td>' +
                '<td style="padding:10px 8px;">' + esc(x.s.nombre) + '</td>' +
                '<td style="padding:10px 8px;">' + ddmmaaaa(x.s.nacimiento) + '</td>' +
                '<td style="padding:10px 8px;">' + esc(x.s.pais) + '</td>' +
                '<td style="padding:10px 8px;">' + esc(x.s.porcentaje) + ' %</td>' +
                '<td style="padding:10px 8px;">' + ddmmaaaa(x.s.fechaSocio) + '</td>' +
            '</tr>').join('')
            : '<tr><td colspan="9" style="padding:14px 8px;color:#555;">No hay registros disponibles</td></tr>';

        const total = lista().reduce((a, s) => a + (parseFloat(s.porcentaje) || 0), 0);
        $('socios-info').innerHTML = datos.length
            ? 'Mostrando ' + (desde + 1) + ' a ' + (desde + visibles.length) + ' de ' + datos.length + ' registros' +
              ' &nbsp;·&nbsp; Participación total: <strong style="color:' + (Math.round(total * 100) / 100 === 100 ? '#2e7d32' : '#c62828') + ';">' + (Math.round(total * 100) / 100) + ' %</strong>'
            : 'No hay registros disponibles';
        const enlace = (txt, p, activo) => '<a href="javascript:void(0)" data-socios-pag="' + p + '" style="color:' + (activo ? '#0b5cad' : '#999') +
            ';text-decoration:none;' + (activo ? '' : 'pointer-events:none;') + '">' + txt + '</a>';
        $('socios-paginas').innerHTML =
            enlace('Primero', 1, pagina > 1) + enlace('Anterior', pagina - 1, pagina > 1) +
            '<span>' + pagina + ' / ' + paginas + '</span>' +
            enlace('Siguiente', pagina + 1, pagina < paginas) + enlace('Último', paginas, pagina < paginas);
    }

    // ---------------------------------------------------------- ventana
    function esNatural(t) { return /NATURAL/.test(t || ''); }
    function esNoDomiciliado(t) { return /NO DOMICILIAD/.test(t || ''); }

    // Habilita o bloquea (gris) los campos según lo elegido, como en SUNAT
    function estadoCampos() {
        const tSocio = $('ms-tipo-socio').value, tDoc = $('ms-tipo-doc').value;
        const pon = (id, activo) => {
            const el = $(id);
            el.disabled = !activo;
            el.style.background = activo ? '#fff' : '#b5b5b5';
            el.style.cursor = activo ? '' : 'not-allowed';
            if (!activo) el.value = '';
        };
        pon('ms-num-doc', !!tDoc);
        pon('ms-nombre', !!tDoc);
        pon('ms-nacimiento', !tSocio || esNatural(tSocio));
        pon('ms-pais', esNoDomiciliado(tSocio));
    }

    function abrir(indice) {
        editando = typeof indice === 'number' ? indice : -1;
        const s = editando >= 0 ? lista()[editando] : {};
        $('ms-tipo-socio').value = s.tipoSocio || '';
        $('ms-tipo-doc').value = s.tipoDoc || '';
        estadoCampos();
        $('ms-num-doc').value = s.numDoc || '';
        $('ms-nombre').value = s.nombre || '';
        $('ms-nacimiento').value = s.nacimiento || '';
        $('ms-pais').value = s.pais || '';
        $('ms-porcentaje').value = s.porcentaje != null ? s.porcentaje : '';
        $('ms-fecha-socio').value = s.fechaSocio || '';
        error('');
        $('modal-socios').style.display = 'flex';
    }

    function cerrar() { $('modal-socios').style.display = 'none'; }

    function error(msg) {
        const p = $('ms-error');
        p.textContent = msg;
        p.style.display = msg ? 'block' : 'none';
    }

    function guardar() {
        const s = {
            tipoSocio: $('ms-tipo-socio').value,
            tipoDoc: $('ms-tipo-doc').value,
            numDoc: $('ms-num-doc').value.trim(),
            nombre: $('ms-nombre').value.trim().toUpperCase().replace(/,/g, ' ').replace(/\s+/g, ' '),
            nacimiento: $('ms-nacimiento').value,
            pais: $('ms-pais').value,
            porcentaje: parseFloat(String($('ms-porcentaje').value).replace(',', '.')) || 0,
            fechaSocio: $('ms-fecha-socio').value
        };
        if (!s.tipoSocio) return error('Seleccione el Tipo de Socio.');
        if (!s.tipoDoc) return error('Seleccione el Tipo de Documento.');
        if (!s.numDoc) return error('Ingrese el Número de Documento.');
        if (s.tipoDoc === 'DOC. NACIONAL DE IDENTIDAD' && !/^\d{8}$/.test(s.numDoc)) return error('El DNI debe tener 8 dígitos.');
        if (s.tipoDoc === 'REG. ÚNICO DE CONTRIBUYENTES' && !/^(10|15|17|20)\d{9}$/.test(s.numDoc)) return error('El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20.');
        if (!s.nombre) return error('Ingrese el Nombre o Razón Social.');
        if (esNatural(s.tipoSocio) && !s.nacimiento) return error('Ingrese la Fecha de Nacimiento del socio.');
        if (esNoDomiciliado(s.tipoSocio) && !s.pais) return error('Seleccione el País de Residencia del socio no domiciliado.');
        if (!(s.porcentaje > 0 && s.porcentaje <= 100)) return error('El Porcentaje de Participación debe ser mayor que 0 y como máximo 100.');
        if (!s.fechaSocio) return error('Ingrese la Fecha en que se constituye como socio.');

        const arr = lista();
        const repetido = arr.findIndex((x, i) => i !== editando && x.tipoDoc === s.tipoDoc && x.numDoc === s.numDoc);
        if (repetido >= 0) return error('Ya registró un socio con ese documento (' + s.numDoc + ').');
        const suma = arr.reduce((a, x, i) => a + (i === editando ? 0 : (parseFloat(x.porcentaje) || 0)), 0) + s.porcentaje;
        if (suma > 100.0001) return error('La participación total de los socios no puede pasar de 100 %. Con este socio sumaría ' + (Math.round(suma * 100) / 100) + ' %.');

        if (editando >= 0) arr[editando] = s; else arr.push(s);
        guardarLista(arr);
        cerrar();
        pintar();
    }

    // Socios reales de la empresa (tabla socios_empresa, p. ej. las empresas del
    // AA4). Si la empresa los tiene, reemplazan a los de ejemplo, también en un
    // avance recuperado que todavía tenga los de ejemplo. Lo que el alumno ya
    // editó no se toca.
    let sociosBase = null;          // null = aún no consultado; [] = la empresa no tiene
    async function cargarSociosDeLaBase() {
        if (sociosBase === null) {
            sociosBase = [];
            try {
                if (typeof authSupabaseClient === 'undefined' || !authSupabaseClient) return;
                const { data, error } = await authSupabaseClient.from('socios_empresa')
                    .select('tipo_socio,tipo_doc,num_doc,nombre,fecha_nacimiento,pais,porcentaje,fecha_socio')
                    .eq('ruc', rucEmpresa()).order('orden');
                if (error || !data) return;
                sociosBase = data.map(s => ({
                    tipoSocio: s.tipo_socio,
                    tipoDoc: s.tipo_doc,
                    numDoc: s.num_doc,
                    nombre: s.nombre,
                    nacimiento: s.fecha_nacimiento || '',
                    pais: s.pais || '',
                    porcentaje: Number(s.porcentaje),
                    fechaSocio: s.fecha_socio || ''
                }));
            } catch (e) { return; /* sin conexión: quedan los socios de ejemplo */ }
        }
        aplicarSociosDeLaBase();
    }

    function aplicarSociosDeLaBase() {
        if (!sociosBase || !sociosBase.length) return false;
        const actual = ($('socios-710-lista') || {}).value || '';
        if (actual && actual !== JSON.stringify(sociosDeEjemplo())) return false;
        $('socios-710-lista').value = JSON.stringify(sociosBase);
        $('socios-710-lista').dispatchEvent(new Event('change', { bubbles: true }));
        pintar();
        return true;
    }

    // ---------------------------------------------------------- montaje
    function irPestana(t) {
        if (typeof switchInfComp === 'function') switchInfComp(t);
    }

    function montar() {
        const ref = $('inf-comp-others-content');
        if (!ref || $('inf-comp-socios-content')) return;
        ref.insertAdjacentHTML('afterend', HTML_PESTANA);
        document.body.insertAdjacentHTML('beforeend', HTML_MODAL);

        // Socios de ejemplo de la empresa (solo la primera vez; luego manda lo guardado)
        if (!$('socios-710-lista').value) $('socios-710-lista').value = JSON.stringify(sociosDeEjemplo());
        cargarSociosDeLaBase();

        const zona = $('inf-comp-socios-content');
        zona.addEventListener('click', e => {
            const t = e.target;
            const ed = t.closest('[data-socio-editar]'), bo = t.closest('[data-socio-borrar]');
            const pg = t.closest('[data-socios-pag]'), ir = t.closest('[data-socios-ir]');
            if (ed) abrir(parseInt(ed.getAttribute('data-socio-editar'), 10));
            else if (bo) {
                const i = parseInt(bo.getAttribute('data-socio-borrar'), 10);
                const s = lista()[i];
                if (s && confirm('¿Eliminar al socio ' + s.nombre + '?')) {
                    const arr = lista(); arr.splice(i, 1); guardarLista(arr); pintar();
                }
            } else if (pg) { pagina = parseInt(pg.getAttribute('data-socios-pag'), 10) || 1; pintar(); }
            else if (ir) irPestana(ir.getAttribute('data-socios-ir'));
            else if (t.closest('#socios-agregar')) abrir();
            else if (t.closest('#socios-importar')) {
                alert('En el simulador los socios se registran con el botón "Agregar". ' +
                      'Use el lápiz para corregir un socio y el tacho para eliminarlo.');
            }
        });
        $('socios-buscar').addEventListener('input', () => { pagina = 1; pintar(); });
        $('socios-por-pagina').addEventListener('change', () => { pagina = 1; pintar(); });
        document.querySelectorAll('input[name="socios-tiene"]').forEach(r => r.addEventListener('change', pintar));

        const modal = $('modal-socios');
        modal.addEventListener('click', e => {
            const b = e.target.closest('[data-socios-m]');
            if (!b) return;
            if (b.getAttribute('data-socios-m') === 'guardar') guardar(); else cerrar();
        });
        $('ms-tipo-socio').addEventListener('change', estadoCampos);
        $('ms-tipo-doc').addEventListener('change', estadoCampos);
        $('ms-num-doc').addEventListener('input', function () {
            if (['DOC. NACIONAL DE IDENTIDAD', 'REG. ÚNICO DE CONTRIBUYENTES'].indexOf($('ms-tipo-doc').value) >= 0) this.value = this.value.replace(/\D/g, '');
        });

        pintar();
    }

    window.FV710Socios = { pintar: pintar };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
    else montar();
})();
