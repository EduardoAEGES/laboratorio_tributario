// =============================================================================
// FV 710 · Importar Estados Financieros (réplica de la opción "Importar" de SUNAT)
// -----------------------------------------------------------------------------
// 1) Botón "Importar" del Estado de Situación Financiera y del Estado de
//    Resultados: carga las plantillas oficiales de SUNAT en Excel (.xls)
//       0710AAAArucACTIVO.xls · 0710AAAArucPASIVO.xls · 0710AAAArucEEGGPP.xls
//    Lee la columna "Monto" desde la celda C4, igual que el formulario real.
// 2) Detalle de las casillas 361, 362, 363, 364, 365, 367, 404, 405, 406, 407
//    y 408 (cuentas por cobrar / por pagar por tercero): se importa un archivo
//    0710AAAArucCCC.TXT (o .xls) con la estructura del instructivo de SUNAT
//    y la casilla toma la suma del detalle.
// 3) Botón "Importar" de las ventanas de las casillas 128 (pagos a cuenta) y
//    130 (retenciones): plantillas 0710AAAAruc128.xls / 0710AAAAruc130.xls,
//    un mes por fila (AAAAMM en la columna A, montos desde la celda B4).
// Se valida lo mismo que valida SUNAT: nombre del archivo, ejercicio, RUC,
// estructura, montos enteros y positivos y casillas excluyentes.
// La ventana imita la de SUNAT (Seleccionar archivo · Cancelar · Aceptar) y el
// resultado sale en la ventana "Mensaje". Las plantillas oficiales para los
// alumnos están en plantillas_710/.
// El detalle se guarda en un campo oculto del formulario, así viaja con el
// guardado automático del avance (fv710_movil.js). Se carga después de él.
// =============================================================================
(function () {
    'use strict';

    const URL_SHEETJS = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

    // ------------------------------------------------------------ plantillas
    // entradas: casillas que llena el contribuyente. totales: las calcula el
    // formulario (se ignoran si vienen en el archivo).
    const rango = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
    const PLANTILLAS = {
        ACTIVO: {
            titulo: 'Activo',
            entradas: rango(359, 389),
            totales: ['390'],
            excluyentes: [],
            pestana: 'activo'
        },
        PASIVO: {
            titulo: 'Pasivo y Patrimonio',
            entradas: rango(401, 411).concat(rango(414, 424)),
            totales: ['412', '425', '426'],
            excluyentes: [['416', '417'], ['421', '422'], ['423', '424']],
            pestana: 'pasivo'
        },
        EEGGPP: {
            titulo: 'Estado de Resultados',
            entradas: ['461', '462', '464', '468', '469', '472', '650', '651', '475', '476',
                       '432', '433', '478', '480', '481', '483', '486', '351', '490'],
            // 473 = 650 + 651 y 477 = 432 + 433: se aceptan solos si el detalle viene vacío
            totales: ['463', '466', '467', '470', '471', '473', '477', '484', '485', '487', '489', '492', '493'],
            excluyentes: [['481', '483'], ['351', '490']],
            pestana: 'resultados'
        }
    };

    // Casillas 128 y 130: un mes por fila (enero del ejercicio a junio del siguiente)
    const MENSUALES = {
        C128: {
            casilla: '128',
            titulo: 'Pagos a cuenta del ejercicio (casilla 128)',
            columnas: ['Utilización del saldo a favor', 'Compensación del SFMB', 'Compensación del ITAN', 'Otros créditos', 'Monto pagado']
        },
        C130: {
            casilla: '130',
            titulo: 'Retenciones de Renta de Tercera Categoría (casilla 130)',
            columnas: ['Monto de la retención']
        }
    };
    const tipoMensual = casilla => casilla === '128' ? 'C128' : casilla === '130' ? 'C130' : null;

    // Casillas con detalle por tercero
    const CASILLAS_DETALLE = {
        '361': 'Cuentas por cobrar comerciales – terceros',
        '362': 'Cuentas por cobrar comerciales – relacionadas',
        '363': 'Cuentas por cobrar al personal, accionistas (socios) y directores',
        '364': 'Cuentas por cobrar diversas – terceros',
        '365': 'Cuentas por cobrar diversas – relacionadas',
        '367': 'Estimación de cuentas de cobranza dudosa',
        '404': 'Cuentas por pagar comerciales – terceros',
        '405': 'Cuentas por pagar comerciales – relacionadas',
        '406': 'Cuentas por pagar a los accionistas (socios, partícipes) y directores',
        '407': 'Cuentas por pagar diversas – terceros',
        '408': 'Cuentas por pagar diversas – relacionadas'
    };

    // Tabla 1 del instructivo
    const TIPOS_DOC = {
        '01': 'DNI', '04': 'Carnet de Extranjería', '06': 'RUC', '07': 'Pasaporte',
        '00': 'Otros Tipos de Documentos', '99': 'Consolidado (montos menores a 2 UIT)',
        'A': 'Carnet de Identidad', 'F': 'Carnet Permiso Temp. Permanencia'
    };

    const idCasilla = c => (Number(c) >= 400 && Number(c) < 430 ? 'ep-' : 'ea-') + c;
    const fmt = n => Number(n || 0).toLocaleString('en-US');
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

    // --------------------------------------------------- datos del declarante
    function ejercicio() {
        try { return String(currentEjercicio); } catch (e) { return ''; }
    }
    function rucDeclarante() {
        try { if (currentContribuyente && currentContribuyente.ruc) return String(currentContribuyente.ruc); } catch (e) {}
        const d = document.getElementById('drop-ruc');
        return d ? d.textContent.trim() : '';
    }

    // ------------------------------------------------------------- SheetJS
    let promesaSheetJS = null;
    function cargarSheetJS() {
        if (window.XLSX) return Promise.resolve(window.XLSX);
        if (!promesaSheetJS) {
            promesaSheetJS = new Promise((ok, falla) => {
                const s = document.createElement('script');
                s.src = URL_SHEETJS;
                s.onload = () => window.XLSX ? ok(window.XLSX) : falla(new Error('sin XLSX'));
                s.onerror = () => { promesaSheetJS = null; falla(new Error('sin conexión')); };
                document.head.appendChild(s);
            });
        }
        return promesaSheetJS;
    }

    function leerArchivo(file, comoTexto) {
        return new Promise((ok, falla) => {
            const r = new FileReader();
            r.onload = () => ok(r.result);
            r.onerror = () => falla(r.error);
            if (comoTexto) r.readAsText(file, 'ISO-8859-1'); else r.readAsArrayBuffer(file);
        });
    }

    async function filasExcel(file) {
        let XLSX;
        try { XLSX = await cargarSheetJS(); }
        catch (e) {
            throw ['No se pudo cargar el lector de Excel. Revise su conexión a internet y vuelva a pulsar Importar.'];
        }
        let libro;
        try { libro = XLSX.read(await leerArchivo(file), { type: 'array' }); }
        catch (e) {
            throw ['El archivo no se pudo abrir como Excel. Ábralo en Excel, guárdelo como "Libro de Excel 97-2003 (*.xls)" y vuelva a importarlo.'];
        }
        // Filas y columnas por posición absoluta (fila 1 = índice 0, columna A = 0),
        // aunque el rango usado de la hoja no empiece en A1.
        const hoja = libro.Sheets[libro.SheetNames[0]];
        if (!hoja || !hoja['!ref']) return [];
        const r = XLSX.utils.decode_range(hoja['!ref']);
        const filas = [];
        for (let f = 0; f <= r.e.r; f++) {
            const fila = [];
            for (let c = 0; c <= r.e.c; c++) {
                const celda = hoja[XLSX.utils.encode_cell({ r: f, c: c })];
                fila.push(celda && celda.v != null ? celda.v : '');
            }
            filas.push(fila);
        }
        return filas;
    }

    // Monto de una celda: vacío = 0. Devuelve { valor } o { error }.
    function leerMonto(celda) {
        if (celda === '' || celda == null) return { valor: 0 };
        let n = celda;
        if (typeof n !== 'number') {
            const t = String(n).trim().replace(/,/g, '').replace(/^S\/\.?\s*/i, '');
            if (t === '' || t === '-') return { valor: 0 };
            if (!/^-?\d+(\.\d+)?$/.test(t)) return { error: 'no es un número ("' + celda + '")' };
            n = parseFloat(t);
        }
        if (n < 0) return { error: 'es negativo (' + fmt(n) + '). Ingrese los montos en positivo' };
        if (Math.abs(n - Math.round(n)) > 1e-9) return { error: 'tiene decimales (' + n + '). Ingrese soles enteros, sin decimales' };
        return { valor: Math.round(n) };
    }

    // ------------------------------------------------------ nombre de archivo
    // Devuelve { tipo: 'ACTIVO'|'PASIVO'|'EEGGPP'|'DETALLE', casilla, ext } o lanza errores
    function analizarNombre(nombre, permitidos) {
        const m = /^0710(\d{4})(\d{11})(ACTIVO|PASIVO|EEGGPP|\d{3})\.(xls|xlsx|txt)$/i.exec(nombre.trim());
        const ruc = rucDeclarante(), y = ejercicio();
        const ejemplos = permitidos.map(t => t === 'DETALLE' ? '0710' + y + ruc + '361.TXT'
            : MENSUALES[t] ? '0710' + y + ruc + MENSUALES[t].casilla + '.xls'
            : '0710' + y + ruc + t + '.xls');
        if (!m) {
            throw ['El nombre del archivo "' + nombre + '" no tiene la estructura que pide SUNAT.',
                   'Renombre el archivo así: ' + ejemplos.join('  ·  ') +
                   ' (0710 = formulario, ' + y + ' = ejercicio, ' + ruc + ' = RUC del declarante).'];
        }
        const errores = [];
        const sufijo = m[3].toUpperCase();
        const ext = m[4].toLowerCase();
        const tipo = /^\d{3}$/.test(sufijo) ? (tipoMensual(sufijo) || 'DETALLE') : sufijo;

        if (m[1] !== y) errores.push('El archivo es del ejercicio ' + m[1] + ', pero está declarando el ejercicio ' + y + '. Corrija el año en el nombre del archivo o elija el ejercicio correcto.');
        if (m[2] !== ruc) errores.push('El RUC del nombre del archivo (' + m[2] + ') no es el del declarante (' + ruc + '). Use el RUC de la empresa con la que ingresó.');
        if (permitidos.indexOf(tipo) < 0) {
            const aqui = permitidos.map(t => (PLANTILLAS[t] || MENSUALES[t] || { titulo: 'detalle de la casilla ' + (casillaActual || '') }).titulo).join(' o ');
            errores.push(tipo === 'DETALLE'
                ? 'Este botón importa: ' + aqui + '. El detalle de la casilla ' + sufijo + ' se importa desde el botón verde de esa casilla.'
                : MENSUALES[tipo]
                ? 'Este botón importa: ' + aqui + '. El archivo de la casilla ' + sufijo + ' se importa desde el botón "Importar" de la ventana de la casilla ' + sufijo + ' (pestaña Cred. Contra Imp. Renta).'
                : 'El archivo ' + sufijo + ' no corresponde a esta sección. Impórtelo desde el botón "Importar" de la pestaña ' + PLANTILLAS[sufijo].titulo + '.');
        }
        if (tipo === 'DETALLE' && !CASILLAS_DETALLE[sufijo]) {
            errores.push('La casilla ' + sufijo + ' no admite importación de detalle. Solo se importan las casillas ' + Object.keys(CASILLAS_DETALLE).join(', ') + '.');
        }
        if (tipo !== 'DETALLE' && ext !== 'xls') {
            errores.push('El archivo debe tener la extensión ".xls". En Excel use "Guardar como" > "Libro de Excel 97-2003 (*.xls)".');
        }
        if (errores.length) throw errores;
        return { tipo: tipo, casilla: tipo === 'DETALLE' ? sufijo : null, ext: ext };
    }

    // ----------------------------------------------- plantillas ACTIVO/PASIVO/EEGGPP
    async function importarPlantilla(file, tipo) {
        const p = PLANTILLAS[tipo];
        const filas = await filasExcel(file);
        const conocidas = new Set(p.entradas.concat(p.totales));
        const valores = {}, errores = [];

        // Desde la fila 4 (celda C4): la casilla está en la columna A (PASIVO,
        // EEGGPP) o B (ACTIVO) y el monto siempre en la columna C.
        for (let i = 3; i < filas.length; i++) {
            const f = filas[i] || [];
            const cas = [f[0], f[1]].map(v => String(v).trim().replace(/\.0+$/, '')).find(v => conocidas.has(v));
            if (!cas || cas in valores) continue;
            const r = leerMonto(f[2]);
            if (!r.error) valores[cas] = r.valor;
            else if (p.totales.indexOf(cas) < 0) errores.push('Casilla ' + cas + ' (fila ' + (i + 1) + '): el monto ' + r.error + '.');
        }

        const faltan = p.entradas.filter(c => !(c in valores) && !errores.some(e => e.indexOf('Casilla ' + c + ' ') === 0));
        if (faltan.length > p.entradas.length / 2) {
            throw ['El archivo no tiene la estructura de la plantilla del ' + p.titulo + ' de SUNAT.',
                   'Descargue la plantilla oficial, no agregue ni quite filas o columnas y llene solo la columna "Monto".'];
        }
        if (faltan.length) {
            errores.push('No se encontraron las casillas ' + faltan.join(', ') + '. No modifique la estructura de la plantilla: vuelva a descargarla y copie sus montos.');
        }
        p.excluyentes.forEach(([a, b]) => {
            if ((valores[a] || 0) > 0 && (valores[b] || 0) > 0) {
                errores.push('Las casillas ' + a + ' y ' + b + ' son excluyentes: llene solo una de ellas.');
            }
        });
        if (errores.length) throw errores;

        const avisos = [];
        if (tipo === 'ACTIVO') {
            p.entradas.forEach(c => setCampo(idCasilla(c), valores[c]));
            // Si la casilla tenía detalle importado, el Excel manda: se quita el detalle
            quitarDetallesDe(p.entradas, avisos);
            llamar('calculateActivo');
        } else if (tipo === 'PASIVO') {
            p.entradas.forEach(c => setCampo(idCasilla(c), valores[c]));
            quitarDetallesDe(p.entradas, avisos);
            llamar('calculatePasivo'); llamar('calculatePatrimonio');
        } else {
            ['461', '462', '464', '468', '469', '472', '475', '476', '478', '480', '486', '351', '490']
                .forEach(c => setCampo('er-' + c, valores[c]));

            // 473 = 650 + 651 (si el detalle viene vacío se respeta el 473 del archivo)
            let v650 = valores['650'] || 0, v651 = valores['651'] || 0;
            if (v650 + v651 === 0 && valores['473'] > 0) v650 = valores['473'];
            setCampo('m473-650', v650); setCampo('m473-651', v651);
            setCampo('m473-total', v650 + v651); setCampo('er-473', v650 + v651);

            // 477 = 432 (afectos) + 433 (exonerados)
            let v432 = valores['432'] || 0, v433 = valores['433'] || 0;
            if (v432 + v433 === 0 && valores['477'] > 0) v432 = valores['477'];
            setCampo('m477-432', v432); setCampo('m477-433', v433);
            setCampo('m477-total', v432 + v433); setCampo('er-477', v432 + v433);

            if ((valores['481'] || 0) > 0 || (valores['483'] || 0) > 0) {
                avisos.push('Las casillas 481 / 483 (REI del ejercicio) no se usan en este formulario y no se importaron.');
            }
            llamar('calculateER');
        }
        llamar('recalcularDeterminativa710');

        return { pestana: p.pestana, avisos: avisos };
    }

    // ------------------------------------------------ casillas 128 y 130
    function periodosEjercicio() {
        try { if (Array.isArray(m128Periods) && m128Periods.length) return m128Periods.slice(); } catch (e) {}
        const y = Number(ejercicio());
        const p2 = n => String(n).padStart(2, '0');
        return Array.from({ length: 18 }, (_, i) => p2(i % 12 + 1) + '-' + (i < 12 ? y : y + 1));
    }

    async function importarMensual(file, tipo) {
        const p = MENSUALES[tipo];
        const periodos = periodosEjercicio();               // 'MM-AAAA'
        const filas = await filasExcel(file);
        const valores = {}, errores = [];

        // Desde la fila 4: periodo AAAAMM en la columna A y montos desde la columna B
        for (let i = 3; i < filas.length; i++) {
            const f = filas[i] || [];
            const per = String(f[0]).trim().replace(/\.0+$/, '');
            if (!/^\d{6}$/.test(per)) continue;                 // fila Total o vacía
            const montos = [];
            let conMonto = false;
            p.columnas.forEach((nombre, c) => {
                const r = leerMonto(f[c + 1]);
                if (r.error) errores.push('Periodo ' + per + ', ' + nombre.toLowerCase() + ' (fila ' + (i + 1) + '): el monto ' + r.error + '.');
                else { montos.push(r.valor); if (r.valor > 0) conMonto = true; }
            });
            const idx = periodos.indexOf(per.slice(4) + '-' + per.slice(0, 4));
            if (idx < 0) {
                if (conMonto) errores.push('El periodo ' + per + ' (fila ' + (i + 1) + ') no corresponde al ejercicio ' + ejercicio() + ': solo se aceptan de ' + periodos[0] + ' a ' + periodos[periodos.length - 1] + '.');
                continue;
            }
            if (idx in valores) { errores.push('El periodo ' + per + ' está repetido (fila ' + (i + 1) + '). Deje una sola fila por mes.'); continue; }
            if (montos.length === p.columnas.length) valores[idx] = montos;
        }
        if (!Object.keys(valores).length && !errores.length) {
            throw ['El archivo no tiene la estructura de la plantilla de la casilla ' + p.casilla + ' de SUNAT.',
                   'Descargue la plantilla oficial: los meses (AAAAMM) van en la columna A y los montos desde la celda B4. No agregue ni quite filas o columnas.'];
        }
        if (errores.length) throw errores;

        let total = 0, meses = 0;
        if (tipo === 'C128') {
            if (!document.getElementById('m128-row-0-col1')) llamar('renderM128Rows');
            periodos.forEach((_, idx) => {
                const montos = valores[idx] || [0, 0, 0, 0, 0];
                montos.forEach((v, c) => setCampo('m128-row-' + idx + '-col' + (c + 1), v));
                try { calculateM128Row(idx); } catch (e) {}
                const fila = montos.reduce((a, b) => a + b, 0);
                if (fila > 0) meses++;
                total += fila;
            });
            llamar('calculateM128GrandTotal');
        } else {
            if (!document.getElementById('m130-input-0')) llamar('renderM130Rows');
            periodos.forEach((_, idx) => {
                const v = (valores[idx] || [0])[0];
                setCampo('m130-input-' + idx, v);
                if (v > 0) meses++;
                total += v;
            });
            llamar('calculateM130Total');
        }
        return {
            pestana: null,
            avisos: [meses + ' mes(es) con monto, total S/ ' + fmt(total) + '. Revise los montos y pulse "Guardar" para pasarlos a la casilla ' + p.casilla + '.']
        };
    }

    // Las ventanas 128 y 130 se volvían a dibujar en 0 cada vez que se abrían:
    // ahora conservan lo importado o digitado mientras no cambie el ejercicio.
    function conservarFilas(nombreAbrir, idPrimera, idCuerpo) {
        const original = window[nombreAbrir];
        if (typeof original !== 'function') return;
        window[nombreAbrir] = function () {
            const cuerpo = document.getElementById(idCuerpo);
            const primerPeriodo = periodosEjercicio()[0];
            const vigente = document.getElementById(idPrimera) && cuerpo && cuerpo.textContent.indexOf(primerPeriodo) >= 0;
            if (!vigente) return original.apply(this, arguments);
            const modal = document.getElementById(nombreAbrir.replace('open', '').replace('M', 'm'));
            if (modal) modal.style.display = 'flex';
        };
    }

    // ------------------------------------------------- detalle por casilla
    function validarLinea(campos, n) {
        const err = [];
        const pre = 'Línea ' + n + ': ';
        if (campos.length < 8) return [pre + 'tiene ' + campos.length + ' campo(s); deben ser 8 separados por "|" (tipo|número|indicador|paterno|materno|nombres|razón social|monto).'];
        let [tipo, num, ind, pat, mat, nom, razon, monto] = campos.map(c => String(c == null ? '' : c).trim());
        if (/^\d$/.test(tipo)) tipo = '0' + tipo;          // Excel convierte 01 en 1
        tipo = tipo.toUpperCase();

        if (!TIPOS_DOC[tipo]) err.push(pre + 'el tipo de documento "' + tipo + '" no existe. Use la Tabla 1: 01, 04, 06, 07, 00, 99, A o F.');
        if (tipo !== '99') {
            if (!num) err.push(pre + 'falta el número de documento.');
            else if (num.length > 15) err.push(pre + 'el número de documento tiene más de 15 caracteres.');
            else if (tipo === '01' && !/^\d{8}$/.test(num)) err.push(pre + 'el DNI debe tener 8 dígitos (' + num + ').');
            else if (tipo === '06' && !/^(10|15|16|17|20)\d{9}$/.test(num)) err.push(pre + 'el RUC debe tener 11 dígitos y empezar en 10, 15, 16, 17 o 20 (' + num + ').');
        }
        const admiteRazon = tipo === '06' || tipo === '00';
        if (ind !== '1' && ind !== '0') err.push(pre + 'el indicador debe ser 1 (apellidos y nombres) o 0 (razón social).');
        else if (ind === '0' && !admiteRazon) err.push(pre + 'con tipo de documento ' + tipo + ' el indicador siempre es 1 (apellidos y nombres).');

        if (ind === '1') {
            if (!pat) err.push(pre + 'falta el apellido paterno.');
            if (!nom) err.push(pre + 'faltan los nombres.');
            if (razon) err.push(pre + 'con indicador 1 la razón social va vacía.');
        } else if (ind === '0') {
            if (!razon) err.push(pre + 'falta la razón social.');
            if (pat || mat || nom) err.push(pre + 'con indicador 0 los apellidos y nombres van vacíos.');
        }
        [['apellido paterno', pat, 20], ['apellido materno', mat, 20], ['nombres', nom, 20], ['razón social', razon, 40]]
            .forEach(([etq, v, max]) => { if (v.length > max) err.push(pre + 'el ' + etq + ' pasa de ' + max + ' caracteres.'); });

        const montoTxt = monto.replace(/\.0+$/, '');
        if (!/^\d{1,12}$/.test(montoTxt)) err.push(pre + 'el monto "' + monto + '" debe ser un número entero positivo, sin comas ni puntos decimales (máx. 12 dígitos).');
        else if (Number(montoTxt) === 0) err.push(pre + 'el monto es cero; quite la línea o ingrese el importe.');

        if (err.length) return err;
        return { tipo: tipo, numero: num, indicador: ind, paterno: pat, materno: mat, nombres: nom, razon: razon, monto: Number(montoTxt) };
    }

    async function importarDetalle(file, casilla, ext) {
        let lineas;
        if (ext === 'txt') {
            const texto = await leerArchivo(file, true);
            lineas = texto.split(/\r?\n/).map((l, i) => ({ n: i + 1, campos: l.split('|') }))
                .filter(l => l.campos.join('').trim() !== '');
        } else {
            // Excel: se toman las filas cuya primera columna es un tipo de documento
            lineas = (await filasExcel(file)).map((f, i) => ({ n: i + 1, campos: (f || []).slice(0, 8) }))
                .filter(l => {
                    const t = String(l.campos[0]).trim().toUpperCase();
                    return TIPOS_DOC[t] || TIPOS_DOC['0' + t] || t === '0' || t === '1' || t === '4' || t === '6' || t === '7';
                });
        }
        if (!lineas.length) throw ['El archivo no tiene registros. Cada línea debe ser: tipo|número|indicador|paterno|materno|nombres|razón social|monto'];

        const filas = [], errores = [];
        lineas.forEach(l => {
            const r = validarLinea(l.campos, l.n);
            if (Array.isArray(r)) errores.push(...r); else filas.push(r);
        });
        if (errores.length) throw errores;

        const total = filas.reduce((s, f) => s + f.monto, 0);
        const det = detalles();
        det[casilla] = { archivo: file.name, filas: filas };
        guardarDetalles(det);
        aplicarEstadoDetalle(casilla);
        llamar(Number(casilla) >= 400 ? 'calculatePasivo' : 'calculateActivo');
        llamar('recalcularDeterminativa710');
        return {
            pestana: Number(casilla) >= 400 ? 'pasivo' : 'activo',
            avisos: [filas.length + ' registro(s) por un total de S/ ' + fmt(total) + ' en la casilla ' + casilla + '.']
        };
    }

    // Detalle guardado en un campo oculto dentro del formulario (viaja con el avance)
    function campoDetalle() {
        let el = document.getElementById('imp710-detalle');
        if (!el) {
            el = document.createElement('input');
            el.type = 'hidden';
            el.id = 'imp710-detalle';
            el.value = '{}';
            (document.getElementById('determinativa-area') || document.getElementById('main-content') || document.body).appendChild(el);
        }
        return el;
    }
    function detalles() {
        try { return JSON.parse(campoDetalle().value || '{}') || {}; } catch (e) { return {}; }
    }
    function guardarDetalles(obj) {
        const el = campoDetalle();
        el.value = JSON.stringify(obj);
        el.dispatchEvent(new Event('change', { bubbles: true }));   // dispara el guardado automático
    }
    function quitarDetallesDe(casillas, avisos) {
        const det = detalles();
        const quitadas = casillas.filter(c => det[c]);
        if (!quitadas.length) return;
        quitadas.forEach(c => delete det[c]);
        guardarDetalles(det);
        quitadas.forEach(aplicarEstadoDetalle);
        avisos.push('Se reemplazó el detalle importado de la(s) casilla(s) ' + quitadas.join(', ') + ' por el monto del Excel.');
    }

    function aplicarEstadoDetalle(casilla) {
        const input = document.getElementById(idCasilla(casilla));
        if (!input) return;
        const d = detalles()[casilla];
        const caja = input.closest('.currency-input');
        if (d && d.filas && d.filas.length) {
            input.value = fmt(d.filas.reduce((s, f) => s + f.monto, 0));
            input.readOnly = true;
            input.title = 'Monto del detalle importado (' + d.filas.length + ' registros). Pulse el botón verde para verlo.';
            if (caja) caja.classList.add('highlight-green');
        } else {
            input.readOnly = false;
            input.title = '';
            if (caja) caja.classList.remove('highlight-green');
        }
    }
    function aplicarTodosLosDetalles() {
        Object.keys(CASILLAS_DETALLE).forEach(aplicarEstadoDetalle);
    }

    // ------------------------------------------------------------- utilidades
    function setCampo(id, valor) {
        const el = document.getElementById(id);
        if (el) el.value = fmt(valor);
    }
    function llamar(fn) {
        try { if (typeof window[fn] === 'function') window[fn](); } catch (e) { /* casilla ausente */ }
    }
    function avisarCambio() {
        const el = document.getElementById('ea-359') || campoDetalle();
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // =================================================================== UI
    function insertarEstilos() {
        if (document.getElementById('imp710-estilos')) return;
        const css = document.createElement('style');
        css.id = 'imp710-estilos';
        css.textContent = `
            #imp710-detalle-modal .modal-content { width: 640px; max-width: calc(100vw - 32px); }
            .imp710-nombre { font-family: monospace; background: #f1f1f1; padding: 1px 5px; border-radius: 3px; }
            /* Ventanas "Importar ..." y "Mensaje" con el aspecto del formulario de SUNAT */
            .imp710-ov { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: none; align-items: flex-start; justify-content: center; padding: 8vh 16px 16px; z-index: 2600; box-sizing: border-box; }
            .imp710-ov.ver { display: flex; }
            #imp710-mensaje { z-index: 2700; padding-top: 12vh; }
            .imp710-dlg { background: #fff; width: 625px; max-width: 100%; border-radius: 6px; overflow: hidden; box-shadow: 0 6px 24px rgba(0,0,0,.3); font-family: Roboto, 'Helvetica Neue', Arial, sans-serif; }
            .imp710-hd { background: #0066b3; color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 0 0 18px; min-height: 60px; font-size: 17px; font-weight: 500; }
            .imp710-hd button { background: transparent; border: none; color: #fff; font-size: 26px; font-weight: 700; width: 52px; height: 60px; cursor: pointer; line-height: 1; }
            .imp710-hd button:hover { background: rgba(255,255,255,.12); }
            .imp710-bd { padding: 18px; border-bottom: 1px solid #dee2e6; font-size: 16px; color: #212529; line-height: 1.5; }
            .imp710-bd ul { margin: 8px 0 0; padding-left: 20px; font-size: 14px; }
            .imp710-bd li { margin-bottom: 4px; }
            .imp710-grupo { display: flex; align-items: stretch; border: 1px solid #ced4da; border-radius: 4px; min-height: 40px; cursor: pointer; margin: 0; overflow: hidden; }
            .imp710-grupo:hover, .imp710-grupo:focus-within { border-color: #86b7fe; box-shadow: 0 0 0 3px rgba(13,110,253,.18); }
            .imp710-sel { background: #e9ecef; color: #495057; padding: 8px 13px; border-right: 1px solid #ced4da; white-space: nowrap; display: flex; align-items: center; }
            .imp710-archivo { padding: 8px 12px; color: #212529; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; }
            .imp710-oculto { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
            .imp710-ft { display: flex; justify-content: flex-end; gap: 16px; padding: 18px; }
            .imp710-ft button { font-size: 16px; padding: 8px 13px; border-radius: 4px; cursor: pointer; min-width: 84px; }
            .imp710-cancelar { background: #fff; color: #6c757d; border: 1px solid #6c757d; }
            .imp710-cancelar:hover { background: #f1f3f5; }
            .imp710-aceptar { background: #0066b3; color: #fff; border: 1px solid #0066b3; }
            .imp710-aceptar:hover { background: #00589b; }
            .imp710-aceptar:disabled { opacity: .65; cursor: wait; }
            .imp710-btn-det { flex: 0 0 28px; min-width: 28px; padding: 0; border: 1px solid #81c784; background: #e8f5e9; color: #2e7d32; border-radius: 3px; width: 28px; height: 28px; margin-left: 4px; cursor: pointer; font-size: 12px; }
            .imp710-btn-det:hover { background: #c8e6c9; }
            .imp710-tabla-wrap { max-height: 45vh; overflow: auto; border: 1px solid #ddd; }
            .imp710-tabla { width: 100%; border-collapse: collapse; font-size: 12px; }
            .imp710-tabla th { background: #006699; color: #fff; padding: 6px 8px; text-align: left; position: sticky; top: 0; }
            .imp710-tabla td { padding: 5px 8px; border-top: 1px solid #eee; }
            .imp710-tabla td.num { text-align: right; white-space: nowrap; }
            .imp710-vacio { text-align: center; color: #888; padding: 18px !important; }
            .imp710-total { display: flex; justify-content: flex-end; gap: 12px; align-items: center; margin-top: 10px; font-weight: 700; font-size: 13px; }
            #imp710-det-total { background: #e3f2fd; border: 1px solid #90caf9; padding: 4px 12px; min-width: 130px; text-align: right; color: #1a73e8; }
            .imp710-btn-import { background: #0066B3; color: #fff; border: none; padding: 8px 18px; border-radius: 4px; cursor: pointer; }
            .imp710-btn-borrar { background: #fff; color: #b3261e; border: 1px solid #e6b8b5; padding: 8px 14px; border-radius: 4px; cursor: pointer; margin-right: auto; }
            body.modo-movil .eeff-input-group .currency-input { min-width: 0; }
            @media (max-width: 600px) { .imp710-tabla th:nth-child(1), .imp710-tabla td:nth-child(1) { display: none; } }
        `;
        document.head.appendChild(css);
    }

    function crearModal() {
        if (document.getElementById('imp710-modal')) return;
        insertarEstilos();
        const m = document.createElement('div');
        m.id = 'imp710-modal';
        m.className = 'imp710-ov';
        m.innerHTML = `
            <div class="imp710-dlg" role="dialog" aria-modal="true" aria-labelledby="imp710-titulo">
                <div class="imp710-hd"><span id="imp710-titulo">Importar</span><button type="button" data-cerrar aria-label="Cerrar">&times;</button></div>
                <div class="imp710-bd">
                    <label class="imp710-grupo" for="imp710-file">
                        <span class="imp710-sel">Seleccionar archivo</span>
                        <span class="imp710-archivo" id="imp710-archivo">Seleccionar archivo</span>
                    </label>
                    <input type="file" id="imp710-file" class="imp710-oculto">
                </div>
                <div class="imp710-ft">
                    <button type="button" class="imp710-cancelar" data-cerrar>Cancelar</button>
                    <button type="button" class="imp710-aceptar" id="imp710-ok">Aceptar</button>
                </div>
            </div>`;
        document.body.appendChild(m);
        m.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', cerrarModal));
        document.getElementById('imp710-ok').addEventListener('click', ejecutarImportacion);
        document.getElementById('imp710-file').addEventListener('change', e => {
            const f = e.target.files[0];
            document.getElementById('imp710-archivo').textContent = f ? f.name : 'Seleccionar archivo';
        });

        const msg = document.createElement('div');
        msg.id = 'imp710-mensaje';
        msg.className = 'imp710-ov';
        msg.innerHTML = `
            <div class="imp710-dlg" role="alertdialog" aria-modal="true" aria-labelledby="imp710-mensaje-tit">
                <div class="imp710-hd"><span id="imp710-mensaje-tit">Mensaje</span></div>
                <div class="imp710-bd" id="imp710-mensaje-texto"></div>
                <div class="imp710-ft"><button type="button" class="imp710-aceptar" id="imp710-mensaje-ok">Aceptar</button></div>
            </div>`;
        document.body.appendChild(msg);
        document.getElementById('imp710-mensaje-ok').addEventListener('click', () => msg.classList.remove('ver'));

        const d = document.createElement('div');
        d.id = 'imp710-detalle-modal';
        d.className = 'modal-overlay';
        d.style.zIndex = '2550';
        d.innerHTML = `
            <div class="modal-content" role="dialog" aria-labelledby="imp710-det-titulo">
                <div class="modal-header"><h4 id="imp710-det-titulo">Detalle</h4><span class="close-modal" data-cerrar>&times;</span></div>
                <div class="modal-body">
                    <p id="imp710-det-sub" style="margin:0 0 12px;font-size:13px;color:#444;"></p>
                    <div class="imp710-tabla-wrap">
                        <table class="imp710-tabla">
                            <thead><tr><th>Tipo doc.</th><th>N° documento</th><th>Apellidos y nombres / Razón social</th><th style="text-align:right">Monto</th></tr></thead>
                            <tbody id="imp710-det-body"></tbody>
                        </table>
                    </div>
                    <div class="imp710-total"><span>Total casilla <span id="imp710-det-cas"></span></span><span id="imp710-det-total">S/ 0</span></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="imp710-btn-borrar" id="imp710-det-borrar"><i class="fas fa-trash-alt"></i> Eliminar detalle</button>
                    <button type="button" class="btn-modal-cancel" data-cerrar>Cerrar</button>
                    <button type="button" class="imp710-btn-import" id="imp710-det-importar"><i class="fas fa-file-import"></i> Importar</button>
                </div>
            </div>`;
        document.body.appendChild(d);
        d.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', () => { d.style.display = 'none'; }));
        d.addEventListener('click', e => { if (e.target === d) d.style.display = 'none'; });
        document.getElementById('imp710-det-importar').addEventListener('click', () =>
            abrirImportar(['DETALLE'], d.dataset.casilla));
        document.getElementById('imp710-det-borrar').addEventListener('click', () => {
            const c = d.dataset.casilla;
            if (!detalles()[c]) return;
            if (!confirm('Se borrará el detalle importado de la casilla ' + c + ' y la casilla quedará en 0 para que la llene a mano. ¿Continuar?')) return;
            const det = detalles(); delete det[c]; guardarDetalles(det);
            aplicarEstadoDetalle(c);
            setCampo(idCasilla(c), 0);
            llamar(Number(c) >= 400 ? 'calculatePasivo' : 'calculateActivo');
            llamar('recalcularDeterminativa710');
            avisarCambio();
            pintarDetalle(c);
        });
    }

    let permitidosActual = [];
    let casillaActual = null;

    function abrirImportar(permitidos, casilla) {
        crearModal();
        permitidosActual = permitidos;
        casillaActual = casilla || null;
        const file = document.getElementById('imp710-file');
        const mensual = MENSUALES[permitidos[0]];
        let titulo;
        if (mensual) {
            titulo = 'Importar ' + mensual.titulo;
            file.accept = '.xls,.xlsx';
        } else if (casillaActual) {
            titulo = 'Importar detalle de la casilla ' + casillaActual;
            file.accept = '.txt,.TXT,.xls,.xlsx';
        } else {
            // El botón del Estado de Situación Financiera se titula según la pestaña visible
            const pasivo = document.getElementById('eeff-pasivo');
            const enPasivo = permitidos.length > 1 && pasivo && pasivo.style.display !== 'none';
            titulo = 'Importar ' + (enPasivo ? PLANTILLAS.PASIVO.titulo : PLANTILLAS[permitidos[0]].titulo);
            file.accept = '.xls,.xlsx';
        }
        document.getElementById('imp710-titulo').textContent = titulo;
        file.value = '';
        document.getElementById('imp710-archivo').textContent = 'Seleccionar archivo';
        document.getElementById('imp710-modal').classList.add('ver');
    }

    function cerrarModal() {
        const m = document.getElementById('imp710-modal');
        if (m) m.classList.remove('ver');
    }

    // Ventana "Mensaje" (texto principal + lista opcional)
    function mensaje(texto, lista) {
        crearModal();
        document.getElementById('imp710-mensaje-texto').innerHTML = esc(texto) +
            (lista && lista.length ? '<ul>' + lista.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '');
        document.getElementById('imp710-mensaje').classList.add('ver');
        document.getElementById('imp710-mensaje-ok').focus();
    }

    async function ejecutarImportacion() {
        const file = document.getElementById('imp710-file').files[0];
        if (!file) { mensaje('Debe seleccionar un archivo. Pulse "Seleccionar archivo" y elija el archivo a importar.'); return; }
        const boton = document.getElementById('imp710-ok');
        boton.disabled = true;
        try {
            const info = analizarNombre(file.name, permitidosActual);
            if (info.tipo === 'DETALLE' && casillaActual && info.casilla !== casillaActual) {
                throw ['Está importando el detalle de la casilla ' + casillaActual + ', pero el archivo es de la casilla ' + info.casilla + '. Renómbrelo como 0710' + ejercicio() + rucDeclarante() + casillaActual + '.TXT o ábralo desde la casilla ' + info.casilla + '.'];
            }
            const r = info.tipo === 'DETALLE' ? await importarDetalle(file, info.casilla, info.ext)
                : MENSUALES[info.tipo] ? await importarMensual(file, info.tipo)
                : await importarPlantilla(file, info.tipo);
            avisarCambio();
            cerrarModal();
            if (r.pestana && typeof window.switchEEFF === 'function') window.switchEEFF(r.pestana);
            if (info.tipo === 'DETALLE') pintarDetalle(info.casilla);
            mensaje('Se cargó la información correctamente', r.avisos);
        } catch (e) {
            const lista = Array.isArray(e) ? e : ['Ocurrió un error inesperado al leer el archivo (' + (e && e.message || e) + '). Verifique que sea la plantilla correcta y vuelva a intentar.'];
            const visibles = lista.slice(0, 15);
            if (lista.length > visibles.length) visibles.push('… y ' + (lista.length - visibles.length) + ' observación(es) más.');
            mensaje('No se cargó la información. Corrija lo siguiente y vuelva a importar:', visibles);
        } finally {
            boton.disabled = false;
        }
    }

    function abrirDetalle(casilla) {
        crearModal();
        const d = document.getElementById('imp710-detalle-modal');
        d.dataset.casilla = casilla;
        document.getElementById('imp710-det-titulo').textContent = 'Detalle de la Casilla ' + casilla;
        pintarDetalle(casilla);
        d.style.display = 'flex';
    }

    function pintarDetalle(casilla) {
        const d = detalles()[casilla];
        const filas = (d && d.filas) || [];
        document.getElementById('imp710-det-sub').innerHTML = '<strong>' + esc(CASILLAS_DETALLE[casilla]) + '</strong>' +
            (d ? '<br>Importado de: <span class="imp710-nombre">' + esc(d.archivo) + '</span>'
               : '<br>Aún no hay detalle. Pulse <strong>Importar</strong> para cargar el archivo de terceros, o cierre y escriba el monto directamente en la casilla.');
        document.getElementById('imp710-det-body').innerHTML = filas.length
            ? filas.map(f => '<tr><td>' + esc(f.tipo) + ' - ' + esc(TIPOS_DOC[f.tipo] || '') + '</td><td>' + esc(f.numero) + '</td><td>' +
                esc(f.indicador === '0' ? f.razon : [f.paterno, f.materno, f.nombres].filter(Boolean).join(' ')) +
                '</td><td class="num">' + fmt(f.monto) + '</td></tr>').join('')
            : '<tr><td colspan="4" class="imp710-vacio">No hay registros disponibles</td></tr>';
        document.getElementById('imp710-det-cas').textContent = casilla;
        document.getElementById('imp710-det-total').textContent = 'S/ ' + fmt(filas.reduce((s, f) => s + f.monto, 0));
        document.getElementById('imp710-det-borrar').style.visibility = filas.length ? 'visible' : 'hidden';
    }

    // ------------------------------------------------------------ enganche
    function montarBotones() {
        document.querySelectorAll('#determinativa-area .btn-import-blue').forEach(b => {
            // El clic lo maneja el onclick del HTML (FV710Importar.abrir); aquí solo el texto de ayuda
            b.title = b.closest('#eeff-resultados')
                ? 'Importar el Estado de Resultados desde la plantilla Excel de SUNAT'
                : 'Importar el Activo o el Pasivo y Patrimonio desde la plantilla Excel de SUNAT';
        });

        Object.keys(CASILLAS_DETALLE).forEach(c => {
            const input = document.getElementById(idCasilla(c));
            const grupo = input && input.closest('.eeff-input-group');
            if (!grupo || grupo.querySelector('.imp710-btn-det')) return;
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'imp710-btn-det';
            b.innerHTML = '<i class="fas fa-list-ul"></i>';
            b.title = 'Detalle de la casilla ' + c + ' (importar terceros)';
            b.setAttribute('aria-label', b.title);
            b.addEventListener('click', () => abrirDetalle(c));
            grupo.appendChild(b);
        });
        campoDetalle();
    }

    // Al restaurar el avance (aplicarEjercicio) se vuelve a pintar el detalle
    function engancharRestauracion() {
        if (typeof window.aplicarEjercicio !== 'function') return;
        const original = window.aplicarEjercicio;
        window.aplicarEjercicio = function () {
            const r = original.apply(this, arguments);
            aplicarTodosLosDetalles();
            return r;
        };
    }

    function iniciar() {
        insertarEstilos();
        montarBotones();
        conservarFilas('openModal128', 'm128-row-0-col1', 'm128-tbody');
        conservarFilas('openModal130', 'm130-input-0', 'm130-rows-container');
        engancharRestauracion();
        aplicarTodosLosDetalles();
    }

    window.FV710Importar = { abrir: abrirImportar, detalle: abrirDetalle };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();
