// =============================================================================
// FV 621 (declaraciones.html) · Versión móvil
// -----------------------------------------------------------------------------
// Botón "Versión móvil" en la barra azul: acomoda el formulario a la pantalla
// del teléfono y convierte el menú "Mis declaraciones y pagos" en un panel que
// se abre con el botón "Menú". La preferencia se recuerda en este equipo.
// Se carga al final de declaraciones.html.
// =============================================================================
(function () {
    'use strict';

    const PREF_MOVIL = 'taxlab_621_movil';   // preferencia de pantalla (no es avance)

    function esMovil() { return document.body.classList.contains('modo-movil'); }

    function alternarMenu(abrir) {
        const abierto = typeof abrir === 'boolean' ? abrir : !document.body.classList.contains('menu-621-abierto');
        document.body.classList.toggle('menu-621-abierto', abierto && esMovil());
    }

    function aplicarModoMovil(activo, recordar) {
        document.body.classList.toggle('modo-movil', activo);
        if (!activo) alternarMenu(false);
        const b = document.getElementById('btn-movil-621');
        if (b) {
            b.innerHTML = activo
                ? '<i class="fas fa-desktop"></i> Versión escritorio'
                : '<i class="fas fa-mobile-alt"></i> Versión móvil';
            b.title = activo ? 'Ver el formulario como en una computadora' : 'Acomodar el formulario a la pantalla del teléfono';
        }
        if (recordar) { try { localStorage.setItem(PREF_MOVIL, activo ? '1' : '0'); } catch (e) {} }
    }

    function montarBotones() {
        const fecha = document.getElementById('current-datetime');
        if (!fecha || document.getElementById('btn-movil-621')) return;

        // La fecha y los botones van juntos, a la izquierda de la barra azul
        const grupo = document.createElement('div');
        grupo.className = 'fecha-621';
        fecha.parentNode.insertBefore(grupo, fecha);
        grupo.appendChild(fecha);

        const menu = document.createElement('button');
        menu.type = 'button';
        menu.id = 'btn-menu-621';
        menu.className = 'btn-movil-621 btn-menu-621';
        menu.innerHTML = '<i class="fas fa-bars"></i> Menú';
        menu.title = 'Abrir el menú Mis declaraciones y pagos';
        menu.addEventListener('click', e => { e.stopPropagation(); alternarMenu(); });

        const modo = document.createElement('button');
        modo.type = 'button';
        modo.id = 'btn-movil-621';
        modo.className = 'btn-movil-621';
        modo.addEventListener('click', () => aplicarModoMovil(!esMovil(), true));

        grupo.appendChild(menu);
        grupo.appendChild(modo);

        const fondo = document.createElement('div');
        fondo.className = 'fondo-menu-621';
        fondo.addEventListener('click', () => alternarMenu(false));
        document.body.appendChild(fondo);

        // Al elegir un formulario del menú en el teléfono, el menú se cierra
        const sidebar = document.querySelector('.decl-sidebar');
        if (sidebar) {
            sidebar.addEventListener('click', e => {
                if (esMovil() && e.target.closest('.tree-leaf a')) alternarMenu(false);
            });
        }
    }

    function iniciar() {
        montarBotones();
        let pref = null;
        try { pref = localStorage.getItem(PREF_MOVIL); } catch (e) {}
        // Sin preferencia guardada: en pantallas de teléfono empieza en versión móvil
        const ancho = window.innerWidth || document.documentElement.clientWidth || 0;
        aplicarModoMovil(pref === null ? (ancho > 0 && ancho <= 768) : pref === '1', false);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();
