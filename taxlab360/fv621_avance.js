// =============================================================================
// FV 621 · Guardado automático del avance (igual que el FV 710)
// -----------------------------------------------------------------------------
// Mientras el alumno declara, todo lo que llena (Información General, casillas
// del Detalle y de la Determinación de la Deuda, y los asistentes de casillas)
// se guarda solo, POR PERÍODO, con SimStore (claves sire_fv621_<mm-aaaa> y
// sire_fv621_ultimo): en el acceso público queda en el localStorage del equipo
// y los roles que guardan avance también lo suben a Supabase.
// Al volver aparece el recuadro "Continuar donde me quedé"; además, al elegir
// un período que ya tiene avance guardado, se recupera solo.
// Solo se borra con "Reiniciar simulación" (SimStore.clearAll borra las
// claves sire_*). "Limpiar" deja el formulario en blanco pero no borra lo
// guardado: basta elegir de nuevo el período para recuperarlo.
// Se carga al final de declaraciones.html.
// =============================================================================
(function () {
    'use strict';

    const VERSION = 1;
    const CLAVE_ULTIMO = 'sire_fv621_ultimo';
    const CLAVE_ANTIGUA = 'sire_fv621_avance';      // versión anterior (un solo avance)
    const clavePeriodo = p => 'sire_fv621_' + p;
    const PERIODO_OK = /^\d{2}-\d{4}$/;

    const PESTANAS = { info: 'Información General', detalle: 'Detalle de Declaración', deuda: 'Determinación de la Deuda' };

    // Asistentes de casillas cuyos datos forman parte de la declaración
    const CAMPOS_ASISTENTES = /^m(105|109|122|127|171|179|380)-/;
    // Lo que nunca se guarda (datos de pago con tarjeta, generador/importador de TXT)
    const EXCLUIR_ID = /^(pv-|py-|pt-|mgen|mimp|mpagos-|mcept|rus-|plame-)/;

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
        } catch (e) { /* almacenamiento lleno o bloqueado: se sigue sin guardar */ }
    }
    function borrar(clave) {
        try { if (window.SimStore) SimStore.removeItem(clave); else localStorage.removeItem(clave); } catch (e) {}
    }

    // El avance guardado con la versión anterior pasa a su período
    function migrarAntiguo() {
        const d = leer(CLAVE_ANTIGUA);
        if (!d) return;
        const p = d.valores && d.valores['periodo-input'];
        if (p && PERIODO_OK.test(p) && !leer(clavePeriodo(p))) {
            escribir(clavePeriodo(p), d);
            escribir(CLAVE_ULTIMO, { periodo: p, tab: d.tab || 'info', fecha: d.fecha });
        }
        borrar(CLAVE_ANTIGUA);
    }

    // ------------------------------------------------------- qué se guarda
    function vista() { return document.getElementById('view-621'); }
    function periodoActual() {
        const el = document.getElementById('periodo-input');
        const p = el ? el.value.trim() : '';
        return PERIODO_OK.test(p) ? p : '';
    }

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
        const p = periodoActual();
        if (!p) return;                       // sin período no hay a dónde guardar
        const d = capturar();
        escribir(clavePeriodo(p), d);
        escribir(CLAVE_ULTIMO, { periodo: p, tab: d.tab, fecha: d.fecha });
        avisoGuardado();
    }

    // ----------------------------------------------------------- recuperar
    function intentar(fn) { try { fn(); } catch (e) { /* función ausente en esta versión */ } }

    function restaurar(periodo) {
        const d = leer(clavePeriodo(periodo));
        if (!d || d.v !== VERSION) return false;
        restaurando = true;
        try {
            // 1) Casillas de verificación y lo que depende de ellas
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
            const ini = document.getElementById('info-inicial');
            if (ini) ini.style.display = 'block';
            intentar(() => aplicarVisibilidadDetalle());
            intentar(() => recalcularDeuda());
            if (d.tab && d.tab !== 'info' && d.infoGeneralOk) intentar(() => cambiarTab621(d.tab));
            else intentar(() => cambiarTab621('info'));
        } finally {
            restaurando = false;
        }
        quitarRecuadro();
        return true;
    }

    // ----------------------------------------------------------- avisos
    function aviso(html) {
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;left:50%;bottom:50px;transform:translateX(-50%);background:rgba(30,57,91,.94);' +
            'color:#fff;font:13px Roboto,Arial,sans-serif;padding:9px 16px;border-radius:18px;z-index:99999;' +
            'box-shadow:0 4px 14px rgba(0,0,0,.2);max-width:90vw;text-align:center;transition:opacity .4s;';
        t.innerHTML = html;
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; }, 3800);
        setTimeout(() => t.remove(), 4400);
    }

    let chipTimer = null;
    function avisoGuardado() {
        let c = document.getElementById('guardado-621');
        if (!c) {
            c = document.createElement('div');
            c.id = 'guardado-621';
            c.style.cssText = 'position:fixed;left:50%;bottom:46px;transform:translateX(-50%);background:rgba(30,57,91,.92);' +
                'color:#fff;font:13px Roboto,Arial,sans-serif;padding:6px 14px;border-radius:16px;z-index:99998;' +
                'opacity:0;transition:opacity .3s;pointer-events:none;';
            c.innerHTML = '<i class="fas fa-check"></i> Avance guardado';
            document.body.appendChild(c);
        }
        c.style.opacity = '1';
        clearTimeout(chipTimer);
        chipTimer = setTimeout(() => { c.style.opacity = '0'; }, 1200);
    }

    function fechaLegible(iso) {
        try {
            const d = new Date(iso);
            return d.toLocaleDateString('es-PE') + ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        } catch (e) { return ''; }
    }

    function quitarRecuadro() {
        const r = document.getElementById('aviso-avance-621');
        if (r) r.remove();
    }

    // Recuadro "Tienes una declaración guardada..." al entrar al formulario
    function pintarRecuadro() {
        quitarRecuadro();
        const ult = leer(CLAVE_ULTIMO);
        if (!ult || !ult.periodo || !leer(clavePeriodo(ult.periodo))) return;
        const v = vista();
        if (!v) return;

        const caja = document.createElement('div');
        caja.id = 'aviso-avance-621';
        caja.style.cssText = 'margin:0 0 14px;padding:14px 16px;border:1px solid #b3d4f5;border-left:4px solid #0b6fd0;' +
            'background:#eef6ff;border-radius:4px;font:14px/1.5 Roboto,Arial,sans-serif;color:#1d3b5c;';
        caja.innerHTML =
            '<strong><i class="fas fa-save"></i> Tienes una declaración guardada del período ' + ult.periodo + '.</strong><br>' +
            'Te quedaste en: ' + (PESTANAS[ult.tab] || PESTANAS.info) + (ult.fecha ? ' (' + fechaLegible(ult.fecha) + ')' : '') + '.<br>' +
            'Pulsa <em>Continuar donde me quedé</em> para seguir llenándola. Lo guardado solo se borra con <em>Reiniciar simulación</em>.' +
            '<div style="margin-top:10px;"><button type="button" id="btn-continuar-621" style="border:none;border-radius:4px;' +
            'padding:8px 14px;background:#0b6fd0;color:#fff;font:500 13px Roboto,Arial,sans-serif;cursor:pointer;">' +
            '<i class="fas fa-play"></i> Continuar donde me quedé</button></div>';
        v.insertBefore(caja, v.firstChild);
        caja.querySelector('#btn-continuar-621').addEventListener('click', () => {
            if (restaurar(ult.periodo)) {
                window.scrollTo(0, 0);
                aviso('<i class="fas fa-save"></i> Se recuperó tu declaración del período <strong>' + ult.periodo + '</strong>.');
            }
        });
    }

    // ------------------------------------------ enganche con el formulario
    function enganchar() {
        // Al elegir un período que ya tiene avance guardado, se recupera solo
        if (typeof window.seleccionarPeriodo === 'function') {
            const original = window.seleccionarPeriodo;
            window.seleccionarPeriodo = function () {
                const r = original.apply(this, arguments);
                const p = periodoActual();
                if (p && leer(clavePeriodo(p)) && restaurar(p)) {
                    aviso('<i class="fas fa-save"></i> Se recuperó lo que avanzaste del período <strong>' + p + '</strong>.');
                } else {
                    quitarRecuadro();
                }
                return r;
            };
        }
        // "Limpiar" deja el formulario en blanco sin borrar lo guardado
        if (typeof window.limpiarFormulario === 'function') {
            const original = window.limpiarFormulario;
            window.limpiarFormulario = function () {
                restaurando = true;
                try { return original.apply(this, arguments); }
                finally { restaurando = false; pintarRecuadro(); }
            };
        }
    }

    // ------------------------------------------------------------- inicio
    function iniciar() {
        if (!vista()) return;
        migrarAntiguo();
        enganchar();
        pintarRecuadro();

        ['input', 'change', 'focusout'].forEach(ev =>
            document.addEventListener(ev, e => {
                const el = e.target;
                if (!el || !el.closest) return;
                if (el.closest('#view-621') || (el.closest('.modal-overlay') && el.id && CAMPOS_ASISTENTES.test(el.id))) programar();
            }, true));
        // Botones (Siguiente, Guardar de los asistentes, pestañas...)
        document.addEventListener('click', e => {
            if (e.target && e.target.closest && e.target.closest('button, .form-tab, .st')) programar();
        }, true);
        window.addEventListener('pagehide', () => { if (!restaurando) guardarAhora(); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();
