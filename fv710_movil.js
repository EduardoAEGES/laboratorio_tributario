// =============================================================================
// FV 710 · Versión móvil y guardado automático del avance
// -----------------------------------------------------------------------------
// 1) Botón "Versión móvil" en la barra azul: acomoda el formulario a la
//    pantalla del teléfono (casillas en una columna, menú lateral plegable).
//    La preferencia se recuerda en esta computadora/teléfono.
// 2) Lo que el alumno llena se guarda solo, por empresa y ejercicio, con
//    SimStore (clave sire_fv710_<ejercicio>): en el acceso público queda en el
//    localStorage del equipo; los roles que guardan avance también lo suben a
//    Supabase. "Reiniciar simulación" lo borra junto con el resto.
// Se carga al final de dashboard.html, después del script principal.
// =============================================================================
(function () {
    'use strict';

    const PREF_MOVIL = 'taxlab_710_movil';          // preferencia de pantalla (no es avance)
    const CLAVE_ULTIMO = 'sire_fv710_ultimo';
    const claveEjercicio = y => 'sire_fv710_' + y;

    const SECCIONES_FORM = {
        informativa: 'Sección Informativa - Identificación',
        informativa_complementaria: 'Sección Informativa - Complementaria',
        determinativa: 'Sección Determinativa - Estados Financieros',
        determinativa_eeff: 'Sección Determinativa - Estados Financieros',
        determinativa_impuesto: 'Sección Determinativa - Impuesto a la Renta',
        determinativa_creditos: 'Sección Determinativa - Créditos contra el impuesto',
        determinativa_deuda: 'Sección Determinativa - Determinación de la deuda'
    };

    // Campos que no forman parte de la declaración
    const EXCLUIR_ID = /^(select-ejercicio|consulta-ejercicio|m128-row-|m130-input-|prof-)/;
    const EXCLUIR_ZONA = '#view-pasarela, #view-constancia-710, #view-consulta-pagos, .pg-ov';

    // ---------------------------------------------------------------- almacén
    function leer(clave) {
        try {
            const v = window.SimStore ? SimStore.getItem(clave) : localStorage.getItem(clave);
            return v ? JSON.parse(v) : null;
        } catch (e) { return null; }
    }
    function escribir(clave, obj) {
        try {
            const v = JSON.stringify(obj);
            if (window.SimStore) SimStore.setItem(clave, v); else localStorage.setItem(clave, v);
            return true;
        } catch (e) { return false; }
    }
    function borrar(clave) {
        try {
            if (window.SimStore) SimStore.removeItem(clave); else localStorage.removeItem(clave);
        } catch (e) { /* almacenamiento no disponible */ }
    }
    function prefMovil() {
        try { return localStorage.getItem(PREF_MOVIL); } catch (e) { return null; }
    }

    // ------------------------------------------------------------ versión móvil
    function esMovil() { return document.body.classList.contains('modo-movil'); }

    function aplicarModoMovil(activo, recordar) {
        document.body.classList.toggle('modo-movil', activo);
        if (!activo) document.body.classList.remove('menu-710-abierto');
        const b = document.getElementById('btn-movil-710');
        if (b) {
            b.innerHTML = activo
                ? '<i class="fas fa-desktop"></i> Versión escritorio'
                : '<i class="fas fa-mobile-alt"></i> Versión móvil';
            b.title = activo ? 'Ver el formulario como en una computadora' : 'Acomodar el formulario a la pantalla del teléfono';
        }
        if (recordar) { try { localStorage.setItem(PREF_MOVIL, activo ? '1' : '0'); } catch (e) {} }
    }

    function alternarMenu(abrir) {
        const abierto = typeof abrir === 'boolean' ? abrir : !document.body.classList.contains('menu-710-abierto');
        document.body.classList.toggle('menu-710-abierto', abierto);
    }

    function montarBotones() {
        // Van junto a la fecha (a la izquierda de la barra azul), donde sobra
        // espacio, para no apretar Domicilio / Perfil / Menú principal / Salir.
        const barra = document.querySelector('.blue-info-bar .info-left');
        if (!barra || document.getElementById('btn-movil-710')) return;
        barra.classList.add('info-left-710');

        const menu = document.createElement('button');
        menu.type = 'button';
        menu.id = 'btn-menu-710';
        menu.className = 'btn-movil-710 btn-menu-710';
        menu.innerHTML = '<i class="fas fa-bars"></i> Menú';
        menu.title = 'Abrir el menú Mis declaraciones y pagos';
        menu.addEventListener('click', () => alternarMenu());

        const modo = document.createElement('button');
        modo.type = 'button';
        modo.id = 'btn-movil-710';
        modo.className = 'btn-movil-710';
        modo.addEventListener('click', () => aplicarModoMovil(!esMovil(), true));

        barra.appendChild(menu);
        barra.appendChild(modo);

        const fondo = document.createElement('div');
        fondo.className = 'fondo-menu-710';
        fondo.addEventListener('click', () => alternarMenu(false));
        document.body.appendChild(fondo);

        // Al elegir una opción del menú en el teléfono, el menú se cierra
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.addEventListener('click', e => {
                if (esMovil() && e.target.closest('a, .btn-home')) alternarMenu(false);
            });
        }
    }

    // --------------------------------------------------------- captura / carga
    let seccionActual = null;      // última sección del formulario visitada
    let formularioActivo = false;  // hay un ejercicio en curso

    function camposFormulario() {
        const raiz = document.getElementById('main-content');
        if (!raiz) return [];
        return Array.from(raiz.querySelectorAll('input[id], select[id], textarea[id]')).filter(el =>
            !EXCLUIR_ID.test(el.id) &&
            !el.closest(EXCLUIR_ZONA) &&
            el.type !== 'password' && el.type !== 'file' && el.type !== 'button' && el.type !== 'radio'
        );
    }

    function radiosFormulario() {
        const raiz = document.getElementById('main-content');
        const grupos = {};
        if (!raiz) return grupos;
        raiz.querySelectorAll('input[type="radio"][name]').forEach(r => {
            if (r.name === 'pay-method' || r.closest(EXCLUIR_ZONA)) return;
            (grupos[r.name] = grupos[r.name] || []).push(r);
        });
        return grupos;
    }

    function copia(v) {
        try { return JSON.parse(JSON.stringify(v)); } catch (e) { return null; }
    }

    function capturar() {
        const campos = {};
        camposFormulario().forEach(el => {
            campos[el.id] = el.type === 'checkbox' ? !!el.checked : el.value;
        });
        const radios = {};
        Object.entries(radiosFormulario()).forEach(([nombre, lista]) => {
            radios[nombre] = lista.findIndex(r => r.checked);
        });
        const datos = { campos: campos, radios: radios, fecha: new Date().toISOString() };
        try { datos.entries108 = copia(entries108); } catch (e) {}
        try { datos.entries297 = copia(entries297); } catch (e) {}
        try { datos.paymentRecords = copia(paymentRecords); } catch (e) {}
        if (window.ultimoPago710) datos.ultimoPago710 = copia(window.ultimoPago710);
        return datos;
    }

    let avisoTimer = null;
    function avisarGuardado() {
        let t = document.getElementById('guardado-710');
        if (!t) {
            t = document.createElement('div');
            t.id = 'guardado-710';
            t.className = 'guardado-710';
            t.innerHTML = '<i class="fas fa-check"></i> Avance guardado';
            document.body.appendChild(t);
        }
        t.classList.add('ver');
        clearTimeout(avisoTimer);
        avisoTimer = setTimeout(() => t.classList.remove('ver'), 1200);
    }

    let guardarTimer = null;
    function programarGuardado() {
        if (!formularioActivo) return;
        clearTimeout(guardarTimer);
        guardarTimer = setTimeout(guardarAhora, 700);
    }

    function guardarAhora() {
        if (!formularioActivo || typeof currentEjercicio === 'undefined') return;
        const y = String(currentEjercicio);
        const datos = capturar();
        datos.seccion = seccionActual;
        const ok = escribir(claveEjercicio(y), datos);
        escribir(CLAVE_ULTIMO, { ejercicio: y, seccion: seccionActual, fecha: datos.fecha });
        if (ok) avisarGuardado();
    }

    function recalcularTodo() {
        ['calculateActivo', 'calculatePasivo', 'calculatePatrimonio', 'calculateTotalPasPat',
         'calculateER', 'calculateM127', 'recalcularDeterminativa710'].forEach(fn => {
            try { if (typeof window[fn] === 'function') window[fn](); } catch (e) { /* casilla ausente */ }
        });
    }

    function restaurar(y) {
        const datos = leer(claveEjercicio(y));
        if (!datos || !datos.campos) return false;

        Object.entries(datos.campos).forEach(([id, valor]) => {
            const el = document.getElementById(id);
            if (!el || EXCLUIR_ID.test(id)) return;
            if (el.type === 'checkbox') el.checked = !!valor;
            else if (el.tagName === 'SELECT' && valor && !Array.from(el.options).some(o => (o.value || o.text) === valor)) {
                return;   // la opción ya no existe en este ejercicio
            } else el.value = valor;
        });
        const grupos = radiosFormulario();
        Object.entries(datos.radios || {}).forEach(([nombre, idx]) => {
            const r = grupos[nombre] && grupos[nombre][idx];
            if (r) {
                r.checked = true;
                r.dispatchEvent(new Event('change', { bubbles: true }));
                r.dispatchEvent(new Event('click', { bubbles: false }));
            }
        });

        try { if (Array.isArray(datos.entries108)) { entries108 = datos.entries108; renderTable108(); } } catch (e) {}
        try { if (Array.isArray(datos.entries297)) { entries297 = datos.entries297; renderTable297(); } } catch (e) {}
        try {
            if (Array.isArray(datos.paymentRecords)) { paymentRecords = datos.paymentRecords; renderConsultaTable(); }
        } catch (e) {}
        if (datos.ultimoPago710) window.ultimoPago710 = datos.ultimoPago710;

        recalcularTodo();
        return true;
    }

    // ---------------------------------------- aviso "continuar donde me quedé"
    function fechaLegible(iso) {
        try {
            const d = new Date(iso);
            return d.toLocaleDateString('es-PE') + ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        } catch (e) { return ''; }
    }

    function pintarAviso() {
        document.querySelectorAll('.aviso-avance-710').forEach(a => a.remove());
        const ult = leer(CLAVE_ULTIMO);
        if (!ult || !ult.ejercicio || !leer(claveEjercicio(ult.ejercicio))) return;

        const donde = SECCIONES_FORM[ult.seccion] || 'Sección Informativa';
        ['view-welcome', 'view-renta-710'].forEach(idVista => {
            const vista = document.getElementById(idVista);
            if (!vista) return;
            const aviso = document.createElement('div');
            aviso.className = 'aviso-avance-710';
            aviso.innerHTML =
                '<strong><i class="fas fa-save"></i> Tienes una declaración guardada del ejercicio ' + ult.ejercicio + '.</strong><br>' +
                'Te quedaste en: ' + donde + (ult.fecha ? ' (' + fechaLegible(ult.fecha) + ')' : '') + '.<br>' +
                'Pulsa <em>Continuar</em> para seguir llenándola o <em>Empezar de cero</em> para borrarla.' +
                '<div class="acciones">' +
                '<button type="button" class="continuar"><i class="fas fa-play"></i> Continuar donde me quedé</button>' +
                '<button type="button" class="descartar"><i class="fas fa-eraser"></i> Empezar de cero</button>' +
                '</div>';
            aviso.querySelector('.continuar').addEventListener('click', () => continuar(ult));
            aviso.querySelector('.descartar').addEventListener('click', () => descartar(ult.ejercicio));
            vista.insertBefore(aviso, vista.firstChild);
        });
    }

    function continuar(ult) {
        if (typeof aplicarEjercicio === 'function') aplicarEjercicio(ult.ejercicio);   // también restaura
        const destino = SECCIONES_FORM[ult.seccion] ? ult.seccion : 'informativa';
        if (typeof switchSection === 'function') switchSection(destino);
        alternarMenu(false);
        window.scrollTo(0, 0);
    }

    function descartar(y) {
        if (!confirm('Se borrará lo que llenaste del ejercicio ' + y + ' y empezarás con el formulario en blanco. ¿Continuar?')) return;
        borrar(claveEjercicio(y));
        borrar(CLAVE_ULTIMO);
        window.location.reload();
    }

    // ------------------------------------------ enganche con el script principal
    function engancharFunciones() {
        if (typeof window.aplicarEjercicio === 'function') {
            const original = window.aplicarEjercicio;
            window.aplicarEjercicio = function (valor) {
                const r = original.apply(this, arguments);
                if (valor) restaurar(String(parseInt(valor, 10)));
                return r;
            };
        }
        if (typeof window.switchSection === 'function') {
            const original = window.switchSection;
            window.switchSection = function (section) {
                const r = original.apply(this, arguments);
                if (SECCIONES_FORM[section]) {
                    seccionActual = section;
                    formularioActivo = true;
                    guardarAhora();
                } else if (section === 'form_selection') {
                    formularioActivo = false;
                    pintarAviso();
                }
                window.scrollTo(0, 0);
                return r;
            };
        }
        if (typeof window.registrarPago710 === 'function') {
            const original = window.registrarPago710;
            window.registrarPago710 = function () {
                const r = original.apply(this, arguments);
                formularioActivo = true;
                guardarAhora();
                return r;
            };
        }
    }

    function iniciar() {
        montarBotones();
        const pref = prefMovil();
        // Sin preferencia guardada: en pantallas de teléfono empieza en versión móvil
        const ancho = window.innerWidth || document.documentElement.clientWidth || 0;
        aplicarModoMovil(pref === null ? (ancho > 0 && ancho <= 768) : pref === '1', false);

        engancharFunciones();
        pintarAviso();

        // Guardado automático mientras se llena el formulario
        ['input', 'change', 'focusout'].forEach(ev =>
            document.addEventListener(ev, e => {
                if (e.target && e.target.closest && e.target.closest('#main-content, .modal-content, .modal-custom')) programarGuardado();
            }, true));
        // Los asistentes de casillas (108, 297, 128...) guardan al pulsar sus botones
        document.addEventListener('click', e => {
            if (e.target && e.target.closest && e.target.closest('button')) programarGuardado();
        }, true);
        window.addEventListener('pagehide', () => { if (formularioActivo) guardarAhora(); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();
