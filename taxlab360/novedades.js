// =============================================================================
// Novedades del simulador (portal SOL)
// -----------------------------------------------------------------------------
// La asistente de CERTUS aparece en la columna izquierda del portal SOL, solo
// en computadora, con una burbuja que va mostrando las actualizaciones y
// aclaraciones. Para avisar algo nuevo basta con agregar un elemento AL INICIO
// de la lista NOVEDADES (la primera es la que se muestra primero).
// =============================================================================
(function () {
    'use strict';

    const NOVEDADES = [
        {
            fecha: '04/10/2026',
            texto: 'En el <strong>FV 710</strong> ya puedes <strong>Importar</strong> los Estados Financieros con las plantillas Excel de SUNAT.'
        },
        {
            fecha: '04/10/2026',
            texto: 'Las casillas <strong>128</strong> (pagos a cuenta) y <strong>130</strong> (retenciones) del FV 710 también se importan desde Excel.'
        },
        {
            fecha: '04/10/2026',
            texto: 'Nuevas pestañas <strong>ITAN</strong> y <strong>NIIF</strong> en el FV 710. Si marcas <strong>Si</strong> en ITAN se habilita la casilla <strong>131</strong>.'
        },
        {
            fecha: '03/10/2026',
            texto: 'En el <strong>FV 621</strong> y el <strong>FV 710</strong>, luego de realizar la declaración ya aparecen los <strong>reportes de declaración</strong>.'
        },
        {
            fecha: '03/10/2026',
            texto: '¿Estás en el celular? El FV 621 y el FV 710 tienen el botón <strong>Versión móvil</strong> en la barra azul.'
        },
        {
            fecha: '03/10/2026',
            texto: 'El <strong>FV 621</strong> y el <strong>FV 710</strong> guardan solo lo que vas llenando. Al volver, pulsa <strong>Continuar donde me quedé</strong>.'
        },
        {
            fecha: '03/10/2026',
            texto: 'Practica el <strong>Registro de Ventas (14.1)</strong> y de <strong>Compras (8.1)</strong> con el botón verde de arriba.'
        }
    ];

    const CAMBIO_CADA_MS = 9000;

    const ESTILOS = `
        .asis-nov { display: none; position: relative; margin: 18px 0 8px; height: 300px; }
        @media (min-width: 1025px) { .asis-nov { display: block; } #info-sin-clave-sol.con-asistente { margin-top: 0; } }
        .asis-nov__burbuja {
            position: relative; z-index: 1; background: #fff; border: 2px solid #0b4a8b; border-radius: 14px;
            padding: 10px 12px 8px; font: 13px/1.4 'Roboto', sans-serif; color: #26313d;
            box-shadow: 0 4px 14px rgba(11, 74, 139, .15); min-height: 74px;
        }
        .asis-nov__burbuja::after, .asis-nov__burbuja::before {
            content: ''; position: absolute; left: 58px; border-style: solid; border-color: transparent;
        }
        .asis-nov__burbuja::before { bottom: -14px; border-width: 14px 10px 0; border-top-color: #0b4a8b; }
        .asis-nov__burbuja::after  { bottom: -10px; left: 60px; border-width: 11px 8px 0; border-top-color: #fff; }
        .asis-nov__tag {
            display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700;
            color: #fff; background: #0b4a8b; border-radius: 10px; padding: 2px 8px; margin-bottom: 5px;
        }
        .asis-nov__texto { transition: opacity .25s; }
        .asis-nov__texto strong { color: #0b4a8b; }
        .asis-nov__nav { display: flex; align-items: center; justify-content: flex-end; gap: 6px; margin-top: 4px; }
        .asis-nov__nav button {
            border: none; background: #eef3f9; color: #0b4a8b; width: 22px; height: 22px; border-radius: 50%;
            cursor: pointer; font-size: 11px; line-height: 22px; padding: 0;
        }
        .asis-nov__nav button:hover { background: #d9e6f5; }
        .asis-nov__cuenta { font-size: 11px; color: #6b7785; }
        .asis-nov__img {
            position: absolute; left: 6px; bottom: 0; height: 160px; width: auto;
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, .12)); user-select: none; pointer-events: none;
        }
    `;

    function iniciar() {
        const ancla = document.getElementById('info-clave-sol');
        if (!ancla || document.getElementById('asis-nov') || !NOVEDADES.length) return;

        const estilo = document.createElement('style');
        estilo.textContent = ESTILOS;
        document.head.appendChild(estilo);

        const caja = document.createElement('div');
        caja.className = 'asis-nov';
        caja.id = 'asis-nov';
        caja.setAttribute('aria-live', 'polite');
        caja.innerHTML =
            '<div class="asis-nov__burbuja">' +
                '<div class="asis-nov__tag"><i class="fas fa-bullhorn"></i> <span id="asis-nov-fecha"></span></div>' +
                '<div class="asis-nov__texto" id="asis-nov-texto"></div>' +
                (NOVEDADES.length > 1
                    ? '<div class="asis-nov__nav">' +
                        '<button type="button" id="asis-nov-ant" title="Novedad anterior"><i class="fas fa-chevron-left"></i></button>' +
                        '<span class="asis-nov__cuenta" id="asis-nov-cuenta"></span>' +
                        '<button type="button" id="asis-nov-sig" title="Siguiente novedad"><i class="fas fa-chevron-right"></i></button>' +
                      '</div>'
                    : '') +
            '</div>' +
            '<img class="asis-nov__img" src="asistente_certus.webp" alt="Asistente de CERTUS">';
        ancla.parentNode.insertBefore(caja, ancla.nextSibling);

        // El espacio que antes separaba los dos textos ahora lo ocupa la asistente
        const sinClave = document.getElementById('info-sin-clave-sol');
        if (sinClave) sinClave.classList.add('con-asistente');

        let actual = 0;
        let timer = null;
        const texto = document.getElementById('asis-nov-texto');

        function pintar() {
            const n = NOVEDADES[actual];
            document.getElementById('asis-nov-fecha').textContent = 'Actualización al ' + n.fecha;
            texto.innerHTML = n.texto;
            const cuenta = document.getElementById('asis-nov-cuenta');
            if (cuenta) cuenta.textContent = (actual + 1) + ' / ' + NOVEDADES.length;
            texto.style.opacity = 1;
        }

        function mostrar(i) {
            actual = (i + NOVEDADES.length) % NOVEDADES.length;
            texto.style.opacity = 0;
            setTimeout(pintar, 200);
        }

        function programar() {
            clearInterval(timer);
            if (NOVEDADES.length > 1) timer = setInterval(function () { mostrar(actual + 1); }, CAMBIO_CADA_MS);
        }

        const ant = document.getElementById('asis-nov-ant');
        const sig = document.getElementById('asis-nov-sig');
        if (ant) ant.addEventListener('click', function () { mostrar(actual - 1); programar(); });
        if (sig) sig.addEventListener('click', function () { mostrar(actual + 1); programar(); });
        // Mientras el alumno lee (cursor encima), la burbuja no cambia sola
        caja.addEventListener('mouseenter', function () { clearInterval(timer); });
        caja.addEventListener('mouseleave', programar);

        pintar();
        programar();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();
