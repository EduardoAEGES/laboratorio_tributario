// =============================================================================
// FV 621 · Guardado automático del avance
// -----------------------------------------------------------------------------
// Mientras el alumno declara, todo lo que llena (Información General, casillas
// del Detalle y de la Determinación de la Deuda, y los asistentes de casillas)
// se guarda solo con SimStore (clave sire_fv621_avance): en el acceso público
// queda en el localStorage del equipo y los roles que guardan avance también
// lo suben a Supabase. Al volver a abrir el formulario se recupera tal cual.
// Solo se borra con "Reiniciar simulación" (SimStore.clearAll borra las
// claves sire_*). El botón "Limpiar" del formulario deja la declaración en
// blanco y eso es lo que queda guardado.
// Se carga al final de declaraciones.html.
// =============================================================================
(function () {
    'use strict';

    const CLAVE = 'sire_fv621_avance';
    const VERSION = 1;

    // Asistentes de casillas cuyos datos forman parte de la declaración
    const CAMPOS_ASISTENTES = /^m(105|109|122|127|171|179|380)-/;
    // Lo que nunca se guarda (datos de pago con tarjeta, generador/importador de TXT)
    const EXCLUIR_ID = /^(pv-|py-|pt-|mgen|mimp|mpagos-|mcept|rus-|plame-)/;

    // ---------------------------------------------------------------- almacén
    function leer() {
        try {
            const v = window.SimStore ? SimStore.getItem(CLAVE) : localStorage.getItem(CLAVE);
            return v ? JSON.parse(v) : null;
        } catch (e) { return null; }
    }
    function escribir(obj) {
        try {
            const v = JSON.stringify(obj);
            if (window.SimStore) SimStore.setItem(CLAVE, v); else localStorage.setItem(CLAVE, v);
        } catch (e) { /* almacenamiento lleno o bloqueado: se sigue sin guardar */ }
    }

    // ------------------------------------------------------- qué se guarda
    function vista() { return document.getElementById('view-621'); }

    function campos() {
        const out = [];
        const v = vista();
        if (v) v.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => out.push(el));
        document.querySelectorAll('.modal-overlay input[id]').forEach(el => {
            if (CAMPOS_ASISTENTES.test(el.id)) out.push(el);
        });
        return out.filter(el => !EXCLUIR_ID.test(el.id) && el.type !== 'radio' && el.type !== 'file' && el.type !== 'button');
    }

    function gruposRadio() {
        const grupos = {};
        const v = vista();
        if (!v) return grupos;
        v.querySelectorAll('input[type="radio"][name]').forEach(r => {
            if (r.name === 'pay-method-621') return;
            (grupos[r.name] = grupos[r.name] || []).push(r);
        });
        return grupos;
    }

    function copia(x) { try { return JSON.parse(JSON.stringify(x)); } catch (e) { return null; } }

    function capturar() {
        const valores = {}, marcados = {};
        campos().forEach(el => {
            if (el.type === 'checkbox') marcados[el.id] = !!el.checked;
            else valores[el.id] = el.value;
        });
        const radios = {};
        Object.entries(gruposRadio()).forEach(([n, lista]) => { radios[n] = lista.findIndex(r => r.checked); });
        const tab = document.querySelector('.form-tab.active');
        const d = {
            v: VERSION,
            fecha: new Date().toISOString(),
            valores: valores,
            marcados: marcados,
            radios: radios,
            tab: tab ? tab.id.replace('tab621-btn-', '') : 'info'
        };
        try { d.pagosPrevios = copia(pagosPrevios); } catch (e) {}
        try { d.prorrataHist = copia(prorrataHist); } catch (e) {}
        try { d.ingresosPrevios = copia(ingresosPrevios); } catch (e) {}
        try { d.c301Editada = !!c301Editada; } catch (e) {}
        try { d.infoGeneralOk = !!infoGeneralOk; } catch (e) {}
        return d;
    }

    let restaurando = false;
    let timer = null;
    function programar() {
        if (restaurando) return;
        clearTimeout(timer);
        timer = setTimeout(guardarAhora, 600);
    }
    function guardarAhora() {
        if (restaurando || !vista()) return;
        escribir(capturar());
    }

    // ----------------------------------------------------------- recuperar
    function intentar(fn) { try { fn(); } catch (e) { /* función ausente en esta versión */ } }

    function restaurar() {
        const d = leer();
        if (!d || d.v !== VERSION) return false;
        restaurando = true;
        try {
            // 1) Casillas de verificación y lo que dependen de ellas
            Object.entries(d.marcados || {}).forEach(([id, ok]) => {
                const el = document.getElementById(id);
                if (el) el.checked = ok;
            });
            intentar(() => toggleLey31556());

            // 2) Opciones (régimen, IGV, IVAP, ventas no gravadas, requisitos Ley 31556...)
            const grupos = gruposRadio();
            Object.entries(d.radios || {}).forEach(([n, idx]) => {
                (grupos[n] || []).forEach((r, i) => { r.checked = i === idx; });
            });
            intentar(() => toggleIGVSubOptions());

            // 3) Período, tipo de declaración y casillas
            Object.entries(d.valores || {}).forEach(([id, valor]) => {
                const el = document.getElementById(id);
                if (el && !EXCLUIR_ID.test(id)) el.value = valor;
            });
            intentar(() => actualizarTextoAviso());

            // 4) Datos internos de los asistentes
            intentar(() => {
                if (d.pagosPrevios) Object.keys(pagosPrevios).forEach(k => {
                    if (d.pagosPrevios[k]) Object.assign(pagosPrevios[k], d.pagosPrevios[k]);
                });
            });
            intentar(() => {
                if (Array.isArray(d.prorrataHist)) { prorrataHist.length = 0; d.prorrataHist.forEach(r => prorrataHist.push(r)); }
            });
            intentar(() => {
                if (d.ingresosPrevios) {
                    Object.keys(ingresosPrevios).forEach(k => delete ingresosPrevios[k]);
                    Object.assign(ingresosPrevios, d.ingresosPrevios);
                }
            });
            intentar(() => { c301Editada = !!d.c301Editada; });
            intentar(() => { infoGeneralOk = !!d.infoGeneralOk; });

            // 5) Cálculos y pestaña donde se quedó
            const periodo = document.getElementById('periodo-input');
            if (periodo && periodo.value) {
                const ini = document.getElementById('info-inicial');
                if (ini) ini.style.display = 'block';
            }
            intentar(() => aplicarVisibilidadDetalle());
            intentar(() => recalcularDeuda());
            if (d.tab && d.tab !== 'info' && d.infoGeneralOk) intentar(() => cambiarTab621(d.tab));
        } finally {
            restaurando = false;
        }
        const p = document.getElementById('periodo-input');
        return !!(p && p.value);
    }

    function aviso(texto) {
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;left:50%;bottom:50px;transform:translateX(-50%);background:rgba(30,57,91,.94);' +
            'color:#fff;font:13px Roboto,Arial,sans-serif;padding:9px 16px;border-radius:18px;z-index:99999;' +
            'box-shadow:0 4px 14px rgba(0,0,0,.2);max-width:90vw;text-align:center;transition:opacity .4s;';
        t.innerHTML = texto;
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; }, 4200);
        setTimeout(() => t.remove(), 4800);
    }

    // ------------------------------------------------------------- inicio
    function iniciar() {
        if (!vista()) return;
        // Se espera a que el formulario termine su propia preparación
        setTimeout(() => {
            if (restaurar()) {
                const p = document.getElementById('periodo-input').value;
                aviso('<i class="fas fa-save"></i> Se recuperó tu declaración en curso del período <strong>' + p +
                    '</strong>. Se borra solo con "Reiniciar simulación".');
            }

            ['input', 'change', 'focusout'].forEach(ev =>
                document.addEventListener(ev, e => {
                    const el = e.target;
                    if (!el || !el.closest) return;
                    if (el.closest('#view-621') || (el.closest('.modal-overlay') && el.id && CAMPOS_ASISTENTES.test(el.id))) programar();
                }, true));
            // Botones (Siguiente, Limpiar, Guardar de los asistentes, pestañas...)
            document.addEventListener('click', e => {
                if (e.target && e.target.closest && e.target.closest('button, .form-tab, .st, a')) programar();
            }, true);
            window.addEventListener('pagehide', guardarAhora);
        }, 0);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();
